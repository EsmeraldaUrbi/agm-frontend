import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-importar-materias',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './importar-materias.component.html'
})
export class ImportarMateriasComponent {
  // Aquí podemos manejar el estado del stepper o los datos de la tabla
}
