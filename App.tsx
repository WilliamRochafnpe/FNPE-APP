
import React, { useState, useEffect, createContext, useContext, useRef } from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { loadDB, saveDB, ADMIN_EMAIL, ensureAdminUser } from './db';
import { DB, User } from './types';
import { supabase, SUPABASE_ENABLED } from './lib/supabase';
import { auth as authProvider, IS_SUPABASE } from './services/auth';
import { syncDatabase } from './services/auth/supabaseAuth';

import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Events from './pages/Events';
import EventDetails from './pages/EventDetails';
import Rankings from './pages/Rankings';
import RankingEstado from './pages/RankingEstado';
import Athletes from './pages/Athletes';
import Admin from './pages/Admin';
import AdminDashboard from './pages/AdminDashboard';
import AdminCommunication from './pages/AdminCommunication';
import AdminCertificationRequests from './pages/AdminCertificationRequests';
import AdminMessaging from './pages/AdminMessaging';
import AdminFinanceiro from './pages/AdminFinanceiro';
import AdminBranding from './pages/AdminBranding';
import IdNortePage from './pages/IdNorte';
import ConsultarIdNorte from './pages/ConsultarIdNorte';
import Profile from './pages/Profile';
import CertificationRequestForm from './pages/CertificationRequestForm';
import AppMap from './pages/AppMap';
import UserMessages from './pages/UserMessages';
import RegionalStats from './pages/RegionalStats';
import Partners from './pages/Partners';
import AuthCompleteProfile from './pages/AuthCompleteProfile';
import Layout from './components/Layout';
import OnlineEvents from './pages/OnlineEvents';
import OnlineEventDetails from './pages/OnlineEventDetails';
import OnlineRankings from './pages/OnlineRankings';
import OnlineRankingEstado from './pages/OnlineRankingEstado';

interface AppContextType {
  db: DB;
  setDb: React.Dispatch<React.SetStateAction<DB>>;
  user: User | null;
  setUser: (u: User | null) => void;
  logout: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used within AppProvider");
  return context;
};

const App: React.FC = () => {
  const [db, setDb] = useState<DB>(() => loadDB());
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dbRef = useRef(db);
  useEffect(() => { dbRef.current = db; }, [db]);

  const syncFullStateFromCloud = async () => {
    if (!SUPABASE_ENABLED) return;
    try {
      const cloudData = await syncDatabase.fetchAll();
      setDb(cloudData);
    } catch (err) {
      console.error("Erro ao sincronizar nuvem:", err);
    }
  };

  const syncUserSession = async (sessionEmail: string, sessionUserId: string) => {
    try {
      const profile = await authProvider.findUserByEmail(dbRef.current, sessionEmail);
      if (profile) {
        handleSetUser(profile);
      } else {
        handleSetUser({
          id: sessionUserId, email: sessionEmail, nome_completo: '', cpf: '', cidade: '', uf: '',
          nivel: sessionEmail.toLowerCase() === ADMIN_EMAIL.toLowerCase() ? 'ADMIN' : 'PESCADOR',
          id_norte_status: 'NAO_SOLICITADO'
        } as User);
      }
      await syncFullStateFromCloud();
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    // Safety timeout to prevent infinite loading
    const safetyTimer = setTimeout(() => {
      console.warn("Safety timeout triggers: forcing app initialization completion.");
      setInitializing(false);
    }, 7000);

    const initializeAuth = async () => {
      try {
        if (IS_SUPABASE) {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user?.email) await syncUserSession(session.user.email, session.user.id);
        } else {
          const saved = sessionStorage.getItem('fnpe_session');
          if (saved) try { setUser(JSON.parse(saved)); } catch (e) { console.error(e); }
        }
      } catch (err) {
        console.error("Initialization error:", err);
      } finally {
        clearTimeout(safetyTimer);
        setInitializing(false);
      }
    };
    initializeAuth();

    if (IS_SUPABASE) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
        if ((event === 'SIGNED_IN' || event === 'INITIAL_SESSION') && session?.user?.email) {
          await syncUserSession(session.user.email, session.user.id);
        } else if (event === 'SIGNED_OUT') setUser(null);
      });
      return () => subscription.unsubscribe();
    }
  }, []);

  useEffect(() => {
    if (!IS_SUPABASE) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        const updatedDb = ensureAdminUser(db);
        saveDB(updatedDb);
      }, 2000);
    }
    return () => { if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current); };
  }, [db]);

  const handleSetUser = (u: User | null) => {
    let finalUser = u;
    if (finalUser?.email?.toLowerCase() === ADMIN_EMAIL.toLowerCase()) {
      finalUser = { ...finalUser, nivel: 'ADMIN' };
    }
    setUser(finalUser);
    if (!IS_SUPABASE) {
      if (finalUser) sessionStorage.setItem('fnpe_session', JSON.stringify(finalUser));
      else sessionStorage.removeItem('fnpe_session');
    }
  };

  const logout = async () => {
    try {
      if (IS_SUPABASE) await supabase.auth.signOut();
      handleSetUser(null);
    } catch (err) { handleSetUser(null); }
  };

  if (initializing) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-6">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] animate-pulse">Sincronizando Banco...</p>
      </div>
    );
  }

  return (
    <AppContext.Provider value={{ db, setDb, user, setUser: handleSetUser, logout }}>
      <HashRouter>
        <Routes>
          <Route path="/login" element={user?.nome_completo ? <Navigate to="/app" replace /> : <Login />} />
          <Route path="/login/perfil" element={user ? <AuthCompleteProfile /> : <Navigate to="/login" replace />} />
          <Route path="/app/*" element={user ? <AppRoutes /> : <Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to={user ? "/app" : "/login"} replace />} />
        </Routes>
      </HashRouter>
    </AppContext.Provider>
  );
};

