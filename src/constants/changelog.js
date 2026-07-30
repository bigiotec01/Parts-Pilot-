// Historial de cambios visibles para el usuario, más reciente primero.
// audience: 'admin' | 'taller' | 'all' — a quién se le muestra cada línea en el pop-up de Novedades.
export const CHANGELOG = [
  {
    version: '1.8.3',
    items: [
      { audience: 'all', text: 'El logo nuevo ahora se ve en la pantalla de inicio de sesión y en la parte de arriba de la app (antes se veía un ícono genérico).' },
      { audience: 'all', text: 'Corregido un destello de color naranja al abrir la app en celulares/computadoras lentas.' },
    ],
  },
  {
    version: '1.8.2',
    items: [
      { audience: 'taller', text: 'En el detalle de un pedido ya no hay que desplegar el estatus de piezas: se ve directo.' },
      { audience: 'all', text: 'En las tarjetas y la lista de Pedidos, el PO y el número de Orden ahora se muestran en negrita arriba, y el vehículo debajo.' },
    ],
  },
  {
    version: '1.8.1',
    items: [
      { audience: 'all', text: 'Nuevo ícono de la app.' },
    ],
  },
  {
    version: '1.8.0',
    items: [
      { audience: 'taller', text: 'Nueva vista de "Lista" en Mis pedidos, Historial y Estimados: cada pedido en una fila compacta, ahora la vista por defecto (con opción de volver a Tarjetas).' },
    ],
  },
  {
    version: '1.7.5',
    items: [
      { audience: 'admin', text: 'La vista de Lista de Pedidos ahora se puede ordenar: toca "Vehículo", "Taller", "Folio", "Fechas" o "Estado" para ordenar por esa columna (y de nuevo para invertir el orden).' },
    ],
  },
  {
    version: '1.7.2',
    items: [
      { audience: 'admin', text: 'Nueva vista de "Lista" para Pedidos: cada pedido en una fila compacta con taller, folio, fechas y estado. Ahora es la vista por defecto.' },
    ],
  },
  {
    version: '1.7.1',
    items: [
      { audience: 'all', text: 'La lista de piezas ahora se ve en un solo listado (pendientes primero), sin desplegables anidados.' },
      { audience: 'taller', text: 'El estatus de piezas ahora aparece más arriba en el detalle del pedido.' },
      { audience: 'admin', text: 'Ahora puedes subir el reporte de Excel de piezas en cualquier estado del pedido, no solo en "Esperando piezas".' },
    ],
  },
  {
    version: '1.7.0',
    items: [
      { audience: 'all', text: 'La lista de piezas ahora separa "Pendientes" (arriba, para atención inmediata) de "Recibidas en tienda" (plegadas, para reducir el desorden visual).' },
      { audience: 'all', text: 'Las piezas pendientes muestran hace cuántos días están en espera, para priorizar reclamos al proveedor.' },
    ],
  },
  {
    version: '1.6.9',
    items: [
      { audience: 'all', text: 'Nuevo pop-up de "Novedades": al actualizar, verás un resumen de lo que cambió.' },
    ],
  },
  {
    version: '1.6.8',
    items: [
      { audience: 'taller', text: 'Ahora puedes verificar el estatus de las piezas de tu pedido (en espera, recibidas o en tienda) desde el detalle del pedido.' },
      { audience: 'admin',  text: 'Nuevo importador de Excel para "Esperando piezas": sube el reporte del proveedor y el sistema detecta automáticamente cuáles piezas ya llegaron.' },
      { audience: 'admin',  text: 'Puedes agregar piezas manualmente cuando ya están en la tienda pero no vinieron en el Excel del proveedor.' },
    ],
  },
  {
    version: '1.6.3',
    items: [
      { audience: 'admin', text: 'Rediseño de las tarjetas de Talleres.' },
    ],
  },
  {
    version: '1.6.2',
    items: [
      { audience: 'admin', text: 'Se agregó la fecha y hora en la barra superior del panel de Admin.' },
    ],
  },
];
