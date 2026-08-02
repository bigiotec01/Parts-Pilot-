import { useState, useEffect } from 'react';
import { AlertCircle, Calendar, Car, Hourglass } from 'lucide-react';
import { StatusBadge } from '../shared/StatusBadge';
import { PiezasList } from '../shared/PiezasList';
import { formatDate } from '../../utils/format';

export function GuestTrackingScreen({ pedidoId, token }) {
  const [estadoCarga, setEstadoCarga] = useState('cargando'); // cargando | ok | error
  const [pedido, setPedido] = useState(null);

  useEffect(() => {
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.toString().trim();
    const url = `https://us-central1-${projectId}.cloudfunctions.net/pedidoGuestEstado?id=${encodeURIComponent(pedidoId)}&tk=${encodeURIComponent(token)}`;
    fetch(url)
      .then(res => res.ok ? res.json() : Promise.reject(res))
      .then(data => { setPedido(data); setEstadoCarga('ok'); })
      .catch(() => setEstadoCarga('error'));
  }, [pedidoId, token]);

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--pp-bg)' }}>
      <div className="w-full max-w-[400px]" style={{ animation: 'ppRise .5s ease both' }}>
        <div className="text-center mb-7">
          <img src="/pwa-192x192.png" alt="Parts Pilot" className="mx-auto mb-[18px] rounded-[16px]" style={{ width: 60, height: 60, boxShadow: '0 12px 30px -8px rgba(0,0,0,0.5)' }} />
          <h1 className="font-extrabold text-[26px] tracking-tight" style={{ color: 'var(--pp-text)', letterSpacing: '-.02em' }}>Parts Pilot</h1>
          <p className="mt-1.5 text-[13.5px] font-medium" style={{ color: 'var(--pp-text2)' }}>Seguimiento de tu pedido</p>
        </div>

        <div className="rounded-[18px] p-7" style={{ background: 'var(--pp-card)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' }}>
          {estadoCarga === 'cargando' && (
            <p className="text-center text-[13.5px]" style={{ color: 'var(--pp-text2)' }}>Buscando tu pedido…</p>
          )}

          {estadoCarga === 'error' && (
            <div className="flex flex-col items-center text-center gap-2">
              <AlertCircle className="w-6 h-6" style={{ color: '#dc2626' }} />
              <p className="text-[13.5px] font-semibold" style={{ color: 'var(--pp-text)' }}>Este link ya no está disponible</p>
              <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Puede que el pedido ya se haya entregado o el link haya expirado. Contacta al taller si necesitas más información.</p>
            </div>
          )}

          {estadoCarga === 'ok' && pedido && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <div className="font-mono text-[12px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{pedido.folio || pedidoId.slice(0, 8)}</div>
                  <h2 className="text-[17px] font-bold truncate flex items-center gap-1.5" style={{ color: 'var(--pp-text)' }}>
                    <Car className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} /> {pedido.vehiculo || 'Tu pedido'}
                  </h2>
                </div>
                <StatusBadge estado={pedido.estado} />
              </div>

              {pedido.fechaEntrega && (
                <div className="flex items-center gap-2 text-[13px] px-3 py-2.5 rounded-[10px]" style={{ background: 'rgba(37,99,235,0.1)', color: '#2563eb' }}>
                  <Calendar className="w-4 h-4 flex-shrink-0" /> Entrega estimada: {formatDate(pedido.fechaEntrega)}
                </div>
              )}

              {pedido.piezas?.length > 0 && (
                <div className="rounded-[12px] p-3" style={{ background: 'var(--pp-surface)' }}>
                  <p className="text-[10.5px] font-bold uppercase mb-2 flex items-center gap-1.5" style={{ color: 'var(--pp-text9)', letterSpacing: '.05em' }}>
                    <Hourglass className="w-3.5 h-3.5" /> Piezas en espera
                    <span className="normal-case font-medium" style={{ color: 'var(--pp-text3)' }}>
                      · {pedido.piezas.filter(p => p.estado === 'recibida' || p.estado === 'en_tienda').length} de {pedido.piezas.length} en tienda
                    </span>
                  </p>
                  <PiezasList piezas={pedido.piezas} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
