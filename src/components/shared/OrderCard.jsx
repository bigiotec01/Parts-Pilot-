import {
  Truck, Clock, Building2, Calendar, MessageSquare, StickyNote, Eye, ArrowRightCircle
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate } from '../../utils/format';
import { StatusBadge } from './StatusBadge';
import { QuickActionsMenu } from './QuickActionsMenu';
import { STATUS_CONFIG, getNextStatus } from '../../constants/status';

export function OrderCard({ order, taller, showTaller, onClick, unreadCount = 0, activityRole, onChangeStatus }) {
  const hasActivity = activityRole ? hasNewActivity(activityRole, order) : false;
  const hasNewIds = order.numeroPO || order.numeroOrden;
  const cardTitle = !hasNewIds ? (order.referencia || order.vehiculo) : order.vehiculo;
  const cardSub = !hasNewIds && order.referencia ? order.vehiculo : null;
  const next = getNextStatus(order.estado);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className="w-full text-left rounded-[15px] p-[17px] border-2 transition-all hover:border-[#a0a0a0] hover:shadow-[0_8px_24px_-14px_rgba(160,160,160,0.15)] relative cursor-pointer"
      style={{ background: hasActivity ? 'rgba(245,158,11,0.06)' : 'var(--pp-card)', borderColor: hasActivity ? '#f59e0b' : 'var(--pp-border)', boxShadow: hasActivity ? '0 0 0 3px rgba(245,158,11,0.18), 0 8px 20px -10px rgba(245,158,11,0.5)' : 'none' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[14.5px] truncate" style={{ color: 'var(--pp-text)' }}>{cardTitle}</h3>
            {hasActivity && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#f59e0b' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white" />
                </span>
                Actualizado
              </span>
            )}
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full font-bold flex-shrink-0" style={{ background: 'var(--pp-active-bg)', color: 'var(--pp-text8)' }}>
                <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: 'var(--pp-accent)' }} />
                {unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{cardSub}</p>}
          {order.pieza && !cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{order.pieza}</p>}
          {hasNewIds && (
            <div className="flex items-center gap-1.5 mt-1 flex-wrap">
              {order.numeroPO && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(180,180,180,0.1)', color: 'var(--pp-text6)', border: '1px solid rgba(180,180,180,0.2)' }}>PO# {order.numeroPO}</span>}
              {order.numeroOrden && <span className="text-[11px] px-2 py-0.5 rounded-md font-medium" style={{ background: 'rgba(140,140,140,0.1)', color: 'var(--pp-text8)', border: '1px solid rgba(140,140,140,0.2)' }}>Orden {order.numeroOrden}</span>}
            </div>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <StatusBadge estado={order.estado} />
          {onChangeStatus && (
            <div onClick={(e) => e.stopPropagation()}>
              <QuickActionsMenu size="sm" items={[
                { label: 'Ver detalles', icon: Eye, onClick },
                next && { label: `Avanzar a: ${STATUS_CONFIG[next].short}`, icon: ArrowRightCircle, onClick: () => onChangeStatus(order.id, next, order.fechaEntrega || '') },
              ]} />
            </div>
          )}
        </div>
      </div>
      <div className="flex items-center justify-between gap-3 pt-3" style={{ borderTop: '1px dashed var(--pp-border)' }}>
        <div className="flex items-center justify-between flex-1 gap-3 text-[11.5px] min-w-0" style={{ color: 'var(--pp-text2)' }}>
          <span className="font-mono font-semibold flex-shrink-0" style={{ color: 'var(--pp-text2)' }}>{order.folio || order.id?.slice(0, 8)}</span>
          {showTaller && taller && (
            <span className="flex items-center gap-1 truncate min-w-0"><Building2 className="w-3.5 h-3.5 flex-shrink-0" />{taller.nombre}</span>
          )}
          <span className="flex items-center gap-1 flex-shrink-0"><Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(order.fecha)}</span>
        </div>
        <div className="flex items-center gap-2.5 flex-shrink-0 text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>
          {order.mensajes?.length > 0 && (
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3.5 h-3.5" style={{ color: hasActivity ? '#f59e0b' : 'var(--pp-text3)' }} />
              <span className="min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: hasActivity ? '#f59e0b' : 'var(--pp-text3)' }}>
                {order.mensajes.length}
              </span>
            </span>
          )}
          {order.estado === 'cotizando' && order.estimado?.respuesta === 'pendiente' && <span className="flex items-center gap-1 font-semibold" style={{ color: '#b7791f' }}><Clock className="w-3.5 h-3.5" />Esperando</span>}
          {showTaller && order.notasInternas && <StickyNote className="w-3.5 h-3.5" style={{ color: 'var(--pp-text3)' }} />}
        </div>
      </div>
      {order.fechaEntrega && (
        <div className="mt-2 flex items-center gap-1 text-[11.5px] font-semibold" style={{ color: '#2563eb' }}>
          <Truck className="w-3.5 h-3.5 flex-shrink-0" /> Entrega est.: {formatDate(order.fechaEntrega)}
        </div>
      )}
    </div>
  );
}
