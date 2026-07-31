import { useMemo, useState } from 'react';
import { ArrowLeft, Calculator } from 'lucide-react';
import { inputClass } from '../../constants/styles';
import { fmtCur } from '../../utils/format';

const FACTOR_MARCA = { KIA: 0.45, NISSAN: 0.55 };
const FACTOR_COSTO = 1.01;

export function CalcularView({ onExit }) {
  const [marca, setMarca] = useState('KIA');
  const [lista, setLista] = useState('');

  const { precio6, costo } = useMemo(() => {
    const listaNum = parseFloat(lista) || 0;
    const factor = FACTOR_MARCA[marca] || 0;
    const p6 = listaNum * factor;
    return { precio6: p6, costo: p6 * FACTOR_COSTO };
  }, [marca, lista]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <div className="safe-top" style={{ background: 'var(--pp-bg)' }}>
        <header className="h-[70px] flex items-center gap-3 px-[30px] border-b" style={{ borderColor: 'var(--pp-border2)' }}>
          <button onClick={onExit} className="w-9 h-9 rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
            <ArrowLeft className="w-4 h-4" />
          </button>
          <Calculator className="w-5 h-5" style={{ color: 'var(--pp-text)' }} />
          <div>
            <h1 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Calcular</h1>
            <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Precio y costo de piezas KIA / NISSAN</p>
          </div>
        </header>
      </div>

      <div className="p-[30px] max-w-[420px] space-y-5">
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
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-[14px] border px-4 py-3.5" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text3)' }}>Precio 6</p>
            <p className="text-[20px] font-bold mt-0.5" style={{ color: 'var(--pp-text)' }}>{fmtCur(precio6)}</p>
          </div>
          <div className="rounded-[14px] border px-4 py-3.5" style={{ borderColor: 'var(--pp-border2)', background: 'var(--pp-card)' }}>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--pp-text3)' }}>Costo</p>
            <p className="text-[20px] font-bold mt-0.5" style={{ color: 'var(--pp-text)' }}>{fmtCur(costo)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
