import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiClient {
  private http = inject(HttpClient);

  get<T>(url: string, params?: HttpParams | { [param: string]: string | number | boolean | ReadonlyArray<string | number | boolean> }): Observable<T> {
    return this.http.get<T>(this.normalizeUrl(url), { params }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(url: string, body: any, options?: { headers?: HttpHeaders; params?: HttpParams }): Observable<T> {
    return this.http.post<T>(this.normalizeUrl(url), body, options).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(this.normalizeUrl(url), body).pipe(
      catchError(this.handleError)
    );
  }

  patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(this.normalizeUrl(url), body).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(this.normalizeUrl(url)).pipe(
      catchError(this.handleError)
    );
  }

  // Método específico para descargas de archivos (Blob)
  download(url: string, params?: HttpParams | { [param: string]: string | number | boolean }): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': '*/*'
    });
    return this.http.get(this.normalizeUrl(url), {
      headers,
      params: params as any,
      responseType: 'blob'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Manejo centralizado de errores HTTP
  private handleError(error: any) {
    if (error && error.status !== 404) {
      console.error('Error HTTP en ApiClient:', error);
    }
    return throwError(() => error);
  }

  private normalizeUrl(url: string): string {
    return url
      .replace(/^http:\/\/api-gateway-production-0647\.up\.railway\.app/, 'https://api-gateway-production-0647.up.railway.app')
      .replace('/api/periodos/periodos', '/api/v1/periodos')
      .replace('/api/periodos/planes-estudio', '/api/v1/planes-estudio')
      .replace('/api/periodos/materias-catalogo', '/api/v1/materias-catalogo')
      .replace('/api/periodos/materias-planes-estudio', '/api/v1/materias-planes-estudio')
      .replace('/api/periodos/materias-ofertadas', '/api/v1/materias-ofertadas')
      .replace('/api/periodos/materia-horarios', '/api/v1/materia-horarios')
      .replace('/api/periodos/importaciones', '/api/v1/importaciones')
      .replace('/api/periodos/materias', '/api/v1/materias');
  }
}
