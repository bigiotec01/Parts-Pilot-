import {
  X, Bell
} from 'lucide-react';

export function NotifToast({ toast, onClose }) {
  return (
    <div
      style={{
        position: 'fixed', top: 16, right: 16, zIndex: 9999,
        maxWidth: 340, width: 'calc(100vw - 32px)',
        background: 'var(--pp-card)', border: '1px solid var(--pp-border)',
        borderRadius: 14, boxShadow: '0 8px 32px rgba(0,0,0,0.22)',
        display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px',
        animation: 'pp-slide-in 0.25s ease',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10, flexShrink: 0,
        background: 'linear-gradient(160deg, #f97316, #ea580c)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Bell className="w-5 h-5 text-white" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--pp-text1)', marginBottom: 2 }}>
          {toast.title}
        </p>
        {toast.body && (
          <p style={{ fontSize: 12, color: 'var(--pp-text3)', lineHeight: 1.4 }}>{toast.body}</p>
        )}
      </div>
      <button onClick={onClose} style={{ color: 'var(--pp-text4)', flexShrink: 0, paddingTop: 2 }}>
        <X className="w-4 h-4" />
      </button>
      <style>{`
        @keyframes pp-slide-in {
          from { opacity: 0; transform: translateY(-12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
