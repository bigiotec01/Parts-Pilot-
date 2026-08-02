import { useEffect, useMemo, useRef, useState } from 'react';
import { X, GripHorizontal } from 'lucide-react';
import { inputClass } from '../../constants/styles';
import { fmtCur } from '../../utils/format';

const FACTOR_MARCA = { KIA: 0.45, NISSAN: 0.55 };
const FACTOR_COSTO = 1.01;
const ANCHO = 320;

// Ventana flotante y arrastrable, no modal: se puede dejar abierta mientras se sigue
// usando el resto de la app, y solo se cierra con el botón X (igual que CalculadoraPopover).
export function CalcularModal({ onClose }) {
  const [marca, setMarca] = useState('KIA');
  const [lista, setLista] = useState('');
  const [pos, setPos] = useState(() => ({
    top: 80,
    left: Math.max(8, window.innerWidth - ANCHO - 24),
  }));
  const draggingRef = useRef(null);

  useEffect(() => {
    const puntero = (ev) => (ev.touches ? ev.touches[0] : ev);
    const onMove = (ev) => {
      if (!draggingRef.current) return;
      ev.preventDefault();
      const { offsetX, offsetY } = draggingRef.current;
      const { clientX, clientY } = puntero(ev);
      setPos({
        left: Math.min(Math.max(0, clientX - offsetX), window.innerWidth - ANCHO),
        top: Math.min(Math.max(0, clientY - offsetY), window.innerHeight - 60),
      });
    };
    const onUp = () => { draggingRef.current = null; };
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onUp);
    return () => {
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onUp);
    };
  }, []);

  const startDrag = (ev) => {
    const { clientX, clientY } = ev.touches ? ev.touches[0] : ev;
    draggingRef.current = { offsetX: clientX - pos.left, offsetY: clientY - pos.top };
  };

  const { precio6, costo } = useMemo(() => {
    const listaNum = parseFloat(lista) || 0;
    const factor = FACTOR_MARCA[marca] || 0;
    const p6 = listaNum * factor;
    return { precio6: p6, costo: p6 * FACTOR_COSTO };
  }, [marca, lista]);

  return (
    <div className="fixed w-[320px] rounded-[14px] border shadow-lg z-50 p-4" style={{ top: pos.top, left: pos.left, borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
      <div
        className="flex items-center justify-between mb-3 cursor-move select-none"
        style={{ touchAction: 'none' }}
        onMouseDown={startDrag}
        onTouchStart={startDrag}
      >
        <span className="flex items-center gap-1.5 text-[11.5px] font-bold uppercase" style={{ color: 'var(--pp-text3)', letterSpacing: '.05em' }}>
          <GripHorizontal className="w-3.5 h-3.5" /> Calcular
        </span>
        <button type="button" onClick={onClose} onMouseDown={ev => ev.stopPropagation()} style={{ color: 'var(--pp-text3)' }}><X className="w-3.5 h-3.5" /></button>
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
