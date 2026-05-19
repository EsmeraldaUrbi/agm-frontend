import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html'
})
export class PerfilComponent {
  // Mock de los datos del usuario logueado (que provendrían del GET /auth/me)
  usuario = {
    nombre: 'Carlos Eduardo Fernández',
    correo: 'carlos.fernandez@correo.buap.mx',
    rol: 'Administrador'
  };

  // Helper para generar iniciales
  getInitials(name: string): string {
    if (!name) return '';
    const parts = name.split(' ').filter(p => p.length > 0 && p.toLowerCase() !== 'dr.' && p.toLowerCase() !== 'mtra.');
    if (parts.length === 0) return '';
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
  }
}
