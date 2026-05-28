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
  
  // Verificar si la petición va dirigida a alguna URL de nuestros microservicios
  const isMicroserviceReq = Object.values(environment).some(url => 
    typeof url === 'string' && req.url.startsWith(url)
  );

  let authReq = req;
  if (token && isMicroserviceReq) {
    authReq = req.clone({
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
