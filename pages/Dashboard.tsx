import React, { useMemo, useState } from 'react';
import { Trophy, Users, Calendar, Award, Star, TrendingUp, MapPin, Shield, User as UserIcon, CreditCard, ChevronUp, X } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { useApp } from '../App';
import IdNorteCard from '../components/IdNorteCard';

const Dashboard: React.FC = () => {
  const { db, user, isMaster } = useApp();
  const [showIdNorteWidget, setShowIdNorteWidget] = useState(false);

  const athleteScores = useMemo(() => {
    const scores: Record<string, { id: string; name: string; total: number }> = {};
    (db.results || []).forEach(res => {
      const athlete = db.users.find(u => u.id === res.atleta_id);
      if (!athlete) return;
      if (!scores[res.atleta_id]) {
        scores[res.atleta_id] = { id: res.atleta_id, name: athlete.nome_completo, total: 0 };
      }
      scores[res.atleta_id].total += res.pontuacao;
    });
    return Object.values(scores).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [db.results, db.users]);

  const stateDistribution = useMemo(() => {
    const states: Record<string, number> = {};
    (db.users || []).forEach(u => {
      const uf = u.uf || 'NI';
      states[uf] = (states[uf] || 0) + 1;
    });
    return Object.entries(states).map(([name, value]) => ({ name, value }));
  }, [db.users]);

  const myStats = useMemo(() => {
    const results = (db.results || []).filter(r => r.atleta_id === user?.id);
    return {
      participations: results.length,
      totalScore: results.reduce((acc, curr) => acc + curr.pontuacao, 0)
    };
  }, [db.results, user?.id]);

  const COLORS = ['#10b981', '#4f46e5', '#f59e0b', '#ef4444', '#8b5cf6'];

  const getLevelLabel = (level?: string) => {
    if (isMaster) return 'Master';
    const isFemale = user?.sexo === 'F' || user?.sexo === 'FEMININO' || user?.sexo === 'Feminino';
    if (level === 'ATLETA') return 'Atleta';
    if (level === 'ADMIN') return 'Admin';
    return isFemale ? 'Pescadora' : 'Pescador';
  };

  const getLevelColorClass = (level?: string) => {
    if (level === 'ATLETA') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (level === 'ADMIN') return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20';
    return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 relative pb-24 md:pb-0">

      {/* HEADER SECTION - Mobile Optimized */}
      <section className="bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/20 rounded-[40px] p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8">

          {/* Mobile Welcome Text */}
          <div className="md:hidden w-full text-center space-y-1 mb-2">
            <p className="text-slate-500 font-medium text-sm tracking-wide">
              {user?.sexo === 'F' || user?.sexo === 'FEMININO' || user?.sexo === 'Feminino' ? 'Seja Bem-Vinda,' : 'Seja Bem-Vindo,'}
            </p>
            <p className="text-emerald-500 font-black text-xl uppercase tracking-tighter">
              {user?.sexo === 'F' || user?.sexo === 'FEMININO' || user?.sexo === 'Feminino' ? 'Pescadora' : 'Pescador'}
            </p>
          </div>

          {/* Profile Photo */}
          <div className="relative group">
            <div className="w-32 h-32 md:w-28 md:h-28 bg-slate-800 rounded-full md:rounded-[32px] overflow-hidden border-[6px] md:border-4 border-slate-900/50 shadow-2xl flex items-center justify-center text-slate-600 relative z-10">
              {user?.foto_url ? (
                <img src={user.foto_url} alt={user.nome_completo} className="w-full h-full object-cover" />
              ) : (
                <UserIcon className="w-12 h-12" />
              )}
            </div>
            {/* Status Indicator */}
            <div className="absolute bottom-0 right-0 md:-bottom-2 md:-right-2 bg-emerald-500 text-slate-950 p-2.5 rounded-xl shadow-lg border-4 border-slate-900 z-20">
              <Shield className="w-5 h-5" />
            </div>
            {/* Glow Effect */}
            <div className="absolute inset-0 bg-emerald-500/20 blur-2xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          </div>

          {/* User Info */}
          <div className="flex-1 text-center md:text-left w-full space-y-3 md:space-y-1">
            <div className="flex flex-col md:flex-row md:items-center gap-2 justify-center md:justify-start">
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase leading-none">
                {user?.nome_completo || 'Visitante'}
              </h1>
              <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border w-fit mx-auto md:mx-0 ${getLevelColorClass(user?.nivel)}`}>
                {getLevelLabel(user?.nivel)}
              </span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-2 text-slate-500 text-xs font-bold uppercase tracking-widest bg-slate-950/30 p-2 rounded-lg w-fit mx-auto md:mx-0">
              <MapPin className="w-3.5 h-3.5 text-emerald-500" />
              {user?.cidade || '---'}, {user?.uf || '--'}
            </div>
          </div>

          {/* Desktop ID Norte Display (Mini) */}
          <div className="hidden md:block bg-slate-950/50 p-6 rounded-3xl border border-slate-800/50 text-center min-w-[140px] backdrop-blur-sm">
            <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.2em] mb-1">ID Norte</p>
            <p className="text-2xl font-black text-emerald-500 font-mono tracking-tight">
              {user?.id_norte_numero || '---'}
            </p>
          </div>

        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Atletas" value={db.users.filter(u => u.nivel === 'ATLETA').length} />
        <StatCard icon={Calendar} label="Eventos" value={db.events.length} />
        <StatCard icon={Award} label="Pontos" value={myStats.totalScore.toLocaleString()} />
        <StatCard icon={Star} label="Status" value={user?.id_norte_status === 'APROVADO' ? 'Ativo' : 'Pendente'} color={user?.id_norte_status === 'APROVADO' ? 'text-emerald-400' : 'text-amber-400'} />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <TrendingUp className="text-emerald-500 w-4 h-4" />
            Top 5 Pontuações
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={athleteScores} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" hide />
                <YAxis dataKey="name" type="category" width={80} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }}
                  itemStyle={{ color: '#10b981' }}
                />
                <Bar dataKey="total" radius={[0, 4, 4, 0]} barSize={20}>
                  {athleteScores.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-2">
            <MapPin className="text-emerald-500 w-4 h-4" />
            Distribuição Regional (UF)
          </h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stateDistribution}
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={8}
                  dataKey="value"
                  stroke="none"
                >
                  {stateDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* MOBILE ID NORTE WIDGET - Floating Strip */}
      {user?.id_norte_status === 'APROVADO' && (
        <>
          {/* FLOATING STRIP */}
          <div
            onClick={() => setShowIdNorteWidget(true)}
            className="md:hidden fixed bottom-24 left-4 right-4 bg-emerald-500 text-slate-950 p-4 rounded-2xl shadow-2xl shadow-emerald-500/20 z-30 flex items-center justify-between cursor-pointer animate-in slide-in-from-bottom-10 duration-700 hover:scale-[1.02] active:scale-95 transition-all border-4 border-slate-900/10"
          >
            <div className="flex items-center gap-4">
              <div className="bg-slate-950/20 p-2.5 rounded-xl">
                <CreditCard className="w-6 h-6 text-slate-950" />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Documento Oficial</p>
                <p className="text-base font-black uppercase tracking-tight leading-none">Minha ID Norte</p>
              </div>
            </div>
            <div className="bg-slate-950/10 p-2 rounded-full">
              <ChevronUp className="w-5 h-5 animate-pulse" />
            </div>
          </div>

          {/* EXPANDED MODAL (Full Screen Overlay) */}
          {showIdNorteWidget && (
            <div className="fixed inset-0 z-[60] flex flex-col items-center justify-end md:justify-center p-0 md:p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">

              {/* Close Area (Click outside) */}
              <div className="absolute inset-0" onClick={() => setShowIdNorteWidget(false)}></div>

              <div className="w-full max-w-sm relative z-10 bg-slate-900 md:rounded-[40px] rounded-t-[40px] border-t md:border border-slate-700 shadow-2xl p-8 pb-12 animate-in slide-in-from-bottom-full duration-500">

                <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mb-8 opacity-50"></div>

                <button
                  onClick={() => setShowIdNorteWidget(false)}
                  className="absolute top-6 right-6 bg-slate-800 text-slate-400 p-2 rounded-full hover:bg-slate-700 hover:text-white transition"
                >
                  <X className="w-6 h-6" />
                </button>

                <div className="text-center mb-8">
                  <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Sua Identidade</h3>
                  <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Atleta Federado Oficial</p>
                </div>

                <div className="transform transition-all active:scale-95 duration-200">
                  <IdNorteCard user={user} />
                </div>

                <p className="text-center text-slate-600 text-[10px] font-bold mt-8 uppercase tracking-widest">
                  Apresente este documento em eventos oficiais
                </p>
              </div>
            </div>
          )}
        </>
      )}

    </div>
  );
};

const StatCard: React.FC<{ icon: any, label: string, value: any, color?: string }> = ({ icon: Icon, label, value, color }) => (
  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 shadow-lg group hover:border-emerald-500/50 transition-all hover:-translate-y-1">
    <div className="flex items-center gap-3 mb-2">
      <div className="p-2 bg-slate-800 rounded-xl text-emerald-500 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-all">
        <Icon className="w-4 h-4" />
      </div>
      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</span>
    </div>
    <p className={`text-xl font-black ${color || 'text-white'}`}>{value}</p>
  </div>
);

export default Dashboard;
