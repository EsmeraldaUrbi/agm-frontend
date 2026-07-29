import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PeriodosService } from '../../../core/services/periodos.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AuthService } from '../../../core/services/auth.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OnDestroy, OnInit } from '@angular/core';
import { PlanesEstudioService, PlanEstudio } from '../../../core/services/planes-estudio.service';
import { PdfExtractionService, MateriaExtraida } from '../../../core/services/pdf-extraction.service';

@Component({
  selector: 'app-importar-materias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './importar-materias.component.html'
})
export class ImportarMateriasComponent implements OnInit, OnDestroy {
  currentStep = signal<1 | 2 | 3 | 4>(1);
  
  selectedFile = signal<File | null>(null);
  showDuplicateError = signal(false);
  isSaving = signal(false);

  // Modal de horario
  showScheduleModal = signal(false);
  selectedSchedule = signal<{ days: string, time: string, raw: string } | null>(null);

  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  pdfPreviewUrl = signal<SafeResourceUrl | null>(null);
  private rawPdfUrl: string | null = null;

  private processedHashes: string[] = [];

  planes = signal<PlanEstudio[]>([]);
  todosLosPeriodos = signal<any[]>([]);
  periodoSeleccionadoId = signal<string>('');
  planSeleccionadoId = signal<string>('');

  previsualizacionDatos = signal<MateriaExtraida[]>([]);
  
  // Paginación
  currentPage = signal<number>(1);
  itemsPerPage = 50;

  totalRegistros = computed(() => this.previsualizacionDatos().length);
  totalErrores = computed(() => this.previsualizacionDatos().filter(m => m.tieneError).length);
  totalValidos = computed(() => this.totalRegistros() - this.totalErrores());
  totalPages = computed(() => Math.ceil(this.totalRegistros() / this.itemsPerPage) || 1);

  paginatedDatos = computed(() => {
    const start = (this.currentPage() - 1) * this.itemsPerPage;
    return this.previsualizacionDatos().slice(start, start + this.itemsPerPage);
  });
  
  // Para bloquear si falta algo
  hasConfigError = signal<boolean>(false);
  configErrorMessage = signal<string>('');

  private router = inject(Router);
  private periodosService = inject(PeriodosService);
  private planesService = inject(PlanesEstudioService);
  private materiasService = inject(MateriasService);
  private authService = inject(AuthService);
  private sanitizer = inject(DomSanitizer);
  private pdfExtractor = inject(PdfExtractionService);

  private currentFileSignature = '';

  ngOnInit() {
    this.verificarConfiguracionInicial();
  }

  private verificarConfiguracionInicial() {
    // 1. Obtener planes de estudio
    this.planesService.getPlanesEstudio(1, 100, true).subscribe({
      next: (res) => {
        const planesActivos = res.items || [];
        this.planes.set(planesActivos);
        
        if (planesActivos.length === 0) {
          this.hasConfigError.set(true);
          this.configErrorMessage.set('No existe un plan de estudio registrado. Por favor, crea primero un plan de estudio antes de continuar.');
          return;
        }

        // 2. Obtener todos los periodos (para que el usuario seleccione)
        this.periodosService.getPeriodos(1, 100).subscribe({
          next: (res) => {
            const periodosList = res.items || [];
            this.todosLosPeriodos.set(periodosList);
            if (periodosList.length === 0) {
              this.hasConfigError.set(true);
              this.configErrorMessage.set('No existen periodos escolares. Por favor, crea un periodo antes de continuar.');
              return;
            }
            // Seleccionar por defecto el activo si hay
            const activo = periodosList.find((p: any) => p.activo);
            if (activo && activo.periodo_id) {
              this.periodoSeleccionadoId.set(activo.periodo_id);
            }
            this.hasConfigError.set(false);
          },
          error: () => {
            this.hasConfigError.set(true);
            this.configErrorMessage.set('Error al conectar con el servidor para verificar periodos.');
          }
        });
      },
      error: () => {
        this.hasConfigError.set(true);
        this.configErrorMessage.set('Error al conectar con el servidor para verificar planes de estudio.');
      }
    });
  }

  ngOnDestroy() {
    this.revokePdfUrl();
  }

  private revokePdfUrl() {
    if (this.rawPdfUrl) {
      URL.revokeObjectURL(this.rawPdfUrl);
      this.rawPdfUrl = null;
      this.pdfPreviewUrl.set(null);
    }
  }

