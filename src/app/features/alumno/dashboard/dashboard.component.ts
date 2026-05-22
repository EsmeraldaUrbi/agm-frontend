import { Component, OnInit, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

interface MateriaStats {
  nrc: string;
  nombre_materia: string;
  promedio: number;
  presentes: number;
  retardos: number;
  faltas: number;
  porcentaje_asistencia: number;
  minimoAsegurado: number;
  maximoPotencial: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterModule, CommonModule],
  templateUrl: './dashboard.component.html',
  styles: `
    .donut-chart {
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      position: relative;
    }
    .donut-inner {
      background-color: white;
      border-radius: 50%;
      position: absolute;
      width: 75%;
      height: 75%;
      display: flex;
      justify-content: center;
      align-items: center;
      flex-direction: column;
    }

    @keyframes fadeInUp {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .animate-fade-in-up {
      animation: fadeInUp 0.7s ease-out forwards;
      opacity: 0;
    }
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-400 { animation-delay: 400ms; }

    @keyframes popIn {
      0% { opacity: 0; transform: scale(0.5) rotate(-15deg); }
      100% { opacity: 1; transform: scale(1) rotate(0deg); }
    }
    .animate-pop {
      animation: popIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
    }
  `
})
export class DashboardComponent implements OnInit, AfterViewInit {
  
  animatingDonut = false;
  dataLoaded = false;

  // Variables para la animación fluida de la dona
  animatedPresentes: number = 0;
  animatedRetardos: number = 0;
  animatedPorcentaje: number = 0;

  alumnoInfo = {
    nombre_completo: 'Alejandro Pavón',
    matricula: '202145682',
    carrera: 'Ingeniería en Ciencias de la Computación',
    periodo_activo: 'Otoño 2024',
    estatus: 'Regular'
  };

  estadisticasMaterias: MateriaStats[] = [
    { nrc: '24589', nombre_materia: 'Arquitectura de Software', promedio: 9.8, presentes: 24, retardos: 1, faltas: 1, porcentaje_asistencia: 96.1, minimoAsegurado: 8.5, maximoPotencial: 10.0 },
    { nrc: '24601', nombre_materia: 'Sistemas Operativos', promedio: 8.5, presentes: 20, retardos: 3, faltas: 3, porcentaje_asistencia: 88.4, minimoAsegurado: 6.5, maximoPotencial: 9.5 },
    { nrc: '24712', nombre_materia: 'Inteligencia Artificial', promedio: 9.2, presentes: 25, retardos: 0, faltas: 1, porcentaje_asistencia: 96.1, minimoAsegurado: 7.0, maximoPotencial: 10.0 },
    { nrc: '24855', nombre_materia: 'Base de Datos II', promedio: 7.4, presentes: 18, retardos: 5, faltas: 3, porcentaje_asistencia: 88.4, minimoAsegurado: 5.0, maximoPotencial: 8.5 },
  ];

  promedioGeneral: number = 0;
  asistenciaTotal: number = 0;
  totalMaterias: number = 0;
  materiaMenorRendimiento: MateriaStats | null = null;
  materiaSeleccionada: MateriaStats | null = null;
  alertaStyles: any = {};

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit() {
    this.calcularMetricas();
    if (this.estadisticasMaterias.length > 0) {
      this.materiaSeleccionada = this.estadisticasMaterias[0];
      this.animatingDonut = true;
      this.animarDona(this.materiaSeleccionada);
    }
  }

  ngAfterViewInit() {
    // Retrasar dataLoaded garantiza que los elementos se dibujen en 0 primero
    setTimeout(() => {
      this.dataLoaded = true;
      this.cdr.detectChanges();
    }, 50);
  }

  calcularMetricas() {
    this.totalMaterias = this.estadisticasMaterias.length;
    if (this.totalMaterias > 0) {
      const sumaPromedios = this.estadisticasMaterias.reduce((acc, curr) => acc + curr.promedio, 0);
      this.promedioGeneral = Number((sumaPromedios / this.totalMaterias).toFixed(1));

      const sumaAsistencias = this.estadisticasMaterias.reduce((acc, curr) => acc + curr.porcentaje_asistencia, 0);
      this.asistenciaTotal = Number((sumaAsistencias / this.totalMaterias).toFixed(1));

      this.materiaMenorRendimiento = this.estadisticasMaterias.reduce((prev, curr) => 
        (curr.promedio < prev.promedio) ? curr : prev
      );
      this.alertaStyles = this.getAlertaStyles(this.materiaMenorRendimiento.promedio);
    }
  }

