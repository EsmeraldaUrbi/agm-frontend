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

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) this.handleFile(file);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files?.[0];
    if (file) this.handleFile(file);
  }

  onDropOver(event: DragEvent) {
    event.preventDefault();
  }

  private handleFile(file: File) {
    // Aceptamos Excel (.xlsx, .xls) o PDF para coincidir con la compatibilidad del backend
    const nameLower = file.name.toLowerCase();
    if (!nameLower.endsWith('.pdf') && !nameLower.endsWith('.xlsx') && !nameLower.endsWith('.xls')) {
      alert('Por favor, selecciona únicamente un archivo Excel (.xlsx) o PDF de plantilla.');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    
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
          // Éxito: se mantiene en el paso 4 mostrando el éxito
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.showDuplicateError.set(true);
          this.currentStep.set(1);
          alert('Hubo un error al procesar el archivo. Asegúrate de que los campos coincidan con la plantilla.');
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