  openScheduleModal(scheduleStr: string) {
    const parts = scheduleStr.split(' ');
    const daysStr = parts[0];
    const timeStr = parts.slice(1).join(' ');
    
    let fullDays = daysStr;
    if (daysStr === 'Lu/Mi') fullDays = 'Lunes y Miércoles';
    if (daysStr === 'Ma/Ju') fullDays = 'Martes y Jueves';
    if (daysStr === 'Vi') fullDays = 'Viernes';
    if (daysStr === 'Sa') fullDays = 'Sábado';

    this.selectedSchedule.set({ days: fullDays, time: timeStr, raw: scheduleStr });
    this.showScheduleModal.set(true);
  }

  closeScheduleModal() {
    this.showScheduleModal.set(false);
    setTimeout(() => this.selectedSchedule.set(null), 300);
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
  }

  triggerToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 4000);
  }

  private async handleFile(file: File) {
    // Validamos extensión (solo PDF para materias)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.triggerToast('Por favor, selecciona únicamente un archivo PDF.', 'error');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    this.currentFileSignature = `${file.name}_${file.size}`;
    
    // Generar vista previa
    this.revokePdfUrl();
    this.rawPdfUrl = URL.createObjectURL(file);
    this.pdfPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl));
    
    this.currentStep.set(2);

    try {
      // Extraer datos reales del PDF
      const materiasExtraidas = await this.pdfExtractor.extractMateriasFromPdf(file);
      
      // Si el parser no encontró absolutamente nada (fallback a error)
      if (materiasExtraidas.length === 0) {
        materiasExtraidas.push({
          nrc: '',
          materia: 'No se pudo leer el contenido',
          seccion: '',
          docente: '',
          horario: '',
          tieneError: true
        });
        this.triggerToast('No se detectaron materias con el formato esperado. Por favor valida manualmente.', 'error');
      }

      this.previsualizacionDatos.set(materiasExtraidas);
      this.currentPage.set(1);
      this.currentStep.set(3);
    } catch (e) {
      console.error(e);
      this.triggerToast('Hubo un error al extraer el PDF.', 'error');
      this.currentStep.set(1);
      this.selectedFile.set(null);
    }
  }

  cancelImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.planSeleccionadoId.set('');
    this.showDuplicateError.set(false);
    this.revokePdfUrl();
  }

  confirmImport() {
    const file = this.selectedFile();
    const periodoId = this.periodoSeleccionadoId();
    const planId = this.planSeleccionadoId();

    if (!file) return;

    if (!planId) {
      this.triggerToast('Por favor, selecciona a qué Plan de Estudio deseas importar las materias.', 'error');
      return;
    }

    if (!periodoId) {
      this.triggerToast('Por favor, selecciona el Periodo Escolar.', 'error');
      return;
    }

    this.currentStep.set(4);
    this.isSaving.set(true);
    
    this.subirArchivoReal(periodoId, planId, file);
  }

  private subirArchivoReal(periodoId: string, planEstudioId: string, file: File) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('periodo_id', periodoId);
    formData.append('plan_estudio_id', planEstudioId);

    this.materiasService.importarProgramacionAcademica(formData).subscribe({
        next: () => {
          this.isSaving.set(false);
          const uploaded = JSON.parse(localStorage.getItem('agm_uploaded_files') || '[]');
          if (!uploaded.includes(this.currentFileSignature)) {
            uploaded.push(this.currentFileSignature);
            localStorage.setItem('agm_uploaded_files', JSON.stringify(uploaded));
          }
        },
        error: (err: any) => {
          this.isSaving.set(false);
          this.currentStep.set(1);
          if (err.status === 409) {
            this.showDuplicateError.set(true);
          } else {
            const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error desconocido';
            this.triggerToast(`Error al importar la carga académica: ${errorMsg}`, 'error');
          }
        }
      });
  }

  private handleErrorMsg(err: any) {
    this.isSaving.set(false);
    this.currentStep.set(1);
    const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error de conexión';
    this.triggerToast(`Error de integración: ${errorMsg}`, 'error');
  }

  resetImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
    this.isSaving.set(false);
    this.revokePdfUrl();
  }

  goToDashboard() {
    const user = this.authService.getCurrentUser();
    const role = user?.rol?.toLowerCase() || localStorage.getItem('current_user_role')?.toLowerCase();
    
    if (role === 'admin' || role === 'administrador') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'docente') {
      this.router.navigate(['/docente/dashboard']);
    } else if (role === 'alumno') {
      this.router.navigate(['/alumno/dashboard']);
    } else {
      this.router.navigate(['/']);
    }
  }

  // Métodos de Paginación
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
