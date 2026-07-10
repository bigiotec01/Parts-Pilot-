export function NavTabs({ tabs, active, onChange, maxWidth = 'max-w-6xl' }) {
  return (
    <nav className="sticky top-0 z-10 border-b" style={{ background: 'var(--pp-nav)', borderColor: 'var(--pp-border)' }}>
      <div className={`${maxWidth} mx-auto px-2 sm:px-4 flex gap-0 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]`}>
        {tabs.map(tab => {
          const Icon = tab.icon;
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChange(tab.id)}
              className={`relative flex items-center gap-1.5 px-3 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors`}
              style={{ borderBottomColor: isActive ? 'var(--pp-accent)' : 'transparent', color: isActive ? 'var(--pp-text)' : 'var(--pp-text2)' }}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.badge > 0 && (
                <span className="text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 leading-none" style={{ background: 'var(--pp-accent)' }}>{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
