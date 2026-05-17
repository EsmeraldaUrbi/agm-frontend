import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';

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
  materia = {
    nrc: '28491',
    nombre: 'Web Services Architecture',
    seccion: '101',
    horario: 'Lunes, Miércoles 16:00 - 18:00',
    programa: 'Postgrado en Computación',
    periodo: 'Primavera 2026',
  };

  tabs = ['Alumnos', 'Ponderaciones', 'Actividades'];

  // Lista de Alumnos Inscritos
  alumnos = signal<Alumno[]>([
    { matricula: '202012345', nombre: 'Diego Cannata', correo: 'diego.cannata@alumno.buap.mx', estatus: 'Inscrito Oficial' },
    { matricula: '202015678', nombre: 'Alejandro Garcia', correo: 'alejandro.garciacon@alumno.buap.mx', estatus: 'Inscrito Oficial' },
    { matricula: '202019921', nombre: 'Maria Rodriguez Ortiz', correo: 'maria.rodriguez@alumno.buap.mx', estatus: 'Inscrito Oficial' },
    { matricula: '202113342', nombre: 'Ana Beltrán López', correo: 'ana.beltran@alumno.buap.mx', estatus: 'Inscrito Oficial' },
  ]);

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

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
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
  alumnosExtraidos = signal<any[]>([
    { matricula: '202245678', nombre: 'Carlos Sánchez Ruiz', correo: 'carlos.sanchez@alumno.buap.mx', status: 'Nuevo' },
    { matricula: '202289101', nombre: 'Laura Gómez Fernandez', correo: 'laura.gomez@alumno.buap.mx', status: 'Nuevo' },
  ]);

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
