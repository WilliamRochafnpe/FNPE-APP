
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../App';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell 
} from 'recharts';
import { 
  Users, Trophy, Calendar, MapPin, Download, Printer, 
  RotateCcw, ShieldCheck, AlertCircle, Loader2, Database,
  User as UserIcon, Layers
} from 'lucide-react';
import { Category } from '../types';
import { downloadCSV, handlePrint } from '../utils/report';
import { SUPABASE_ENABLED } from '../lib/supabase';
import { syncDatabase } from '../services/auth/supabaseAuth';

const STATES = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'];
const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const AdminDashboard: React.FC = () => {
  const { db, setDb, user } = useApp();
  const [loading, setLoading] = useState(SUPABASE_ENABLED);
  
  const [selectedState, setSelectedState] = useState<string>('TODOS');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'TODAS'>('TODAS');

  useEffect(() => {
    const fetchStats = async () => {
      if (!SUPABASE_ENABLED) {
        console.log("[AdminDashboard] Supabase desabilitado. Carregamento local.");
        return;
      }
      
      setLoading(true);
      try {
        const fullData = await syncDatabase.fetchAll();
        setDb(prev => ({
          ...prev,
          users: fullData.users,
          events: fullData.events,
          results: fullData.results
        }));
      } catch (err) {
        console.error("[AdminDashboard] Erro crítico no fetchAll:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [setDb]);

  const stats = useMemo(() => {
    const isStateMatch = (st: string | undefined) => selectedState === 'TODOS' || st === selectedState;
    
    const filteredUsers = db.users.filter(u => isStateMatch(u.uf));
    const filteredEvents = db.events.filter(e => isStateMatch(e.uf));
    const filteredResults = db.results.filter(r => {
      const evt = db.events.find(e => e.id === r.evento_id);
      const catMatch = selectedCategory === 'TODAS' || r.categoria === selectedCategory;
      return isStateMatch(evt?.uf) && catMatch;
    });

    const athletes = filteredUsers.filter(u => u.nivel === 'ATLETA');
    const fishermen = filteredUsers.filter(u => u.nivel === 'PESCADOR');

    return {
      totalAtletas: athletes.length,
      atletasMasc: athletes.filter(u => u.sexo === 'Masculino').length,
      atletasFem: athletes.filter(u => u.sexo === 'Feminino').length,
      
      totalPescadores: fishermen.length,
      pescMasc: fishermen.filter(u => u.sexo === 'Masculino').length,
      pescFem: fishermen.filter(u => u.sexo === 'Feminino').length,

      totalGeral: athletes.length + fishermen.length,
      eventosCount: filteredEvents.length,
      resultadosCount: filteredResults.length,
      participantesUnicos: new Set(filteredResults.map(r => r.atleta_id)).size,
      cidades: new Set(filteredEvents.map(e => e.cidade)).size
    };
  }, [db, selectedState, selectedCategory]);

  const chartData = useMemo(() => {
    return STATES.map(st => ({
      name: st,
      atletas: db.users.filter(u => u.uf === st && u.nivel === 'ATLETA').length,
      eventos: db.events.filter(e => e.uf === st).length
    }));
  }, [db.users, db.events]);

  if (loading) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest">Sincronizando Banco...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <Database className="text-emerald-500 w-8 h-8" />
            Dashboard Admin
          </h1>
          <p className="text-slate-500 font-medium">Análise e métricas da Federação Norte.</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="px-4 py-3 bg-slate-900 border border-slate-800 rounded-2xl font-bold flex items-center gap-2 text-slate-300 hover:bg-slate-800 transition-all">
            <Printer className="w-4 h-4"/> Imprimir
          </button>
          <button onClick={() => downloadCSV('base_usuarios_fnpe.csv', db.users)} className="px-4 py-3 bg-emerald-600 text-white rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 hover:bg-emerald-500 transition-all">
            <Download className="w-4 h-4"/> Exportar Dados
          </button>
        </div>
      </header>

      <section className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 ml-1">Região / Estado</label>
          <select value={selectedState} onChange={e => setSelectedState(e.target.value)} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="TODOS">Toda Região Norte</option>
            {STATES.map(st => <option key={st} value={st}>{st}</option>)}
          </select>
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-500 block mb-2 ml-1">Modalidade</label>
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value as any)} className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="TODAS">Todas as Categorias</option>
            <option value="CAIAQUE">Caiaque</option>
            <option value="EMBARCADO">Embarcado</option>
            <option value="ARREMESSO">Arremesso</option>
            <option value="BARRANCO">Barranco</option>
          </select>
        </div>
        <div className="flex items-end">
          <button onClick={() => { setSelectedState('TODOS'); setSelectedCategory('TODAS'); }} className="w-full p-4 bg-slate-800 text-slate-300 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-700 transition-colors">
            <RotateCcw className="w-4 h-4"/> Resetar Filtros
          </button>
        </div>
      </section>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <KpiCard icon={Users} label="Atletas" value={stats.totalAtletas} subText="Com ID Norte" color="emerald" />
        <KpiCard icon={UserIcon} label="Pescadores" value={stats.totalPescadores} subText="Sem ID Norte" color="slate" />
        <KpiCard icon={Layers} label="Total Geral" value={stats.totalGeral} subText="Base Completa" color="indigo" />
        <KpiCard icon={Calendar} label="Eventos" value={stats.eventosCount} subText="Certificados" color="amber" />
        <KpiCard icon={Trophy} label="Resultados" value={stats.resultadosCount} subText="Lançamentos" color="blue" />
        <KpiCard icon={MapPin} label="Cidades" value={stats.cidades} subText="Ativas" color="slate" />
      </div>

      {/* NOVO BLOCO: CENSO DEMOGRÁFICO POR GÊNERO */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
           <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              Censo de Atletas (Filiados)
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                 <p className="text-3xl font-black text-white">{stats.totalAtletas}</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center">
                 <UserIcon className="w-4 h-4 text-blue-400 mb-2" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Masculino</p>
                 <p className="text-2xl font-black text-white">{stats.atletasMasc}</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center">
                 <UserIcon className="w-4 h-4 text-pink-400 mb-2" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Feminino</p>
                 <p className="text-2xl font-black text-white">{stats.atletasFem}</p>
              </div>
           </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
           <h2 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tight">
              <div className="w-2 h-6 bg-slate-600 rounded-full"></div>
              Censo de Pescadores (Base)
           </h2>
           <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 text-center">
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total</p>
                 <p className="text-3xl font-black text-white">{stats.totalPescadores}</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center">
                 <UserIcon className="w-4 h-4 text-blue-400 mb-2" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Masculino</p>
                 <p className="text-2xl font-black text-white">{stats.pescMasc}</p>
              </div>
              <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 flex flex-col items-center">
                 <UserIcon className="w-4 h-4 text-pink-400 mb-2" />
                 <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Feminino</p>
                 <p className="text-2xl font-black text-white">{stats.pescFem}</p>
              </div>
           </div>
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl h-[450px] flex flex-col">
          <h2 className="text-xl font-black text-white mb-6 flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            Distribuição por Estado
          </h2>
          <div className="flex-1 min-h-0">
            {stats.totalAtletas > 0 || stats.eventosCount > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                    contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155', color: '#fff'}} 
                  />
                  <Bar dataKey="atletas" name="Atletas" radius={[6, 6, 0, 0]} fill="#10b981" />
                  <Bar dataKey="eventos" name="Eventos" radius={[6, 6, 0, 0]} fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-2">
                <AlertCircle className="w-12 h-12 opacity-20" />
                <p className="text-sm font-bold italic opacity-50">Nenhum dado disponível.</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl flex flex-col items-center justify-center text-center space-y-6">
          <div className="w-20 h-20 bg-emerald-500/10 text-emerald-500 rounded-[32px] flex items-center justify-center shadow-inner">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white">Infraestrutura FNPE</h2>
            <p className="text-slate-500 text-sm max-w-xs mx-auto font-medium leading-relaxed">
              O ecossistema conta atualmente com <strong>{stats.totalGeral}</strong> membros cadastrados em toda a região norte.
            </p>
          </div>
          <div className="w-full grid grid-cols-2 gap-4 pt-4 border-t border-slate-800">
             <div>
               <p className="text-[10px] font-black text-slate-600 uppercase">Pescadores Ativos</p>
               <p className="text-xl font-black text-white">{stats.totalPescadores}</p>
             </div>
             <div>
               <p className="text-[10px] font-black text-slate-600 uppercase">Atletas Federados</p>
               <p className="text-xl font-black text-white">{stats.totalAtletas}</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ icon: any, label: string, value: number, subText: string, color: string }> = ({ icon: Icon, label, value, subText, color }) => {
  const colorMap: Record<string, string> = {
    emerald: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    indigo: 'text-indigo-500 bg-indigo-500/10 border-indigo-500/20',
    amber: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    blue: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    slate: 'text-slate-400 bg-slate-400/10 border-slate-400/20'
  };

  return (
    <div className="bg-slate-900 p-5 rounded-[24px] border border-slate-800 shadow-lg space-y-4 hover:border-slate-700 transition-all flex flex-col justify-between h-full">
      <div className={`p-3 rounded-xl w-fit border ${colorMap[color] || colorMap.slate}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h3 className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">{label}</h3>
        <p className="text-2xl font-black text-white leading-tight">{value}</p>
        <p className="text-[9px] text-slate-600 font-bold italic mt-1">{subText}</p>
      </div>
    </div>
  );
};

export default AdminDashboard;
