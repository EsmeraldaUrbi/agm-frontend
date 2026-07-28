export function normalizeApiUrl(url: string): string {
  return url
    .replace(/^http:\/\/api-gateway-production-0647\.up\.railway\.app/, 'https://api-gateway-production-0647.up.railway.app')
    .replace('/api/periodos/periodos', '/api/v1/periodos')
    .replace('/api/periodos/planes-estudio', '/api/v1/planes-estudio')
    .replace('/api/periodos/materias-catalogo', '/api/v1/materias-catalogo')
    .replace('/api/periodos/materias-planes-estudio', '/api/v1/materias-planes-estudio')
    .replace('/api/periodos/materias-ofertadas', '/api/v1/materias-ofertadas')
    .replace('/api/periodos/materia-horarios', '/api/v1/materia-horarios')
    .replace('/api/periodos/importaciones', '/api/v1/importaciones')
    .replace('/api/periodos/materias', '/api/v1/materias');
}
