import { useState, useEffect } from 'react';
import { Sparkles } from 'lucide-react';
import { CHANGELOG } from '../../constants/changelog';
import { compareVersions } from '../../utils/changelog';
import { APP_VERSION } from '../../constants/app';

const STORAGE_KEY = 'pp_changelog_seen';

// Pop-up de "Novedades": se muestra una sola vez por versión, con lo que
// cambió desde la última vez que el usuario abrió la app (filtrado por rol).
export function WhatsNewModal({ role }) {
  const [pending, setPending] = useState(null);

  useEffect(() => {
    let lastSeen;
    try { lastSeen = localStorage.getItem(STORAGE_KEY); } catch { lastSeen = null; }

    // Primera vez que corre este mecanismo en este dispositivo: muestra el
    // historial reciente completo (es corto) en vez de empezar en blanco.
    const releases = !lastSeen
      ? CHANGELOG
      : compareVersions(lastSeen, APP_VERSION) >= 0
        ? []
        : CHANGELOG.filter(release => compareVersions(release.version, lastSeen) > 0);

    if (releases.length === 0) {
      if (!lastSeen) { try { localStorage.setItem(STORAGE_KEY, APP_VERSION); } catch {} }
      return;
    }

    const audiencias = role === 'admin' ? ['admin', 'all'] : ['taller', 'all'];
    const items = releases.flatMap(release => release.items.filter(i => audiencias.includes(i.audience)));

    if (items.length === 0) {
      try { localStorage.setItem(STORAGE_KEY, APP_VERSION); } catch {}
      return;
    }
    setPending(items);
  }, [role]);

  if (!pending) return null;

  const cerrar = () => {
    try { localStorage.setItem(STORAGE_KEY, APP_VERSION); } catch {}
    setPending(null);
  };

  return (
    <div className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'var(--pp-overlay)' }} onClick={cerrar}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-sm max-h-[85vh] overflow-y-auto" style={{ background: 'var(--pp-card)' }} onClick={e => e.stopPropagation()}>
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-[10px] flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(198,32,43,0.12)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#D42A38' }} />
            </div>
            <div>
              <h2 className="font-bold text-[15px]" style={{ color: 'var(--pp-text)' }}>Novedades</h2>
              <p className="text-[11.5px]" style={{ color: 'var(--pp-text3)' }}>Esto es lo nuevo desde tu última visita</p>
            </div>
          </div>
          <ul className="space-y-2.5">
            {pending.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-[13px]" style={{ color: 'var(--pp-text2)' }}>
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: '#D42A38' }} />
                {item.text}
              </li>
            ))}
          </ul>
          <button onClick={cerrar} className="w-full py-[11px] rounded-[11px] text-white font-bold text-[13px]" style={{ background: 'var(--pp-accent)' }}>
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
}
