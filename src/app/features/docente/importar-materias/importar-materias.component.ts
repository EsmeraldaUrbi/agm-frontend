import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

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

  private processedHashes: string[] = [];

  private router = inject(Router);
  private http = inject(HttpClient);

  openScheduleModal(scheduleStr: string) {
    const parts = scheduleStr.split(' ');
    const daysStr = parts[0];
    const timeStr = parts.slice(1).join(' ');
    
    let fullDays = daysStr;
    if (daysStr === 'Lu/Mi') fullDays = 'Lunes y Miércoles';
    if (daysStr === 'Ma/Ju') fullDays = 'Martes y Jueves';
    if (daysStr === 'Vi') fullDays = 'Viernes';

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

  private handleFile(file: File) {
    // Validamos extensión (solo PDF para materias)
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      alert('Por favor, selecciona únicamente un archivo PDF.');
      return;
    }

    this.selectedFile.set(file);
    this.showDuplicateError.set(false);
    
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

    const formData = new FormData();
    formData.append('archivo', file);
    // UUIDs de prueba requeridos por el backend
    formData.append('periodo_id', '11111111-1111-1111-1111-111111111111');
    formData.append('plan_estudio_id', '22222222-2222-2222-2222-222222222222');

    this.http.post(`${environment.msCatalogosUrl}/api/v1/importaciones/programacion-academica`, formData)
      .subscribe({
        next: () => {
          this.isSaving.set(false);
        },
        error: () => {
          this.isSaving.set(false);
          this.showDuplicateError.set(true);
          this.currentStep.set(1);
          alert('Error al importar la carga académica. Revisa el archivo o los IDs del periodo.');
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
    // Navigate back to the previous context, which might be a teacher's view or admin depending on who is logged in.
    this.router.navigate(['/']); // Routing to root or dashboard

  }
}
