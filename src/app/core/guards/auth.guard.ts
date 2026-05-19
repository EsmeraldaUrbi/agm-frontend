import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // 1. Verificar si está autenticado
  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  // 2. Verificar roles requeridos (si la ruta especifica data.roles)
  const requiredRoles = route.data?.['roles'] as string[];
  if (requiredRoles && requiredRoles.length > 0) {
    const user = authService.currentUser();
    const hasRole = user && requiredRoles.includes(user.rol);

    if (!hasRole) {
      router.navigate(['/acceso-denegado']);
      return false;
    }
  }

  return true;
};
