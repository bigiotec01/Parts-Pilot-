import { useEffect, useMemo, useRef, useState } from 'react';
import { collection, count, getAggregateFromServer, getCountFromServer, onSnapshot, query, sum, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import {
  AlertTriangle, ArrowLeft, Building2, LogIn, LogOut, MoreVertical, Pencil,
  Plus, Power, ScrollText, Search, Trash2, X,
} from 'lucide-react';
import { db, functions } from '../../firebase';
import { inputClass } from '../../constants/styles';
import { formatDate, fmtCur } from '../../utils/format';
import { FormField } from '../shared/FormField';
import { TenantSupportView } from './TenantSupportView';
import { AuditLogsView } from './AuditLogsView';

function NuevaEmpresaModal({ onClose }) {
  const [form, setForm] = useState({ nombreEmpresa: '', nombreAdmin: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const fn = httpsCallable(functions, 'crearEmpresa');
      await fn(form);
      onClose();
    } catch (err) {
      setError(err.message || 'Error al crear la empresa.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-[18px] p-6 space-y-4" style={{ background: 'var(--pp-card)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Nueva empresa</h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--pp-text3)' }} /></button>
        </div>
        <FormField label="Nombre de la empresa">
          <input required value={form.nombreEmpresa} onChange={e => setForm({ ...form, nombreEmpresa: e.target.value })} className={inputClass} placeholder="Dealer Hyundai" />
        </FormField>
        <FormField label="Nombre del administrador principal">
          <input required value={form.nombreAdmin} onChange={e => setForm({ ...form, nombreAdmin: e.target.value })} className={inputClass} placeholder="Edwin Pérez" />
        </FormField>
        <FormField label="Email del administrador">
          <input required type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className={inputClass} />
        </FormField>
        <FormField label="Contraseña temporal">
          <input required type="text" minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} className={inputClass} placeholder="mínimo 6 caracteres" />
        </FormField>
        {error && <p className="text-[12.5px]" style={{ color: '#dc2626' }}>{error}</p>}
        <button disabled={guardando} type="submit" className="w-full py-[12px] rounded-[11px] text-white font-bold text-[14px] transition-all hover:brightness-105 disabled:opacity-50" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)' }}>
          {guardando ? 'Creando…' : 'Crear empresa'}
        </button>
      </form>
    </div>
  );
}

function EditarEmpresaModal({ empresa, onClose }) {
  const [nombre, setNombre] = useState(empresa.nombre || '');
  const [error, setError] = useState('');
  const [guardando, setGuardando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setGuardando(true);
    try {
      const fn = httpsCallable(functions, 'actualizarEmpresa');
      await fn({ tenantId: empresa.id, nombre });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al editar la empresa.');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form onSubmit={submit} className="w-full max-w-[420px] rounded-[18px] p-6 space-y-4" style={{ background: 'var(--pp-card)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Editar empresa</h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--pp-text3)' }} /></button>
        </div>
        <FormField label="Nombre de la empresa">
          <input required value={nombre} onChange={e => setNombre(e.target.value)} className={inputClass} />
        </FormField>
        {error && <p className="text-[12.5px]" style={{ color: '#dc2626' }}>{error}</p>}
        <button disabled={guardando} type="submit" className="w-full py-[12px] rounded-[11px] text-white font-bold text-[14px] transition-all hover:brightness-105 disabled:opacity-50" style={{ background: 'var(--pp-accent)' }}>
          {guardando ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </form>
    </div>
  );
}

function EliminarEmpresaModal({ empresa, onClose }) {
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [borrando, setBorrando] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBorrando(true);
    try {
      const fn = httpsCallable(functions, 'eliminarEmpresaPermanente');
      await fn({ tenantId: empresa.id, confirmar: confirmText.trim() });
      onClose();
    } catch (err) {
      setError(err.message || 'Error al eliminar la empresa.');
    } finally {
      setBorrando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <form onSubmit={submit} className="w-full max-w-[440px] rounded-[18px] p-6 space-y-4" style={{ background: 'var(--pp-card)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold flex items-center gap-2" style={{ color: '#ef4444' }}>
            <AlertTriangle className="w-5 h-5" /> Eliminar {empresa.nombre}
          </h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--pp-text3)' }} /></button>
        </div>
        <p className="text-[13px]" style={{ color: 'var(--pp-text2)' }}>
          Esto borra <strong>permanentemente</strong> las cuentas y todos los datos de esta empresa
          (equipo, talleres, pedidos, facturas). No se puede deshacer.
        </p>
        <FormField label={`Escribe "${empresa.id}" para confirmar`}>
          <input required value={confirmText} onChange={e => setConfirmText(e.target.value)} className={inputClass} placeholder={empresa.id} />
        </FormField>
        {error && <p className="text-[12.5px]" style={{ color: '#dc2626' }}>{error}</p>}
        <button
          disabled={borrando || confirmText.trim() !== empresa.id}
          type="submit"
          className="w-full py-[12px] rounded-[11px] text-white font-bold text-[14px] transition-all disabled:opacity-50"
          style={{ background: '#dc2626' }}
        >
          {borrando ? 'Eliminando…' : 'Eliminar permanentemente'}
        </button>
      </form>
    </div>
  );
}

// KPIs globales de toda la plataforma — una lectura puntual (no en vivo) al entrar al panel.
function useGlobalStats() {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        const [talleresSnap, pedidosSnap, facturasAgg] = await Promise.all([
          getCountFromServer(collection(db, 'talleres')),
          getCountFromServer(collection(db, 'pedidos')),
          getAggregateFromServer(collection(db, 'facturas'), { total: count(), valor: sum('valor') }),
        ]);
        if (!cancelado) {
          setStats({
            talleres: talleresSnap.data().count,
            pedidos: pedidosSnap.data().count,
            facturas: facturasAgg.data().total,
            facturado: facturasAgg.data().valor || 0,
          });
        }
      } catch (err) {
        console.error('useGlobalStats:', err.code || err.message);
      }
    })();
    return () => { cancelado = true; };
  }, []);
  return stats;
}

