import * as XLSX from 'xlsx';

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
export function parsePiezasExcel(arrayBuffer) {
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
  const piezas = (piezasActuales || []).map(p => ({ ...p }));

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

// Agrega a mano una pieza que ya está físicamente en la tienda pero no pasó
// por el reporte del proveedor (ej. quedó de un pedido anterior, stock propio).
// Queda marcada "en_tienda" — distinta de "recibida" (que solo viene del Excel).
export function agregarPiezaManual(piezasActuales, { numeroPieza, descripcion }) {
  const numero = String(numeroPieza || '').trim();
  if (!numero) throw new Error('Ingresa un número de pieza.');
  const piezas = (piezasActuales || []).map(p => ({ ...p }));
  if (piezas.some(p => p.numeroPieza === numero)) {
    throw new Error(`La pieza ${numero} ya está en la lista.`);
  }
  const ahora = new Date();
  piezas.push({
    numeroPieza: numero,
    descripcion: String(descripcion || '').trim(),
    estado: 'en_tienda',
    fechaRecibida: null,
    primeraDeteccion: ahora,
    ultimaActualizacion: ahora,
  });
  return piezas;
}

// Corrige el número de pieza y/o descripción de una pieza ya guardada
// (ej. se capturó mal al agregarla manualmente).
export function editarPieza(piezasActuales, numeroPiezaOriginal, { numeroPieza, descripcion }) {
  const numero = String(numeroPieza || '').trim();
  if (!numero) throw new Error('Ingresa un número de pieza.');
  const piezas = (piezasActuales || []).map(p => ({ ...p }));
  if (numero !== numeroPiezaOriginal && piezas.some(p => p.numeroPieza === numero)) {
    throw new Error(`La pieza ${numero} ya está en la lista.`);
  }
  const pieza = piezas.find(p => p.numeroPieza === numeroPiezaOriginal);
  if (!pieza) throw new Error('No se encontró la pieza a editar.');
  pieza.numeroPieza = numero;
  pieza.descripcion = String(descripcion || '').trim();
  pieza.ultimaActualizacion = new Date();
  return piezas;
}

// Quita una pieza de la lista (ej. se agregó por error).
export function eliminarPieza(piezasActuales, numeroPieza) {
  return (piezasActuales || []).filter(p => p.numeroPieza !== numeroPieza);
}
