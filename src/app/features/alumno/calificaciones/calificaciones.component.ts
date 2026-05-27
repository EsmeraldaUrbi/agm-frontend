import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { CalificacionesService } from '../../../core/services/calificaciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AuthService } from '../../../core/services/auth.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-calificaciones',
  standalone: true,
  imports: [CommonModule, RouterModule, SolicitarBajaComponent],
  templateUrl: './calificaciones.component.html',
  styles: ``
})
export class CalificacionesComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private calificacionesService = inject(CalificacionesService);
  private materiasService = inject(MateriasService);
  private authService = inject(AuthService);
  private alumnosService = inject(AlumnosService);
  private inscripcionesService = inject(InscripcionesService);

  mostrarBajaModal = false;
  
  materiaInfo = signal<any>(null);
  actividades = signal<any[]>([]);
  calificaciones = signal<any[]>([]);
  
  promedioActual = signal<number>(0);
  
  // Agrupadas por ponderación o categoría
  actividadesAgrupadas = signal<{categoria: string, porcentaje: number, items: any[]}[]>([]);

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const materiaId = params.get('materiaId');
      if (materiaId) {
        this.cargarDatosMateria(materiaId);
      }
    });
  }

  cargarDatosMateria(materiaId: string) {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    // 1. Obtener datos de la materia
    this.materiasService.getMateriaById(materiaId).subscribe({
      next: (materia) => {
        this.materiaInfo.set(materia);
      },
      error: (err) => console.error('Error al cargar materia', err)
    });

    // 2. Obtener el alumno_id, luego ponderaciones, actividades y calificaciones
    this.alumnosService.getAlumnos({ limit: 1000 }).pipe(
      switchMap(alumnos => {
        const miRegistro = alumnos.find(a => a.user_id === user.user_id);
        if (!miRegistro || !miRegistro.alumno_id) {
          return of(null);
        }
        
        return forkJoin({
          ponderacion: this.calificacionesService.getPonderaciones(materiaId).pipe(catchError(() => of(null))),
          actividades: this.calificacionesService.getActividadesByMateria(materiaId).pipe(catchError(() => of([]))),
          calificaciones: this.calificacionesService.getCalificacionesAlumnoMateria(miRegistro.alumno_id, materiaId).pipe(catchError(() => of([])))
        });
      })
    ).subscribe({
      next: (data) => {
        if (!data) return;
        
        const acts = data.actividades || [];
        const califs = data.calificaciones || [];
        const pond = data.ponderacion;
        
        let suma = 0;
        let conteo = 0;
        
        // Mapear la calificación a cada actividad
        const mappedActividades = acts.map(act => {
          const califObj = califs.find((c: any) => c.actividad_id === act.actividad_id);
          const calificacion = califObj ? califObj.calificacion : null;
          
          if (calificacion !== null) {
            suma += calificacion;
            conteo++;
          }
          
          return {
            ...act,
            calificacion,
            observaciones: califObj ? califObj.observaciones : ''
          };
        });
        
        if (conteo > 0) {
          this.promedioActual.set(Number((suma / conteo).toFixed(1)));
        }
        
        // Agrupar por categoría (Criterio de ponderación)
        if (pond && pond.criterios) {
          const agrupadas = pond.criterios.map((crit: any) => {
            return {
              categoria: crit.nombre,
              porcentaje: crit.porcentaje,
              items: mappedActividades.filter(a => {
                // MS-Calificaciones liga la actividad a la ponderacion (opcional)
                // Si no hay mapeo exacto, se pueden dejar en "General"
                return a.ponderacion_id === pond.ponderacion_id; // Simplicación o buscar por nombre si el back lo soporta
              })
            };
          });
          
          // Actividades sin categoría específica
          const unassigned = mappedActividades.filter(a => !a.ponderacion_id || a.ponderacion_id !== pond.ponderacion_id);
          if (unassigned.length > 0) {
            agrupadas.push({
              categoria: 'Actividades Generales',
              porcentaje: 0,
              items: unassigned
            });
          }
          
          this.actividadesAgrupadas.set(agrupadas);
        } else {
          // Si no hay ponderación, agrupar todo en General
          this.actividadesAgrupadas.set([{
            categoria: 'Actividades Generales',
            porcentaje: 100,
            items: mappedActividades
          }]);
        }
      },
      error: (err) => console.error('Error cargando calificaciones', err)
    });
  }

  abrirBaja() {
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.mostrarBajaModal = false;
  }

  ejecutarBaja() {
    this.route.paramMap.subscribe(params => {
      const materiaId = params.get('materiaId');
      const user = this.authService.getCurrentUser();
      
      if (!materiaId || !user) return;

      this.alumnosService.getAlumnos({ limit: 1000 }).pipe(
        switchMap(alumnos => {
          const miRegistro = alumnos.find(a => a.user_id === user.user_id);
          if (!miRegistro || !miRegistro.alumno_id) return of(null);
          
          return this.alumnosService.bajaMateria(miRegistro.alumno_id, materiaId);
        })
      ).subscribe({
        next: (result) => {
          if (result === null) return;
          this.cerrarBaja();
          this.router.navigate(['/alumno/materias']);
        },
        error: (err: any) => {
          console.error('Error al dar de baja:', err);
          alert('No se pudo dar de baja la materia.');
        }
      });
    });
  }
}
