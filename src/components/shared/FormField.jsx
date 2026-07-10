import {
  Package
} from 'lucide-react';

export function FormField({ label, children }) {
  return (
    <div>
      <label className="text-[12.5px] font-semibold block mb-1.5" style={{ color: 'var(--pp-text2)' }}>{label}</label>
      {children}
    </div>
  );
}

export function InfoItem({ label, value }) {
  return (
    <div className="rounded-[11px] p-3" style={{ background: 'var(--pp-card)' }}>
      <p className="text-[11px] mb-0.5" style={{ color: 'var(--pp-text3)' }}>{label}</p>
      <p className="text-[13.5px] font-semibold truncate" style={{ color: 'var(--pp-text)' }}>{value}</p>
    </div>
  );
}

export function EmptyState({ text }) {
  return (
    <div className="text-center py-14" style={{ color: 'var(--pp-text3)' }}>
      <Package className="w-10 h-10 mx-auto mb-2 opacity-50" />
      <p className="text-sm">{text}</p>
    </div>
  );
}
