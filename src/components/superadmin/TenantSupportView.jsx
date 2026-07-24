import { useEffect, useMemo, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { ArrowLeft, ChevronDown, ChevronsUpDown, ChevronUp, Eye, Receipt, Users, Wrench } from 'lucide-react';
import { db } from '../../firebase';
import { formatDate } from '../../utils/format';
import { StatusBadge } from '../shared/StatusBadge';

const toMs = f => f?.toDate ? f.toDate().getTime() : new Date(f).getTime();

function SortTh({ label, campo, sortBy, sortDir, onSort, className }) {
  const activo = sortBy === campo;
  return (
    <th
      onClick={() => onSort(campo)}
      className={`text-left py-2 font-medium cursor-pointer select-none ${className || 'px-3'}`}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {activo
          ? (sortDir === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)
          : <ChevronsUpDown className="w-3 h-3 opacity-30" />}
      </span>
    </th>
  );
}

function useTenantCollection(tenantId, name) {
  const [docs, setDocs] = useState([]);
  useEffect(() => {
    if (!tenantId) return;
    const unsub = onSnapshot(
      query(collection(db, name), where('tenantId', '==', tenantId)),
      (snap) => setDocs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => console.error(`TenantSupportView ${name}:`, err.code)
    );
    return unsub;
  }, [tenantId, name]);
  return docs;
}

function Section({ icon: Icon, title, count, children }) {
  return (
    <div className="rounded-[16px] border overflow-hidden" style={{ borderColor: 'var(--pp-border2)' }}>
      <div className="flex items-center gap-2 px-5 py-3.5" style={{ background: 'var(--pp-surface)' }}>
        <Icon className="w-4 h-4" style={{ color: 'var(--pp-text2)' }} />
        <span className="text-[13px] font-bold" style={{ color: 'var(--pp-text)' }}>{title}</span>
        <span className="ml-auto text-[11.5px] font-semibold" style={{ color: 'var(--pp-text3)' }}>{count}</span>
      </div>
      {children}
    </div>
  );
}

export function TenantSupportView({ empresa, onExit }) {
  const talleres = useTenantCollection(empresa.id, 'talleres');
  const pedidos = useTenantCollection(empresa.id, 'pedidos');
  const facturas = useTenantCollection(empresa.id, 'facturas');
  const equipo = useTenantCollection(empresa.id, 'admins');

  const [sortBy, setSortBy] = useState('fecha');
  const [sortDir, setSortDir] = useState('desc');

  const getTaller = (id) => talleres.find(t => t.uid === id);

  const onSort = (campo) => {
    if (sortBy === campo) setSortDir(d => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(campo); setSortDir('asc'); }
  };

  const pedidosRecientes = useMemo(() => {
    // Los 25 más recientes primero, y sobre esos se aplica el orden elegido en el header.
    const recientes = [...pedidos].sort((a, b) => toMs(b.fecha) - toMs(a.fecha)).slice(0, 25);
    const valorDe = (p) => {
      switch (sortBy) {
        case 'folio':    return p.folio || p.id;
        case 'taller':   return getTaller(p.tallerId)?.nombre || '';
        case 'vehiculo': return p.vehiculo || '';
        case 'estado':   return p.estado || '';
        case 'fecha':    return toMs(p.fecha);
        default:         return '';
      }
    };
    const dir = sortDir === 'asc' ? 1 : -1;
    return recientes.sort((a, b) => {
      const va = valorDe(a), vb = valorDe(b);
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb), 'es') * dir;
    });
  }, [pedidos, talleres, sortBy, sortDir]);

  return (
    <div className="min-h-screen" style={{ background: 'var(--pp-bg)' }}>
      <header className="h-[70px] flex items-center gap-3 px-[30px] border-b" style={{ borderColor: 'var(--pp-border2)' }}>
        <button onClick={onExit} className="w-9 h-9 rounded-[10px] flex items-center justify-center border" style={{ borderColor: 'var(--pp-border4)', color: 'var(--pp-text2)' }}>
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[17px] font-bold flex items-center gap-2" style={{ color: 'var(--pp-text)' }}>
            {empresa.nombre}
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
              <Eye className="w-3 h-3" /> Modo soporte · solo lectura
            </span>
          </h1>
          <p className="text-[12px]" style={{ color: 'var(--pp-text2)' }}>{empresa.id}</p>
        </div>
      </header>

      <div className="p-[30px] max-w-[1000px] space-y-5">
        <Section icon={Wrench} title="Talleres" count={talleres.length}>
          {talleres.length === 0 ? (
            <p className="px-5 py-6 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin talleres registrados.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--pp-border2)' }}>
              {talleres.map(t => (
                <div key={t.uid} className="flex items-center justify-between px-5 py-2.5" style={{ borderColor: 'var(--pp-border2)' }}>
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{t.nombre}</span>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>{t.contacto || t.telefono || '—'}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Receipt} title="Pedidos recientes" count={pedidos.length}>
          {pedidosRecientes.length === 0 ? (
            <p className="px-5 py-6 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin pedidos todavía.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-wider" style={{ color: 'var(--pp-text4)' }}>
                    <SortTh label="Folio" campo="folio" sortBy={sortBy} sortDir={sortDir} onSort={onSort} className="px-5" />
                    <SortTh label="Taller" campo="taller" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Vehículo" campo="vehiculo" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Estado" campo="estado" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                    <SortTh label="Fecha" campo="fecha" sortBy={sortBy} sortDir={sortDir} onSort={onSort} />
                  </tr>
                </thead>
                <tbody>
                  {pedidosRecientes.map(p => (
                    <tr key={p.id} style={{ borderTop: '1px solid var(--pp-border2)' }}>
                      <td className="px-5 py-2 font-mono" style={{ color: 'var(--pp-text2)' }}>{p.folio || p.id.slice(0, 8)}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--pp-text2)' }}>{getTaller(p.tallerId)?.nombre || '—'}</td>
                      <td className="px-3 py-2" style={{ color: 'var(--pp-text2)' }}>{p.vehiculo || '—'}</td>
                      <td className="px-3 py-2"><StatusBadge estado={p.estado} /></td>
                      <td className="px-3 py-2 whitespace-nowrap" style={{ color: 'var(--pp-text3)' }}>{formatDate(p.fecha)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section icon={Users} title="Equipo" count={equipo.length}>
          {equipo.length === 0 ? (
            <p className="px-5 py-6 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin miembros de equipo.</p>
          ) : (
            <div className="divide-y" style={{ borderColor: 'var(--pp-border2)' }}>
              {equipo.map(m => (
                <div key={m.uid} className="flex items-center justify-between px-5 py-2.5">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--pp-text)' }}>{m.nombre}</span>
                  <span className="text-[12px]" style={{ color: 'var(--pp-text3)' }}>{m.email} · {m.rol === 'admin' ? 'Administrador' : 'Miembro'}</span>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section icon={Receipt} title="Facturas" count={facturas.length}>
          {facturas.length === 0 && (
            <p className="px-5 py-6 text-[13px]" style={{ color: 'var(--pp-text3)' }}>Sin facturas registradas.</p>
          )}
        </Section>
      </div>
    </div>
  );
}
