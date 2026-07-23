import {
  Clock, FileText, ThumbsUp, ThumbsDown, MessageSquare, MessageCircle, PackageCheck, PackageX, PackageSearch
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate, cleanText, filesOf, humanize } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';

// Ícono + tono para la nota de disponibilidad, según palabras clave frecuentes en el texto
// que escribe el admin (ninguna estructura de datos nueva, solo lectura del texto libre).
function disponibilidadTono(notas) {
  const t = (notas || '').toLowerCase();
  if (/\bno disponible/.test(t)) return { Icon: PackageX, tone: '#ef4444' };
  if (/\btodas? disponible/.test(t)) return { Icon: PackageCheck, tone: '#10b981' };
  return { Icon: PackageSearch, tone: 'var(--pp-text3)' };
}

function NotaDisponibilidad({ notas }) {
  if (!notas) return null;
  const { Icon, tone } = disponibilidadTono(notas);
  return (
    <div className="flex items-start gap-2 rounded-lg px-3 py-2" style={{ background: 'var(--pp-surface)' }}>
      <Icon className="w-4 h-4 flex-shrink-0 mt-[1px]" style={{ color: tone }} />
      <p className="text-[13px] leading-snug" style={{ color: 'var(--pp-text2)' }}>{humanize(cleanText(notas))}</p>
    </div>
  );
}

function ArchivoChip({ f, onClick }) {
  return (
    <a href={f.url} target="_blank" rel="noreferrer" onClick={onClick} className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium transition-colors hover:brightness-110" style={{ background: 'var(--pp-surface)', color: 'var(--pp-text2)' }}>
      <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#f87171' }} /> <span className="truncate max-w-[140px]">{f.name}</span>
    </a>
  );
}

export function EstimateCard({ order }) {
  const { estimado } = order;
  const archivos = filesOf(estimado.archivo, estimado.archivos);
  return (
    <div className="rounded-xl border p-4 space-y-3" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
      <div>
        <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{humanize(order.referencia || order.vehiculo)}</h3>
        {order.referencia && <p className="text-sm truncate" style={{ color: 'var(--pp-text2)' }}>{humanize(order.vehiculo)}</p>}
      </div>
      <NotaDisponibilidad notas={estimado.notas} />
      {archivos.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {archivos.map((f, i) => <ArchivoChip key={i} f={f} />)}
        </div>
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
      <div className="flex items-center gap-3">
        <button onClick={() => onRespond(order.id, 'aceptado')} className="flex-1 py-2 rounded-[9px] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors hover:brightness-105" style={{ background: '#10b981' }}>
          <ThumbsUp className="w-3.5 h-3.5" /> Aprobar
        </button>
        <button onClick={() => onRespond(order.id, 'rechazado')} className="text-[13px] font-medium flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: '#ef4444' }}>
          <ThumbsDown className="w-3.5 h-3.5" /> Rechazar
        </button>
      </div>
    );
  }

  if (estimado.respuesta === 'rechazado') {
    return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] text-[13px] font-medium" style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444' }}>
        <ThumbsDown className="w-3.5 h-3.5 flex-shrink-0" /> Rechazaste este estimado
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-[9px] text-[13px] font-medium" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
      <ThumbsUp className="w-3.5 h-3.5 flex-shrink-0" /> Estimado aceptado
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
                    <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{humanize(p.vehiculo)}</h3>
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
                <NotaDisponibilidad notas={p.estimado?.notas} />
                {filesOf(p.estimado?.archivo, p.estimado?.archivos).length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {filesOf(p.estimado?.archivo, p.estimado?.archivos).map((f, i) => (
                      <ArchivoChip key={i} f={f} onClick={e => e.stopPropagation()} />
                    ))}
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <button onClick={e => { e.stopPropagation(); onRespond(p.id, 'aceptado'); }} className="flex-1 py-2 rounded-[9px] text-white text-[13px] font-semibold flex items-center justify-center gap-1.5 transition-colors hover:brightness-105" style={{ background: '#10b981' }}>
                    <ThumbsUp className="w-3.5 h-3.5" /> Aprobar
                  </button>
                  <button onClick={e => { e.stopPropagation(); onRespond(p.id, 'rechazado'); }} className="text-[13px] font-medium flex items-center gap-1.5 transition-colors hover:opacity-80" style={{ color: '#ef4444' }}>
                    <ThumbsDown className="w-3.5 h-3.5" /> Rechazar
                  </button>
                  <button onClick={e => { e.stopPropagation(); onSelect?.(p.id); }} title="Preguntar al vendedor" className="w-8 h-8 flex-shrink-0 rounded-[9px] flex items-center justify-center transition-colors hover:bg-[#1e1e1e]" style={{ color: 'var(--pp-text3)' }}>
                    <MessageCircle className="w-4 h-4" />
                  </button>
                </div>
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
                    <h3 className="text-[15px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{humanize(p.vehiculo)}</h3>
                  </div>
                  <StatusBadge estado={p.estado} />
                </div>
                {p.notas && (
                  <div className="mb-2.5">
                    <NotaDisponibilidad notas={p.notas} />
                  </div>
                )}
                {filesOf(p.archivo, p.archivos).length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-2.5">
                    {filesOf(p.archivo, p.archivos).map((f, i) => (
                      <ArchivoChip key={i} f={f} onClick={e => e.stopPropagation()} />
                    ))}
                  </div>
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
