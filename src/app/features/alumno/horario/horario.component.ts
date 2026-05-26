import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-horario',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horario.component.html',
  styleUrl: './horario.component.css'
})
export class HorarioComponent {
  @Input() scheduleData: any[] = [];

  diasSemana = [
    { clave: 'LU', nombre: 'Lunes' },
    { clave: 'MA', nombre: 'Martes' },
    { clave: 'MI', nombre: 'Miércoles' },
    { clave: 'JU', nombre: 'Jueves' },
    { clave: 'VI', nombre: 'Viernes' },
    { clave: 'SA', nombre: 'Sábado' }
  ];

  timeSlots = Array.from({ length: 15 }, (_, i) => {
    const hour = i + 7;
    const formattedHour = hour.toString().padStart(2, '0');
    return { start: `${formattedHour}:00:00`, label: `${formattedHour}:00` };
  });

  // Asignar un color fijo según el ID de la materia para que se vea estético
  getColorClass(materiaId: string): any {
    const sum = materiaId ? materiaId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : 0;
    const colors = [
      { bg: 'bg-primary-fixed/30', border: 'border-primary', textTitle: 'text-primary', textSub: 'text-primary-container', hover: 'hover:bg-primary-fixed/50' },
      { bg: 'bg-secondary-fixed/30', border: 'border-secondary', textTitle: 'text-secondary', textSub: 'text-on-secondary-container', hover: 'hover:bg-secondary-fixed/50' },
      { bg: 'bg-tertiary-fixed/30', border: 'border-tertiary', textTitle: 'text-tertiary', textSub: 'text-on-tertiary-container', hover: 'hover:bg-tertiary-fixed/50' },
      { bg: 'bg-error-container/30', border: 'border-error', textTitle: 'text-error', textSub: 'text-on-error-container', hover: 'hover:bg-error-container/50' },
      { bg: 'bg-on-primary-container/10', border: 'border-primary-container', textTitle: 'text-primary-container', textSub: 'text-on-surface-variant', hover: 'hover:bg-on-primary-container/20' }
    ];
    return colors[sum % colors.length];
  }

  getMateriaParaSlot(slotStart: string, dia: string): any {
    if (!this.scheduleData) return null;
    return this.scheduleData.find(s => {
      // Backend puede devolver "dia" o "dia_semana" (normalizar)
      const d = s.dia || s.dia_semana || '';
      return s.hora_inicio === slotStart && d.toString().toUpperCase() === dia;
    });
  }
}
