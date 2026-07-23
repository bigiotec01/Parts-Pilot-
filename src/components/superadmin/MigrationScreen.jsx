import { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { AlertCircle, CheckCircle2, LogOut } from 'lucide-react';
import { functions } from '../../firebase';

const ETIQUETAS = {
  admins: 'Equipo (admins)',
  talleres: 'Talleres',
  tallerUsuarios: 'Sub-usuarios de taller',
  pedidos: 'Pedidos / estimados',
  facturas: 'Facturas',
  facturaBackups: 'Backups de facturas',
  fcmTokens: 'Tokens de notificación',
  counterPedidosActual: 'Folio actual de pedidos',
};

export function MigrationScreen({ onLogout }) {
  const [reporte, setReporte] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [hecho, setHecho] = useState(false);

  const llamar = async (dryRun) => {
    setCargando(true);
    setError('');
    try {
      const fn = httpsCallable(functions, 'migrarManaAuto');
      const res = await fn({ dryRun });
      if (dryRun) {
        setReporte(res.data.reporte);
      } else {
        setHecho(true);
      }
    } catch (e) {
      setError(e.message || 'Error al ejecutar la migración.');
    } finally {
      setCargando(false);
    }
  };

  const confirmar = () => {
    const ok = window.confirm(
      'Esto va a modificar datos reales de producción: convierte a Mana Auto en el primer tenant del sistema. ¿Confirmas que quieres continuar?'
    );
    if (ok) llamar(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6" style={{ background: 'var(--pp-bg)' }}>
      <div className="w-full max-w-[480px] rounded-[18px] p-7 space-y-5" style={{ background: 'var(--pp-card)', boxShadow: '0 30px 60px -20px rgba(0,0,0,.5)' }}>
        <div>
          <h1 className="font-extrabold text-[20px]" style={{ color: 'var(--pp-text)' }}>Migración a multi-tenant</h1>
          <p className="mt-1.5 text-[13.5px]" style={{ color: 'var(--pp-text2)' }}>
            Tu cuenta todavía no tiene empresa (tenant) asignada. Esto pasa una sola vez:
            convierte los datos actuales en la primera empresa ("Mana Auto") y te vuelve Super Admin de la plataforma.
          </p>
        </div>

        {hecho ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm px-3 py-2.5 rounded-[11px]" style={{ background: 'rgba(16,185,129,0.12)', color: '#10b981' }}>
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              Migración completada. Recarga la página para continuar.
            </div>
            <button
              onClick={() => window.location.reload()}
              className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14.5px] transition-all hover:brightness-105"
              style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)' }}
            >
              Recargar
            </button>
          </div>
        ) : (
          <>
            {reporte && (
              <div className="rounded-[11px] p-4 space-y-1.5" style={{ background: 'var(--pp-bg)' }}>
                <p className="text-[12px] font-bold uppercase tracking-wide mb-2" style={{ color: 'var(--pp-text3)' }}>Vista previa (nada se modificó todavía)</p>
                {Object.entries(reporte).map(([key, val]) => (
                  <div key={key} className="flex justify-between text-[13.5px]">
                    <span style={{ color: 'var(--pp-text2)' }}>{ETIQUETAS[key] || key}</span>
                    <span className="font-semibold" style={{ color: 'var(--pp-text)' }}>{val}</span>
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 text-sm px-3 py-2 rounded-[11px]" style={{ background: '#fdecec', color: '#dc2626' }}>
                <AlertCircle className="w-4 h-4 flex-shrink-0" />{error}
              </div>
            )}

            <div className="space-y-2.5">
              <button
                onClick={() => llamar(true)}
                disabled={cargando}
                className="w-full py-[13px] rounded-[11px] font-bold text-[14.5px] transition-all disabled:opacity-50"
                style={{ background: 'var(--pp-bg)', color: 'var(--pp-text)', border: '1px solid #2a2a2a' }}
              >
                {cargando ? 'Cargando…' : 'Ver vista previa'}
              </button>
              <button
                onClick={confirmar}
                disabled={cargando || !reporte}
                className="w-full py-[13px] rounded-[11px] text-white font-bold text-[14.5px] transition-all hover:brightness-105 disabled:opacity-50"
                style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)' }}
              >
                Confirmar migración
              </button>
            </div>
          </>
        )}

        <button onClick={onLogout} className="w-full flex items-center justify-center gap-1.5 text-[12.5px] font-medium pt-1" style={{ color: 'var(--pp-text3)' }}>
          <LogOut className="w-3.5 h-3.5" /> Cerrar sesión
        </button>
      </div>
    </div>
  );
}
