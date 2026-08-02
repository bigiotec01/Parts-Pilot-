import {
  Truck, Clock, Building2, Calendar, MessageSquare, StickyNote, Eye, ArrowRightCircle, ChevronUp, ChevronDown, ChevronsUpDown
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate } from '../../utils/format';
import { StatusBadge } from './StatusBadge';
import { QuickActionsMenu } from './QuickActionsMenu';
import { STATUS_CONFIG, getNextStatus } from '../../constants/status';

export function OrderCard({ order, taller, showTaller, onClick, unreadCount = 0, activityRole, onChangeStatus, compact }) {
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
      className={`w-full text-left rounded-[15px] ${compact ? 'p-3' : 'p-[17px]'} border-2 transition-all hover:border-[#a0a0a0] hover:shadow-[0_8px_24px_-14px_rgba(160,160,160,0.15)] relative cursor-pointer`}
      style={{ background: hasActivity ? 'rgba(245,158,11,0.06)' : 'var(--pp-card)', borderColor: hasActivity ? '#f59e0b' : 'var(--pp-border)', boxShadow: hasActivity ? '0 0 0 3px rgba(245,158,11,0.18), 0 8px 20px -10px rgba(245,158,11,0.5)' : 'none' }}
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-bold text-[14.5px] truncate min-w-0 max-w-full" style={{ color: 'var(--pp-text)' }}>
              {hasNewIds ? [order.numeroPO && `PO# ${order.numeroPO}`, order.numeroOrden && `Orden ${order.numeroOrden}`].filter(Boolean).join('  ·  ') : cardTitle}
            </h3>
            {hasActivity && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold text-white flex-shrink-0" style={{ background: '#f59e0b' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#3b82f6' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
                </span>
                Actualizado
              </span>
            )}
            {unreadCount > 0 && (
              <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white flex-shrink-0" style={{ background: '#f59e0b' }}>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full" style={{ background: '#3b82f6' }} />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-white" style={{ boxShadow: '0 0 0 1px rgba(0,0,0,0.15)' }} />
                </span>
                {unreadCount} mensaje{unreadCount !== 1 ? 's' : ''} nuevo{unreadCount !== 1 ? 's' : ''}
              </span>
            )}
          </div>
          {hasNewIds ? (
            <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{order.vehiculo}</p>
          ) : (
            <>
              {cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{cardSub}</p>}
              {order.pieza && !cardSub && <p className="text-[12.5px] mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{order.pieza}</p>}
            </>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {!compact && <StatusBadge estado={order.estado} />}
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
            <span className="flex items-center gap-1 min-w-0"><Building2 className="w-3.5 h-3.5 flex-shrink-0" /><span className="truncate">{taller.nombre}</span></span>
          )}
          <span className="flex items-center gap-1 flex-shrink-0"><Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(order.fecha)}</span>
        </div>
        <div className="flex items-center gap-2 flex-wrap flex-shrink-0 text-[11.5px]" style={{ color: 'var(--pp-text2)' }}>
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

const LIST_SORT_COLUMNS = [
  { key: 'vehiculo', label: 'Vehículo' },
  { key: 'taller', label: 'Taller' },
  { key: 'folio', label: 'Folio' },
  { key: 'fecha', label: 'Fechas' },
  { key: 'estado', label: 'Estado' },
];

function SortIcon({ active, dir }) {
  if (!active) return <ChevronsUpDown className="w-3 h-3 flex-shrink-0 opacity-40" />;
  return dir === 'asc' ? <ChevronUp className="w-3 h-3 flex-shrink-0" /> : <ChevronDown className="w-3 h-3 flex-shrink-0" />;
}

export function OrderListHeader({ showTaller, sortBy, sortDir, onSort }) {
  return (
    <div
      className="hidden sm:grid sm:grid-cols-subgrid sm:col-span-full gap-x-3 px-4 py-2.5 text-[10.5px] font-bold uppercase"
      style={{ color: 'var(--pp-text3)', letterSpacing: '.05em', borderBottom: '1px solid var(--pp-border2)' }}
    >
      {LIST_SORT_COLUMNS.map(col => {
        if (col.key === 'taller' && !showTaller) return <span key={col.key} />;
        return (
          <button
            key={col.key}
            type="button"
            onClick={() => onSort(col.key)}
            className="flex items-center gap-1 text-left uppercase"
            style={{ color: sortBy === col.key ? 'var(--pp-text)' : 'var(--pp-text3)', letterSpacing: '.05em' }}
          >
            {col.label}
            <SortIcon active={sortBy === col.key} dir={sortDir} />
          </button>
        );
      })}
      <span />
    </div>
  );
}

