// Estados posibles de una pieza y su etiqueta para mostrar — se usa tanto en
// la lista (PiezasList) como en el selector del modal de editar.
export const ESTADOS_PIEZA = [
  { value: 'pendiente', label: 'En espera' },
  { value: 'en_tienda', label: 'En tienda' },
  { value: 'recibida', label: 'Recibida' },
  { value: 'entregada', label: 'Entregada' },
];

// Piezas que ya llegaron (recibidas, en tienda o ya entregadas al cliente) —
// para el resumen "X de Y en tienda" del pedido.
export function contarPiezasEnTienda(piezas) {
  return (piezas || []).filter(p => p.estado === 'recibida' || p.estado === 'en_tienda' || p.estado === 'entregada').length;
}

// Los encabezados del reporte (ej. "Last Recv \nDate") traen saltos de línea y
// espacios variables — se normalizan para no depender del formato exacto del archivo.
function normalizeHeader(h) {
  return String(h ?? '').replace(/\s+/g, ' ').trim().toLowerCase();
}

function findCol(headers, matchers) {
  for (const test of matchers) {
    const idx = headers.findIndex(h => test(normalizeHeader(h)));
    if (idx !== -1) return idx;
  }
  return -1;
}

// Lee un ArrayBuffer de un .xlsx y devuelve las filas relevantes: número de
// pieza, descripción y si ya fue recibida (Last Recv Date con fecha válida).
// La librería xlsx es pesada: se carga solo al leer un archivo, no al abrir la app.
export async function parsePiezasExcel(arrayBuffer) {
  const XLSX = await import('xlsx');
  const wb = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const ws = wb.Sheets[wb.SheetNames[0]];
  if (!ws) throw new Error('El archivo no tiene hojas con datos.');

  const raw = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
  const headerIdx = raw.findIndex(row => row.some(c => /part/i.test(String(c))));
  if (headerIdx === -1) throw new Error('No se encontró una columna "Part" en el archivo.');

  const headers = raw[headerIdx];
  const partCol = findCol(headers, [
    h => h === 'part',
    h => /^part\s*(number|no\.?|#)$/.test(h),
  ]);
  const recvCol = findCol(headers, [
    h => /last\s*recv\s*date/.test(h),
    h => /last\s*received\s*date/.test(h),
  ]);
  const descCol = findCol(headers, [h => h === 'description']);

  if (partCol === -1) throw new Error('No se encontró la columna "Part" (número de pieza).');
  if (recvCol === -1) throw new Error('No se encontró la columna "Last Recv Date".');

  const filas = raw.slice(headerIdx + 1)
    .map(row => {
      const numeroPieza = String(row[partCol] ?? '').trim();
      const recvVal = row[recvCol];
      const recibida = recvVal instanceof Date && !isNaN(recvVal);
      return {
        numeroPieza,
        descripcion: descCol !== -1 ? String(row[descCol] ?? '').trim() : '',
        recibida,
        fechaRecibida: recibida ? recvVal : null,
      };
    })
    .filter(f => f.numeroPieza !== '');

  if (filas.length === 0) throw new Error('No se encontraron filas con número de pieza.');
  return filas;
}

// Combina las piezas ya guardadas en el pedido con las filas del Excel recién
// subido: agrega piezas nuevas, marca como "recibida" las que ya tienen fecha
// (nunca revierte una pieza ya recibida a pendiente), y conserva sin cambios
// las piezas existentes que no aparecen en este archivo (no se eliminan).
export function mergePiezas(piezasActuales, filasExcel) {
  const ahora = new Date();
  const piezas = normalizarPiezas(piezasActuales).map(p => ({ ...p }));

  for (const fila of filasExcel) {
    const existente = piezas.find(p => p.numeroPieza === fila.numeroPieza);
    if (!existente) {
      piezas.push({
        numeroPieza: fila.numeroPieza,
        descripcion: fila.descripcion,
        estado: fila.recibida ? 'recibida' : 'pendiente',
        fechaRecibida: fila.recibida ? fila.fechaRecibida : null,
        primeraDeteccion: ahora,
        ultimaActualizacion: ahora,
      });
      continue;
    }
    if (fila.descripcion && !existente.descripcion) existente.descripcion = fila.descripcion;
    // Solo "pendiente" puede pasar a "recibida" vía Excel — una pieza agregada
    // manualmente ("en_tienda") o ya recibida nunca se toca desde acá.
    if (fila.recibida && existente.estado === 'pendiente') {
      existente.estado = 'recibida';
      existente.fechaRecibida = fila.fechaRecibida;
      existente.ultimaActualizacion = ahora;
    }
  }

  return piezas;
}

// Agrega a mano una pieza — por defecto "en_tienda" (ej. quedó de un pedido
// anterior, stock propio, no pasó por el reporte del proveedor), pero admite
// otro estado explícito (ej. "pendiente" al registrar de una vez las piezas
// en espera desde el formulario de un pedido nuevo).
export function agregarPiezaManual(piezasActuales, { numeroPieza, descripcion, referencia, estado = 'en_tienda' }) {
  const numero = String(numeroPieza || '').trim();
  if (!numero) throw new Error('Ingresa un número de pieza.');
  const piezas = normalizarPiezas(piezasActuales).map(p => ({ ...p }));
  if (piezas.some(p => p.numeroPieza === numero)) {
    throw new Error(`La pieza ${numero} ya está en la lista.`);
  }
  const ahora = new Date();
  piezas.push({
    numeroPieza: numero,
    descripcion: String(descripcion || '').trim(),
    referencia: String(referencia || '').trim(),
    estado,
    fechaRecibida: estado === 'recibida' ? ahora : null,
    primeraDeteccion: ahora,
    ultimaActualizacion: ahora,
  });
  return piezas;
}

// Corrige el número de pieza, descripción y/o estado de una pieza ya
// guardada (ej. se capturó mal al agregarla manualmente, o llegó el
// proveedor y hay que marcarla recibida a mano sin esperar el Excel). Se
// ubica por posición (index) y no por numeroPieza: si dos piezas distintas
// llegaran a compartir el mismo número, buscar por valor editaba/eliminaba
// a las dos a la vez.
export function editarPieza(piezasActuales, index, { numeroPieza, descripcion, referencia, estado }) {
  const numero = String(numeroPieza || '').trim();
  if (!numero) throw new Error('Ingresa un número de pieza.');
  const piezas = normalizarPiezas(piezasActuales).map(p => ({ ...p }));
  if (piezas.some((p, i) => i !== index && p.numeroPieza === numero)) {
    throw new Error(`La pieza ${numero} ya está en la lista.`);
  }
  const pieza = piezas[index];
  if (!pieza) throw new Error('No se encontró la pieza a editar.');
  pieza.numeroPieza = numero;
  pieza.descripcion = String(descripcion || '').trim();
  if (referencia !== undefined) pieza.referencia = String(referencia || '').trim();
  if (estado && estado !== pieza.estado) {
    pieza.estado = estado;
    // "Recibida" sin fecha del reporte todavía necesita una fecha para
    // mostrar en la lista — se usa "ahora" ya que se está marcando a mano.
    // Al sacarla de "recibida" esa fecha ya no aplica.
    pieza.fechaRecibida = estado === 'recibida' ? (pieza.fechaRecibida || new Date()) : null;
    // Igual con "Entregada": se registra cuándo se le entregó al cliente.
    pieza.fechaEntregada = estado === 'entregada' ? new Date() : null;
  }
  pieza.ultimaActualizacion = new Date();
  return piezas;
}

// Quita una pieza de la lista (ej. se agregó por error), por su posición
// (index) — ver nota arriba sobre por qué no se busca por numeroPieza.
export function eliminarPieza(piezasActuales, index) {
  return normalizarPiezas(piezasActuales).filter((_, i) => i !== index);
}

// ── Piezas de órdenes Tag Logic ─────────────────────────────────────
// Tag Logic manda sus piezas como { descripcion, partNumber, lado } y/o las
// escribe en las notas del taller ("• Bumper — Part# 86511-J5000 (izq)").
// Al aprobar la orden se convierten en "Piezas en espera" con número de
// pieza, descripción y número de referencia (la ref. de Tag Logic si la pieza
// no trae una propia).

// "Part#", "Part No.", "P/N", "No. de pieza", "Núm. pieza" seguidos del número.
const PART_LABEL_RE = /(?:part\s*(?:#|no\.?|num(?:ber)?\.?)|p\s*\/\s*n|(?:n[uú]m(?:ero)?|no)\.?\s*(?:de\s+)?pieza)\s*[:#.]?\s*([A-Z0-9][A-Z0-9-]{3,})/i;
// Sin etiqueta: formato típico Kia/Hyundai (86511-J5000) o un código largo con dígitos y guiones.
const PART_BARE_RE = /\b(\d{5}-?[A-Z0-9]{5}(?:-?[A-Z0-9]{2,3})?|[A-Z0-9]{2,}-[A-Z0-9]{2,}(?:-[A-Z0-9]{2,})*)\b/;

function limpiarDescripcion(texto) {
  return String(texto || '')
    .replace(/^[\s•*·\-–—\d.)]+/, '')
    .replace(/[\s\-–—:,|]+$/, '')
    .trim();
}

// Extrae { numeroPieza, descripcion } de cada línea de las notas que tenga un número de pieza.
export function extraerPiezasDeNotas(notas) {
  const out = [];
  for (const linea of String(notas || '').split(/\r?\n/)) {
    if (!linea.trim()) continue;
    let m = linea.match(PART_LABEL_RE);
    if (!m) {
      m = linea.toUpperCase().match(PART_BARE_RE);
      // Un código sin etiqueta debe tener dígitos (evita "PRE-PINTADO", fechas, etc.).
      if (!m || !/\d{3,}/.test(m[1]) || /^\d{1,4}-\d{1,2}-\d{1,4}$/.test(m[1])) continue;
    }
    const numeroPieza = m[1].toUpperCase();
    const antes = linea.slice(0, m.index);
    const despues = linea.slice(m.index + m[0].length);
    let descripcion = limpiarDescripcion(antes);
    const extra = limpiarDescripcion(despues);
    if (!descripcion) descripcion = extra;
    else if (/^\(.*\)$/.test(extra)) descripcion = `${descripcion} ${extra}`;
    out.push({ numeroPieza, descripcion });
  }
  return out;
}

// Normaliza una pieza con el formato de Tag Logic al formato de "Piezas en espera".
// Las piezas que ya tienen estado (importadas por Excel o editadas) se dejan igual.
export function normalizarPieza(p, referencia = '') {
  if (!p || p.estado) return p;
  const numeroPieza = String(p.numeroPieza || p.partNumber || p.numero || '').trim();
  const desc = String(p.descripcion || p.description || p.nombre || '').trim();
  return {
    numeroPieza,
    descripcion: p.lado && desc ? `${desc} (${p.lado})` : desc,
    referencia: String(p.referencia || p.ref || referencia || '').trim(),
    estado: 'pendiente',
    fechaRecibida: null,
    primeraDeteccion: p.primeraDeteccion || null,
    ultimaActualizacion: p.ultimaActualizacion || null,
  };
}

// Normaliza todo el arreglo conservando posiciones (los índices se usan para editar/eliminar).
export function normalizarPiezas(piezas, referencia = '') {
  return (piezas || []).map(p => normalizarPieza(p, referencia));
}

// Piezas en espera para una orden Tag Logic recién aprobada: une las piezas
// estructuradas y las que aparecen en las notas, sin duplicar números.
export function piezasDesdeTagLogic(order) {
  const ahora = new Date();
  const referencia = order?.ref || '';
  const piezas = (order?.piezas || []).map(p => {
    const n = normalizarPieza(p, referencia);
    return n.estado === 'pendiente' && !n.primeraDeteccion ? { ...n, primeraDeteccion: ahora, ultimaActualizacion: ahora } : n;
  });
  const vistos = new Set(piezas.map(p => p.numeroPieza).filter(Boolean));
  for (const { numeroPieza, descripcion } of extraerPiezasDeNotas(order?.notas)) {
    if (vistos.has(numeroPieza)) {
      // Completa la descripción si la pieza estructurada venía sin ella.
      const ex = piezas.find(p => p.numeroPieza === numeroPieza);
      if (ex && !ex.descripcion && descripcion) ex.descripcion = descripcion;
      continue;
    }
    vistos.add(numeroPieza);
    piezas.push({
      numeroPieza, descripcion, referencia, estado: 'pendiente',
      fechaRecibida: null, primeraDeteccion: ahora, ultimaActualizacion: ahora,
    });
  }
  // Piezas sin número ni descripción no aportan nada a la lista.
  return piezas.filter(p => p.numeroPieza || p.descripcion);
}
