import {
  Clock, FileText, Building2, Paperclip
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate, cleanText, filesOf } from '../../utils/format';

export function AdminEstimados({ solicitudes, getTaller, onSelect }) {
  if (solicitudes.length === 0) return (
    <div className="text-center py-14" style={{ color: 'var(--pp-text9)' }}>
      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm">No hay estimados pendientes.</p>
    </div>
  );

  const sinEstimado = solicitudes.filter(p => p.estado === 'pendiente' || p.tipo === 'solicitud');
  const cotizando   = solicitudes.filter(p => p.estado === 'cotizando');

  const Card = ({ p }) => {
    const taller = getTaller(p.tallerId);
    const isCotizando = p.estado === 'cotizando';
    const hasAct = hasNewActivity('admin', p);
    return (
      <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-[15px] p-[17px] border-2 transition-all hover:border-[#a0a0a0] hover:shadow-[0_8px_24px_-14px_rgba(160,160,160,0.25)] relative" style={{ background: hasAct ? 'rgba(245,158,11,0.06)' : 'var(--pp-card)', borderColor: hasAct ? '#f59e0b' : isCotizando ? 'rgba(160,160,160,0.25)' : 'var(--pp-border)', boxShadow: hasAct ? '0 0 0 3px rgba(245,158,11,0.18), 0 8px 20px -10px rgba(245,158,11,0.5)' : 'none' }}>
      {hasAct && (
        <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: '#f59e0b' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
          </span>
          Actualizado
        </span>
      )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11.5px] flex items-center gap-1 mb-1 truncate" style={{ color: 'var(--pp-text2)' }}>
              <Building2 className="w-3 h-3 flex-shrink-0" />{taller?.nombre || '—'}
            </p>
            <h3 className="text-[14.5px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{p.vehiculo}</h3>
            {p.pieza && <p className="text-[12.5px] mt-0.5" style={{ color: 'var(--pp-text2)' }}>{p.pieza}</p>}
            {(p.numeroPO || p.numeroOrden) && (
              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                {p.numeroPO && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(180,180,180,0.1)', color: 'var(--pp-text6)', border: '1px solid rgba(180,180,180,0.2)' }}>PO# {p.numeroPO}</span>}
                {p.numeroOrden && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(140,140,140,0.1)', color: 'var(--pp-text8)', border: '1px solid rgba(140,140,140,0.2)' }}>Orden {p.numeroOrden}</span>}
              </div>
            )}
          </div>
          {isCotizando ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ background: '#eef4ff', color: '#2563eb' }}>
              <FileText className="w-3 h-3" /> Cotizando
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold flex-shrink-0" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>
              <Clock className="w-3 h-3" /> Sin estimado
            </span>
          )}
        </div>
        {p.notas && <p className="text-[13px] line-clamp-2 mt-2" style={{ color: 'var(--pp-text2)' }}>{cleanText(p.notas)}</p>}
        {(() => {
          const archivos = filesOf(p.archivo, p.archivos);
          if (!archivos.length) return null;
          return (
            <p className="text-[11.5px] flex items-center gap-1 mt-1.5" style={{ color: 'var(--pp-text3)' }}>
              <Paperclip className="w-3 h-3" />{archivos[0].name}{archivos.length > 1 ? ` +${archivos.length - 1}` : ''}
            </p>
          );
        })()}
        <p className="font-mono text-[11.5px] mt-2.5" style={{ color: 'var(--pp-text3)' }}>{p.folio || p.id?.slice(0,8)} · {formatDate(p.fecha)}</p>
      </button>
    );
  };

  return (
    <div className="space-y-6">
      {sinEstimado.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase mb-3" style={{ color: 'var(--pp-text9)', letterSpacing: '.06em' }}>Sin estimado · {sinEstimado.length}</p>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {[...sinEstimado].sort((a,b) => { const t=f=>f?.toDate?f.toDate().getTime():new Date(f+'T00:00:00').getTime(); return t(a.fecha)-t(b.fecha); }).map(p => <Card key={p.id} p={p} />)}
          </div>
        </div>
      )}
      {cotizando.length > 0 && (
        <div>
          <p className="text-[11px] font-bold uppercase mb-3" style={{ color: 'var(--pp-text9)', letterSpacing: '.06em' }}>Cotizando — esperando respuesta · {cotizando.length}</p>
          <div className="grid sm:grid-cols-2 gap-3.5">
            {[...cotizando].sort((a,b) => { const t=f=>f?.toDate?f.toDate().getTime():new Date(f+'T00:00:00').getTime(); return t(a.fecha)-t(b.fecha); }).map(p => <Card key={p.id} p={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  FACTURAS — helpers                                                  */
/* ------------------------------------------------------------------ */
