export function lsActivityKey(role, orderId) { return `pp_act_${role}_${orderId}`; }

export function saveOrderSeen(role, order) {
  try {
    localStorage.setItem(lsActivityKey(role, order.id), JSON.stringify({
      estado:     order.estado,
      respuesta:  order.estimado?.respuesta || '',
      estNotas:   order.estimado?.notas || '',
      adminMsgs:  (order.mensajes || []).filter(m => m.from === 'admin').length,
      tallerMsgs: (order.mensajes || []).filter(m => m.from === 'taller').length,
    }));
  } catch {}
}

export function hasNewActivity(role, order) {
  try {
    const raw = localStorage.getItem(lsActivityKey(role, order.id));
    if (!raw) {
      // Sin baseline: resaltar si hay mensajes del otro lado o respuesta al estimado
      if (role === 'admin') {
        const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller').length;
        if (tallerMsgs > 0) return true;
        if (order.estimado?.respuesta && order.estimado.respuesta !== 'pendiente') return true;
      }
      // Para taller: no resaltar en primer render (evita ruido en primera carga)
      saveOrderSeen(role, order);
      return false;
    }
    const seen = JSON.parse(raw);
    if (role === 'taller') {
      if (seen.estado   !== order.estado)                       return true;
      if (seen.estNotas !== (order.estimado?.notas || ''))      return true;
      const adminMsgs = (order.mensajes || []).filter(m => m.from === 'admin').length;
      if (adminMsgs > seen.adminMsgs)                           return true;
    } else {
      if (seen.respuesta !== (order.estimado?.respuesta || '')) return true;
      const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller').length;
      if (tallerMsgs > seen.tallerMsgs)                         return true;
    }
  } catch {}
  return false;
}

export function getAdminNotifications(pedidos, getTaller) {
  const notifs = [];
  for (const order of pedidos) {
    try {
      const tallerMsgs = (order.mensajes || []).filter(m => m.from === 'taller');
      const tallerMsgCount = tallerMsgs.length;
      const currentResp = order.estimado?.respuesta || '';
      const raw = localStorage.getItem(lsActivityKey('admin', order.id));
      const taller = getTaller?.(order.tallerId)?.nombre || '—';
      const folio = order.folio || order.id?.slice(0, 8);

      if (!raw) {
        if (tallerMsgCount > 0) {
          notifs.push({ orderId: order.id, folio, vehiculo: order.vehiculo, taller, type: 'message',
            label: 'Mensaje nuevo', detail: tallerMsgs[tallerMsgs.length - 1]?.texto?.slice(0, 60) || '' });
        } else if (currentResp && currentResp !== 'pendiente') {
          notifs.push({ orderId: order.id, folio, vehiculo: order.vehiculo, taller, type: 'estimado',
            label: currentResp === 'aceptado' ? 'Estimado aceptado' : 'Estimado rechazado', detail: '' });
        }
        continue;
      }
      const seen = JSON.parse(raw);
      if (tallerMsgCount > (seen.tallerMsgs || 0)) {
        const diff = tallerMsgCount - (seen.tallerMsgs || 0);
        notifs.push({ orderId: order.id, folio, vehiculo: order.vehiculo, taller, type: 'message',
          label: diff === 1 ? 'Mensaje nuevo' : `${diff} mensajes nuevos`,
          detail: tallerMsgs[tallerMsgs.length - 1]?.texto?.slice(0, 60) || '' });
      }
      if (currentResp && currentResp !== 'pendiente' && seen.respuesta !== currentResp) {
        notifs.push({ orderId: order.id, folio, vehiculo: order.vehiculo, taller, type: 'estimado',
          label: currentResp === 'aceptado' ? 'Estimado aceptado' : 'Estimado rechazado', detail: '' });
      }
    } catch {}
  }
  return notifs;
}
