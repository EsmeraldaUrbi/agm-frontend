import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesEstudioService, PlanEstudio } from '../../../core/services/planes-estudio.service';
import { AgmButtonComponent, AgmCardComponent, AgmInputComponent } from '../../../shared/components/ui';

@Component({
  selector: 'app-planes-estudio',
  standalone: true,
  imports: [CommonModule, FormsModule, AgmButtonComponent, AgmCardComponent, AgmInputComponent],
  templateUrl: './planes-estudio.component.html'
})
export class PlanesEstudioComponent implements OnInit {
  private planesService = inject(PlanesEstudioService);

  planes = signal<PlanEstudio[]>([]);
  isLoading = signal<boolean>(false);
  
  // Modal state
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  // Form fields
  planId = '';
  planNombre = '';
  planActivo = true;

  // Toast notifications
  showToast = signal<boolean>(false);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit() {
    this.cargarPlanes();
  }

  cargarPlanes() {
    this.isLoading.set(true);
    this.planesService.getPlanesEstudio().subscribe({
      next: (res) => {
        this.planes.set(res.items || []);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar planes de estudio', err);
        this.isLoading.set(false);
        this.triggerToast('Error al cargar los planes de estudio', 'error');
      }
    });
  }

  openCreateModal() {
    this.isEditing.set(false);
    this.planId = '';
    this.planNombre = '';
    this.planActivo = true;
    this.showModal.set(true);
  }

  openEditModal(plan: PlanEstudio) {
    this.isEditing.set(true);
    this.planId = plan.plan_estudio_id;
    this.planNombre = plan.nombre;
    this.planActivo = plan.activo;
    this.showModal.set(true);
  }

  savePlan() {
    if (!this.planNombre || this.planNombre.trim() === '') {
      this.triggerToast('El nombre del plan es requerido', 'error');
      return;
    }

    if (this.isEditing()) {
      this.planesService.updatePlanEstudio(this.planId, {
        nombre: this.planNombre,
        activo: this.planActivo
      }).subscribe({
        next: () => {
          this.triggerToast('Plan de estudio actualizado correctamente', 'success');
          this.showModal.set(false);
          this.cargarPlanes();
        },
        error: (err) => {
          console.error(err);
          this.triggerToast('Error al actualizar el plan', 'error');
        }
      });
    } else {
      this.planesService.createPlanEstudio({
        nombre: this.planNombre,
        activo: this.planActivo
      }).subscribe({
        next: () => {
          this.triggerToast('Plan de estudio creado correctamente', 'success');
          this.showModal.set(false);
          this.cargarPlanes();
        },
        error: (err) => {
          console.error(err);
          this.triggerToast('Error al crear el plan', 'error');
        }
      });
    }
  }

  deactivatePlan(plan: PlanEstudio) {
    if (confirm(`¿Estás seguro de que deseas desactivar el plan "${plan.nombre}"?`)) {
      this.planesService.deactivatePlanEstudio(plan.plan_estudio_id).subscribe({
        next: () => {
          this.triggerToast('Plan de estudio desactivado', 'success');
          this.cargarPlanes();
        },
        error: (err) => {
          console.error(err);
          this.triggerToast('Error al desactivar el plan', 'error');
        }
      });
    }
  }

  triggerToast(message: string, type: 'success' | 'error') {
    this.toastMessage.set(message);
    this.toastType.set(type);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
