import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';
// Configurar el worker de PDF.js localmente si es necesario o usar el cdn
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface MateriaExtraida {
  nrc: string;
  materia: string;
  seccion: string;
  docente: string;
  horario: string;
  periodo?: string;
  tieneError?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PdfExtractionService {

  constructor() { }

  /**
   * Lee un archivo PDF y extrae la lista de materias parseadas.
   */
  async extractMateriasFromPdf(file: File): Promise<MateriaExtraida[]> {
    try {
      const text = await this.extractTextFromPdf(file);
      return this.parseTextToMaterias(text);
    } catch (error) {
      console.error('Error al extraer PDF:', error);
      throw error;
    }
  }

  /**
   * Extrae todo el texto plano del PDF.
   */
  private async extractTextFromPdf(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    let fullText = '';

    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map((item: any) => item.str).join(' ');
      fullText += pageText + '\n';
    }

    return fullText;
  }

  private columnAliases: Record<string, string[]> = {
    docente: ['docente', 'profesor', 'maestro', 'catedratico', 'teacher', 'instructor'],
    horario: ['horario', 'hora', 'schedule', 'time', 'turno'],
    materia: ['materia', 'asignatura', 'curso', 'unidadaprendizaje'],
    nrc: ['nrc', 'crn'],
    seccion: ['secc', 'seccion', 'grupo']
  };

  /**
   * Normaliza un texto de cabecera:
   * - Convierte a minúsculas
   * - Elimina acentos
   * - Elimina espacios y caracteres especiales
   */
  private normalizeHeader(value: string): string {
    return value.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  /**
   * Resuelve el nombre real de la columna comparando contra los aliases.
   */
  private resolveColumn(header: string): keyof MateriaExtraida | null {
    const normalized = this.normalizeHeader(header);
    for (const [key, aliases] of Object.entries(this.columnAliases)) {
      if (aliases.includes(normalized)) {
        return key as keyof MateriaExtraida;
      }
    }
    return null;
  }

  /**
   * Busca patrones en el texto y los convierte en la interfaz MateriaExtraida.
   * Utiliza expresiones regulares adaptadas para BUAP y reconoce aliases.
   */
  private parseTextToMaterias(text: string): MateriaExtraida[] {
    const materias: MateriaExtraida[] = [];
    
    // 1. Detectar cabeceras en el texto inicial para validar qué columnas existen
    const firstLines = text.substring(0, 1000).split(/\s+/);
    const headersFound = new Set<keyof MateriaExtraida>();
    
    for (const word of firstLines) {
      if (word.length > 2) {
        const resolved = this.resolveColumn(word);
        if (resolved) {
          headersFound.add(resolved);
        }
      }
    }

    // 2. Extraer datos (Heurística)
    // El NRC en BUAP normalmente son 5 dígitos.
    const nrcRegex = /\b(\d{5})\b/g;
    let match;

    const nrcsEncontrados: string[] = [];
    while ((match = nrcRegex.exec(text)) !== null) {
      if (!nrcsEncontrados.includes(match[1])) {
        nrcsEncontrados.push(match[1]);
      }
    }

    if (nrcsEncontrados.length === 0) {
      return materias;
    }
    
    const chunks = text.split(/\b\d{5}\b/);
    
    for (let i = 0; i < nrcsEncontrados.length; i++) {
      const nrc = nrcsEncontrados[i];
      const chunk = chunks[i + 1] || ''; 
      
      // Seccion: Ej. 101, 102, 001
      const seccionMatch = chunk.match(/\b([0-9]{3}|[0-9]{2}[A-Z]|[A-Z]{2}[0-9])\b/);
      const seccion = seccionMatch ? seccionMatch[1] : '';

      // Horario: Puede ser 0700-0859 o 07:00 - 08:59 y tener dias como L, M, Mi, J, V, A
      const horarioMatch = chunk.match(/([A-Za-z]{1,2}(?:\/[A-Za-z]{1,2})*)?\s*(\d{2}:?\d{2})\s*(?:-|a|al)?\s*(\d{2}:?\d{2})/);
      const horario = horarioMatch ? horarioMatch[0].trim() : '';

      // Docente: Nombres en MAYÚSCULAS con guiones (ej. RODRIGUEZ - PEDROZA BERENICE) o con títulos (Dr., Mtra.)
      let docente = '';
      const docenteMatchUpper = chunk.match(/[A-ZÁÉÍÓÚÑ]+\s*-\s*[A-ZÁÉÍÓÚÑ\s]+/);
      if (docenteMatchUpper) {
        docente = docenteMatchUpper[0].trim();
      } else {
        const docenteMatchTitles = chunk.match(/(?:Dr\.|Mtra\.|Mtro\.|Ing\.|Lic\.)\s+[A-Za-zÁÉÍÓÚáéíóúñÑ\s]+/i);
        docente = docenteMatchTitles ? docenteMatchTitles[0].trim() : '';
      }

      // Materia: Limpieza del inicio del chunk
      const materiaLimpia = chunk.substring(0, 60)
                                 .replace(/\b([0-9]{3}|[0-9]{2}[A-Z])\b/g, '') // Quitar seccion
                                 .replace(/([A-Za-z]{1,2})?\s*(\d{2}:?\d{2})\s*(?:-|a)?\s*(\d{2}:?\d{2})/g, '') // Quitar horario
                                 .replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ\s]/g, ' ')
                                 .replace(/\s+/g, ' ')
                                 .trim();
      const materia = materiaLimpia.length > 5 ? materiaLimpia : '';

      // Si falta un campo y su cabecera sí fue detectada en el PDF, lo marcamos para validar
      // O si de plano no pudimos parsearlo
      const tieneError = !nrc || !materia || !seccion || !docente || !horario;

      materias.push({
        nrc,
        materia: materia || '',
        seccion: seccion || '',
        docente: docente || '',
        horario: horario || '',
        tieneError
      });
    }

    return materias;
  }
}
