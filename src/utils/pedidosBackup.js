import { STATUS_CONFIG } from '../constants/status';

// Convierte Timestamps de Firestore (y cualquier objeto anidado) a valores
// planos serializables, para que el backup se pueda guardar y leer fuera de la app.
function plano(v) {
  if (v == null) return v;
  if (typeof v?.toDate === 'function') return v.toDate().toISOString();
  if (Array.isArray(v)) return v.map(plano);
  if (typeof v === 'object') return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, plano(x)]));
  return v;
}

function fechaTexto(d) {
  if (!d) return '';
  const date = d?.toDate ? d.toDate() : new Date(String(d).length === 10 ? d + 'T00:00:00' : d);
  return isNaN(date) ? '' : date.toISOString().slice(0, 10);
}

function nombreArchivo(ext) {
  return `backup-pedidos-${new Date().toISOString().slice(0, 10)}.${ext}`;
}

function descargar(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// Copia completa (todos los campos, chat y piezas incluidos), para guardar.
export function descargarBackupJSON(pedidos) {
  const data = { generado: new Date().toISOString(), total: pedidos.length, pedidos: pedidos.map(plano) };
  descargar(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), nombreArchivo('json'));
}

// Versión legible en Excel: una hoja con los pedidos y otra con sus piezas.
// La librería xlsx es pesada: se carga solo al generar el archivo.
export async function descargarBackupExcel(pedidos, getTaller) {
  const XLSX = await import('xlsx');
  const filasPedidos = pedidos.map(p => ({
    Folio: p.folio || p.id,
    'No. PO': p.numeroPO || '',
    'No. Orden': p.numeroOrden || '',
    Taller: getTaller(p.tallerId)?.nombre || p.tallerNombre || '',
    'Vehículo': p.vehiculo || '',
    Pieza: p.pieza || '',
    Estado: STATUS_CONFIG[p.estado]?.label || p.estado || '',
    Fecha: fechaTexto(p.fecha),
    'Entrega est.': fechaTexto(p.fechaEntrega),
    Origen: p.origen === 'taglogic' ? 'Tag Logic' : (p.origen || ''),
    'Ref. Tag Logic': p.ref || '',
    Piezas: (p.piezas || []).length,
    Mensajes: (p.mensajes || []).length,
    'Notas del taller': p.notas || '',
    'Notas internas': p.notasInternas || '',
  }));
  const filasPiezas = pedidos.flatMap(p => (p.piezas || []).map(pz => ({
    Folio: p.folio || p.id,
    'No. PO': p.numeroPO || '',
    'No. Orden': p.numeroOrden || '',
    'No. pieza': pz.numeroPieza || '',
    'Descripción': pz.descripcion || '',
    Estado: pz.estado || '',
  })));

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasPedidos), 'Pedidos');
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(filasPiezas), 'Piezas');
  XLSX.writeFile(wb, nombreArchivo('xlsx'));
}
