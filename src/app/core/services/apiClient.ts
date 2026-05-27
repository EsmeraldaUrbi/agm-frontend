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
    return this.http.get<T>(url, { params }).pipe(
      catchError(this.handleError)
    );
  }

  post<T>(url: string, body: any, options?: { headers?: HttpHeaders; params?: HttpParams }): Observable<T> {
    return this.http.post<T>(url, body, options).pipe(
      catchError(this.handleError)
    );
  }

  put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  patch<T>(url: string, body: any): Observable<T> {
    return this.http.patch<T>(url, body).pipe(
      catchError(this.handleError)
    );
  }

  delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(url).pipe(
      catchError(this.handleError)
    );
  }

  // Método específico para descargas de archivos (Blob)
  download(url: string, params?: HttpParams | { [param: string]: string | number | boolean }): Observable<Blob> {
    const headers = new HttpHeaders({
      'Accept': '*/*'
    });
    return this.http.get(url, {
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
}