  getAlertaStyles(promedio: number) {
    if (promedio >= 9.0) {
      return {
        wrapper: 'bg-green-50 border-green-100',
        iconBox: 'bg-green-100 text-green-600',
        title: 'text-green-700',
        materia: 'text-green-900',
        bgIcon: 'text-green-100/60',
        icon: 'info',
        bgIconShape: 'trending_flat'
      };
    } else if (promedio >= 8.0) {
      return {
        wrapper: 'bg-[rgb(245,250,210)] border-[rgb(213,236,93)]',
        iconBox: 'bg-[rgb(213,236,93)] text-[rgb(100,120,20)]',
        title: 'text-[rgb(110,130,20)]',
        materia: 'text-[rgb(80,90,10)]',
        bgIcon: 'text-[rgb(213,236,93)]',
        icon: 'info',
        bgIconShape: 'trending_flat'
      };
    } else if (promedio >= 7.0) {
      return {
        wrapper: 'bg-yellow-50 border-yellow-100',
        iconBox: 'bg-yellow-100 text-yellow-600',
        title: 'text-yellow-700',
        materia: 'text-yellow-900',
        bgIcon: 'text-yellow-100/60',
        icon: 'warning',
        bgIconShape: 'trending_down'
      };
    } else if (promedio >= 6.0) {
      return {
        wrapper: 'bg-orange-50 border-orange-100',
        iconBox: 'bg-orange-100 text-orange-600',
        title: 'text-orange-700',
        materia: 'text-orange-900',
        bgIcon: 'text-orange-100/60',
        icon: 'warning',
        bgIconShape: 'trending_down'
      };
    } else {
      return {
        wrapper: 'bg-red-50 border-red-100',
        iconBox: 'bg-red-100 text-red-600',
        title: 'text-red-700',
        materia: 'text-red-900',
        bgIcon: 'text-red-100/60',
        icon: 'warning',
        bgIconShape: 'trending_down'
      };
    }
  }

  // Animación del gradiente de la dona
  animarDona(mat: MateriaStats) {
    const total = mat.presentes + mat.retardos + mat.faltas;
    if (total === 0) return;

    const targetPresentes = (mat.presentes / total) * 100;
    const targetRetardos = (mat.retardos / total) * 100;
    const targetPorcentaje = mat.porcentaje_asistencia;

    let startTime: number | null = null;
    const duration = 1000;

    const step = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      
      // Función ease-out cubic
      const easeOut = 1 - Math.pow(1 - progress, 3);

      this.animatedPresentes = targetPresentes * easeOut;
      this.animatedRetardos = targetRetardos * easeOut;
      this.animatedPorcentaje = targetPorcentaje * easeOut;

      this.cdr.detectChanges(); // Forzar actualización de la vista

      if (progress < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }

  getAnimatedDonutGradient(): string {
    if (!this.materiaSeleccionada) return 'conic-gradient(#e2e8f0 0% 100%)';
    const p1 = this.animatedPresentes;
    const p2 = p1 + this.animatedRetardos;

    return `conic-gradient(
      #22c55e 0% ${p1}%, 
      #eab308 ${p1}% ${p2}%, 
      #ef4444 ${p2}% 100%
    )`;
  }

  seleccionarMateria(nrc: string) {
    const mat = this.estadisticasMaterias.find(m => m.nrc === nrc);
    if (mat) {
      this.animatingDonut = false;
      this.animatedPresentes = 0;
      this.animatedRetardos = 0;
      this.animatedPorcentaje = 0;
      this.cdr.detectChanges(); // Reiniciar visualmente a 0

      setTimeout(() => {
        this.materiaSeleccionada = mat;
        this.animatingDonut = true;
        this.animarDona(mat);
      }, 10);
    }
  }

  // --- LÓGICA PARA GRÁFICO RADAR (SVG) ---
  getRadarPolygon(): string {
    const cx = 100, cy = 100, maxR = 80;
    let points = '';
    const total = this.estadisticasMaterias.length;

    this.estadisticasMaterias.forEach((mat, i) => {
      const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
      const radius = (mat.promedio / 10) * maxR;
      points += `${cx + radius * Math.cos(angle)},${cy + radius * Math.sin(angle)} `;
    });
    return points.trim();
  }

  getRadarAxes() {
    const cx = 100, cy = 100, maxR = 80;
    const total = this.estadisticasMaterias.length;
    return this.estadisticasMaterias.map((mat, i) => {
      const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
      // Posición final de la línea del eje
      const x = cx + maxR * Math.cos(angle);
      const y = cy + maxR * Math.sin(angle);
      // Posición para la etiqueta de la materia
      const labelX = cx + (maxR + 15) * Math.cos(angle);
      const labelY = cy + (maxR + 15) * Math.sin(angle);
      // Alineación del texto
      const anchor = Math.cos(angle) > 0.1 ? 'start' : (Math.cos(angle) < -0.1 ? 'end' : 'middle');
      // Coordenada del punto de calificación del alumno
      const radius = (mat.promedio / 10) * maxR;
      const pointX = cx + radius * Math.cos(angle);
      const pointY = cy + radius * Math.sin(angle);
      
      return { x, y, labelX, labelY, nombre: mat.nombre_materia, anchor, pointX, pointY };
    });
  }

  getRadarBackgroundPolygons() {
    // Dibujar 5 polígonos de fondo (escalas 2, 4, 6, 8, 10)
    const cx = 100, cy = 100, maxR = 80;
    const total = this.estadisticasMaterias.length;
    const polygons = [];

    for (let scale = 1; scale <= 5; scale++) {
      let points = '';
      const r = (scale / 5) * maxR;
      for (let i = 0; i < total; i++) {
        const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
        points += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
      }
      polygons.push(points.trim());
    }
    return polygons.reverse(); // El más grande primero para no tapar a los pequeños
  }

}
