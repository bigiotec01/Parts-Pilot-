import { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { ArrowLeft, ScrollText } from 'lucide-react';
import { db } from '../../firebase';
import { formatDate } from '../../utils/format';

const ACCION_LABELS = {
  crear_empresa: 'Creó la empresa',
  editar_empresa: 'Editó la empresa',
  cambiar_estado_empresa: 'Cambió el estado de la empresa',
  eliminar_empresa: 'Eliminó la empresa',
};

function detalleTexto(log) {
  const d = log.detalle || {};
  switch (log.accion) {
    case 'crear_empresa':
      return `${d.nombreEmpresa || d.tenantId} · admin ${d.emailAdmin || ''}`;
    case 'editar_empresa':
      return `${d.tenantId} → "${d.nombre}"`;
    case 'cambiar_estado_empresa':
      return `${d.tenantId} → ${d.estado === 'activa' ? 'Activa' : 'Suspendida'}`;
    case 'eliminar_empresa':
      return `${d.tenantId} · ${d.documentosEliminados ?? 0} documentos, ${d.cuentasAuthEliminadas ?? 0} cuentas`;
    default:
      return d.tenantId || '';
  }
}

export function AuditLogsView({ onExit }) {
  const [logs, setLogs] = useState(null);

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('ts', 'desc'), limit(100));
    const unsub = onSnapshot(q, (snap) => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.error('AuditLogsView:', err.code || err.message));
    return unsub;
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <header className="h-[70px] flex items-center gap-3 px-[30px] border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <button onClick={onExit} className="w-9 h-9 rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <ScrollText className="w-5 h-5" style={{ color: 'var(--pp-text)' }} />
        <div>
          <h1 className="text-[17px] font-bold" style={{ color: 'var(--pp-text)' }}>Logs de auditoría</h1>
          <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>Últimas 100 acciones del Super Admin</p>
        </div>
      </header>

      <div className="p-[30px] max-w-[900px]">
        {logs === null ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Cargando…</p>
        ) : logs.length === 0 ? (
          <p className="text-[13.5px]" style={{ color: 'var(--pp-text3)' }}>Todavía no hay acciones registradas.</p>
        ) : (
          <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
            {logs.map((log) => (
              <div key={log.id} className="px-5 py-3.5" style={{ borderBottom: '1px solid var(--pp-border2)' }}>
                <div className="flex items-center justify-between">
                  <p className="text-[13px] font-bold" style={{ color: 'var(--pp-text)' }}>
                    {ACCION_LABELS[log.accion] || log.accion}
                  </p>
                  <span className="text-[11px]" style={{ color: 'var(--pp-text3)' }}>{formatDate(log.ts)}</span>
                </div>
                <p className="text-[12px] mt-0.5" style={{ color: 'var(--pp-text2)' }}>{detalleTexto(log)}</p>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--pp-text4)' }}>{log.actorEmail || log.actorUid || 'desconocido'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
