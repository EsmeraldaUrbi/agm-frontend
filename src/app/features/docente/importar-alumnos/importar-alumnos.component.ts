import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriasService } from '../../../core/services/materias.service';
import { AlumnosService } from '../../../core/services/alumnos.service';

interface Alumno {
  matricula: string;
  nombre: string;
  correo: string;
  estatus: string;
  origen: string;
}

@Component({
  selector: 'app-importar-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './importar-alumnos.component.html'
})
export class ImportarAlumnosComponent {
  materia = signal<any>({
    materia_id: '',
    nrc: '',
    nombre: 'Cargando materia...',
    seccion: '',
    horario: 'Sin horario asignado',
    programa: 'Cargando programa...',
    periodo: 'Cargando periodo...',
  });

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];

  // Lista de Alumnos Inscritos
  alumnos = signal<Alumno[]>([]);

  busqueda = signal('');

  alumnosFiltrados = computed(() => {
    const q = this.busqueda().toLowerCase();
    if (!q) return this.alumnos();
    return this.alumnos().filter(a => 
      a.nombre.toLowerCase().includes(q) || 
      a.matricula.toLowerCase().includes(q) || 
      a.correo.toLowerCase().includes(q)
    );
  });

  constructor(
    private route: ActivatedRoute,
    private materiasService: MateriasService,
    private alumnosService: AlumnosService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
        this.cargarAlumnosDeMateria(id);
      }
    });
  }

  cargarAlumnosDeMateria(materiaId: string) {
    this.alumnosService.getAlumnosByMateria(materiaId).subscribe({
      next: (data) => {
        const mapped = data.map((a: any) => ({
          matricula: a.matricula || 'N/A',
          nombre: a.nombre_completo || 'Sin Nombre',
          correo: a.correo || 'Sin correo',
          estatus: a.estatus_academico !== undefined ? (a.estatus_academico ? 'Activo' : 'Inactivo') : 'Sin estatus',
          origen: a.tipo_formacion || 'N/A'
        }));
        this.alumnos.set(mapped);
      },
      error: (err) => {
        console.error('Error al cargar alumnos de la materia', err);
        this.alumnos.set([]);
      }
    });
  }

  cargarDatosMateria(id: string) {
    this.materiasService.getMateriaById(id).subscribe({
      next: (data: any) => {
        let horarioFormat = 'Horario no definido';
        if (data.horarios && data.horarios.length > 0) {
          const gruposHorarios: { [key: string]: string[] } = {};
          data.horarios.forEach((h: any) => {
            const ini = h.hora_inicio?.substring(0, 5) || '';
            const fin = h.hora_fin?.substring(0, 5) || '';
            const rango = `${ini} - ${fin}`;
            if (!gruposHorarios[rango]) gruposHorarios[rango] = [];
            gruposHorarios[rango].push(h.dia);
          });
          const partes = Object.entries(gruposHorarios).map(([rango, dias]) => {
            return `${dias.join(', ')} ${rango}`;
          });
          horarioFormat = partes.join(' | ');
        }

        this.materia.set({
          materia_id: id,
          nrc: data.nrc || 'N/A',
          nombre: data.nombre || 'Materia sin nombre',
          seccion: data.seccion || '001',
          horario: horarioFormat,
          programa: data.programa || 'Licenciatura en Ciencias de la Computación',
          periodo: data.periodo?.nombre || 'Otoño 2024'
        });
      },
      error: (err) => {
        console.error('Error al cargar la materia', err);
      }
    });
  }

  // Stepper Importar PDF BUAP (Modal)
  showPdfModal = signal(false);
  step = signal<number>(1); // 1: Subir PDF, 2: Procesando, 3: Previsualización, 4: Confirmado
  archivoSeleccionado = signal<string>('');
  alumnosExtraidos = signal<any[]>([]);
  archivoParaSubir: File | null = null;
  importResult = signal<any>(null);
  confirmacionNrc = signal<boolean>(false);

  abrirPdfModal() {
    this.step.set(1);
    this.archivoSeleccionado.set('');
    this.archivoParaSubir = null;
    this.importResult.set(null);
    this.confirmacionNrc.set(false);
    this.showPdfModal.set(true);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file.name);
      this.archivoParaSubir = file;
      this.confirmacionNrc.set(false);
      this.step.set(2); // Vamos directo a confirmar
    }
  }

  confirmarImportacionPdf() {
    if (!this.archivoParaSubir || !this.confirmacionNrc()) return;
    
    this.step.set(3); // Procesando...
    
    this.alumnosService.importarAlumnos(this.archivoParaSubir, this.materia().materia_id).subscribe({
      next: (res) => {
        this.importResult.set(res);
        this.step.set(4); // Exito
      },
      error: (err) => {
        console.error('Error al importar PDF:', err);
        // Volvemos al paso 1 en caso de error
        alert('Hubo un error al procesar el PDF. Asegúrate de que sea el formato correcto.');
        this.step.set(1);
      }
    });
  }

  cerrarPdfModal() {
    this.showPdfModal.set(false);
    // Idealmente recargar la lista de alumnos
    if (this.step() === 4) {
      const id = this.materia().materia_id;
      if (id) this.cargarAlumnosDeMateria(id);
    }
  }
}