const AppRoutes = () => {
  const { user } = useApp();
  if (user && (!user.nome_completo || !user.cpf)) return <Navigate to="/login/perfil" replace />;
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/eventos" element={<Events />} />
        <Route path="/eventos/:id" element={<EventDetails />} />
        <Route path="/solicitar-certificacao" element={<CertificationRequestForm />} />
        <Route path="/ranking-estadual" element={<Rankings />} />
        <Route path="/ranking-estadual/:uf" element={<RankingEstado />} />

        {/* RANKING ONLINE MODULE */}
        <Route path="/ranking-online" element={<OnlineRankings />} />
        <Route path="/ranking-online/eventos" element={<OnlineEvents />} />
        <Route path="/ranking-online/evento/:id" element={<OnlineEventDetails />} />
        <Route path="/ranking-online/:uf" element={<OnlineRankingEstado />} />
        <Route path="/atletas" element={<Athletes />} />
        <Route path="/estatisticas" element={<RegionalStats />} />
        <Route path="/parceiros" element={<Partners />} />
        <Route path="/admin" element={<AdminGate><Admin /></AdminGate>} />
        {/* Fix: changed DashboardGate to AdminDashboardGate to fix usage on line 182 */}
        <Route path="/admin-dashboard" element={<AdminDashboardGate><AdminDashboard /></AdminDashboardGate>} />
        <Route path="/admin/financeiro" element={<AdminGate><AdminFinanceiro /></AdminGate>} />
        <Route path="/admin/customizacao" element={<AdminGate><AdminBranding /></AdminGate>} />
        <Route path="/comunicacao" element={<AdminGate><AdminCommunication /></AdminGate>} />
        <Route path="/admin/certificacoes" element={<AdminGate><AdminCertificationRequests /></AdminGate>} />
        <Route path="/admin/mensagens" element={<AdminGate><AdminMessaging /></AdminGate>} />
        <Route path="/mensagens" element={<UserMessages />} />
        <Route path="/id-norte" element={<IdNortePage />} />
        <Route path="/consultar-id-norte" element={<ConsultarIdNorte />} />
        <Route path="/perfil" element={<Profile />} />
        <Route path="/mapa" element={<AppMap />} />
        <Route path="*" element={<Navigate to="/app" replace />} />
      </Routes>
    </Layout>
  );
};

const AdminGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (user?.nivel !== 'ADMIN') return <Navigate to="/app" replace />;
  return <>{children}</>;
};

/**
 * Gate de acesso para Dashboard Admin/Diretoria
 * Fix: renamed to AdminDashboardGate to match usage above.
 */
const AdminDashboardGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useApp();
  if (user?.nivel !== 'ADMIN' && user?.nivel !== 'DIRETORIA') return <Navigate to="/app" replace />;
  return <>{children}</>;
};

export default App;
