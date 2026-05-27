import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { DocentesService } from '../../../core/services/docentes.service';
import { MateriasService } from '../../../core/services/materias.service';
import { AlumnosService, Alumno as AlumnoInscrito } from '../../../core/services/alumnos.service';
import { AsistenciasService, EstadisticasAsistenciaResponse } from '../../../core/services/asistencias.service';
import { ReportesService } from '../../../core/services/reportes.service';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

type EstadoAsistencia = 'presente' | 'retardo' | 'falta' | 'justificado' | null;

interface Alumno {
  matricula: string;
  nombre: string;
  iniciales: string;
  colorAvatar: string;
  hora: string;
  estado: EstadoAsistencia;
}

interface MateriaActiva {
  nrc: string;
  nombre: string;
  seccion: string;
  horario: string;
  programa: string;
  periodo: string;
}

@Component({
  selector: 'app-historial-asistencias',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './historial-asistencias.component.html'
})
export class HistorialAsistenciasComponent implements OnInit {
  
  private authService = inject(AuthService);
  private docentesService = inject(DocentesService);
  private materiasService = inject(MateriasService);
  private alumnosService = inject(AlumnosService);
  private asistenciasService = inject(AsistenciasService);
  private reportesService = inject(ReportesService);

  listaMateriasDisponibles: MateriaActiva[] = [];
  materiaSeleccionadaNrc = signal<string>('');
  materia = signal<MateriaActiva | null>(null);
  
  alumnosInscritos = signal<AlumnoInscrito[]>([]);
  historialAlumnos = signal<any[]>([]);
  estadisticas = signal<EstadisticasAsistenciaResponse | null>(null);
  
  isLoading = signal(false);
  docenteId: string | null = null;
  fechaActual = new Date();
  busqueda = '';

  alumnosFiltrados = computed(() => {
    const list = this.historialAlumnos();
    const query = this.busqueda.trim().toLowerCase();
    if (!query) return list;
    return list.filter(al => 
      (al.nombre && al.nombre.toLowerCase().includes(query)) || 
      (al.matricula && al.matricula.toLowerCase().includes(query))
    );
  });

  get fechaFormateada(): string {
    const opciones: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return this.fechaActual.toLocaleDateString('es-ES', opciones);
  }

  get diaActual(): string {
    return this.fechaActual.getDate().toString().padStart(2, '0');
  }

  get mesActual(): string {
    return this.fechaActual.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').toUpperCase();
  }

  ngOnInit() {
    this.resolverDocenteYCargarCursos();
  }

  resolverDocenteYCargarCursos() {
    const user = this.authService.getCurrentUser();
    if (!user) return;

    this.isLoading.set(true);
    this.docentesService.getDocentes().subscribe({
      next: (docentes) => {
        const matchingDocente = docentes.find(d => {
          const docenteEmail = (d as any).email || d.correo || '';
          return docenteEmail.toLowerCase() === user.email.toLowerCase();
        });
        if (matchingDocente && matchingDocente.docente_id) {
          this.docenteId = matchingDocente.docente_id;
          this.cargarCursos(matchingDocente.docente_id);
        } else {
          this.docenteId = user.user_id;
          this.cargarCursos(user.user_id);
        }
      },
      error: (err) => {
        console.error('Error al resolver docente:', err);
        this.docenteId = user.user_id;
        this.cargarCursos(user.user_id);
      }
    });
  }

  cargarCursos(docenteId: string) {
    this.materiasService.getMateriasByDocente(docenteId).subscribe({
      next: (res) => {
        this.listaMateriasDisponibles = res.items.map((m: any) => ({
          nrc: m.nrc || 'N/A',
          nombre: m.nombre || 'Materia sin Nombre',
          seccion: m.seccion || '001',
          horario: 'Por definir',
          programa: 'Licenciatura',
          periodo: m.periodo_id || 'Actual'
        }));
        
        if (this.listaMateriasDisponibles.length > 0) {
          this.cambiarMateria(this.listaMateriasDisponibles[0].nrc);
        }
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error al cargar materias:', err);
        this.isLoading.set(false);
      }
    });
  }

  cambiarMateria(nrc: string) {
    const mat = this.listaMateriasDisponibles.find(m => m.nrc === nrc);
    if (mat) {
      this.materiaSeleccionadaNrc.set(mat.nrc);
      this.materia.set(mat);
      this.alumnosInscritos.set([]);
      this.historialAlumnos.set([]);
      this.estadisticas.set(null);
      this.mensajeInfo.set(null);
      this.cargarDatosMateria();
    }
  }

  cargarDatosMateria() {
    const nrc = this.materiaSeleccionadaNrc();
    if (!nrc) return;
    
    // Obtenemos alumnos inscritos reales
    this.alumnosService.getAlumnosByMateria(nrc).subscribe({
      next: (alumnos) => {
        this.alumnosInscritos.set(alumnos);
        this.consultarHoy();
      }
    });
  }

