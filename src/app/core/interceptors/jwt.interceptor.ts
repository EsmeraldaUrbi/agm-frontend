import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { normalizeApiUrl } from '../helpers/api-url.helpers';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const token = authService.getToken();
  const normalizedUrl = normalizeApiUrl(req.url);
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
      // 401: Sesión expirada o no autorizado, excepto al hacer login
      if (error.status === 401 && !req.url.includes('/auth/login')) {
        authService.logout();
        router.navigate(['/sesion-expirada']);
      }
      // 403: Solo redirigir a /acceso-denegado si es un error real de permisos.
      // Si el backend devuelve un body con mensaje, se deja que el componente lo maneje.
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
