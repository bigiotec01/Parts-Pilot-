import {
  History, ShieldCheck
} from 'lucide-react';
import { ACCION_META } from '../../constants/auditoria';

export function AdminAuditoria({ logs, equipo, pedidos }) {
  const getAdminNombre = (uid) => {
    const a = equipo.find(a => a.uid === uid);
    return a?.nombre || a?.email || 'Admin desconocido';
  };
  const fmtFecha = (ts) => {
    if (!ts?.toDate) return '—';
    return ts.toDate().toLocaleString('es-PR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (logs.length === 0) return (
    <div className="text-center py-16" style={{ color: 'var(--pp-text9)' }}>
      <ShieldCheck className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">Todavía no hay actividad registrada.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{ color: 'var(--pp-text2)' }}>
        <strong style={{ color: 'var(--pp-text)' }}>{logs.length}</strong> cambio{logs.length !== 1 ? 's' : ''} registrado{logs.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-[16px] overflow-hidden border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              {['Fecha', 'Admin', 'Acción', 'Detalle', 'Pedido'].map((h, i) => (
                <th key={h} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'pl-6' : 'px-3'} ${i === 4 ? 'pr-6' : ''}`} style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {logs.map(log => {
              const meta = ACCION_META[log.accion] || { label: log.accion, icon: History };
              const Icon = meta.icon;
              const pedido = pedidos.find(p => p.id === log.pedidoId);
              return (
                <tr key={log.id} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                  <td className="py-3.5 pl-6 pr-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{fmtFecha(log.timestamp)}</td>
                  <td className="py-3.5 px-3 text-[13px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text)' }}>{getAdminNombre(log.adminUid)}</td>
                  <td className="py-3.5 px-3 text-[12.5px] whitespace-nowrap">
                    <span className="flex items-center gap-1.5" style={{ color: 'var(--pp-text2)' }}><Icon className="w-3.5 h-3.5" />{meta.label}</span>
                  </td>
                  <td className="py-3.5 px-3 text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{log.detalle}</td>
                  <td className="py-3.5 pr-6 px-3 font-mono text-[12px] whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{pedido?.folio || log.pedidoId?.slice(0, 8) || '—'}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
