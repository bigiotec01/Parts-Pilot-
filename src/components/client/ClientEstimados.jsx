import {
  Clock, FileText, ThumbsUp, ThumbsDown, MessageSquare
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';

export function EstimateCard({ order }) {
  const { estimado } = order;
  return (
    <div className="rounded-xl border p-4" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
      <div className="mb-2">
        <h3 className="font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{order.referencia || order.vehiculo}</h3>
        {order.referencia && <p className="text-sm truncate" style={{ color: 'var(--pp-text2)' }}>{order.vehiculo}</p>}
      </div>
      {estimado.notas && <p className="text-sm mb-3 rounded-lg p-2" style={{ color: 'var(--pp-text2)', background: 'var(--pp-card)' }}>{estimado.notas}</p>}
      {estimado.archivo && (
        <a href={estimado.archivo.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors mb-3 border hover:border-[#a0a0a0]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
          <FileText className="w-4 h-4 flex-shrink-0" /> <span className="truncate">{estimado.archivo.name}</span>
        </a>
      )}
      <EstimateActions order={order} />
    </div>
  );
}

export function EstimateActions({ order, onRespond }) {
  const { estimado } = order;
  const canRespond = estimado.respuesta === 'pendiente' && order.estado === 'cotizando';

  if (canRespond) {
    return (
      <div className="flex gap-2">
        <button onClick={() => onRespond(order.id, 'aceptado')} className="flex-1 py-[11px] rounded-[11px] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors" style={{ background: '#10b981' }}>
          <ThumbsUp className="w-4 h-4" /> Aprobar Estimado
        </button>
        <button onClick={() => onRespond(order.id, 'rechazado')} className="flex-1 py-[11px] rounded-[11px] text-[13px] font-semibold flex items-center justify-center gap-1.5 border transition-colors hover:bg-[#1e1e1e]" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          <ThumbsDown className="w-4 h-4" /> Rechazar
        </button>
      </div>
    );
  }

  if (estimado.respuesta === 'rechazado') {
    return (
      <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold" style={{ background: '#fdecec', color: '#dc2626' }}>
        <ThumbsDown className="w-4 h-4 flex-shrink-0" /> Rechazaste este estimado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2.5 rounded-[10px] text-[13px] font-semibold" style={{ background: '#eafaf2', color: '#059669' }}>
      <ThumbsUp className="w-4 h-4 flex-shrink-0" /> Estimado aceptado
    </div>
  );
}

export function ClientEstimados({ solicitudes, cotizaciones = [], onRespond, onSelect }) {
  const total = solicitudes.length + cotizaciones.length;
  if (total === 0) return (
    <div className="text-center py-14" style={{ color: 'var(--pp-text3)' }}>
      <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
      <p className="text-sm font-medium" style={{ color: 'var(--pp-text2)' }}>No tienes solicitudes ni cotizaciones pendientes.</p>
      <p className="text-xs mt-1">Usa "Solicitar Estimado" para enviar una nueva solicitud al depto. de piezas.</p>
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Cotizaciones recibidas del admin — por responder */}
      {cotizaciones.length > 0 && (
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-text2)' }}>
            Cotizaciones por responder · {cotizaciones.length}
          </p>
          <div className="grid sm:grid-cols-2 gap-3">
            {cotizaciones.map(p => {
              const hasAct = hasNewActivity('taller', p);
              return (
              <div key={p.id} onClick={() => onSelect?.(p.id)} className="rounded-xl p-4 space-y-3 border-2 cursor-pointer hover:border-[#a0a0a0] transition-colors relative" style={{ background: hasAct ? 'rgba(245,158,11,0.06)' : 'var(--pp-card)', borderColor: hasAct ? '#f59e0b' : 'var(--pp-accent)', boxShadow: hasAct ? '0 0 0 3px rgba(245,158,11,0.18), 0 8px 20px -10px rgba(245,158,11,0.5)' : '0 0 0 1px rgba(200,200,200,0.07)' }}>
                {hasAct && (
                  <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: '#f59e0b' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Actualizado
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.vehiculo}</h3>
                    {(p.numeroPO || p.numeroOrden) && (
                      <div className="flex gap-1.5 mt-1 flex-wrap">
                        {p.numeroPO && <span className="text-[11px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-md font-medium">PO# {p.numeroPO}</span>}
                        {p.numeroOrden && <span className="text-[11px] bg-violet-50 text-violet-700 border border-violet-200 px-2 py-0.5 rounded-md font-medium">Orden {p.numeroOrden}</span>}
                      </div>
                    )}
                    {p.referencia && !p.numeroPO && !p.numeroOrden && (
                      <p className="text-xs mt-0.5" style={{ color: 'var(--pp-text3)' }}>{p.referencia}</p>
                    )}
                  </div>
                  {(p.mensajes?.length > 0) && (
                    <span className="flex items-center gap-1 text-[11px] flex-shrink-0" style={{ color: 'var(--pp-text3)' }}>
                      <MessageSquare className="w-3.5 h-3.5" />{p.mensajes.length}
                    </span>
                  )}
                </div>
                {p.estimado?.notas && (
                  <p className="text-sm rounded-lg p-2.5" style={{ color: 'var(--pp-text2)', background: 'var(--pp-card)' }}>{p.estimado.notas}</p>
                )}
                {p.estimado?.archivo && (
                  <a href={p.estimado.archivo.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors border hover:border-[#a0a0a0]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{p.estimado.archivo.name}</span>
                  </a>
                )}
                <div className="flex gap-2">
                  <button onClick={e => { e.stopPropagation(); onRespond(p.id, 'aceptado'); }} className="flex-1 py-[11px] rounded-[11px] text-white text-[13px] font-bold flex items-center justify-center gap-1.5 transition-colors hover:brightness-105" style={{ background: '#10b981' }}>
                    <ThumbsUp className="w-4 h-4" /> Aprobar Estimado
                  </button>
                  <button onClick={e => { e.stopPropagation(); onRespond(p.id, 'rechazado'); }} className="flex-1 py-[11px] rounded-[11px] text-[13px] font-semibold border flex items-center justify-center gap-1.5 transition-colors hover:bg-[#1e1e1e]" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                    <ThumbsDown className="w-4 h-4" /> Rechazar
                  </button>
                </div>
                <button onClick={e => { e.stopPropagation(); onSelect?.(p.id); }} className="w-full flex items-center justify-center gap-1.5 text-[11.5px] font-semibold py-1.5 rounded-[9px] border transition-colors hover:bg-[#1e1e1e]" style={{ background: 'var(--pp-input-bg)', borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
                  <MessageSquare className="w-3.5 h-3.5" /> Preguntar al Vendedor
                </button>
              </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Solicitudes enviadas — esperando respuesta del proveedor */}
      {solicitudes.length > 0 && (
        <div className="space-y-3">
          {cotizaciones.length > 0 && (
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--pp-text2)' }}>Solicitudes enviadas · {solicitudes.length}</p>
          )}
          <div className="grid sm:grid-cols-2 gap-3">
            {[...solicitudes].sort((a, b) => {
              const t = f => f?.toDate ? f.toDate().getTime() : new Date(f + 'T00:00:00').getTime();
              return t(b.fecha) - t(a.fecha);
            }).map(p => {
              const hasAct = hasNewActivity('taller', p);
              return (
              <div key={p.id} onClick={() => onSelect?.(p.id)} className="rounded-xl border-2 p-4 cursor-pointer hover:border-[#a0a0a0] transition-colors relative" style={{ background: hasAct ? 'rgba(245,158,11,0.06)' : 'var(--pp-card)', borderColor: hasAct ? '#f59e0b' : 'var(--pp-border)', boxShadow: hasAct ? '0 0 0 3px rgba(245,158,11,0.18), 0 8px 20px -10px rgba(245,158,11,0.5)' : 'none' }}>
                {hasAct && (
                  <span className="absolute -top-2 -right-2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white shadow-md" style={{ background: '#f59e0b' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white" />
                    </span>
                    Actualizado
                  </span>
                )}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.vehiculo}</h3>
                  </div>
                  <StatusBadge estado={p.estado} />
                </div>
                {p.notas && <p className="text-sm rounded-lg p-2.5 mb-2.5" style={{ color: 'var(--pp-text2)', background: 'var(--pp-card)' }}>{p.notas}</p>}
                {p.archivo && (
                  <a href={p.archivo.url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors mb-2.5 border hover:border-[#a0a0a0]" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', color: 'var(--pp-text2)' }}>
                    <FileText className="w-4 h-4 flex-shrink-0" /><span className="truncate">{p.archivo.name}</span>
                  </a>
                )}
                <div className="flex items-center justify-between gap-1.5 text-xs px-3 py-1.5 rounded-lg" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b', border: '1px solid rgba(245,158,11,0.2)' }}>
                  <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Esperando estimado · {formatDate(p.fecha)}</span>
                  {(p.mensajes?.length > 0) && <span className="flex items-center gap-1"><MessageSquare className="w-3.5 h-3.5" />{p.mensajes.length}</span>}
                </div>
              </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
