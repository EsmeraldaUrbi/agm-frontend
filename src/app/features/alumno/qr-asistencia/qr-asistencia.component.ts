import { Component, OnInit, OnDestroy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { QRCodeComponent } from 'angularx-qrcode';
import { AsistenciasService } from '../../../core/services/asistencias.service';

@Component({
  selector: 'app-qr-asistencia',
  standalone: true,
  imports: [CommonModule, FormsModule, QRCodeComponent],
  templateUrl: './qr-asistencia.component.html',
  styleUrl: './qr-asistencia.component.css'
})
export class QrAsistenciaComponent implements OnInit, OnDestroy {
  private asistenciasService = inject(AsistenciasService);

  // ID de la sesión vinculada
  idSesionInput: number | null = null;
  idSesion = signal<number | null>(null);

  // Token generado y TTL
  tokenQr = signal<string>('');
  tiempoVidaRestante = signal<number>(0);
  ttlInicial = signal<number>(20);
  errorMsg = signal<string>('');


  private timerInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    // Monitorear y decrementar el tiempo de vida restante cada segundo
    this.timerInterval = setInterval(() => {
      if (this.idSesion() && this.tokenQr() && this.tiempoVidaRestante() > 0) {
        this.tiempoVidaRestante.update(t => t - 1);
        if (this.tiempoVidaRestante() === 0) {
          this.generarQr();
        }
      }
    }, 1000);
  }

  establecerSesion() {
    if (!this.idSesionInput || this.idSesionInput <= 0) {
      this.errorMsg.set('Ingrese un ID de sesión válido.');
      return;
    }
    this.idSesion.set(this.idSesionInput);
    this.generarQr();
  }

  generarQr() {
    const id = this.idSesion();
    if (!id) return;

    this.asistenciasService.generarQr(id).subscribe({
      next: (res) => {
        this.tokenQr.set(res.token);
        const ttl = res.tiempo_vida_segundos || 20;
        this.ttlInicial.set(ttl);
        this.tiempoVidaRestante.set(ttl);
        this.errorMsg.set('');
      },
      error: (err) => {
        console.error('Error al generar código QR:', err);
        this.errorMsg.set(
          err.error?.detail || 
          'Error al obtener QR. Confirme que la sesión existe, esté activa y que esté inscrito en la materia.'
        );
        this.tokenQr.set('');
        this.tiempoVidaRestante.set(0);
      }
    });
  }

  ngOnDestroy() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }
}
