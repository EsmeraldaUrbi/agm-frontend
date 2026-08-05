import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DocentesService } from '../../../core/services/docentes.service';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { OnDestroy } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { DocentePdfExtractionService, DocenteExtraido } from '../../../core/services/docente-pdf-extraction.service';

@Component({
  selector: 'app-importar-docentes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './importar-docentes.component.html'
})
export class ImportarDocentesComponent implements OnDestroy {
  currentStep = signal<1 | 2 | 3 | 4>(1);
  selectedFile = signal<File | null>(null);
  showDuplicateError = signal(false);
  isSaving = signal(false);

  previsualizacionDatos = signal<DocenteExtraido[]>([]);
  
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
  
  private router = inject(Router);
  private docentesService = inject(DocentesService);
  private sanitizer = inject(DomSanitizer);
  private pdfExtractor = inject(DocentePdfExtractionService);
  
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  pdfPreviewUrl = signal<SafeResourceUrl | null>(null);
  private rawPdfUrl: string | null = null;

  private currentFileSignature = '';

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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.handleFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
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
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      this.triggerToast('Por favor, selecciona únicamente un archivo PDF.', 'error');
      return;
    }

    const signature = `${file.name}_${file.size}`;
    const uploaded = JSON.parse(localStorage.getItem('agm_uploaded_docentes') || '[]');
    // if (uploaded.includes(signature)) {
    //   this.showDuplicateError.set(true);
    //   this.triggerToast('Este archivo de docentes ya fue cargado y procesado anteriormente.', 'error');
    //   return;
    // }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    this.currentFileSignature = signature;
    
    this.revokePdfUrl();
    this.rawPdfUrl = URL.createObjectURL(file);
    this.pdfPreviewUrl.set(this.sanitizer.bypassSecurityTrustResourceUrl(this.rawPdfUrl));

    this.currentStep.set(2);

    try {
      const extraidos = await this.pdfExtractor.extractDocentesFromPdf(file);
      
      if (extraidos.length === 0) {
        extraidos.push({
          nombre: 'No se pudo extraer información',
          correo: '',
          ubicacion: '',
          departamento: '',
          academia: '',
          tieneError: true
        });
        this.triggerToast('No se detectaron docentes con correo institucional @correo.buap.mx. Verifica que el PDF use el formato requerido.', 'error');
      }

      this.previsualizacionDatos.set(extraidos);
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
    this.showDuplicateError.set(false);
    this.revokePdfUrl();
  }

  confirmImport() {
    const file = this.selectedFile();
    if (!file) return;

    this.currentStep.set(4);
    this.isSaving.set(true);

    this.docentesService.importarDocentes(file)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
          const uploaded = JSON.parse(localStorage.getItem('agm_uploaded_docentes') || '[]');
          if (!uploaded.includes(this.currentFileSignature)) {
            uploaded.push(this.currentFileSignature);
            localStorage.setItem('agm_uploaded_docentes', JSON.stringify(uploaded));
          }
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.currentStep.set(1);
          if (err.status === 409) {
            this.showDuplicateError.set(true);
          } else {
            const errorMsg = err.error?.detail || err.error?.message || err.message || 'Error desconocido';
            this.triggerToast(`Hubo un error al procesar el archivo: ${errorMsg}. Asegúrate de que los campos coincidan con la plantilla.`, 'error');
          }
        }
      });
  }

  resetImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
    this.isSaving.set(false);
    this.revokePdfUrl();
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
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
