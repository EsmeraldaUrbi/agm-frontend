import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { DocentesService } from '../../../core/services/docentes.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-importar-docentes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './importar-docentes.html'
})
export class ImportarDocentesComponent {
  currentStep = signal<1 | 2 | 3 | 4>(1);
  selectedFile = signal<File | null>(null);
  showDuplicateError = signal(false);
  isSaving = signal(false);
  
  private router = inject(Router);
  private docentesService = inject(DocentesService);
  
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');
  showToast = signal<boolean>(false);

  private currentFileSignature = '';

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

  private handleFile(file: File) {
    // Aceptamos Excel (.xlsx, .xls) o PDF para coincidir con la compatibilidad del backend
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.pdf') && !nameLower.endsWith('.xlsx') && !nameLower.endsWith('.xls')) {
      this.triggerToast('Por favor, selecciona únicamente un archivo Excel (.xlsx) o PDF de plantilla.', 'error');
      return;
    }

    const signature = `${file.name}_${file.size}`;
    const uploaded = JSON.parse(localStorage.getItem('agm_uploaded_docentes') || '[]');
    if (uploaded.includes(signature)) {
      this.showDuplicateError.set(true);
      this.triggerToast('Este archivo de docentes ya fue cargado y procesado anteriormente.', 'error');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    this.currentFileSignature = signature;
    
    // Simular el parseo de vista previa para la UX antes de confirmar el envío real al backend
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
  }

  goToDashboard() {
    this.router.navigate(['/admin/dashboard']);
  }
}
