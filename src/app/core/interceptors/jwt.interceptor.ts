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
      // 401: Sesión Expirada o no autorizado
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/sesion-expirada']);
      } 
      // 403: Acceso Denegado (rol incorrecto)
      else if (error.status === 403) {
        router.navigate(['/acceso-denegado']);
      }
      return throwError(() => error);
    })
  );
};
