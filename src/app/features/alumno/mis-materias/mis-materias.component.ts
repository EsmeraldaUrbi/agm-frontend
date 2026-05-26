import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HorarioComponent } from '../horario/horario.component';
import { SolicitarBajaComponent } from '../solicitar-baja/solicitar-baja.component';
import { InscripcionesService } from '../../../core/services/inscripciones.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AuthService } from '../../../core/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

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

  materias: any[] = [];
  scheduleData: any[] = [];

  private inscripcionesService = inject(InscripcionesService);
  private materiasService = inject(MateriasService);
  private authService = inject(AuthService);

  ngOnInit() {
    this.cargarDatos();
  }

  cargarDatos() {
    const user = this.authService.getCurrentUser();
    if (!user) return;
    
    this.inscripcionesService.getInscripcionesByAlumno(user.user_id).subscribe({
      next: (inscripciones) => {
        this.materias = inscripciones.map(ins => ({
          nrc: ins.materia?.nrc || 'N/A',
          nombre: ins.materia?.nombre || 'Materia sin nombre',
          docente: 'Asignado',
          creditos: 6,
          promedio: 'N/A'
        }));
        
        if (inscripciones.length === 0) return;

        const peticiones = inscripciones.map(inscripcion => 
          this.materiasService.getHorarios({ materia_ofertada_id: inscripcion.materia_id }).pipe(
            catchError(() => of([]))
          )
        );

        forkJoin(peticiones).subscribe((resultados) => {
          let allHorarios: any[] = [];
          resultados.forEach((horariosMateria: any[], index) => {
            const materiaInfo = inscripciones[index].materia;
            horariosMateria.forEach(h => {
              allHorarios.push({
                ...h,
                materia_nombre: materiaInfo?.nombre || 'Materia'
              });
            });
          });
          this.scheduleData = allHorarios;
        });
      },
      error: (err) => console.error("Error al cargar inscripciones", err)
    });
  }

  abrirHorario() {
    this.mostrarHorarioModal = true;
  }

  cerrarHorario() {
    this.mostrarHorarioModal = false;
  }

  abrirBaja() {
    this.mostrarBajaModal = true;
  }

  cerrarBaja() {
    this.mostrarBajaModal = false;
  }
}