function KpiCard({ label, value }) {
  return (
    <div className="rounded-[14px] border px-4 py-3.5" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
      <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text3)' }}>{label}</p>
      <p className="text-[20px] font-bold mt-0.5" style={{ color: 'var(--pp-text)' }}>{value}</p>
    </div>
  );
}

function KpiBar({ empresas }) {
  const stats = useGlobalStats();
  const activas = empresas.filter(e => e.estado === 'activa').length;
  const suspendidas = empresas.length - activas;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
      <KpiCard label="Empresas activas" value={activas} />
      <KpiCard label="Suspendidas" value={suspendidas} />
      <KpiCard label="Talleres" value={stats ? stats.talleres : '…'} />
      <KpiCard label="Pedidos" value={stats ? stats.pedidos : '…'} />
      <KpiCard label="Facturas" value={stats ? stats.facturas : '…'} />
      <KpiCard label="Facturado" value={stats ? fmtCur(stats.facturado) : '…'} />
    </div>
  );
}

// Talleres y pedidos activos de una empresa — conteo puntual (no en vivo), solo para el listado.
function useEmpresaStats(tenantId) {
  const [stats, setStats] = useState(null);
  useEffect(() => {
    let cancelado = false;
    (async () => {
      try {
        // Solo filtros de un campo (tenantId) para no depender de índices compuestos manuales.
        const [talleresSnap, pedidosSnap] = await Promise.all([
          getCountFromServer(query(collection(db, 'talleres'), where('tenantId', '==', tenantId))),
          getCountFromServer(query(collection(db, 'pedidos'), where('tenantId', '==', tenantId))),
        ]);
        if (!cancelado) setStats({ talleres: talleresSnap.data().count, pedidos: pedidosSnap.data().count });
      } catch (err) {
        console.error('useEmpresaStats:', err.code || err.message);
      }
    })();
    return () => { cancelado = true; };
  }, [tenantId]);
  return stats;
}

function AccionesMenu({ empresa: e, busy, onEditar, onToggleEstado, onEliminar }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClickFuera = (ev) => { if (ref.current && !ref.current.contains(ev.target)) setOpen(false); };
    document.addEventListener('mousedown', onClickFuera);
    return () => document.removeEventListener('mousedown', onClickFuera);
  }, [open]);

  const item = (icon, label, onClick, color) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onClick(); }}
      className="w-full flex items-center gap-2 px-3.5 py-2.5 text-[12.5px] font-semibold text-left hover:bg-black/5 dark:hover:bg-white/5"
      style={{ color: color || 'var(--pp-text2)' }}
    >
      {icon} {label}
    </button>
  );

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(o => !o)}
        disabled={busy}
        className="w-8 h-8 rounded-[8px] flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 disabled:opacity-50"
        style={{ color: 'var(--pp-text2)' }}
        title="Acciones"
      >
        <MoreVertical className="w-4 h-4" />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-[190px] rounded-[10px] border shadow-lg z-10 overflow-hidden" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
          {item(<Pencil className="w-3.5 h-3.5" />, 'Editar', onEditar)}
          {item(<Power className="w-3.5 h-3.5" />, e.estado === 'activa' ? 'Suspender' : 'Activar', onToggleEstado)}
          {e.id !== 'mana-auto' && item(<Trash2 className="w-3.5 h-3.5" />, 'Eliminar', onEliminar, '#ef4444')}
        </div>
      )}
    </div>
  );
}

