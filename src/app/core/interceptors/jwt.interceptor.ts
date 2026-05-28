import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  const token = authService.getToken();
  const normalizedUrl = normalizeUrl(req.url);
  const normalizedReq = normalizedUrl === req.url ? req : req.clone({ url: normalizedUrl });
  
  // Verificar si la petición va dirigida a alguna URL de nuestros microservicios
  const isMicroserviceReq = Object.values(environment).some(url => 
    typeof url === 'string' && normalizedReq.url.startsWith(url)
  );

  let authReq = normalizedReq;
  if (token && isMicroserviceReq) {
    authReq = normalizedReq.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // 401: Sesión Expirada o no autorizado (excepto al hacer login)
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        router.navigate(['/sesion-expirada']);
      }
      // 403: Solo redirigir a /acceso-denegado si es un error de permisos de rol real.
      // Si el backend devuelve un body con mensaje (error de negocio), NO redirigir
      // para que el componente pueda mostrar el error al usuario en la misma pantalla.
      else if (error.status === 403) {
        const hasBusinessErrorBody = error.error &&
          (error.error.message || error.error.detail || error.error.error);
        if (!hasBusinessErrorBody) {
          router.navigate(['/acceso-denegado']);
        }
      }
      return throwError(() => error);
    })
  );
};

function normalizeUrl(url: string): string {
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
