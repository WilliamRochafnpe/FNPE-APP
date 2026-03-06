
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Trash2, Edit3, RotateCcw, Search, User as UserIcon, 
  Plus, X, Check, Mail, Users, AlertCircle, MapPin, 
  ShieldCheck, ImageIcon, Save, Bell, Settings, Layers,
  MessageSquarePlus, Loader2, CheckCircle2,
  DollarSign
} from 'lucide-react';
import { useApp } from '../App';
import { UserLevel, User } from '../types';
import { ADMIN_EMAIL } from '../db';
import BackupRestorePanel from '../components/BackupRestorePanel';
import { syncDatabase } from '../services/auth/supabaseAuth';
import { IS_SUPABASE } from '../services/auth';

const Admin: React.FC = () => {
  const { db, setDb, user: currentUser } = useApp();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCoverModalOpen, setIsCoverModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [updatingLevelId, setUpdatingLevelId] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [selectedStateForCover, setSelectedStateForCover] = useState('AM');
  const [tempCover, setTempCover] = useState<string | null>(null);

  const pendingCertsCount = (db.certificationRequests || []).filter(r => r.status === 'PENDENTE').length;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setTimeout(() => setSuccessMessage(null), 4000);
  };

  const handleChangeUserLevel = async (userId: string, newLevel: UserLevel) => {
    if (!currentUser) return;
    setUpdatingLevelId(userId);
    
    try {
      if (IS_SUPABASE) {
        // Fix: Removed third argument 'currentUser' as syncDatabase.updateUserLevel only expects 2 arguments (userId, newLevel).
        await syncDatabase.updateUserLevel(userId, newLevel);
        setDb(prev => ({
          ...prev,
          // Fix: Ensure we update the user object with the new level in the local state.
          users: prev.users.map(u => u.id === userId ? { ...u, nivel: newLevel } : u)
        }));
        showToast(`Nível alterado para ${newLevel}!`);
      } else {
        setDb(prev => ({
          ...prev,
          users: prev.users.map(u => u.id === userId ? { ...u, nivel: newLevel } : u)
        }));
        showToast("Nível alterado localmente.");
      }
    } catch (err: any) {
      alert("Erro ao alterar nível: " + err.message);
    } finally {
      setUpdatingLevelId(null);
    }
  };

  const filteredUsers = db.users.filter(u => 
    u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 relative">
      {/* TOAST FEEDBACK */}
      {successMessage && (
        <div className="fixed bottom-24 right-8 z-[100] animate-in slide-in-from-right-4 fade-in duration-300">
           <div className="bg-emerald-600 text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5" />
              <span className="font-bold text-sm uppercase tracking-tight">{successMessage}</span>
           </div>
        </div>
      )}

      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Painel Administrativo</h1>
          <p className="text-slate-500 font-medium italic">Gestão estratégica e base federativa.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* FINANCEIRO */}
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <div className="p-4 bg-emerald-500/10 rounded-2xl text-emerald-500 border border-emerald-500/20 w-fit">
            <DollarSign className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Financeiro</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Caixa & Cobranças</p>
          </div>
          <button 
            onClick={() => navigate('/app/admin/financeiro')}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 shadow-lg shadow-emerald-500/20 transition-all"
          >
            Acessar Módulo
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <div className="flex justify-between items-start">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 border border-indigo-500/20">
              <ShieldCheck className="w-8 h-8" />
            </div>
            {pendingCertsCount > 0 && (
              <span className="bg-red-500 text-white px-3 py-1 rounded-full text-[10px] font-black animate-pulse">
                {pendingCertsCount} PEDIDOS
              </span>
            )}
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Certificações</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Eventos federados</p>
          </div>
          <button 
            onClick={() => navigate('/app/admin/certificacoes')}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-500 shadow-lg shadow-indigo-500/20 transition-all"
          >
            Ver Solicitações
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <div className="p-4 bg-purple-500/10 rounded-2xl text-purple-400 border border-purple-500/20 w-fit">
            <MessageSquarePlus className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Mensagens</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Comunicados</p>
          </div>
          <button 
            onClick={() => navigate('/app/admin/mensagens')}
            className="w-full bg-purple-600 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-purple-500 shadow-lg shadow-purple-500/20 transition-all"
          >
            Painel de Comunicação
          </button>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 w-fit">
            <ImageIcon className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-white uppercase tracking-tight leading-none">Customização</h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-2">Branding & Imagens</p>
          </div>
          <button 
            onClick={() => navigate('/app/admin/customizacao')}
            className="w-full bg-amber-500 text-white py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-amber-400 shadow-lg shadow-amber-500/20 transition-all"
          >
            Acessar Módulo
          </button>
        </div>
      </div>

      <BackupRestorePanel />

      <div className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex flex-col md:flex-row gap-4 items-center justify-between">
          <h2 className="text-lg font-black text-white uppercase tracking-tight">Base de Usuários</h2>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
            <input 
              type="text" 
              placeholder="Buscar usuários..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="w-full pl-12 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-[#6C4DE4] transition-all font-bold text-white placeholder:text-slate-700" 
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-950/50">
                <th className="py-5 px-8 font-black text-slate-600 uppercase text-[10px] tracking-widest">Identificação</th>
                <th className="py-5 px-8 font-black text-slate-600 uppercase text-[10px] tracking-widest">Nível de Acesso</th>
                <th className="py-5 px-8 font-black text-slate-600 uppercase text-[10px] tracking-widest text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-slate-950 transition-colors group">
                  <td className="py-5 px-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-800 rounded-2xl flex items-center justify-center text-slate-600 overflow-hidden border border-slate-700 shadow-inner">
                        {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-6 h-6" />}
                      </div>
                      <div>
                        <p className="font-bold text-white leading-none mb-1">{u.nome_completo}</p>
                        <p className="text-[10px] font-mono text-slate-500 uppercase tracking-tighter">
                          {u.id_norte_numero || u.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8">
                    <div className="relative w-40">
                      {updatingLevelId === u.id ? (
                        <div className="flex items-center gap-2 text-[#6C4DE4] font-bold text-[10px] uppercase tracking-widest px-3 py-2 bg-[#6C4DE4]/5 rounded-xl border border-[#6C4DE4]/20 animate-pulse">
                           <Loader2 className="w-3 h-3 animate-spin" /> Atualizando...
                        </div>
                      ) : (
                        <select 
                          value={u.nivel}
                          onChange={(e) => handleChangeUserLevel(u.id, e.target.value as UserLevel)}
                          disabled={u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()}
                          className={`w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-[10px] font-black uppercase tracking-widest transition-all outline-none focus:ring-2 focus:ring-[#6C4DE4] appearance-none cursor-pointer hover:border-slate-600 ${
                            u.nivel === 'ADMIN' ? 'text-indigo-400' : 
                            u.nivel === 'DIRETORIA' ? 'text-purple-400' :
                            u.nivel === 'ATLETA' ? 'text-emerald-400' : 'text-slate-500'
                          }`}
                        >
                          <option value="PESCADOR">Pescador</option>
                          <option value="ATLETA">Atleta</option>
                          <option value="DIRETORIA">Diretoria</option>
                          <option value="ADMIN">ADM</option>
                        </select>
                      )}
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none opacity-30">
                        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                      </div>
                    </div>
                  </td>
                  <td className="py-5 px-8 text-center">
                    <button 
                      disabled={u.email.toLowerCase() === ADMIN_EMAIL.toLowerCase()}
                      onClick={() => confirm("Remover este usuário permanentemente?") && setDb(p => ({...p, users: p.users.filter(x => x.id !== u.id)}))} 
                      className="p-3 text-slate-700 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all disabled:opacity-0 active:scale-90"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Admin;