import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-importar-docentes',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './importar-docentes.html'
})
export class ImportarDocentesComponent {
  currentStep = signal<1 | 2 | 3>(1);
  selectedFile = signal<File | null>(null);
  showDuplicateError = signal(false);
  isSaving = signal(false);
  
  private router = inject(Router);
  private http = inject(HttpClient);

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

  private handleFile(file: File) {
    if (file.type !== 'text/csv' && !file.name.toLowerCase().endsWith('.csv')) {
      alert('Por favor, selecciona únicamente un archivo CSV.');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    
    // Simular el "Parseo de vista previa" antes de confirmar
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

    const formData = new FormData();
    formData.append('file', file);

    this.http.post(`${environment.msUsuariosUrl}/api/v1/importar/docentes`, formData)
      .subscribe({
        next: (res: any) => {
          this.isSaving.set(false);
          // Permanece en el paso 4 mostrando el mensaje de éxito
        },
        error: (err: HttpErrorResponse) => {
          this.isSaving.set(false);
          this.showDuplicateError.set(true);
          this.currentStep.set(1);
          alert('Hubo un error al procesar el archivo. Podría tener formato inválido.');
        }
      });
  }

  resetImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
    this.isSaving.set(false);
  }


    this.router.navigate(['/admin/dashboard']);
  }
}