  consultarHoy() {
    const nrc = this.materiaSeleccionadaNrc();
    if (!nrc) return;

    this.isLoading.set(true);
    this.mensajeInfo.set(null);
    this.historialAlumnos.set([]);
    this.estadisticas.set(null);

    this.asistenciasService.obtenerAsistenciasHoy(nrc as any).subscribe({
      next: (asistencias) => {
        if (!asistencias || asistencias.length === 0) {
          this.mensajeInfo.set('No hay sesión de asistencia registrada para esta fecha.');
          this.isLoading.set(false);
          return;
        }

        // Si hay asistencias, sacamos el id_sesion del primer registro para consultar estadísticas reales
        const idSesion = asistencias[0].id_sesion;
        if (idSesion) {
          this.asistenciasService.obtenerEstadisticasSesion(idSesion).subscribe({
            next: (stats) => {
              this.estadisticas.set(stats);
              this.mapearHistorial(asistencias);
            },
            error: () => {
              this.mapearHistorial(asistencias);
            }
          });
        } else {
          this.mapearHistorial(asistencias);
        }
      },
      error: (err) => {
        this.mensajeInfo.set('Error al consultar las asistencias de hoy.');
        this.isLoading.set(false);
      }
    });
  }

  private mapearHistorial(asistencias: any[]) {
    // Armamos la lista completa. Todos los inscritos que no están en asistencias son faltas.
    const inscritos = this.alumnosInscritos();
    const result: any[] = [];

    inscritos.forEach(inscrito => {
      // Buscar si el alumno pasó lista
      const registro = asistencias.find(a => a.matricula === inscrito.matricula || String(a.id_alumno) === String(inscrito.alumno_id));
      
      if (registro) {
        result.push({
          matricula: inscrito.matricula || registro.matricula,
          nombre: inscrito.nombre_completo,
          hora: new Date(registro.fecha_hora_registro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          estado: registro.estado_asistencia.toUpperCase()
        });
      } else {
        // No tiene registro, es FALTA
        result.push({
          matricula: inscrito.matricula || 'N/A',
          nombre: inscrito.nombre_completo,
          hora: '--:-- --',
          estado: 'FALTA'
        });
      }
    });
    
    // Agregamos también los que pasaron lista pero no están en la tabla de alumnos (casos raros)
    asistencias.forEach(a => {
      const exists = result.find(r => r.matricula === a.matricula);
      if (!exists) {
        result.push({
          matricula: a.matricula,
          nombre: `Alumno ${a.matricula}`,
          hora: new Date(a.fecha_hora_registro).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' }),
          estado: a.estado_asistencia.toUpperCase()
        });
      }
    });

    this.historialAlumnos.set(result);
    
    // Si el backend no trajo estadísticas (porque falló el ID de sesión), calculamos las fallback
    if (!this.estadisticas()) {
      const presentes = result.filter(r => r.estado === 'PRESENTE').length;
      const retardos = result.filter(r => r.estado === 'RETARDO').length;
      const faltas = result.filter(r => r.estado === 'FALTA').length;
      const total = presentes + retardos + faltas;
      const porcentaje = total > 0 ? ((presentes + retardos) / total) * 100 : 0;
      
      this.estadisticas.set({
        total_alumnos: total,
        presentes: presentes,
        retardos: retardos,
        ausentes: faltas,
        porcentaje_asistencia: porcentaje
      });
    }

    this.isLoading.set(false);
  }

  // Resumen calculado reactivamente
  resumen = computed(() => {
    const stats = this.estadisticas();
    return {
      total:        stats?.total_alumnos || this.alumnosInscritos().length || 0,
      presentes:    stats?.presentes || 0,
      faltas:       stats?.ausentes || 0,
      retardos:     stats?.retardos || 0,
      justificados: 0, // No soportado actualmente por el backend
      porcentaje:   stats?.porcentaje_asistencia ? Math.round(stats.porcentaje_asistencia) : 0,
    };
  });

  descargandoReporte = signal(false);
  
  descargarReporte() {
    const nrc = this.materiaSeleccionadaNrc();
    if (!nrc) return;
    
    this.descargandoReporte.set(true);
    this.reportesService.descargarReporteAsistencias(nrc, 'xlsx').subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Reporte_Asistencias_${nrc}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.descargandoReporte.set(false);
      },
      error: () => {
        alert('Error al generar el reporte de asistencias.');
        this.descargandoReporte.set(false);
      }
    });
  }
  
  mensajeInfo = signal<string | null>(null);

  getInitials(nombre: string): string {
    if (!nombre) return 'NA';
    return nombre.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  }
}