function EmpresaRow({ empresa: e, busy, onToggleEstado, onEliminar, onEntrar, onEditar }) {
  const stats = useEmpresaStats(e.id);

  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
      <div className="min-w-0">
        <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>{e.nombre}</p>
        <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>
          {e.id}
          {e.createdAt && ` · creada ${formatDate(e.createdAt)}`}
          {stats && ` · ${stats.talleres} taller${stats.talleres === 1 ? '' : 'es'} · ${stats.pedidos} pedido${stats.pedidos === 1 ? '' : 's'}`}
        </p>
        {(e.nombreAdminPrincipal || e.emailAdminPrincipal) && (
          <p className="text-[11.5px] mt-0.5" style={{ color: 'var(--pp-text4)' }}>
            {e.nombreAdminPrincipal}{e.nombreAdminPrincipal && e.emailAdminPrincipal ? ' · ' : ''}{e.emailAdminPrincipal}
          </p>
        )}
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <span
          className="text-[11.5px] font-bold px-2.5 py-1 rounded-full"
          style={{
            background: e.estado === 'activa' ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.10)',
            color: e.estado === 'activa' ? '#10b981' : '#ef4444',
          }}
        >
          {e.estado === 'activa' ? 'Activa' : 'Suspendida'}
        </span>
        <button
          onClick={onEntrar}
          className="flex items-center gap-1.5 text-[12.5px] font-semibold hover:underline"
          style={{ color: 'var(--pp-text6)' }}
        >
          <LogIn className="w-3.5 h-3.5" /> Entrar
        </button>
        <AccionesMenu empresa={e} busy={busy} onEditar={onEditar} onToggleEstado={onToggleEstado} onEliminar={onEliminar} />
      </div>
    </div>
  );
}

const FILTROS = [
  { val: 'todas', label: 'Todas' },
  { val: 'activa', label: 'Activas' },
  { val: 'suspendida', label: 'Suspendidas' },
];

export function SuperAdminApp({ onLogout, onExit }) {
  const [empresas, setEmpresas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [eliminarTarget, setEliminarTarget] = useState(null);
  const [editarTarget, setEditarTarget] = useState(null);
  const [soporteTarget, setSoporteTarget] = useState(null);
  const [showLogs, setShowLogs] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'empresas'), (snap) => {
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  const empresasFiltradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return empresas.filter((e) => {
      if (filtroEstado !== 'todas' && e.estado !== filtroEstado) return false;
      if (!q) return true;
      return e.nombre?.toLowerCase().includes(q) || e.id.toLowerCase().includes(q);
    });
  }, [empresas, busqueda, filtroEstado]);

  if (soporteTarget) {
    return <TenantSupportView empresa={soporteTarget} onExit={() => setSoporteTarget(null)} />;
  }

  if (showLogs) {
    return <AuditLogsView onExit={() => setShowLogs(false)} />;
  }

  const toggleEstado = async (empresa) => {
    setBusyId(empresa.id);
    try {
      const fn = httpsCallable(functions, 'actualizarEstadoEmpresa');
      await fn({ tenantId: empresa.id, estado: empresa.estado === 'activa' ? 'suspendida' : 'activa' });
    } catch (err) {
      alert(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <header className="h-[70px] flex items-center gap-3 px-[30px] border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <Building2 className="w-5 h-5" style={{ color: 'var(--pp-text)' }} />
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Empresas</h1>
          <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Panel de Super Admin</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          {onExit && (
            <button onClick={onExit} className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[13px] font-semibold" style={{ color: 'var(--pp-text2)' }}>
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
          )}
          <button onClick={() => setShowLogs(true)} className="flex items-center gap-1.5 px-3.5 py-[9px] rounded-[10px] text-[13px] font-semibold border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
            <ScrollText className="w-4 h-4" /> Logs
          </button>
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva empresa
          </button>
          <button onClick={onLogout} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-[30px] max-w-[980px]">
        <KpiBar empresas={empresas} />

        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1 max-w-[320px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--pp-text3)' }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar por nombre o id…"
              className={`${inputClass} pl-9`}
            />
          </div>
          <div className="flex items-center gap-1 rounded-[10px] border p-1" style={{ borderColor: 'var(--pp-border4)' }}>
            {FILTROS.map(f => (
              <button
                key={f.val}
                onClick={() => setFiltroEstado(f.val)}
                className="px-3 py-1.5 rounded-[8px] text-[12px] font-semibold transition-colors"
                style={{
                  background: filtroEstado === f.val ? 'var(--pp-accent)' : 'transparent',
                  color: filtroEstado === f.val ? '#fff' : 'var(--pp-text2)',
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {empresas.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay empresas registradas.</p>
        ) : empresasFiltradas.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Ninguna empresa coincide con la búsqueda.</p>
        ) : (
          <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
            {empresasFiltradas.map((e) => (
              <EmpresaRow
                key={e.id}
                empresa={e}
                busy={busyId === e.id}
                onToggleEstado={() => toggleEstado(e)}
                onEliminar={() => setEliminarTarget(e)}
                onEntrar={() => setSoporteTarget(e)}
                onEditar={() => setEditarTarget(e)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && <NuevaEmpresaModal onClose={() => setShowForm(false)} />}
      {editarTarget && <EditarEmpresaModal empresa={editarTarget} onClose={() => setEditarTarget(null)} />}
      {eliminarTarget && <EliminarEmpresaModal empresa={eliminarTarget} onClose={() => setEliminarTarget(null)} />}
    </div>
  );
}
