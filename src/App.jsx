import { useState, useEffect, useRef } from 'react';
import { useAuth } from './useAuth';
import {
  usePedidos, useTalleres, crearPedido, crearCotizacion, cambiarEstatus, enviarEstimado,
  responderEstimado, enviarMensaje, eliminarMensaje, crearTaller, eliminarTaller, eliminarPedido,
  actualizarTaller, actualizarNotasInternas, actualizarReferencias, useFacturas, agregarFactura,
  actualizarFactura, eliminarFactura, archivarFactura, useAdminEquipo, crearAdminUsuario,
  actualizarPermisosAdmin, eliminarAdminUsuario, useTallerUsuarios, crearTallerUsuario,
  eliminarTallerUsuario, actualizarTallerUsuario, guardarFCMToken, eliminarFCMToken,
  useFacturaBackups, crearBackupFacturas, restaurarBackupFacturas, eliminarBackupFacturas
} from './firestore';
import { ThemeProvider } from './theme/ThemeContext';
import { LoginScreen } from './components/shared/LoginScreen';
import { NotifToast } from './components/shared/NotifToast';
import { AdminApp } from './components/admin/AdminApp';
import { ClientApp } from './components/client/ClientApp';
import { SuperAdminApp } from './components/superadmin/SuperAdminApp';
import { MigrationScreen } from './components/superadmin/MigrationScreen';

function AppContent() {
  const { user, perfil, cargando, error, login, logout, setError } = useAuth();
  const pedidos        = usePedidos(user);
  const talleres       = useTalleres(user);
  const facturas       = useFacturas(user);
  const equipo         = useAdminEquipo(user);
  const tallerUsuarios = useTallerUsuarios(user);
  const isSuperadmin   = user?.role === 'admin' && !perfil?.permisos;
  const backups        = useFacturaBackups(isSuperadmin);

  const [notifToast, setNotifToast] = useState(null);
  const notifTimerRef = useRef(null);

  useEffect(() => {
    if (!user) return;
    let unsub;
    (async () => {
      try {
        const { requestNotificationPermission, getFCMToken, listenForeground } = await import('./notifications');
        const granted = await requestNotificationPermission();
        if (!granted) return;
        const token = await getFCMToken();
        if (token) await guardarFCMToken(user.uid, token, user.role, user.tallerId || null);
        unsub = listenForeground((payload) => {
          setNotifToast({
            title: payload.notification?.title || 'Parts Pilot',
            body:  payload.notification?.body  || '',
          });
          clearTimeout(notifTimerRef.current);
          notifTimerRef.current = setTimeout(() => setNotifToast(null), 6000);
        });
      } catch (err) {
        console.error('[Notifications] init:', err);
      }
    })();
    return () => {
      unsub?.();
      clearTimeout(notifTimerRef.current);
    };
  }, [user?.uid]);

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--pp-bg)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl inline-flex items-center justify-center mb-4 animate-pulse" style={{ background: 'linear-gradient(160deg, #f97316, #ea580c)' }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2.5 21 19.5 12 15.2 3 19.5 12 2.5Z" fill="#fff"/></svg>
          </div>
          <p className="text-sm" style={{ color: 'var(--pp-text4)' }}>Cargando Parts Pilot…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <LoginScreen
        onLogin={(email, password) => login(email, password)}
        error={error}
      />
    );
  }

  if (user.role === 'superadmin') {
    return <SuperAdminApp onLogout={logout} />;
  }

  if (user.role === 'admin') {
    // Solo la cuenta original de Mana Auto ve la pantalla de migración (única vez, arranca el multi-tenant).
    // El resto del equipo sigue entrando a AdminApp exactamente igual que siempre mientras tanto.
    if (!perfil?.tenantId && (perfil?.email || '').toLowerCase() === 'bigio_tec@me.com') {
      return <MigrationScreen onLogout={logout} />;
    }
    return (
      <>
        {notifToast && <NotifToast toast={notifToast} onClose={() => setNotifToast(null)} />}
        <AdminApp
          pedidos={pedidos}
          talleres={talleres}
          facturas={facturas}
          equipo={equipo}
          tallerUsuarios={tallerUsuarios}
          perfil={perfil}
          currentUid={user.uid}
          onLogout={logout}
          onChangeStatus={(id, estado, fechaEntrega) => cambiarEstatus(id, estado, fechaEntrega)}
          onSendEstimate={(id, data) => enviarEstimado(id, data)}
          onCreateOrder={(data) => crearPedido({ ...data, tipo: 'pedido' })}
          onCreateCotizacion={(data) => crearCotizacion(data)}
          onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
          onDeleteMessage={(id, mensajes, index) => eliminarMensaje(id, mensajes, index)}
          onCreateTaller={(data) => crearTaller(data)}
          onDeleteTaller={(uid) => eliminarTaller(uid)}
          onDeleteOrder={async (id) => { await eliminarPedido(id); }}
          onUpdateTaller={(uid, data) => actualizarTaller(uid, data)}
          onUpdateNotes={(id, notas) => actualizarNotasInternas(id, notas)}
          onUpdateReferencias={(id, refs) => actualizarReferencias(id, refs)}
          onAgregarFactura={(data) => agregarFactura(data)}
          onActualizarFactura={(id, data) => actualizarFactura(id, data)}
          onEliminarFactura={(id) => eliminarFactura(id)}
          onCrearAdmin={(data) => crearAdminUsuario(data)}
          onActualizarAdmin={(uid, data) => actualizarPermisosAdmin(uid, data)}
          onEliminarAdmin={(uid) => eliminarAdminUsuario(uid)}
          onCrearSubUsuario={(tallerId, data) => crearTallerUsuario(tallerId, data)}
          onEliminarSubUsuario={(uid) => eliminarTallerUsuario(uid)}
          onActualizarSubUsuario={(uid, data) => actualizarTallerUsuario(uid, data)}
          backups={backups}
          onCrearBackup={() => crearBackupFacturas(facturas)}
          onRestaurarBackup={(backupId) => restaurarBackupFacturas(backupId)}
          onEliminarBackup={(backupId) => eliminarBackupFacturas(backupId)}
        />
      </>
    );
  }

  const isSubUser = !!(user.tallerId && user.tallerId !== user.uid);
  const mainTaller = talleres.find(t => t.uid === (user.tallerId || user.uid));
  const taller = mainTaller || { nombre: perfil?.nombre, contacto: perfil?.contacto, uid: user.tallerId || user.uid };

  return (
    <>
      {notifToast && <NotifToast toast={notifToast} onClose={() => setNotifToast(null)} />}
      <ClientApp
        taller={{ ...taller, id: user.uid, tallerId: user.tallerId || user.uid, isSubUser,
          contacto: isSubUser ? (perfil?.contacto || taller.contacto) : taller.contacto }}
        pedidos={pedidos}
        facturas={facturas}
        onLogout={logout}
        onCreateOrder={(data) => crearPedido({ ...data, tallerId: user.tallerId || user.uid, tipo: 'solicitud' })}
        onRespondEstimate={(id, respuesta) => responderEstimado(id, respuesta)}
        onSendMessage={(id, texto, from, attachment) => enviarMensaje(id, texto, from, attachment)}
        onUpdateTaller={(uid, data) => actualizarTaller(uid, data)}
        onUpdateSubUsuario={(uid, data) => actualizarTallerUsuario(uid, data)}
      />
    </>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
