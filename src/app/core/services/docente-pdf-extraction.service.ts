import { Injectable } from '@angular/core';
import * as pdfjsLib from 'pdfjs-dist';

// Configurar el worker de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface DocenteExtraido {
  nombre: string;
  correo: string;
  ubicacion: string;
  departamento: string;
  academia: string;
  tieneError: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DocentePdfExtractionService {
  private columnAliases: Record<string, string[]> = {
    nombre: ['nombre', 'docente', 'profesor', 'maestro', 'teacher'],
    correo: ['correo', 'email', 'mail', 'correoelectronico'],
    ubicacion: ['ubicacion', 'cubiculo', 'oficina', 'edificio', 'area', 'ubicaciondocente'],
    departamento: ['departamento', 'area'],
    academia: ['academia', 'colegio']
  };

  constructor() {}

  async extractDocentesFromPdf(file: File): Promise<DocenteExtraido[]> {
    try {
      const text = await this.extractTextFromPdf(file);
      return this.parseTextToDocentes(text);
    } catch (error) {
      console.error('Error al extraer PDF:', error);
      throw error;
    }
  }

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

  private normalizeHeader(value: string): string {
    return value.toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "");
  }

  private resolveColumn(header: string): keyof DocenteExtraido | null {
    const normalized = this.normalizeHeader(header);
    for (const [key, aliases] of Object.entries(this.columnAliases)) {
      if (aliases.includes(normalized)) {
        return key as keyof DocenteExtraido;
      }
    }
    return null;
  }

  private parseTextToDocentes(text: string): DocenteExtraido[] {
    const docentes: DocenteExtraido[] = [];
    
    // Detect headers
    const firstLines = text.substring(0, 1000).split(/\s+/);
    const headersFound = new Set<keyof DocenteExtraido>();
    for (const word of firstLines) {
      if (word.length > 2) {
        const resolved = this.resolveColumn(word);
        if (resolved) {
          headersFound.add(resolved);
        }
      }
    }

    // Heuristic: Emails are reliable delimiters in academic PDFs for teachers
    const emailRegex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi;
    let match;
    const emailsFound: string[] = [];
    
    while ((match = emailRegex.exec(text)) !== null) {
      if (!emailsFound.includes(match[1])) {
        emailsFound.push(match[1]);
      }
    }

    if (emailsFound.length === 0) {
      return docentes;
    }

    // Split text by emails to create chunks around each teacher
    const chunks = text.split(/([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/i);

    for (let i = 1; i < chunks.length; i += 2) {
      const email = chunks[i].trim();
      let preChunk = chunks[i - 1] || '';
      
      // Try to find location in the preChunk
      let ubicacion = '';
      
      // Match patterns like CCO2-301, CCO1-102
      const buildingMatch = preChunk.match(/\b[A-Z]{2,4}\d?-\d{2,4}\b/);
      if (buildingMatch) {
        ubicacion = buildingMatch[0];
        preChunk = preChunk.replace(buildingMatch[0], '');
      } else {
        // Match patterns like Cubiculo A-12, Oficina 203, Edificio D, etc.
        // Be careful not to swallow the teacher's name (e.g. Ubicación: Extensión: Acosta)
        const wordMatch = preChunk.match(/(?:Cub[ií]culo|Oficina|Edificio|Lab(?:oratorio)?(?:\s+Sistemas)?|Ubicaci[oó]n:?(?:\s*Extensi[oó]n:?)?)\s*([A-Z]?\-\d+|\d+[A-Z]?|[A-Z]\b)?/i);
        if (wordMatch) {
          ubicacion = wordMatch[0].trim();
          // Clean up dangling colons or labels if it didn't capture a real location value
          preChunk = preChunk.replace(wordMatch[0], '');
        }
      }

      // Try to find names before the email
      let nombre = '';
      const tokensBefore = preChunk.split(/\s+/).filter(t => t.length > 1).reverse();
      const nameParts = [];
      for (const token of tokensBefore) {
        if (/^[A-ZÁÉÍÓÚÑ]/.test(token) || /^(Dr\.|Mtra\.|Mtro\.|Ing\.|Lic\.)/i.test(token)) {
          nameParts.unshift(token);
        } else {
          if (nameParts.length > 1) break;
        }
      }
      nombre = nameParts.join(' ').trim();
      if (!nombre) {
        const fallbackNameMatch = preChunk.match(/[A-ZÁÉÍÓÚÑa-záéíóúñ\-\s]{10,}$/);
        nombre = fallbackNameMatch ? fallbackNameMatch[0].trim() : '';
      }

      const tieneError = !nombre || !email;

      docentes.push({
        nombre: nombre || '',
        correo: email.toLowerCase(),
        ubicacion: ubicacion || '',
        departamento: '', // Optional/manual
        academia: '',     // Optional/manual
        tieneError
      });
    }

    return docentes;
  }
}
