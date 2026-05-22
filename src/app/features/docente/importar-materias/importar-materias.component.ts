import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-importar-materias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './importar-materias.component.html'
})
export class ImportarMateriasComponent {
  currentStep = signal<1 | 2 | 3>(1);
  
  selectedFile = signal<File | null>(null);
  showDuplicateError = signal(false);

  // Modal de horario
  showScheduleModal = signal(false);
  selectedSchedule = signal<{ days: string, time: string, raw: string } | null>(null);

  // Historial de hashes procesados (memoria volátil para pruebas)
  private processedHashes: string[] = [];

  constructor(private router: Router) {}

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
    
    // Leer archivo para generar hash y validar duplicados (Simulación Error 409)
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const hash = await this.calculateHash(buffer);
      
      // Si el archivo ya se subió en esta sesión o su nombre contiene "duplicado" (para forzar la prueba)
      if (this.processedHashes.includes(hash) || file.name.toLowerCase().includes('duplicado')) {
        this.showDuplicateError.set(true);
        this.selectedFile.set(null);
      } else {
        this.processFile(hash);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private async calculateHash(buffer: ArrayBuffer): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private processFile(hash: string) {
    this.currentStep.set(2);
    
    // Simulamos tiempo de procesamiento de backend (ej. OCR o parseo)
    setTimeout(() => {
      this.currentStep.set(3);
      this.processedHashes.push(hash); // Registrar para evitar que lo suba de nuevo
    }, 2500);
  }

  cancelImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
  }

  confirmImport() {
    // Simular guardado exitoso
    this.router.navigate(['/admin/dashboard']);
  }
}