export function OrderListRow({ order, taller, showTaller, onClick, unreadCount = 0, activityRole, onChangeStatus }) {
  const hasActivity = activityRole ? hasNewActivity(activityRole, order) : false;
  const hasNewIds = order.numeroPO || order.numeroOrden;
  const title = !hasNewIds ? (order.referencia || order.vehiculo) : order.vehiculo;
  const next = getNextStatus(order.estado);

  return (
    <div
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter') onClick(); }}
      className="grid grid-cols-1 sm:grid-cols-subgrid sm:col-span-full gap-x-3 gap-y-1.5 sm:items-start px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--pp-hover)]"
      style={{ background: hasActivity ? 'rgba(245,158,11,0.06)' : undefined, borderBottom: '1px solid var(--pp-border2)' }}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <span className="font-bold text-[13.5px] truncate" style={{ color: 'var(--pp-text)' }}>
            {hasNewIds ? [order.numeroPO && `PO# ${order.numeroPO}`, order.numeroOrden && `Orden ${order.numeroOrden}`].filter(Boolean).join('  ·  ') : title}
          </span>
          {hasActivity && (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold text-white flex-shrink-0" style={{ background: '#f59e0b' }}>Actualizado</span>
          )}
          {unreadCount > 0 && (
            <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold text-white flex-shrink-0" style={{ background: '#f59e0b' }}>{unreadCount} nuevo{unreadCount !== 1 ? 's' : ''}</span>
          )}
        </div>
        {hasNewIds && (
          <p className="text-[11px] mt-0.5 truncate font-medium" style={{ color: 'var(--pp-text3)' }}>
            {title}
          </p>
        )}
      </div>

      {showTaller && taller ? (
        <div className="flex items-center gap-1.5 min-w-0 text-[12.5px] sm:pt-0.5" style={{ color: 'var(--pp-text2)' }}>
          <Building2 className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--pp-text3)' }} />
          <span className="truncate">{taller.nombre}</span>
        </div>
      ) : <div className="hidden sm:block" />}

      <span className="font-mono font-semibold text-[12px] sm:pt-0.5" style={{ color: 'var(--pp-text2)' }}>{order.folio || order.id?.slice(0, 8)}</span>

      <div className="text-[12px] sm:pt-0.5" style={{ color: 'var(--pp-text3)' }}>
        <div className="flex items-center gap-1.5"><Calendar className="w-3 h-3 flex-shrink-0" />{formatDate(order.fecha)}</div>
        {order.fechaEntrega && (
          <div className="flex items-center gap-1.5 mt-0.5 font-semibold" style={{ color: '#2563eb' }}>
            <Truck className="w-3 h-3 flex-shrink-0" />Entrega est.: {formatDate(order.fechaEntrega)}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 flex-wrap sm:pt-px">
        <StatusBadge estado={order.estado} />
        {order.mensajes?.length > 0 && (
          <span className="flex items-center gap-1 text-[11px] font-bold">
            <MessageSquare className="w-3.5 h-3.5" style={{ color: hasActivity ? '#f59e0b' : 'var(--pp-text3)' }} />
            <span className="min-w-[16px] h-4 px-1 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: hasActivity ? '#f59e0b' : 'var(--pp-text3)' }}>
              {order.mensajes.length}
            </span>
          </span>
        )}
        {showTaller && order.notasInternas && <StickyNote className="w-3.5 h-3.5" style={{ color: 'var(--pp-text3)' }} />}
      </div>

      {onChangeStatus ? (
        <div onClick={(e) => e.stopPropagation()} className="flex sm:justify-end sm:-mt-0.5">
          <QuickActionsMenu size="sm" items={[
            { label: 'Ver detalles', icon: Eye, onClick },
            next && { label: `Avanzar a: ${STATUS_CONFIG[next].short}`, icon: ArrowRightCircle, onClick: () => onChangeStatus(order.id, next, order.fechaEntrega || '') },
          ]} />
        </div>
      ) : <div className="hidden sm:block" />}
    </div>
  );
}
