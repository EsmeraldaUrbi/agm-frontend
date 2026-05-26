import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriasService } from '../../../core/services/materias.service';

interface Alumno {
  matricula: string;
  nombre: string;
  correo: string;
  estatus: string;
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
    private materiasService: MateriasService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.cargarDatosMateria(id);
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

  // Modal Agregar Manual
  showManualModal = signal(false);
  nuevoAlumno = { matricula: '', nombre: '', correo: '' };

  abrirManualModal() {
    this.nuevoAlumno = { matricula: '', nombre: '', correo: '' };
    this.showManualModal.set(true);
  }

  guardarManual() {
    if (!this.nuevoAlumno.matricula || !this.nuevoAlumno.nombre) return;
    this.alumnos.update(list => [...list, {
      matricula: this.nuevoAlumno.matricula,
      nombre: this.nuevoAlumno.nombre,
      correo: this.nuevoAlumno.correo || `${this.nuevoAlumno.matricula}@alumno.buap.mx`,
      estatus: 'Inscrito Manual'
    }]);
    this.showManualModal.set(false);
  }

  // Dar de Baja
  darDeBaja(matricula: string) {
    this.alumnos.update(list => list.filter(a => a.matricula !== matricula));
  }

  // Stepper Importar PDF BUAP (Modal)
  showPdfModal = signal(false);
  step = signal<number>(1); // 1: Subir PDF, 2: Procesando, 3: Previsualización, 4: Confirmado
  archivoSeleccionado = signal<string>('');
  alumnosExtraidos = signal<any[]>([]);

  abrirPdfModal() {
    this.step.set(1);
    this.archivoSeleccionado.set('');
    this.showPdfModal.set(true);
  }

  seleccionarArchivo(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.archivoSeleccionado.set(file.name);
      this.step.set(2);
      setTimeout(() => {
        this.step.set(3);
      }, 2000);
    }
  }

  confirmarImportacionPdf() {
    this.step.set(4);
    // Agregar extraídos a la lista general
    setTimeout(() => {
      this.alumnos.update(list => [
        ...list,
        ...this.alumnosExtraidos().map(a => ({
          matricula: a.matricula,
          nombre: a.nombre,
          correo: a.correo,
          estatus: 'Importado PDF'
        }))
      ]);
    }, 1000);
  }

  cerrarPdfModal() {
    this.showPdfModal.set(false);
  }
}
