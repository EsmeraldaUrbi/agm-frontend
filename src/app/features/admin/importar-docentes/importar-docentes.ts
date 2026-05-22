import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';

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
  private processedHashes: string[] = [];

  constructor(private router: Router) {}

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
    
    const reader = new FileReader();
    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer;
      const hash = await this.calculateHash(buffer);
      
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
    setTimeout(() => {
      this.currentStep.set(3);
      this.processedHashes.push(hash);
    }, 2500);
  }

  cancelImport() {
    this.currentStep.set(1);
    this.selectedFile.set(null);
    this.showDuplicateError.set(false);
  }

  confirmImport() {
    this.router.navigate(['/admin/dashboard']);
  }
}
