import { useState, useMemo } from 'react';
import {
  Clock, ChevronRight, CheckCircle2, ChevronUp, ChevronDown, ChevronsUpDown, Eye, ArrowRightCircle, Truck, PackageCheck, BadgeCheck, Sun, AlertTriangle, Package
} from 'lucide-react';
import { hasNewActivity } from '../../utils/activity';
import { formatDate, toDateAny, esHoy } from '../../utils/format';
import { contarPiezasEnTienda } from '../../utils/piezasExcel';
import { StatusBadge } from '../shared/StatusBadge';
import { StatCard } from '../shared/StatCard';
import { DashboardChart } from '../shared/DashboardChart';
import { QuickActionsMenu } from '../shared/QuickActionsMenu';
import { STATUS_ORDER, STATUS_CONFIG, getNextStatus } from '../../constants/status';

const COLUMNS = [
  { key: 'folio',  label: 'Folio' },
  { key: 'taller', label: 'Taller' },
  { key: 'vehiculo', label: 'Vehículo / Pieza', sortable: false, hideSm: true },
  { key: 'estado', label: 'Estado' },
  { key: 'fecha',  label: 'Fecha', align: 'right' },
];

// Bloque "Para hoy": lo que hay que atender hoy, en una sola vista.
function ParaHoy({ pedidos, aprobados, getTaller, onSelect, onGoToAprobados }) {
  const finDeHoy = new Date(); finDeHoy.setHours(23, 59, 59, 999);
  const entregas = pedidos
    .filter(p => { const d = toDateAny(p.fechaEntrega); return d && d <= finDeHoy; })
    .sort((a, b) => toDateAny(a.fechaEntrega) - toDateAny(b.fechaEntrega));
  const conPiezasHoy = pedidos
    .map(p => ({ p, n: (p.piezas || []).filter(pz => esHoy(pz.fechaRecibida)).length }))
    .filter(x => x.n > 0);
  const piezasHoy = conPiezasHoy.reduce((acc, x) => acc + x.n, 0);

  const Item = ({ p, extra, tone }) => (
    <button onClick={() => onSelect(p.id)} className="w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-[9px] transition-colors hover:bg-[var(--pp-hover)] min-w-0">
      <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: tone }} />
      <span className="text-[12px] font-semibold truncate flex-1 min-w-0" style={{ color: 'var(--pp-text)' }}>{p.numeroPO ? `PO# ${p.numeroPO}` : p.vehiculo || p.folio}</span>
      <span className="text-[11px] flex-shrink-0 truncate max-w-[45%]" style={{ color: 'var(--pp-text3)' }}>{extra}</span>
    </button>
  );

  const Col = ({ icon: Icon, tone, titulo, valor, vacio, children, onHeaderClick }) => (
    <div className="rounded-[13px] p-3 border flex flex-col min-w-0" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-surface)' }}>
      <button type="button" onClick={onHeaderClick} disabled={!onHeaderClick} className="flex items-center gap-2.5 mb-2 text-left disabled:cursor-default">
        <span className="w-8 h-8 rounded-[9px] flex items-center justify-center flex-shrink-0" style={{ background: `${tone}1f` }}><Icon className="w-4 h-4" style={{ color: tone }} /></span>
        <span className="min-w-0">
          <span className="block text-[20px] font-extrabold leading-none" style={{ color: valor ? 'var(--pp-text)' : 'var(--pp-text3)' }}>{valor}</span>
          <span className="block text-[11.5px] font-semibold mt-0.5 truncate" style={{ color: 'var(--pp-text2)' }}>{titulo}</span>
        </span>
      </button>
      {valor ? children : <p className="text-[11.5px] px-1" style={{ color: 'var(--pp-text3)' }}>{vacio}</p>}
    </div>
  );

  return (
    <div className="rounded-[16px] p-5 border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)', animation: 'ppRise .3s ease both' }}>
      <div className="flex items-center gap-2 mb-3">
        <Sun className="w-4 h-4" style={{ color: '#f59e0b' }} />
        <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Para hoy</h2>
        <span className="text-[12px] capitalize" style={{ color: 'var(--pp-text3)' }}>· {new Date().toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
      </div>
      <div className="grid sm:grid-cols-3 gap-3">
        <Col icon={Truck} tone="#ef4444" titulo="Entregas hoy / vencidas" valor={entregas.length} vacio="Ninguna entrega para hoy.">
          {entregas.slice(0, 3).map(p => <Item key={p.id} p={p} tone={esHoy(p.fechaEntrega) ? '#f59e0b' : '#ef4444'} extra={esHoy(p.fechaEntrega) ? 'hoy' : `vencida · ${formatDate(p.fechaEntrega)}`} />)}
          {entregas.length > 3 && <p className="text-[11px] px-2.5 mt-0.5" style={{ color: 'var(--pp-text3)' }}>+{entregas.length - 3} más</p>}
        </Col>
        <Col icon={PackageCheck} tone="#10b981" titulo={`Pieza${piezasHoy === 1 ? '' : 's'} recibida${piezasHoy === 1 ? '' : 's'} hoy`} valor={piezasHoy} vacio="Aún no llegan piezas hoy.">
          {conPiezasHoy.slice(0, 3).map(({ p, n }) => <Item key={p.id} p={p} tone="#10b981" extra={`${n} pieza${n === 1 ? '' : 's'} · ${getTaller(p.tallerId)?.nombre || ''}`} />)}
          {conPiezasHoy.length > 3 && <p className="text-[11px] px-2.5 mt-0.5" style={{ color: 'var(--pp-text3)' }}>+{conPiezasHoy.length - 3} pedidos más</p>}
        </Col>
        <Col icon={BadgeCheck} tone="#6366f1" titulo="Aprobadas sin mover" valor={aprobados.length} vacio="Todas las órdenes aprobadas ya están en Pedidos." onHeaderClick={aprobados.length ? onGoToAprobados : undefined}>
          {aprobados.slice(0, 3).map(p => <Item key={p.id} p={p} tone="#6366f1" extra={getTaller(p.tallerId)?.nombre || p.tallerNombre || ''} />)}
          {aprobados.length > 3 && <button onClick={onGoToAprobados} className="text-[11px] font-semibold px-2.5 mt-0.5 text-left hover:underline" style={{ color: 'var(--pp-text2)' }}>Ver las {aprobados.length} →</button>}
        </Col>
      </div>
    </div>
  );
}

