import {
  CarFront, LogOut
} from 'lucide-react';

export function Header({ title, subtitle, userLabel, onLogout, maxWidth = 'max-w-6xl' }) {
  return (
    <header className="text-white safe-top" style={{ background: 'var(--pp-nav)' }}>
      <div className={`${maxWidth} mx-auto px-4 sm:px-6 py-4 flex items-center justify-between`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'var(--pp-accent)' }}>
            <CarFront className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <h1 className="font-bold text-base sm:text-lg leading-tight truncate">{title}</h1>
            <p className="text-xs truncate" style={{ color: 'var(--pp-text3)' }}>{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <span className="hidden sm:inline text-sm" style={{ color: 'var(--pp-text2)' }}>{userLabel}</span>
          <button onClick={onLogout} className="p-2 rounded-lg transition-colors hover:bg-[#1e1e1e]" style={{ background: 'var(--pp-card)' }} title="Cerrar sesión">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
