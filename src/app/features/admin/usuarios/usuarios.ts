import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { AgmButtonComponent, AgmInputComponent, AgmCardComponent } from '../../../shared/components/ui';

interface User {
  id: string;
  name: string;
  email: string;
  cubiculo: string; 
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
export class UsuariosComponent implements OnInit {
  private http = inject(HttpClient);

  // Exponer Math para el HTML
  Math = Math;

  // Lista dinámica obtenida desde el backend
  usersList = signal<User[]>([]);
  activeUsersCount = computed(() => this.usersList().filter(u => u.status === 'active').length);

  ngOnInit() {
    this.cargarDocentes();
  }

  cargarDocentes() {
    this.http.get<any[]>(`${environment.msUsuariosUrl}/api/v1/docentes/?limit=1000`).subscribe({
      next: (data) => {
        const mappedUsers: User[] = data.map(d => ({
          id: d.docente_id,
          name: d.nombre_completo,
          email: d.correo,
          cubiculo: d.cubiculo || 'N/A',
          status: d.estatus_laboral ? 'active' : 'inactive',
          createdAt: d.created_at ? new Date(d.created_at).toISOString().split('T')[0] : 'N/A'
        }));
        this.usersList.set(mappedUsers);
      },
      error: (err) => {
        console.error('Error cargando docentes', err);
        this.triggerToast('Error de conexión al obtener el padrón de docentes.');
      }
    });
  }

  // Filtros reactivos (Signals)
  searchQuery = signal<string>('');
  selectedStatusFilter = signal<'all' | 'active' | 'inactive'>('all');

  // Paginación (Signals)
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);

  // Control de Modales
  showModal = signal<boolean>(false);
  isEditing = signal<boolean>(false);

  // Formulario del Docente
  userId = '';
  userName = '';
  userEmail = '';
  userCubiculo = '';
  userStatus: 'active' | 'inactive' = 'active';

  // Toasts / Notificaciones de feedback
  toastMessage = signal<string>('');
  showToast = signal<boolean>(false);

  // Lista Filtrada Dinámicamente (Computed Signal)
  filteredUsers = computed(() => {
    const query = this.searchQuery().toLowerCase().trim();
    const status = this.selectedStatusFilter();

    return this.usersList().filter(user => {
      // Filtro de búsqueda textual (Nombre, Email o Cubículo)
      const matchesQuery = 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query) ||
        user.cubiculo.toLowerCase().includes(query);

      // Filtro de estado
      const matchesStatus = status === 'all' || user.status === status;

      return matchesQuery && matchesStatus;
    });
  });

  // Lista Paginada (Computed Signal)
  paginatedUsers = computed(() => {
    const filtered = this.filteredUsers();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  // Total de páginas (Computed Signal)
  totalPages = computed(() => {
    return Math.max(1, Math.ceil(this.filteredUsers().length / this.pageSize()));
  });

  // Métodos de paginación
  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  prevPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  // Resetea la página actual cuando cambian los filtros (se llama desde el template en ngModelChange)
  resetPagination() {
    this.currentPage.set(1);
  }

  // Abrir Modal para crear nuevo docente
  openCreateModal() {
    this.isEditing.set(false);
    this.userId = '';
    this.userName = '';
    this.userEmail = '';
    this.userCubiculo = '';
    this.userStatus = 'active';
    this.showModal.set(true);
  }

  // Abrir Modal para editar docente existente
  openEditModal(user: User) {
    this.isEditing.set(true);
    this.userId = user.id;
    this.userName = user.name;
    this.userEmail = user.email;
    this.userCubiculo = user.cubiculo;
    this.userStatus = user.status;
    this.showModal.set(true);
  }

  // Guardar cambios (Crear o Editar)
  saveUser() {
    if (!this.userName || !this.userEmail || !this.userCubiculo) {
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
              cubiculo: this.userCubiculo,
              status: this.userStatus
            }
          : u
        )
      );
      this.triggerToast('¡Docente actualizado exitosamente!');
    } else {
      // Operación de Creación
      const newUser: User = {
        id: Math.random().toString(36).substring(2, 9),
        name: this.userName,
        email: this.userEmail,
        cubiculo: this.userCubiculo,
        status: this.userStatus,
        createdAt: new Date().toISOString().split('T')[0]
      };
      
      this.usersList.update(list => [newUser, ...list]);
      this.triggerToast('¡Nuevo docente agregado con éxito!');
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

  // Eliminar docente
  deleteUser(user: User) {
    if (confirm(`¿Estás seguro de eliminar a ${user.name} del directorio?`)) {
      this.usersList.update(list => list.filter(u => u.id !== user.id));
      this.triggerToast('Docente eliminado del sistema.');
      
      // Ajustar la paginación si eliminamos el último elemento de la página
      if (this.paginatedUsers().length === 0 && this.currentPage() > 1) {
          this.currentPage.update(p => p - 1);
      }
    }
  }

  // Disparar alertas tipo Toast
  triggerToast(message: string) {
    this.toastMessage.set(message);
    this.showToast.set(true);
    setTimeout(() => {
      this.showToast.set(false);
    }, 3000);
  }
}
