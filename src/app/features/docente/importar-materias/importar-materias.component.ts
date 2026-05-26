import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { PeriodosService } from '../../../core/services/periodos.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-importar-materias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './importar-materias.component.html'
})
export class ImportarMateriasComponent {
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

  private processedHashes: string[] = [];

  private router = inject(Router);
  private http = inject(HttpClient);
  private periodosService = inject(PeriodosService);
  private materiasService = inject(MateriasService);
  private authService = inject(AuthService);

  private currentFileSignature = '';

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

  private handleFile(file: File) {
    // Validamos extensión (solo PDF para materias)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.triggerToast('Por favor, selecciona únicamente un archivo PDF.', 'error');
      return;
    }

    const signature = `${file.name}_${file.size}`;
    const uploaded = JSON.parse(localStorage.getItem('agm_uploaded_files') || '[]');
    if (uploaded.includes(signature)) {
      this.showDuplicateError.set(true);
      this.triggerToast('Este archivo ya fue cargado y procesado anteriormente en este periodo.', 'error');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    this.currentFileSignature = signature;
    
    // Simular tiempo de carga de vista previa
    this.currentStep.set(2);
    setTimeout(() => {
      this.currentStep.set(3);
    }, 1500);
  }

  cancelImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
  }

  confirmImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.currentStep.set(4);
    this.isSaving.set(true);

    // 1. Obtener Periodo Activo
    this.periodosService.getPeriodoActivo().subscribe({
      next: (periodo) => {
        if (!periodo) {
          // Si no hay periodo activo, buscar el primero de la lista
          this.periodosService.getPeriodos(1, 1).subscribe({
            next: (resPeriodos) => {
              const p = resPeriodos.items[0];
              if (!p) {
                this.isSaving.set(false);
                this.currentStep.set(1);
                this.triggerToast('Error: No existe ningún periodo escolar registrado. Crea uno en la sección de Periodos antes de continuar.', 'error');
                return;
              }
              this.procederConPlan(p.periodo_id!, file);
            },
            error: (err) => this.handleErrorMsg(err)
          });
        } else {
          this.procederConPlan(periodo.periodo_id!, file);
        }
      },
      error: (err) => this.handleErrorMsg(err)
    });
  }

  private procederConPlan(periodoId: string, file: File) {
    // 2. Obtener Plan de Estudios
    this.materiasService.getPlanesEstudio().subscribe({
      next: (planes) => {
        const planValido = planes.find(p => p.activo) || planes[0];
        if (!planValido) {
          // Si no hay plan, creamos uno dinámicamente "Plan de Estudios General"
          this.materiasService.createPlanEstudio({
            nombre: 'Plan de Estudios General',
            activo: true
          }).subscribe({
            next: (nuevoPlan) => {
              this.subirArchivoReal(periodoId, nuevoPlan.plan_estudio_id!, file);
            },
            error: (err) => this.handleErrorMsg(err)
          });
        } else {
          this.subirArchivoReal(periodoId, planValido.plan_estudio_id!, file);
        }
      },
      error: (err) => this.handleErrorMsg(err)
    });
  }

  private subirArchivoReal(periodoId: string, planEstudioId: string, file: File) {
    const formData = new FormData();
    formData.append('archivo', file);
    formData.append('periodo_id', periodoId);
    formData.append('plan_estudio_id', planEstudioId);

    this.http.post(`${environment.msCatalogosUrl}/api/v1/importaciones/programacion-academica`, formData)
      .subscribe({
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
            this.triggerToast(`Error al importar la carga académica: ${errorMsg}. Revisa los IDs del periodo o el archivo.`, 'error');
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
}
