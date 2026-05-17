import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

type EstadoMateria = 'activa' | 'cerrada' | 'finalizada';

@Component({
  selector: 'app-cierre-materia',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './cierre-materia.component.html'
})
export class CierreMateriaComponent {
  // Estado actual de la materia — cambia el UI dinámicamente
  // 'activa'    → Puede cerrarse (notifica alumnos por correo)
  // 'cerrada'   → Cerrada, puede recibir cambios hasta imprimir acta
  // 'finalizada'→ Acta impresa, no acepta más cambios
  estadoMateria = signal<EstadoMateria>('activa');

  materia = {
    nrc: '24589',
    nombre: 'Programación Orientada a Objetos III',
    seccion: '004',
    alumnos: 32,
    promedioGrupal: 8.4,
    asistencias: 100
  };

  checklist = [
    { label: 'Calificaciones registradas', completado: true },
    { label: 'Asistencias finalizadas', completado: true },
    { label: 'Observaciones académicas', completado: true },
    { label: 'Generación de Acta Final', completado: false },
  ];

  // Modal de confirmación
  mostrarModalCierre = false;
  mostrarModalActa = false;

  abrirModalCierre() {
    this.mostrarModalCierre = true;
  }

  confirmarCierre() {
    // Aquí se llamará a DELETE /sesiones/:id/cerrar (MS-5) y
    // el backend notifica por correo a los alumnos vía MS-6
    this.estadoMateria.set('cerrada');
    // Marcar checklist de acta como pendiente
    this.mostrarModalCierre = false;
  }

  abrirModalActa() {
    this.mostrarModalActa = true;
  }

  confirmarImpresionActa() {
    // Al confirmar, la materia queda finalizada y no acepta más cambios
    // Llamada a MS-7: GET /reportes/calificaciones/:materiaId?formato=pdf
    this.checklist[3].completado = true;
    this.estadoMateria.set('finalizada');
    this.mostrarModalActa = false;
  }

  cancelarModal() {
    this.mostrarModalCierre = false;
    this.mostrarModalActa = false;
  }

  get esCerrada() { return this.estadoMateria() === 'cerrada'; }
  get esFinalizada() { return this.estadoMateria() === 'finalizada'; }
  get esActiva() { return this.estadoMateria() === 'activa'; }
}
