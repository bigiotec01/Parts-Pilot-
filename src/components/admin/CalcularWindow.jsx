import { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { Calculator } from 'lucide-react';
import { inputClass } from '../../constants/styles';
import { fmtCur } from '../../utils/format';

const FACTOR_MARCA = { KIA: 0.45, NISSAN: 0.55 };
const FACTOR_COSTO = 1.01;

// Contenido de la calculadora, sin drag/posicionamiento flotante — aquí vive
// dentro de su propia ventana del sistema operativo, así que simplemente
// llena el body de esa ventana.
function CalcularWindowContent() {
  const [marca, setMarca] = useState('KIA');
  const [lista, setLista] = useState('');

  const { precio6, costo } = useMemo(() => {
    const listaNum = parseFloat(lista) || 0;
    const factor = FACTOR_MARCA[marca] || 0;
    const p6 = listaNum * factor;
    return { precio6: p6, costo: p6 * FACTOR_COSTO };
  }, [marca, lista]);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--pp-bg)', padding: '20px 18px' }}>
      <div className="flex items-center gap-1.5 mb-4">
        <Calculator className="w-4 h-4" style={{ color: 'var(--pp-text3)' }} />
        <span className="text-[11.5px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>Calcular</span>
      </div>

      <div className="space-y-3.5">
        <div>
          <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--pp-text2)' }}>Marca</p>
          <div className="flex items-center gap-1 rounded-[10px] border p-1" style={{ borderColor: 'var(--pp-border4)' }}>
            {Object.keys(FACTOR_MARCA).map((m) => (
              <button
                key={m}
                onClick={() => setMarca(m)}
                className="flex-1 px-3 py-1.5 rounded-[8px] text-[12.5px] font-semibold transition-colors"
                style={{
                  background: marca === m ? 'var(--pp-accent)' : 'transparent',
                  color: marca === m ? '#fff' : 'var(--pp-text2)',
                }}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[12px] font-semibold mb-1.5" style={{ color: 'var(--pp-text2)' }}>Lista</p>
          <input
            type="number"
            min="0"
            step="0.01"
            value={lista}
            onChange={(e) => setLista(e.target.value)}
            placeholder="0.00"
            className={inputClass}
            autoFocus
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div className="rounded-[12px] border px-3 py-2.5" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-input-bg)' }}>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text3)' }}>Precio 6</p>
            <p className="text-[17px] font-bold mt-0.5" style={{ color: 'var(--pp-text)' }}>{fmtCur(precio6)}</p>
          </div>
          <div className="rounded-[12px] border px-3 py-2.5" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-input-bg)' }}>
            <p className="text-[10.5px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text3)' }}>Costo</p>
            <p className="text-[17px] font-bold mt-0.5" style={{ color: 'var(--pp-text)' }}>{fmtCur(costo)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

let calcWin = null;
let calcRoot = null;
let watchInterval = null;

// Abre "Calcular" como una ventana REAL del sistema operativo (no un modal
// dentro de la app) para que, al minimizar Parts Pilot, esta ventana se quede
// visible y el usuario pueda seguir usándola junto a otros programas externos
// (calculadoras de terceros, hojas de cálculo, etc.) al mismo tiempo.
export function openCalcularWindow() {
  // Si ya hay una ventana abierta (y no la cerraron), solo la enfocamos en
  // vez de abrir una segunda.
  if (calcWin && !calcWin.closed) {
    calcWin.focus();
    return;
  }

  const win = window.open('', 'pp_calcular_window', 'width=380,height=600,resizable=yes');
  if (!win) {
    alert('El navegador bloqueó la ventana de "Calcular". Permite ventanas emergentes para Parts Pilot e inténtalo de nuevo.');
    return;
  }
  calcWin = win;

  const doc = win.document;
  doc.open();
  doc.write('<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>Calcular · Parts Pilot</title></head><body><div id="calc-root"></div></body></html>');
  doc.close();

  // Refleja el tema claro/oscuro activo (clase "light" en <html>) para que
  // las variables --pp-* usen la misma paleta que el resto de la app.
  doc.documentElement.className = document.documentElement.className;

  // window.open('', ...) nace sin ningún CSS — copiamos las hojas de estilo
  // (Tailwind compilado + fuentes de Google) del documento principal para que
  // esta ventana no se vea "cruda".
  document.querySelectorAll('link[rel="stylesheet"], style').forEach((el) => {
    if (el.tagName === 'LINK') {
      const link = doc.createElement('link');
      link.rel = 'stylesheet';
      link.href = el.href; // .href ya resuelve a URL absoluta, así que funciona sin <base>
      doc.head.appendChild(link);
    } else {
      doc.head.appendChild(el.cloneNode(true));
    }
  });

  doc.body.style.margin = '0';

  calcRoot = createRoot(doc.getElementById('calc-root'));
  calcRoot.render(<CalcularWindowContent />);

  // Si el usuario cierra la ventana con el botón nativo del sistema
  // operativo, limpiamos la referencia para que el próximo click en
  // "Calcular" abra una ventana nueva en vez de quedarse "pegado".
  if (watchInterval) clearInterval(watchInterval);
  watchInterval = setInterval(() => {
    if (win.closed) {
      clearInterval(watchInterval);
      watchInterval = null;
      calcWin = null;
      calcRoot = null;
    }
  }, 800);
}
