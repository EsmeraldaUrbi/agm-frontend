import os

path = 'src/app/features/docente/reportes/reportes.component.html'
with open(path, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '<!-- Historial Académico -->'
start_idx = content.find(start_marker)

if start_idx != -1:
    before = content[:start_idx]
    
    new_html = '''<!-- Historial Académico -->
  <div class="bg-white rounded-xl shadow-sm border border-[#c2c7ce] overflow-hidden mt-8">
    <div class="px-8 py-6 border-b border-[#c2c7ce]/60 flex flex-col md:flex-row justify-between md:items-center gap-4 bg-[#f3f4f5]/30">
      <div>
        <h2 class="text-xl font-black text-[#003b5c] flex items-center gap-2">
          <span class="material-symbols-outlined text-[#003b5c]">history_edu</span>
          Historial Académico
        </h2>
        <p class="text-xs text-[#72787e] mt-1">Consulta las materias que has impartido por periodo académico.</p>
      </div>
      <div class="flex items-center gap-3">
        <label class="text-xs font-bold text-[#003b5c] uppercase">Periodo:</label>
        <select 
          [(ngModel)]="selectedPeriodoId"
          class="bg-white border border-[#c2c7ce] text-[#003b5c] text-sm font-bold rounded-lg px-4 py-2 outline-none focus:border-[#003b5c] focus:ring-1 focus:ring-[#003b5c] transition-all cursor-pointer">
          @for (periodo of periodosHistorial(); track periodo.periodo_id) {
            <option [value]="periodo.periodo_id">{{ periodo.periodo_nombre }}</option>
          }
        </select>
      </div>
    </div>

    <div class="p-8">
      @if (isLoadingHistorial()) {
        <div class="flex justify-center items-center py-8">
          <span class="material-symbols-outlined animate-spin text-[#003b5c] text-4xl">autorenew</span>
          <span class="ml-3 text-[#003b5c] font-bold">Cargando historial académico...</span>
        </div>
      } @else if (errorHistorial()) {
        <div class="bg-red-50 text-red-600 p-4 rounded-xl border border-red-200 text-sm font-medium flex items-center gap-2">
          <span class="material-symbols-outlined">error</span>
          {{ errorHistorial() }}
        </div>
      } @else if (periodosHistorial().length === 0) {
        <div class="py-8 text-center text-[#72787e] text-sm font-medium">
          No hay periodos disponibles
        </div>
      } @else if (currentPeriodoData()) {
        <div class="overflow-x-auto rounded-xl border border-[#c2c7ce]/60">
          <table class="w-full text-left border-collapse">
            <thead>
              <tr class="bg-slate-50 border-b border-[#c2c7ce]/40 text-[11px] font-extrabold text-[#72787e] uppercase tracking-widest">
                <th class="py-4 px-6">NRC</th>
                <th class="py-4 px-6">MATERIA</th>
                <th class="py-4 px-6 text-center">PROMEDIO GRUPAL</th>
                <th class="py-4 px-6 text-center">APROBADOS</th>
                <th class="py-4 px-6 text-center">REPROBADOS</th>
                <th class="py-4 px-6 text-center">APROBACIÓN (%)</th>
                <th class="py-4 px-6 text-center">ASISTENCIA (%)</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 text-sm">
              @for (materia of currentPeriodoData()!.materias; track materia.nrc) {
                <tr class="hover:bg-[#f3f4f5]/40 transition-colors">
                  <td class="py-4 px-6 font-mono font-bold text-[#003b5c]">{{ materia.nrc }}</td>
                  <td class="py-4 px-6 font-bold text-[#42474e]">{{ materia.materia_nombre }}</td>
                  <td class="py-4 px-6 text-center font-bold text-[#003b5c]">{{ materia.promedio_grupal | number:'1.1-2' }}</td>
                  <td class="py-4 px-6 text-center text-green-700 font-bold">{{ materia.aprobados }}</td>
                  <td class="py-4 px-6 text-center text-red-600 font-bold">{{ materia.reprobados }}</td>
                  <td class="py-4 px-6 text-center">
                    <span class="text-sm font-bold" [ngClass]="getPorcentajeAprobacion(materia.aprobados, materia.reprobados) >= 80 ? 'text-[#2E7D32]' : 'text-amber-600'">
                      {{ getPorcentajeAprobacion(materia.aprobados, materia.reprobados) }}%
                    </span>
                  </td>
                  <td class="py-4 px-6 text-center font-bold text-[#003b5c]">{{ materia.porcentaje_asistencia | number:'1.1-2' }}%</td>
                </tr>
              }
              @if (currentPeriodoData()!.materias.length === 0) {
                <tr>
                  <td colspan="7" class="py-8 text-center text-[#72787e] text-sm font-medium">
                    No hay materias registradas en este periodo
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  </div>
</div>
'''
    with open(path, 'w', encoding='utf-8') as f:
        f.write(before + new_html)
    print('HTML replaced successfully.')
else:
    print('Start marker not found!')
