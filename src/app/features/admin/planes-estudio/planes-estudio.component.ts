import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesEstudioService, PlanEstudio } from '../../../core/services/planes-estudio.service';
import { MateriasService, MateriaCatalogo } from '../../../core/services/materias.service';
import { AgmButtonComponent, AgmCardComponent, AgmInputComponent } from '../../../shared/components/ui';

@Component({
  selector: 'app-planes-estudio',
  standalone: true,
  imports: [CommonModule, FormsModule, AgmButtonComponent, AgmCardComponent, AgmInputComponent],
  templateUrl: './planes-estudio.component.html'
})
export class PlanesEstudioComponent implements OnInit {
  private planesService = inject(PlanesEstudioService);
  private materiasService = inject(MateriasService);

  planes = signal<PlanEstudio[]>([]);
  isLoading = signal<boolean>(false);
  
  // Modal state - Planes
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);
  
  // Form fields
  planId = '';
  planNombre = '';
  planActivo = true;

  // Modal state - Asignación de Materias
  showAsignacionModal = signal<boolean>(false);
  planSeleccionado = signal<PlanEstudio | null>(null);
  catalogoMaterias = signal<MateriaCatalogo[]>([]);
  materiasAsignadas = signal<any[]>([]);
  isLoadingAsignadas = signal<boolean>(false);
  materiaSeleccionada = signal<string>('');

  // Toast notifications
  showToast = signal<boolean>(false);
  toastMessage = signal<string>('');
  toastType = signal<'success' | 'error'>('success');

  ngOnInit() {
    this.cargarPlanes();
    this.cargarCatalogoMaterias();
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

  cargarCatalogoMaterias() {
    this.materiasService.getMateriasCatalogo().subscribe({
      next: (materias) => {
        this.catalogoMaterias.set(materias || []);
      },
      error: (err) => {
        console.error('Error al cargar catálogo de materias', err);
      }
    });
  }

  // === GESTIÓN DE PLANES ===

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

  // === GESTIÓN DE ASIGNACIONES (MATERIAS) ===

  openAsignacionModal(plan: PlanEstudio) {
    this.planSeleccionado.set(plan);
    this.materiaSeleccionada.set('');
    this.showAsignacionModal.set(true);
    this.cargarMateriasDelPlan(plan.plan_estudio_id);
  }

  closeAsignacionModal() {
    this.showAsignacionModal.set(false);
    this.planSeleccionado.set(null);
    this.materiasAsignadas.set([]);
  }

  cargarMateriasDelPlan(planId: string) {
    this.isLoadingAsignadas.set(true);
    this.planesService.getMateriasPorPlan(planId).subscribe({
      next: (res) => {
        // Combinamos la información de la relación con los datos del catálogo
        const asignadas = (res.items || []).filter((r: any) => r.activa !== false).map((relacion: any) => {
          const materiaCat = this.catalogoMaterias().find(m => m.materia_catalogo_id === relacion.materia_catalogo_id);
          return {
            materia_plan_estudio_id: relacion.materia_plan_estudio_id,
            materia_catalogo_id: relacion.materia_catalogo_id,
            nombre: materiaCat ? materiaCat.nombre : 'Materia Desconocida',
            codigo: materiaCat ? materiaCat.codigo : 'N/A'
          };
        });
        this.materiasAsignadas.set(asignadas);
        this.isLoadingAsignadas.set(false);
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Error al cargar materias del plan', 'error');
        this.isLoadingAsignadas.set(false);
      }
    });
  }

  asignarMateria() {
    const plan = this.planSeleccionado();
    const matId = this.materiaSeleccionada();

    if (!plan || !matId) {
      this.triggerToast('Selecciona una materia del catálogo', 'error');
      return;
    }

    // Validar si ya está asignada
    const yaAsignada = this.materiasAsignadas().some(m => m.materia_catalogo_id === matId);
    if (yaAsignada) {
      this.triggerToast('Esta materia ya está asignada a este plan', 'error');
      return;
    }

    this.planesService.asignarMateriaAPlan(plan.plan_estudio_id, matId).subscribe({
      next: () => {
        this.triggerToast('Materia asignada correctamente', 'success');
        this.materiaSeleccionada.set('');
        this.cargarMateriasDelPlan(plan.plan_estudio_id);
      },
      error: (err) => {
        console.error(err);
        this.triggerToast('Error al asignar la materia', 'error');
      }
    });
  }

  removerMateria(relacionId: string) {
    if (confirm('¿Deseas quitar esta materia del plan de estudio?')) {
      this.planesService.removerMateriaDePlan(relacionId).subscribe({
        next: () => {
          this.triggerToast('Materia removida del plan', 'success');
          if (this.planSeleccionado()) {
            this.cargarMateriasDelPlan(this.planSeleccionado()!.plan_estudio_id);
          }
        },
        error: (err) => {
          console.error(err);
          this.triggerToast('Error al remover materia', 'error');
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
