import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'docente' | 'alumno';
  identifier: string; // Matrícula o ID de nómina
  status: 'active' | 'inactive';
  createdAt: string;
}

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AgmButtonComponent,
    AgmInputComponent,
    AgmCardComponent
  ],
  templateUrl: './usuarios.html',
  styles: [`
    :host {
      display: block;
    }
    .animate-modal-in {
      animation: modalFadeIn 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards;
    }
    @keyframes modalFadeIn {
      from { opacity: 0; transform: scale(0.95); }
      to { opacity: 1; transform: scale(1); }
    }
  `]
})
export class UsuariosComponent {
  // Datos iniciales de prueba (Mock)
  usersList = signal<User[]>([
    {
      id: '1',
      name: 'Adalberto Aguilar Lozano',
      email: 'adalberto.aguilar@fcc.buap.mx',
      role: 'docente',
      identifier: 'DOC-10294',
      status: 'active',
      createdAt: '2024-02-15'
    },
    {
      id: '2',
      name: 'Esmeralda Urbieta Mora',
      email: 'esmeralda.urbieta@fcc.buap.mx',
      role: 'docente',
      identifier: 'DOC-10822',
      status: 'active',
      createdAt: '2024-03-01'
    },
    {
      id: '3',
      name: 'Juan Carlos Gómez Pérez',
      email: 'juan.gomez@alumno.buap.mx',
      role: 'alumno',
      identifier: '202245382',
      status: 'active',
      createdAt: '2022-08-20'
    },
    {
      id: '4',
      name: 'María Fernanda Ruiz Ortiz',
      email: 'maria.ruiz@alumno.buap.mx',
      role: 'alumno',
      identifier: '202264903',
      status: 'active',
      createdAt: '2022-08-21'
    },
    {
      id: '5',
      name: 'Carlos Sánchez Torres',
      email: 'carlos.sanchez@buap.mx',
      role: 'admin',
      identifier: 'ADM-90412',
      status: 'active',
      createdAt: '2020-05-10'
    },
    {
      id: '6',
      name: 'Ana Laura Mendez Ríos',
      email: 'ana.mendez@alumno.buap.mx',
      role: 'alumno',
      identifier: '202130948',
      status: 'inactive',
      createdAt: '2021-08-15'
    }
  ]);

  // Filtros reactivos (Signals)
  searchQuery = signal<string>('');
  selectedRoleTab = signal<'all' | 'admin' | 'docente' | 'alumno'>('all');
  selectedStatusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Control de Modales
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  // Formulario del Usuario
  userId = '';
  userName = '';
  userEmail = '';
  userRole: 'admin' | 'docente' | 'alumno' = 'alumno';
  userIdentifier = '';
  userStatus: 'active' | 'inactive' = 'active';

  // Toasts / Notificaciones de feedback
  toastMessage = signal<string>('');
  showToast = signal<boolean>(false);

  // Lista Filtrada Dinámicamente (Computed Signal)
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const tab = this.selectedRoleTab();
    const status = this.selectedStatusFilter();

    return this.usersList().filter(user => {
      // Filtro de búsqueda textual (Nombre, Email o Matrícula)
      const matchesQuery = 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.identifier.toLowerCase().includes(query);

      // Filtro de pestaña de rol
      const matchesTab = tab === 'all' || user.role === tab;

      // Filtro de estado
      const matchesStatus = status === 'all' || user.status === status;

      return matchesQuery && matchesTab && matchesStatus;
    });
  });

  // Abrir Modal para crear nuevo usuario
  openCreateModal() {
    this.isEditing.set(false);
    this.userId = '';
    this.userName = '';
    this.userEmail = '';
    this.userRole = 'alumno';
    this.userIdentifier = '';
    this.userStatus = 'active';
    this.showModal.set(true);
  }

  // Abrir Modal para editar usuario existente
  openEditModal(user: User) {
    this.isEditing.set(true);
    this.userId = user.id;
    this.userName = user.name;
    this.userEmail = user.email;
    this.userRole = user.role;
    this.userIdentifier = user.identifier;
    this.userStatus = user.status;
    this.showModal.set(true);
  }

  // Guardar cambios (Crear o Editar)
  saveUser() {
    if (!this.userName || !this.userEmail || !this.userIdentifier) {
      this.triggerToast('Por favor, completa todos los campos obligatorios.');
      return;
    }

    if (this.isEditing()) {
      // Operación de Edición
      this.usersList.update(list => 
        list.map(u => u.id === this.userId 
          ? {
              ...u,
              name: this.userName,
              email: this.userEmail,
              role: this.userRole,
              identifier: this.userIdentifier,
              status: this.userStatus
            }
          : u
        )
      );
      this.triggerToast('¡Usuario actualizado exitosamente!');
    } else {
      // Operación de Creación
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: this.userName,
        email: this.userEmail,
        role: this.userRole,
        identifier: this.userIdentifier,
        status: this.userStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      this.usersList.update(list => [newUser, ...list]);
      this.triggerToast('¡Nuevo usuario agregado con éxito!');
    }

    this.showModal.set(false);
  }

  // Alternar el estado (Activo/Inactivo) desde la lista
  toggleUserStatus(user: User) {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    this.usersList.update(list =>
      list.map(u => u.id === user.id ? { ...u, status: nextStatus } : u)
    );
    this.triggerToast(`Estado cambiado a ${nextStatus === 'active' ? 'Activo' : 'Inactivo'} para ${user.name}`);
  }

  // Eliminar usuario
  deleteUser(user: User) {
    if (confirm(`¿Estás seguro de eliminar a ${user.name} del directorio?`)) {
      this.usersList.update(list => list.filter(u => u.id !== user.id));
      this.triggerToast('Usuario eliminado del sistema.');
    }
  }

  // Disparar alertas tipo Toast de forma elegante
  triggerToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
