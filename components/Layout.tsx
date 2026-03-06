
import React, { useState, useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import {
  Home,
  Calendar,
  Trophy,
  Users,
  ShieldCheck,
  CreditCard,
  LogOut,
  Menu,
  X,
  Sparkles,
  User as UserIcon,
  LayoutDashboard,
  AlertTriangle,
  MessageSquare,
  Bell,
  BarChart3,
  ShoppingBag,
  Globe
} from 'lucide-react';
import { useApp } from '../App';
import AssistantModal from './AssistantModal';
import FnpeLogo from './FnpeLogo';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { db, user, logout } = useApp();
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  if (!user) return <div className="min-h-screen bg-slate-950"></div>;

  const pendingCertificationsCount = useMemo(() => {
    return (db.certificationRequests || []).filter(r => r.status === 'PENDENTE').length;
  }, [db.certificationRequests]);

  const unreadMessagesCount = useMemo(() => {
    return (db.messages || []).filter(msg => {
      const isRecipient = msg.destinatario_tipo === 'TODOS' ||
        msg.destinatario_tipo === user.nivel ||
        msg.destinatario_id === user.id;
      const isUnread = !msg.lida_por?.includes(user.id);
      return isRecipient && isUnread && msg.status === 'ENVIADA';
    }).length;
  }, [db.messages, user.id, user.nivel]);

  // 1. Itens de Prioridade (Ordem Fixa para o Mobile Bottom Nav)
  const priorityItems = [
    { icon: Home, label: 'Início', path: '/app' },
    { icon: CreditCard, label: 'ID Norte', path: '/app/id-norte' },
    { icon: Calendar, label: 'Eventos', path: '/app/eventos', badge: user.nivel === 'ADMIN' ? pendingCertificationsCount : 0 },
    { icon: Trophy, label: 'Rankings', path: '/app/ranking-estadual' },
    { icon: Globe, label: 'Ranking Online', path: '/app/ranking-online' },
  ];

  // 2. Outros Itens (Serão ordenados alfabeticamente)
  const otherItems = [
    { icon: ShoppingBag, label: 'Parceiros', path: '/app/parceiros' },
    { icon: MessageSquare, label: 'Mensagens', path: '/app/mensagens', badge: unreadMessagesCount },
    { icon: BarChart3, label: 'Estatísticas', path: '/app/estatisticas' },
    { icon: Users, label: 'Atletas', path: '/app/atletas' },
    { icon: UserIcon, label: 'Perfil', path: '/app/perfil' },
  ];

  if (user.nivel === 'ADMIN' || user.nivel === 'DIRETORIA') {
    otherItems.push({ icon: LayoutDashboard, label: 'Dashboard', path: '/app/admin-dashboard' });
  }

  if (user.nivel === 'ADMIN') {
    otherItems.push({
      icon: ShieldCheck,
      label: 'Admin',
      path: '/app/admin',
      badge: pendingCertificationsCount
    });
  }

  // Ordenar apenas os "outros itens" alfabeticamente
  otherItems.sort((a, b) => a.label.localeCompare(b.label));

  // Combinar (Prioridade + Outros Ordenados)
  const menuItems = [...priorityItems, ...otherItems];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">


      {/* Sidebar Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 sticky top-0 h-screen z-40 pt-6">
        <div className="p-8 border-b border-slate-800 flex items-center gap-4">
          <FnpeLogo className="h-[72px] w-auto" />
          <span className="text-3xl font-black tracking-tighter text-white">FNPE</span>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/app'}
              className={({ isActive }) =>
                `flex items-center justify-between px-4 py-3 rounded-xl transition-all ${isActive
                  ? 'bg-emerald-500/10 text-emerald-400 font-bold'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/50'
                }`
              }
            >
              <div className="flex items-center gap-3">
                <item.icon className={`w-5 h-5 ${item.path === '/app/mensagens' && unreadMessagesCount > 0 ? 'animate-pulse text-indigo-400' : ''}`} />
                <span className="text-sm">{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className={`text-white text-[10px] font-black px-1.5 py-0.5 rounded-lg shadow-lg ${item.path === '/app/mensagens' ? 'bg-indigo-500' : 'bg-red-500'}`}>
                  {item.badge}
                </span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800 space-y-1">
          <button onClick={() => setIsAssistantOpen(true)} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-all text-sm font-bold">
            <Sparkles className="w-5 h-5" /> Assistente IA
          </button>
          <button onClick={logout} className="flex w-full items-center gap-3 px-4 py-3 rounded-xl text-slate-500 hover:text-red-400 hover:bg-red-400/5 transition-all text-sm">
            <LogOut className="w-5 h-5" /> Sair
          </button>
        </div>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-slate-900 border-b border-slate-800 p-4 sticky top-6 z-30 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <FnpeLogo className="h-[72px] w-auto" />
          <span className="font-black text-white uppercase tracking-widest text-3xl">FNPE</span>
        </div>
        <div className="flex items-center gap-2">
          {unreadMessagesCount > 0 && (
            <NavLink to="/app/mensagens" className="p-2 relative text-indigo-400">
              <Bell className="w-6 h-6 animate-bounce" />
              <span className="absolute top-1 right-1 bg-red-500 w-2.5 h-2.5 rounded-full border-2 border-slate-900 shadow-sm"></span>
            </NavLink>
          )}
          <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-2 text-slate-400">
            {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {isSidebarOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          <div className="bg-slate-900 w-64 h-full border-r border-slate-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-300 pt-8">
            <nav className="flex-1 p-4 space-y-2">
              {menuItems.map(item => (
                <NavLink key={item.path} to={item.path} onClick={() => setIsSidebarOpen(false)} className={({ isActive }) => `flex items-center justify-between p-4 rounded-xl font-bold ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'text-slate-400'}`}>
                  <div className="flex items-center gap-3"><item.icon className="w-5 h-5" /> {item.label}</div>
                  {item.badge! > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md">{item.badge}</span>}
                </NavLink>
              ))}
            </nav>
            <button onClick={logout} className="flex items-center gap-3 p-8 text-red-400 w-full font-bold border-t border-slate-800">
              <LogOut className="w-5 h-5" /> Sair
            </button>
          </div>
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-slate-950 pt-10 md:pt-6">
        <div className="max-w-4xl mx-auto w-full p-4 md:p-10 pb-24 md:pb-10 min-h-screen">
          {children}
        </div>
      </main>

      {/* Bottom Nav Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-slate-900/90 backdrop-blur-md border-t border-slate-800 flex justify-around p-3 z-30">
        {menuItems.slice(0, 4).map((item) => (
          <NavLink key={item.path} to={item.path} className={({ isActive }) => `flex flex-col items-center gap-1 transition-all ${isActive ? 'text-emerald-500' : 'text-slate-500'}`}>
            <div className="relative">
              <item.icon className="w-5 h-5" />
              {item.badge! > 0 && item.path === '/app/mensagens' && (
                <span className="absolute -top-1 -right-1 bg-red-500 w-2 h-2 rounded-full"></span>
              )}
            </div>
            <span className="text-[10px] font-black uppercase tracking-tighter">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default Layout;
