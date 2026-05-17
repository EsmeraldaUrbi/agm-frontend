import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';

interface Periodo {
  id: string;
  name: string; // e.g. "Primavera 2026"
  startDate: string;
  endDate: string;
  status: 'active' | 'planning' | 'closed';
}

@Component({
  selector: 'app-periodos',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgmButtonComponent,
    AgmInputComponent,
    AgmCardComponent
  ],
  templateUrl: './periodos.html',
  styles: [`
    :host {
      display: block;
    }
    .animate-modal-in {
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class PeriodosComponent {
  // Lista inicial de periodos académicos (Mock)
  periodosList = signal<Periodo[]>([
    {
      id: '1',
      name: 'Primavera 2026',
      startDate: '2026-01-05',
      endDate: '2026-05-22',
      status: 'active'
    },
    {
      id: '2',
      name: 'Verano 2026',
      startDate: '2026-06-15',
      endDate: '2026-07-24',
      status: 'planning'
    },
    {
      id: '3',
      name: 'Otoño 2026',
      startDate: '2026-08-10',
      endDate: '2026-12-11',
      status: 'planning'
    },
    {
      id: '4',
      name: 'Otoño 2025',
      startDate: '2025-08-11',
      endDate: '2025-12-12',
      status: 'closed'
    }
  ]);

  // Filtros y control de UI
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  // Formulario del Periodo
  periodoId = '';
  periodoName = '';
  periodoStartDate = '';
  periodoEndDate = '';
  periodoStatus: 'active' | 'planning' | 'closed' = 'planning';

  // Alertas / Toasts
  toastMessage = signal<string>('');
  showToast = signal<boolean>(false);

  // Obtener periodo actualmente activo (Computed)
  activePeriodo = computed(() => {
    return this.periodosList().find(p => p.status === 'active');
  });

  // Calcular el progreso visual del periodo activo
  activePeriodProgress = computed(() => {
    const active = this.activePeriodo();
    if (!active) return 0;

    const start = new Date(active.startDate).getTime();
    const end = new Date(active.endDate).getTime();
    // Fijar la fecha actual al primer trimestre del 2026 para que coincida con el mock Primavera 2026
    const now = new Date('2026-04-10').getTime(); 

    if (now <= start) return 0;
    if (now >= end) return 100;

    const total = end - start;
    const elapsed = now - start;
    return Math.round((elapsed / total) * 100);
  });

  // Obtener periodos que no están activos
  otherPeriodos = computed(() => {
    return this.periodosList().filter(p => p.status !== 'active');
  });

  // Abrir Modal de Creación
  openCreateModal() {
    this.isEditing.set(false);
    this.periodoId = '';
    this.periodoName = '';
    this.periodoStartDate = '';
    this.periodoEndDate = '';
    this.periodoStatus = 'planning';
    this.showModal.set(true);
  }

  // Abrir Modal de Edición
  openEditModal(periodo: Periodo) {
    this.isEditing.set(true);
    this.periodoId = periodo.id;
    this.periodoName = periodo.name;
    this.periodoStartDate = periodo.startDate;
    this.periodoEndDate = periodo.endDate;
    this.periodoStatus = periodo.status;
    this.showModal.set(true);
  }

  // Guardar datos
  savePeriodo() {
    if (!this.periodoName || !this.periodoStartDate || !this.periodoEndDate) {
      this.triggerToast('Por favor, rellena todos los campos obligatorios.');
      return;
    }

    // Validar orden de fechas
    const start = new Date(this.periodoStartDate).getTime();
    const end = new Date(this.periodoEndDate).getTime();
    if (start >= end) {
      this.triggerToast('La fecha de término debe ser posterior a la fecha de inicio.');
      return;
    }

    const targetStatus = this.periodoStatus;

    if (this.isEditing()) {
      // Si estamos editando y cambiamos a Activo, desactivar los demás
      this.periodosList.update(list => {
        let updatedList = list;
        if (targetStatus === 'active') {
          updatedList = list.map((p): Periodo => p.status === 'active' ? { ...p, status: 'closed' } : p);
        }
        return updatedList.map((p): Periodo => p.id === this.periodoId 
          ? {
              ...p,
              name: this.periodoName,
              startDate: this.periodoStartDate,
              endDate: this.periodoEndDate,
              status: this.periodoStatus
            }
          : p
        );
      });
      this.triggerToast('Periodo académico actualizado con éxito.');
    } else {
      // Si estamos agregando y viene como Activo, desactivar los demás
      const newPeriodo: Periodo = {
        id: Math.random().toString(36).substring(2, 9),
        name: this.periodoName,
        startDate: this.periodoStartDate,
        endDate: this.periodoEndDate,
        status: this.periodoStatus
      };

      this.periodosList.update(list => {
        let updatedList = list;
        if (targetStatus === 'active') {
          updatedList = list.map((p): Periodo => p.status === 'active' ? { ...p, status: 'closed' } : p);
        }
        return [newPeriodo, ...updatedList];
      });
      this.triggerToast('¡Nuevo periodo académico creado exitosamente!');
    }

    this.showModal.set(false);
  }

  // Activar directamente un periodo de la lista
  setAsActive(periodo: Periodo) {
    this.periodosList.update(list => {
      // Poner el actual activo a cerrado
      const deactivated = list.map((p): Periodo => p.status === 'active' ? { ...p, status: 'closed' } : p);
      // Activar el periodo seleccionado
      return deactivated.map((p): Periodo => p.id === periodo.id ? { ...p, status: 'active' } : p);
    });
    this.triggerToast(`Se ha activado el periodo académico: ${periodo.name}`);
  }

  // Eliminar periodo
  deletePeriodo(periodo: Periodo) {
    if (periodo.status === 'active') {
      this.triggerToast('No se puede eliminar el periodo actualmente activo. Primero activa otro.');
      return;
    }

    if (confirm(`¿Estás seguro de eliminar el periodo ${periodo.name}?`)) {
      this.periodosList.update(list => list.filter(p => p.id !== periodo.id));
      this.triggerToast('Periodo académico eliminado.');
    }
  }

  // Toast Helper
  triggerToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
