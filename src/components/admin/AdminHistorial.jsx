import {
  CheckCircle2
} from 'lucide-react';
import { formatDate } from '../../utils/format';

export function AdminHistorial({ pedidos, talleres, getTaller, onSelect }) {
  const completados = [...pedidos]
    .filter(p => p.estado === 'entregado')
    .sort((a, b) => {
      const t = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();
      return t(b.fecha) - t(a.fecha);
    });

  if (completados.length === 0) return (
    <div className="text-center py-16" style={{ color: 'var(--pp-text9)' }}>
      <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay órdenes completadas aún.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="text-[13px]" style={{ color: 'var(--pp-text2)' }}>
        <strong style={{ color: 'var(--pp-text)' }}>{completados.length}</strong> orden{completados.length !== 1 ? 'es' : ''} completada{completados.length !== 1 ? 's' : ''}
      </p>
      <div className="rounded-[16px] overflow-hidden border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--pp-border2)' }}>
              {['Folio', 'Taller', 'Vehículo / Pieza', 'Fecha', 'Entrega'].map((h, i) => (
                <th key={h} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'pl-6' : 'px-3'} ${i === 4 ? 'pr-6' : ''}`} style={{ color: 'var(--pp-text3)', letterSpacing: '.06em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {completados.map(p => (
              <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer hover:bg-[#1e1e1e] transition-colors" style={{ borderTop: '1px solid var(--pp-border2)' }}>
                <td className="py-3.5 pl-6 pr-3 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text)' }}>{p.folio || p.id.slice(0,8)}</td>
                <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                <td className="py-3.5 px-3">
                  <div className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{p.vehiculo || '—'}</div>
                  {p.pieza && <div className="text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>{p.pieza}</div>}
                </td>
                <td className="py-3.5 px-3 text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{formatDate(p.fecha)}</td>
                <td className="py-3.5 pr-6 px-3 text-[12.5px] whitespace-nowrap" style={{ color: p.fechaEntrega ? '#059669' : 'var(--pp-text3)' }}>
                  {p.fechaEntrega ? formatDate(p.fechaEntrega) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
