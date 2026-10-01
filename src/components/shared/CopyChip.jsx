import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

// Muestra un valor (ej. "PO# 1234") y lo copia al portapapeles con un clic.
// Detiene la propagación para poder usarse dentro de filas/tarjetas clicables
// sin abrir el pedido al copiar.
export function CopyChip({ label, value, size = 'md' }) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = (e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(String(value)).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const sm = size === 'sm';
  return (
    <button
      type="button"
      onClick={handleCopy}
      onKeyDown={(e) => e.stopPropagation()}
      title={`Copiar ${value}`}
      className={`inline-flex items-center gap-1 rounded-md font-semibold border transition-colors hover:border-[#C6202B] flex-shrink-0 max-w-full ${sm ? 'text-[11px] px-1.5 py-0.5' : 'text-[12.5px] px-2 py-1'}`}
      style={{
        background: copied ? 'rgba(16,185,129,0.12)' : 'rgba(180,180,180,0.08)',
        borderColor: copied ? 'rgba(16,185,129,0.45)' : 'rgba(180,180,180,0.22)',
        color: copied ? '#059669' : 'var(--pp-text)',
      }}
    >
      <span className="truncate">{label ? `${label} ${value}` : value}</span>
      {copied ? <Check className={sm ? 'w-3 h-3' : 'w-3.5 h-3.5'} /> : <Copy className={`${sm ? 'w-3 h-3' : 'w-3.5 h-3.5'} opacity-60`} />}
    </button>
  );
}