// Último movimiento conocido: cambio de estado, pieza recibida o creación del pedido.
// Los pedidos anteriores a que existiera fechaEstado usan la fecha de creación.
function ultimoMovimiento(p) {
  const fechas = [p.fechaEstado, p.fecha, ...(p.piezas || []).map(pz => pz.fechaRecibida)]
    .map(toDateAny).filter(Boolean).map(d => d.getTime());
  return fechas.length ? Math.max(...fechas) : null;
}

const DIAS_DETENIDO = 5;
const ESTADOS_EMBUDO = ['pendiente', 'pedido_fabrica', 'ordenadas', 'esperando_piezas', 'en_transito', 'recibido'];
const fmtCur = (n) => `$${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function Panel({ titulo, sub, accion, children, className = '' }) {
  return (
    <div className={`rounded-[16px] p-6 border flex flex-col min-w-0 ${className}`} style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>{titulo}</h2>
          {sub && <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>{sub}</p>}
        </div>
        {accion}
      </div>
      {children}
    </div>
  );
}

// Cuántos pedidos hay en cada etapa; al tocar una, abre Pedidos filtrado por ese estado.
function Embudo({ pedidos, solicitudes, onFilterEstado, onGoToEstimados }) {
  const filas = [
    { key: 'solicitudes', label: 'Esperando cotizar', dot: '#C6202B', n: solicitudes.length, onClick: onGoToEstimados },
    ...ESTADOS_EMBUDO.map(e => ({ key: e, label: STATUS_CONFIG[e].short, dot: STATUS_CONFIG[e].dot, n: pedidos.filter(p => p.estado === e).length, onClick: () => onFilterEstado?.(e) })),
  ];
  const max = Math.max(...filas.map(f => f.n), 1);
  return (
    <div className="flex flex-col gap-1">
      {filas.map(f => (
        <button key={f.key} onClick={f.onClick} disabled={!f.n} className="flex items-center gap-3 px-2 py-1.5 rounded-[9px] text-left transition-colors hover:bg-[var(--pp-hover)] disabled:hover:bg-transparent disabled:cursor-default">
          <span className="w-[120px] flex-shrink-0 flex items-center gap-2 text-[12.5px] font-semibold truncate" style={{ color: f.n ? 'var(--pp-text)' : 'var(--pp-text3)' }}>
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: f.dot }} />{f.label}
          </span>
          <span className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: 'var(--pp-border2)' }}>
            <span className="block h-full rounded-full transition-all duration-500" style={{ width: `${(f.n / max) * 100}%`, background: f.dot }} />
          </span>
          <span className="w-7 text-right text-[13px] font-extrabold flex-shrink-0" style={{ color: f.n ? 'var(--pp-text)' : 'var(--pp-text3)', fontVariantNumeric: 'tabular-nums' }}>{f.n}</span>
        </button>
      ))}
    </div>
  );
}

export function AdminDashboard({ pedidos, todos = [], solicitudes, aprobados = [], facturas, onGoToAprobados, getTaller, onSelect, onGoToPedidos, onGoToEstimados, onGoToFacturas, onFilterEstado, onChangeStatus }) {
  const [sort, setSort] = useState({ key: 'fecha', dir: 'desc' });

  const enProceso = pedidos.filter(p => ['pedido_fabrica', 'ordenadas', 'esperando_piezas', 'en_transito', 'recibido'].includes(p.estado));
  const enProcesoConActividad = enProceso.filter(p => hasNewActivity('admin', p)).length;
  const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();

  const detenidos = useMemo(() => pedidos
    .map(p => ({ p, ms: ultimoMovimiento(p) }))
    .filter(x => x.ms && Date.now() - x.ms >= DIAS_DETENIDO * 86400000)
    .sort((a, b) => a.ms - b.ms), [pedidos]);

  const piezas = useMemo(() => {
    let pendientes = 0, conPendientes = 0;
    pedidos.forEach(p => {
      const n = (p.piezas || []).length - contarPiezasEnTienda(p.piezas);
      if (n > 0) { pendientes += n; conPendientes++; }
    });
    return { pendientes, conPendientes };
  }, [pedidos]);

  const entregadosMes = useMemo(() => {
    const hoy = new Date();
    const lista = todos.filter(p => {
      if (p.estado !== 'entregado') return false;
      const d = toDateAny(p.fechaEntregado);
      return d && d.getFullYear() === hoy.getFullYear() && d.getMonth() === hoy.getMonth();
    });
    const dias = lista.map(p => (toDateAny(p.fechaEntregado) - toDateAny(p.fecha)) / 86400000).filter(n => n >= 0);
    return { n: lista.length, promedio: dias.length ? Math.round(dias.reduce((a, b) => a + b, 0) / dias.length) : null };
  }, [todos]);

  // Saldo pendiente de facturas no archivadas, agrupado por taller.
  const saldo = useMemo(() => {
    if (!facturas) return null;
    const porTaller = {};
    facturas.filter(f => !f.archivada && Number(f.pendiente || 0) > 0).forEach(f => {
      porTaller[f.tallerId] = (porTaller[f.tallerId] || 0) + Number(f.pendiente);
    });
    const filas = Object.entries(porTaller).map(([tallerId, monto]) => ({ tallerId, monto })).sort((a, b) => b.monto - a.monto);
    return { total: filas.reduce((a, f) => a + f.monto, 0), filas };
  }, [facturas]);

  const recientes = useMemo(() => {
    const base = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 6);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...base].sort((a, b) => {
      switch (sort.key) {
        case 'folio':  return dir * (a.folio || a.id).localeCompare(b.folio || b.id);
        case 'taller': return dir * (getTaller(a.tallerId)?.nombre || '').localeCompare(getTaller(b.tallerId)?.nombre || '');
        case 'estado': return dir * (STATUS_ORDER.indexOf(a.estado) - STATUS_ORDER.indexOf(b.estado));
        case 'fecha':
        default:       return dir * (toMs(a.fecha) - toMs(b.fecha));
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedidos, sort]);

  const toggleSort = (key) => {
    setSort(s => s.key === key ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { key, dir: 'asc' });
  };

  return (
    <div className="space-y-4">
      <ParaHoy pedidos={pedidos} aprobados={aprobados} getTaller={getTaller} onSelect={onSelect} onGoToAprobados={onGoToAprobados} />

      {/* KPIs */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Pedidos detenidos" value={detenidos.length} icon={AlertTriangle} iconBg="rgba(239,68,68,0.1)" iconColor="#ef4444" chipLabel={`+${DIAS_DETENIDO} días`} chipBg="rgba(239,68,68,0.1)" chipColor="#ef4444" highlight={detenidos.length > 0}
          hint={detenidos.length === 0 ? 'Todo se está moviendo' : 'Sin cambios recientes'} hintTone={detenidos.length === 0 ? 'ok' : 'warn'} />
        <StatCard label="En proceso" value={enProceso.length} icon={Clock} iconBg="rgba(198,32,43,0.1)" iconColor="#C6202B"
          hint={enProcesoConActividad === 0 ? 'Sin actividad nueva' : `${enProcesoConActividad} con actividad nueva`} hintTone={enProcesoConActividad === 0 ? 'ok' : 'warn'} />
        <StatCard label="Piezas por llegar" value={piezas.pendientes} icon={Package} iconBg="rgba(245,158,11,0.1)" iconColor="#f59e0b"
          hint={piezas.pendientes === 0 ? 'Nada pendiente' : `En ${piezas.conPendientes} pedido${piezas.conPendientes === 1 ? '' : 's'}`} hintTone={piezas.pendientes === 0 ? 'ok' : undefined} />
        <StatCard label="Entregados este mes" value={entregadosMes.n} icon={CheckCircle2} iconBg="rgba(20,184,166,0.1)" iconColor="#14b8a6" chipLabel={new Date().toLocaleDateString('es-MX', { month: 'short' })} chipBg="rgba(20,184,166,0.1)" chipColor="#14b8a6"
          hint={entregadosMes.promedio != null ? `Promedio ${entregadosMes.promedio} día${entregadosMes.promedio === 1 ? '' : 's'} por orden` : undefined} hintTone="ok" />
      </div>

      {/* Embudo + gráfica */}
      <div className="grid xl:grid-cols-[1fr_1.4fr] gap-4">
        <Panel titulo="Pedidos por estado" sub="Toca un estado para ver esos pedidos">
          <Embudo pedidos={pedidos} solicitudes={solicitudes} onFilterEstado={onFilterEstado} onGoToEstimados={onGoToEstimados} />
        </Panel>
        <Panel titulo="Volumen de pedidos" sub="Últimos 6 meses">
          <DashboardChart pedidos={todos.filter(p => p.estado !== 'rechazado')} />
        </Panel>
      </div>

      {/* Detenidos + saldo */}
      <div className={`grid gap-4 ${saldo ? 'xl:grid-cols-[1.4fr_1fr]' : ''}`}>
        <Panel titulo="Pedidos detenidos" sub={`Sin cambio de estado ni piezas recibidas en ${DIAS_DETENIDO}+ días`}
          accion={detenidos.length > 0 && <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-[7px] flex-shrink-0" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>{detenidos.length}</span>}>
          {detenidos.length === 0 ? (
            <div className="flex items-center gap-2.5 py-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" style={{ color: '#14b8a6' }} />
              <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>Ningún pedido lleva más de {DIAS_DETENIDO} días sin moverse.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5">
              {detenidos.slice(0, 5).map(({ p, ms }) => (
                <button key={p.id} onClick={() => onSelect(p.id)} className="w-full text-left rounded-[11px] px-3 py-2.5 flex gap-3 items-center border transition-colors hover:border-[#C6202B] min-w-0" style={{ borderColor: 'var(--pp-border)' }}>
                  <div className="min-w-0 flex-1">
                    <div className="text-[13px] font-bold truncate" style={{ color: 'var(--pp-text)' }}>{p.numeroPO ? `PO# ${p.numeroPO}` : p.vehiculo || p.folio}</div>
                    <div className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || p.tallerNombre || '—'}{p.numeroPO && p.vehiculo ? ` · ${p.vehiculo}` : ''}</div>
                  </div>
                  <span className="hidden sm:inline-flex"><StatusBadge estado={p.estado} /></span>
                  <span className="text-[11.5px] font-bold flex-shrink-0 w-[52px] text-right" style={{ color: '#ef4444' }}>{Math.floor((Date.now() - ms) / 86400000)} días</span>
                </button>
              ))}
              {detenidos.length > 5 && <button onClick={onGoToPedidos} className="text-[11.5px] font-semibold px-1 mt-0.5 text-left hover:underline" style={{ color: 'var(--pp-text3)' }}>+{detenidos.length - 5} más</button>}
            </div>
          )}
        </Panel>

        {saldo && (
          <Panel titulo="Saldo por cobrar" sub="Facturas pendientes de pago"
            accion={onGoToFacturas && <button onClick={onGoToFacturas} className="flex items-center gap-1 text-[12.5px] font-bold flex-shrink-0 hover:opacity-70" style={{ color: 'var(--pp-text8)' }}>Facturas <ChevronRight className="w-4 h-4" /></button>}>
            <p className="text-[28px] font-extrabold leading-none mb-3" style={{ color: saldo.total ? 'var(--pp-text)' : 'var(--pp-text3)', fontVariantNumeric: 'tabular-nums', letterSpacing: '-.02em' }}>{fmtCur(saldo.total)}</p>
            {saldo.filas.length === 0 ? (
              <p className="text-[12.5px]" style={{ color: 'var(--pp-text2)' }}>No hay facturas pendientes.</p>
            ) : (
              <div className="flex flex-col gap-1">
                {saldo.filas.slice(0, 5).map(f => (
                  <div key={f.tallerId} className="flex items-center justify-between gap-3 px-1 py-1 text-[12.5px]">
                    <span className="truncate font-semibold" style={{ color: 'var(--pp-text)' }}>{getTaller(f.tallerId)?.nombre || '—'}</span>
                    <span className="font-bold flex-shrink-0" style={{ color: '#b7791f', fontVariantNumeric: 'tabular-nums' }}>{fmtCur(f.monto)}</span>
                  </div>
                ))}
                {saldo.filas.length > 5 && <p className="text-[11.5px] px-1" style={{ color: 'var(--pp-text3)' }}>+{saldo.filas.length - 5} talleres más</p>}
              </div>
            )}
          </Panel>
        )}
      </div>

      {/* Tabla recientes */}
      <div className="rounded-[16px] overflow-hidden border" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border)' }}>
        <div className="flex items-center justify-between px-6 py-[18px]">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Pedidos recientes</h2>
          <button onClick={onGoToPedidos} className="flex items-center gap-1 text-[13px] font-bold transition-colors hover:opacity-70" style={{ color: 'var(--pp-text8)' }}>Ver todos <ChevronRight className="w-4 h-4" /></button>
        </div>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ borderTop: '1px solid var(--pp-border2)' }}>
              {COLUMNS.map((c, i) => {
                const sortable = c.sortable !== false;
                const active = sort.key === c.key;
                const Icon = active ? (sort.dir === 'asc' ? ChevronUp : ChevronDown) : ChevronsUpDown;
                return (
                  <th key={c.key} className={`text-left py-3 text-[10.5px] font-bold uppercase ${i === 0 ? 'px-6' : 'px-3'} ${c.align === 'right' ? 'text-right pr-6' : ''} ${c.hideSm ? 'hidden sm:table-cell' : ''}`} style={{ color: active ? 'var(--pp-text)' : 'var(--pp-text6)', letterSpacing: '.06em' }}>
                    {sortable ? (
                      <button onClick={() => toggleSort(c.key)} className={`inline-flex items-center gap-1 hover:text-[var(--pp-text)] transition-colors ${c.align === 'right' ? 'flex-row-reverse' : ''}`}>
                        {c.label}<Icon className="w-3 h-3" />
                      </button>
                    ) : c.label}
                  </th>
                );
              })}
              <th className="py-3 px-3 w-10" />
            </tr>
          </thead>
          <tbody>
            {recientes.length === 0 && <tr><td colSpan={6} className="py-10 text-center text-sm" style={{ color: 'var(--pp-text3)' }}>Sin pedidos aún.</td></tr>}
            {recientes.map(p => {
              const nueva = hasNewActivity('admin', p);
              const next = getNextStatus(p.estado);
              return (
                <tr key={p.id} onClick={() => onSelect(p.id)} className="cursor-pointer transition-colors hover:bg-[#1e1e1e]" style={{ borderTop: '1px solid var(--pp-border2)', background: nueva ? 'rgba(245,158,11,0.05)' : undefined }}>
                  <td className="py-3.5 px-6 font-mono text-[12.5px] font-semibold whitespace-nowrap" style={{ color: 'var(--pp-text)' }}>
                    <span className="inline-flex items-center gap-2">
                      {nueva && <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: '#f59e0b', boxShadow: '0 0 0 3px rgba(245,158,11,0.22)' }} title="Actividad nueva" />}
                      {p.folio || p.id.slice(0,8)}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-[13px] max-w-[150px] truncate" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                  <td className="py-3.5 px-3 hidden sm:table-cell max-w-[220px]">
                    <div className="text-[13px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{p.vehiculo || '—'}</div>
                    {p.pieza && <div className="text-[11.5px] truncate" style={{ color: 'var(--pp-text2)' }}>{p.pieza}</div>}
                  </td>
                  <td className="py-3.5 px-3"><StatusBadge estado={p.estado} /></td>
                  <td className="py-3.5 pr-6 text-right text-[12.5px] whitespace-nowrap" style={{ color: 'var(--pp-text2)' }}>{formatDate(p.fecha)}</td>
                  <td className="py-3.5 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <QuickActionsMenu size="sm" items={[
                      { label: 'Ver detalles', icon: Eye, onClick: () => onSelect(p.id) },
                      next && onChangeStatus && { label: `Avanzar a: ${STATUS_CONFIG[next].short}`, icon: ArrowRightCircle, onClick: () => onChangeStatus(p.id, next, p.fechaEntrega || '') },
                    ]} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
