import { useEffect, useState } from 'react';
import { collection, getCountFromServer, onSnapshot, query, where } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { AlertTriangle, ArrowLeft, Building2, LogIn, LogOut, Plus, Trash2, X } from 'lucide-react';
import { db, functions } from '../../firebase';
import { inputClass } from '../../constants/styles';
import { formatDate } from '../../utils/format';
import { FormField } from '../shared/FormField';
import { TenantSupportView } from './TenantSupportView';

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

// TEMPORAL: muestra el resultado de diagnosticoTaller en un cuadro seleccionable/copiable.
function DiagnosticoModal({ texto, onClose }) {
  const [copiado, setCopiado] = useState(false);
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(texto);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 1500);
    } catch {
      // clipboard API no disponible: el usuario puede seleccionar el texto a mano
    }
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div className="w-full max-w-[600px] rounded-[18px] p-6 space-y-4" style={{ background: 'var(--pp-card)' }}>
        <div className="flex items-center justify-between">
          <h2 className="text-[15px] font-bold" style={{ color: 'var(--pp-text)' }}>Diagnóstico Garaje Morales</h2>
          <button type="button" onClick={onClose}><X className="w-4 h-4" style={{ color: 'var(--pp-text3)' }} /></button>
        </div>
        <textarea
          readOnly
          value={texto}
          onFocus={(e) => e.target.select()}
          className="w-full h-[320px] rounded-[10px] p-3 text-[11.5px] font-mono"
          style={{ background: 'var(--pp-bg)', color: 'var(--pp-text)', border: '1px solid var(--pp-border2)' }}
        />
        <button
          onClick={copiar}
          className="w-full py-[10px] rounded-[11px] text-white font-bold text-[13px]"
          style={{ background: 'var(--pp-accent)' }}
        >
          {copiado ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>
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

function EmpresaRow({ empresa: e, busy, onToggleEstado, onEliminar, onEntrar }) {
  const stats = useEmpresaStats(e.id);

  return (
    <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
      <div>
        <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>{e.nombre}</p>
        <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>
          {e.id}
          {e.createdAt && ` · creada ${formatDate(e.createdAt)}`}
          {stats && ` · ${stats.talleres} taller${stats.talleres === 1 ? '' : 'es'} · ${stats.pedidos} pedido${stats.pedidos === 1 ? '' : 's'}`}
        </p>
      </div>
      <div className="flex items-center gap-3">
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
        <button
          onClick={onToggleEstado}
          disabled={busy}
          className="text-[12.5px] font-semibold hover:underline disabled:opacity-50"
          style={{ color: 'var(--pp-text2)' }}
        >
          {e.estado === 'activa' ? 'Suspender' : 'Activar'}
        </button>
        {e.id !== 'mana-auto' && (
          <button
            onClick={onEliminar}
            className="w-8 h-8 rounded-[8px] flex items-center justify-center transition-colors hover:bg-red-900/20"
            style={{ color: '#ef4444' }}
            title="Eliminar permanentemente"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function SuperAdminApp({ onLogout, onExit }) {
  const [empresas, setEmpresas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [eliminarTarget, setEliminarTarget] = useState(null);
  const [soporteTarget, setSoporteTarget] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'empresas'), (snap) => {
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

  if (soporteTarget) {
    return <TenantSupportView empresa={soporteTarget} onExit={() => setSoporteTarget(null)} />;
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

  // TEMPORAL: diagnóstico de por qué Garaje Morales no ve sus pedidos/facturas.
  const [diagBusy, setDiagBusy] = useState(false);
  const [diagResultado, setDiagResultado] = useState(null);
  const correrDiagnostico = async () => {
    setDiagBusy(true);
    try {
      const fn = httpsCallable(functions, 'diagnosticoTaller');
      const { data } = await fn({ nombreTaller: 'Garaje Morales' });
      console.log('[diagnosticoTaller]', data);
      setDiagResultado(JSON.stringify(data, null, 2));
    } catch (err) {
      setDiagResultado(`ERROR: ${err.message}`);
    } finally {
      setDiagBusy(false);
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
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva empresa
          </button>
          <button onClick={correrDiagnostico} disabled={diagBusy} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold disabled:opacity-50" style={{ border: '1px solid var(--pp-border4)', color: 'var(--pp-text2)' }}>
            {diagBusy ? 'Diagnosticando…' : 'Diagnóstico Garaje Morales'}
          </button>
          <button onClick={onLogout} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-[30px] max-w-[980px]">
        {empresas.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay empresas registradas.</p>
        ) : (
          <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
            {empresas.map((e) => (
              <EmpresaRow
                key={e.id}
                empresa={e}
                busy={busyId === e.id}
                onToggleEstado={() => toggleEstado(e)}
                onEliminar={() => setEliminarTarget(e)}
                onEntrar={() => setSoporteTarget(e)}
              />
            ))}
          </div>
        )}
      </div>

      {showForm && <NuevaEmpresaModal onClose={() => setShowForm(false)} />}
      {eliminarTarget && <EliminarEmpresaModal empresa={eliminarTarget} onClose={() => setEliminarTarget(null)} />}
      {diagResultado && <DiagnosticoModal texto={diagResultado} onClose={() => setDiagResultado(null)} />}
    </div>
  );
}
