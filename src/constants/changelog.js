// Historial de cambios visibles para el usuario, más reciente primero.
// audience: 'admin' | 'taller' | 'all' — a quién se le muestra cada línea en el pop-up de Novedades.
export const CHANGELOG = [
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
