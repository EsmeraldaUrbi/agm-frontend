import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HorarioComponent } from '../../../shared/components/horario/horario.component';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-mis-materias',
  standalone: true,
  imports: [CommonModule, RouterModule, HorarioComponent, SolicitarBajaComponent],
  templateUrl: './mis-materias.component.html',
  styleUrl: './mis-materias.component.css'
})
export class MisMateriasComponent implements OnInit {
  mostrarHorarioModal = false;
  mostrarBajaModal = false;

  filtroActivo: 'todas' | 'activas' | 'bajas' = 'todas';

  get materiasFiltradas() {
    if (this.filtroActivo === 'activas') {
      return this.materias.filter(m => m.activa);
    }
    if (this.filtroActivo === 'bajas') {
      return this.materias.filter(m => !m.activa);
    }
    return this.materias;
  }

  materias: any[] = [];
  scheduleData: any[] = [];

  private inscripcionesService = inject(InscripcionesService);
  private materiasService = inject(MateriasService);
  private alumnosService = inject(AlumnosService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.cargarDatos();
  }

  alumnoId: string | null = null;

  cargarDatos() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    // Primero buscar el alumno_id correspondiente a este user_id
    this.alumnosService.getAlumnos({ limit: 1000 }).pipe(
      switchMap(alumnos => {
        const miRegistro = alumnos.find(a => a.user_id === user.user_id);
        if (!miRegistro || !miRegistro.alumno_id) {
          return of([]);
        }
        this.alumnoId = miRegistro.alumno_id;
        return this.inscripcionesService.getInscripcionesByAlumno(miRegistro.alumno_id);
      })
    ).subscribe({
      next: (inscripciones) => {
        if (!inscripciones || inscripciones.length === 0) {
          this.materias = [];
          this.scheduleData = [];
          return;
        }

        const infoPeticiones = inscripciones.map(ins => 
          this.materiasService.getMateriaById(ins.materia_id).pipe(
            catchError(() => of(null))
          )
        );

        const horariosPeticiones = inscripciones.map(ins => 
          this.materiasService.getHorarios({ materia_ofertada_id: ins.materia_id }).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin([forkJoin(infoPeticiones), forkJoin(horariosPeticiones)]).subscribe(([materiasInfo, horariosData]) => {
          this.materias = inscripciones.map((ins, index) => {
            const info = materiasInfo[index] as any;
            return {
              materia_id: ins.materia_id,
              inscripcion_id: ins.inscripcion_id,
              nrc: ins.nrc_materia || info?.nrc || 'S/N',
              nombre: info?.nombre || 'Materia sin nombre',
              docente: info?.docente_nombre || 'Asignado',
              creditos: info?.creditos || 6,
              promedio: 'N/A',
              activa: ins.activa !== false
            };
          });

          let allHorarios: any[] = [];
          horariosData.forEach((horariosMateria: any[], index) => {
            const inscripcion = inscripciones[index];
            if (inscripcion.activa === false) return; // No mostrar materias dadas de baja en el horario
            
            const info = materiasInfo[index];
            horariosMateria.forEach(h => {
              allHorarios.push({
                ...h,
                materia_nombre: info?.nombre || 'Materia',
                materia_id: inscripcion.materia_id
              });
            });
          });
          this.scheduleData = allHorarios;
        });
      },
      error: (err) => console.error("Error al cargar inscripciones", err)
    });
  }

  materiaSeleccionada: any = null;

  abrirHorario() {
    this.mostrarHorarioModal = true;
  }

  cerrarHorario() {
    this.mostrarHorarioModal = false;
  }

  abrirBaja(materia: any) {
    this.materiaSeleccionada = materia;
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.materiaSeleccionada = null;
    this.mostrarBajaModal = false;
  }

  ejecutarBaja() {
    if (!this.alumnoId || !this.materiaSeleccionada || !this.materiaSeleccionada.materia_id) {
      console.error('No se pudo determinar la información para dar de baja.');
      return;
    }
    
    this.alumnosService.bajaMateria(this.alumnoId, this.materiaSeleccionada.materia_id).subscribe({
      next: () => {
        this.cargarDatos();
        this.cerrarBaja();
      },
      error: (err: any) => {
        console.error('Error al intentar dar de baja la materia:', err);
        alert('Ocurrió un error al procesar la baja.');
      }
    });
  }
}
