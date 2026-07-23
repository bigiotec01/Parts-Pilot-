import { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { Building2, LogOut, Plus, X } from 'lucide-react';
import { db, functions } from '../../firebase';
import { inputClass } from '../../constants/styles';
import { FormField } from '../shared/FormField';

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

export function SuperAdminApp({ onLogout }) {
  const [empresas, setEmpresas] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'empresas'), (snap) => {
      setEmpresas(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return unsub;
  }, []);

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
          <button onClick={() => setShowForm(true)} className="flex items-center gap-1.5 px-4 py-[9px] rounded-[10px] text-[13px] font-semibold text-white transition-colors hover:bg-[#707070]" style={{ background: 'var(--pp-accent)' }}>
            <Plus className="w-4 h-4" strokeWidth={2.2} /> Nueva empresa
          </button>
          <button onClick={onLogout} className="w-[38px] h-[38px] rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      <div className="p-[30px] max-w-[860px]">
        {empresas.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay empresas registradas.</p>
        ) : (
          <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
            {empresas.map((e) => (
              <div key={e.id} className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                <div>
                  <p className="text-[14px] font-bold" style={{ color: 'var(--pp-text)' }}>{e.nombre}</p>
                  <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>{e.id}</p>
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
                    onClick={() => toggleEstado(e)}
                    disabled={busyId === e.id}
                    className="text-[12.5px] font-semibold hover:underline disabled:opacity-50"
                    style={{ color: 'var(--pp-text2)' }}
                  >
                    {e.estado === 'activa' ? 'Suspender' : 'Activar'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && <NuevaEmpresaModal onClose={() => setShowForm(false)} />}
    </div>
  );
}
