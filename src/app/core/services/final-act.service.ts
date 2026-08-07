import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'agm_final_act_printed_materias';

@Injectable({
  providedIn: 'root'
})
export class FinalActService {
  private finalizedIds = signal<Set<string>>(this.load());

  isFinalActPrinted(materiaId: string | null | undefined): boolean {
    if (!materiaId) return false;
    return this.finalizedIds().has(String(materiaId));
  }

  markFinalActPrinted(materiaId: string): void {
    if (!materiaId) return;

    const next = new Set(this.finalizedIds());
    next.add(String(materiaId));

    this.finalizedIds.set(next);
    this.persist(next);
  }

  undoFinalActPrinted(materiaId: string): void {
    if (!materiaId) return;

    const next = new Set(this.finalizedIds());
    next.delete(String(materiaId));

    this.finalizedIds.set(next);
    this.persist(next);
  }

  private load(): Set<string> {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(parsed) ? parsed.map(String) : []);
    } catch {
      return new Set();
    }
  }

  private persist(ids: Set<string>): void {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
  }
}
