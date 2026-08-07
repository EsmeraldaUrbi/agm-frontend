import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MateriaContextService } from '../../../core/services/materia-context.service';
import { AlumnosService } from '../../../core/services/alumnos.service';
import * as pdfjsLib from 'pdfjs-dist';

pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

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
    estado: '',
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

  routeId = signal<string>('');

  constructor(
    private route: ActivatedRoute,
    private materiaContextService: MateriaContextService,
    private alumnosService: AlumnosService
  ) {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.routeId.set(id);
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
    this.materiaContextService.getContextoMateria(id).subscribe({
      next: (contexto) => {
        this.materia.set({
          materia_id: contexto.materia_id,
          nrc: contexto.nrc,
          nombre: contexto.nombre,
          seccion: contexto.seccion,
          horario: contexto.horario,
          programa: contexto.programa,
          periodo: contexto.periodo,
          estado: contexto.estado || contexto.raw?.estado || contexto.raw?.estado_materia || ''
        });
      },
      error: (err) => {
        console.error('Error al cargar contexto académico de la materia', err);
      }
    });
  }

  // Stepper Importar PDF BUAP (Modal)
  showPdfModal = signal(false);
  step = signal<number>(1); // 1: Subir PDF, 2: Confirmar, 3: Procesando, 4: Confirmado
  archivoSeleccionado = signal<string>('');
  alumnosExtraidos = signal<any[]>([]);
  archivoParaSubir: File | null = null;
  importResult = signal<any>(null);
  confirmacionNrc = signal<boolean>(false);
  errorImportacion = signal<string | null>(null);
  nrcPdfExtraido = signal<string | null>(null);
  validandoNrcPdf = signal<boolean>(false);

  materiaCerrada = computed(() =>
    String(this.materia().estado || '').trim().toUpperCase() === 'CERRADA'
  );

  nrcPdfCoincide = computed(() => {
    const esperado = this.normalizarNrc(this.materia().nrc);
    const extraido = this.normalizarNrc(this.nrcPdfExtraido());

    return Boolean(esperado && extraido && esperado === extraido);
  });

  puedeImportarPdf = computed(() =>
    !this.materiaCerrada() &&
    !this.validandoNrcPdf() &&
    this.confirmacionNrc() &&
    this.nrcPdfCoincide()
  );


  abrirPdfModal() {
    this.errorImportacion.set(null);

    if (this.materiaCerrada()) {
      this.errorImportacion.set('No se pueden importar alumnos porque la materia está cerrada.');
      return;
    }

    this.step.set(1);
    this.archivoSeleccionado.set('');
    this.archivoParaSubir = null;
    this.importResult.set(null);
    this.confirmacionNrc.set(false);
    this.nrcPdfExtraido.set(null);
    this.validandoNrcPdf.set(false);
    this.showPdfModal.set(true);
  }


  async seleccionarArchivo(event: any) {
    const file = event.target.files?.[0];
    if (!file) return;

    this.archivoSeleccionado.set(file.name);
    this.archivoParaSubir = file;
    this.confirmacionNrc.set(false);
    this.nrcPdfExtraido.set(null);
    this.errorImportacion.set(null);
    this.validandoNrcPdf.set(true);
    this.step.set(2);

    try {
      const nrcDetectado = await this.extraerNrcDesdePdf(file);
      this.nrcPdfExtraido.set(nrcDetectado);

      const esperado = this.normalizarNrc(this.materia().nrc);
      const detectado = this.normalizarNrc(nrcDetectado);

      if (!detectado) {
        this.errorImportacion.set('No se pudo identificar el NRC dentro del PDF. Verifica que sea un acta BUAP válida.');
      } else if (esperado !== detectado) {
        this.errorImportacion.set(`El PDF contiene el NRC ${nrcDetectado}, pero esta materia corresponde al NRC ${this.materia().nrc}. No se permitirá la importación.`);
      }
    } catch (err) {
      console.error('Error al validar NRC del PDF:', err);
      this.errorImportacion.set('No se pudo leer el PDF para validar el NRC. Verifica que el archivo no esté dañado.');
    } finally {
      this.validandoNrcPdf.set(false);
    }
  }


  confirmarImportacionPdf() {
    if (this.materiaCerrada()) {
      this.errorImportacion.set('No se pueden importar alumnos porque la materia está cerrada.');
      return;
    }

    if (!this.archivoParaSubir || !this.puedeImportarPdf()) {
      this.errorImportacion.set('No se puede importar: verifica que el NRC del PDF coincida con el NRC de esta materia.');
      return;
    }

    this.step.set(3);

    const materiaId = this.routeId() || this.materia().materia_id;

    this.alumnosService.importarAlumnos(this.archivoParaSubir, materiaId).subscribe({
      next: (res) => {
        this.importResult.set(res);
        this.step.set(4);

        if (materiaId) {
          this.alumnosService.invalidateMateriaAlumnosCache(materiaId);
          this.cargarAlumnosDeMateria(materiaId);
        }
      },
      error: (err) => {
        console.error('Error al importar PDF:', err);

        const mensaje =
          err?.error?.detail ||
          err?.error?.message ||
          err?.error?.error ||
          err?.message ||
          'Hubo un error al procesar el PDF. Asegúrate de que sea el formato correcto.';

        this.errorImportacion.set(String(mensaje).trim());
        this.step.set(2);
      }
    });
  }


  private normalizarNrc(valor: any): string {
    const digitos = String(valor || '').replace(/\D/g, '');
    return digitos.replace(/^0+/, '') || digitos;
  }

  private extraerNrcDesdeTexto(texto: string): string | null {
    const patrones = [
      /\bNRC\s*[:#\-]?\s*(\d{4,6})\b/i,
      /\bNRC\s*(\d{4,6})\b/i,
      /NRC[_\s\-]*(\d{4,6})/i
    ];

    for (const patron of patrones) {
      const match = texto.match(patron);
      if (match?.[1]) {
        return match[1];
      }
    }

    return null;
  }

  private async extraerNrcDesdePdf(file: File): Promise<string | null> {
    const nrcPorNombre = this.extraerNrcDesdeTexto(file.name);

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let textoCompleto = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const textoPagina = textContent.items.map((item: any) => item.str || '').join(' ');

      textoCompleto += ` ${textoPagina}`;

      const nrcPagina = this.extraerNrcDesdeTexto(textoPagina);
      if (nrcPagina) {
        return nrcPagina;
      }
    }

    return this.extraerNrcDesdeTexto(textoCompleto) || nrcPorNombre;
  }

  cerrarPdfModal() {
    this.showPdfModal.set(false);
    // Idealmente recargar la lista de alumnos
    if (this.step() === 4) {
      const id = this.routeId() || this.materia().materia_id;
      if (id) {
        this.alumnosService.invalidateMateriaAlumnosCache(id);
        this.cargarAlumnosDeMateria(id);
      }
    }
  }
}
