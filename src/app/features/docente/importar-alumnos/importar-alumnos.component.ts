import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-importar-alumnos',
  standalone: true,
  imports: [CommonModule, RouterModule],
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

  constructor(private route: ActivatedRoute) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.materia.nrc = id;
      }
    });
  }

  step = signal<number>(1); // 1: Subir PDF, 2: Procesando, 3: Previsualización, 4: Confirmado
  archivoSeleccionado = signal<string>('');
  alumnosExtraidos = signal<any[]>([
    { matricula: '202012345', nombre: 'Diego Cannata', correo: 'diego.cannata@alumno.buap.mx', status: 'Válido' },
    { matricula: '202015678', nombre: 'Alejandro Garcia', correo: 'alejandro.garciacon@alumno.buap.mx', status: 'Válido' },
    { matricula: '202019921', nombre: 'Maria Rodriguez Ortiz', correo: 'maria.rodriguez@alumno.buap.mx', status: 'Válido' },
    { matricula: '202113342', nombre: 'Ana Beltrán López', correo: 'ana.beltran@alumno.buap.mx', status: 'Válido' },
  ]);

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

  confirmarImportacion() {
    this.step.set(4);
  }
}
