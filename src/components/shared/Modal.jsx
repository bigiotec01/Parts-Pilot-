import {
  X
} from 'lucide-react';

export function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4" style={{ background: 'var(--pp-overlay)' }} onClick={onClose}>
      <div className="rounded-t-2xl sm:rounded-2xl w-full sm:max-w-3xl h-[92vh] sm:h-auto sm:max-h-[90vh] overflow-y-auto flex flex-col" style={{ background: 'var(--pp-card)' }} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center pt-3 pb-1 sm:hidden"><div className="w-10 h-1 rounded-full" style={{ background: 'var(--pp-surface)' }} /></div>
        <div className="flex items-center justify-between px-6 py-4 border-b sticky top-0 z-10" style={{ background: 'var(--pp-card)', borderColor: 'var(--pp-border2)' }}>
          <h2 className="font-mono tracking-wider text-sm truncate pr-4" style={{ color: 'var(--pp-text2)' }}>{title}</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg flex-shrink-0 hover:bg-[#1e1e1e]"><X className="w-5 h-5" style={{ color: 'var(--pp-text2)' }} /></button>
        </div>
        <div className="p-6 flex-1">{children}</div>
      </div>
    </div>
  );
}
