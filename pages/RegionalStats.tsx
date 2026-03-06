
import React, { useMemo } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, LabelList
} from 'recharts';
import { 
  BarChart3, 
  Users, 
  Map, 
  PieChart as PieIcon, 
  TrendingUp, 
  Globe,
  CalendarDays,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../App';

const NORTH_STATES = ['AC', 'AM', 'AP', 'PA', 'RO', 'RR', 'TO'];
const COLORS = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#ec4899'];

const RegionalStats: React.FC = () => {
  const { db } = useApp();

  const stats = useMemo(() => {
    const northUsers = db.users.filter(u => NORTH_STATES.includes(u.uf || ''));
    const northAthletes = northUsers.filter(u => u.nivel === 'ATLETA');
    
    // 1. Gênero Norte
    const maleAthletes = northAthletes.filter(u => u.sexo === 'Masculino').length;
    const femaleAthletes = northAthletes.filter(u => u.sexo === 'Feminino').length;

    // 2. Distribuição por Estado
    const stateData = NORTH_STATES.map(uf => {
      const stateUsers = db.users.filter(u => u.uf === uf && u.nivel === 'ATLETA');
      return {
        name: uf,
        atletaCount: stateUsers.length,
        masc: stateUsers.filter(u => u.sexo === 'Masculino').length,
        fem: stateUsers.filter(u => u.sexo === 'Feminino').length,
        eventos: db.events.filter(e => e.uf === uf).length
      };
    });

    // 3. Faixa Etária Norte - Conforme imagem enviada
    const calculateAge = (dob?: string) => {
      if (!dob) return null;
      const birth = new Date(dob);
      const diff = Date.now() - birth.getTime();
      return Math.abs(new Date(diff).getUTCFullYear() - 1970);
    };

    const ageGroups = [
      { name: '< 18 anos', value: 0 },
      { name: '18–30', value: 0 },
      { name: '30–40', value: 0 },
      { name: '40–50', value: 0 },
      { name: '50–60', value: 0 },
      { name: '60–70', value: 0 },
      { name: '70–80', value: 0 },
      { name: 'Inconsistentes', value: 0 },
    ];

    northUsers.forEach(u => {
      const age = calculateAge(u.data_nascimento);
      if (age === null) {
        ageGroups[7].value++;
      } else {
        if (age < 18) ageGroups[0].value++;
        else if (age >= 18 && age <= 30) ageGroups[1].value++;
        else if (age > 30 && age <= 40) ageGroups[2].value++;
        else if (age > 40 && age <= 50) ageGroups[3].value++;
        else if (age > 50 && age <= 60) ageGroups[4].value++;
        else if (age > 60 && age <= 70) ageGroups[5].value++;
        else if (age > 70 && age <= 80) ageGroups[6].value++;
        else ageGroups[7].value++;
      }
    });

    // 4. Proporção Brasil (Base inteira)
    const brazilPie = [
      { name: 'Pescadores', value: db.users.filter(u => u.nivel === 'PESCADOR').length },
      { name: 'Atletas', value: db.users.filter(u => u.nivel === 'ATLETA' || u.nivel === 'ADMIN' || u.nivel === 'DIRETORIA').length }
    ];

    return {
      totalNorthAthletes: northAthletes.length,
      maleAthletes,
      femaleAthletes,
      stateData,
      ageGroups,
      brazilPie
    };
  }, [db]);

  return (
    <div className="space-y-10 animate-in fade-in duration-500 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Globe className="text-emerald-500 w-8 h-8" />
          <h1 className="text-3xl font-black text-white tracking-tight uppercase leading-tight">
            Dados da Pesca Esportiva <br className="md:hidden" />
            <span className="text-emerald-500">— Norte do Brasil</span>
          </h1>
        </div>
        <p className="text-slate-500 font-medium italic">Estatísticas consolidadas da Federação Norte e base regional.</p>
      </header>

      {/* KPIs DE TOPO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KpiCard 
          label="Total Atletas Norte" 
          value={stats.totalNorthAthletes} 
          icon={ShieldCheck}
          subValue="Filiados Ativos"
          color="emerald"
        />
        <KpiCard 
          label="Gênero Masculino" 
          value={stats.maleAthletes} 
          icon={Users}
          subValue="Atletas Regionais"
          color="blue"
        />
        <KpiCard 
          label="Gênero Feminino" 
          value={stats.femaleAthletes} 
          icon={Users}
          subValue="Atletas Regionais"
          color="pink"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* GRÁFICO 1: DISTRIBUIÇÃO POR ESTADO */}
        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <Map className="w-5 h-5 text-emerald-500" />
            Atletas e Eventos por UF
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.stateData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1e293b" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12, fontWeight: 700}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155', color: '#fff'}}
                />
                <Bar dataKey="atletaCount" name="Atletas" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="eventos" name="Eventos" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* GRÁFICO 2: FAIXA ETÁRIA - NOVO ESTILO (CONFORME IMAGEM) */}
        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-emerald-500" />
            Faixa etária dos pescadores(as) do Norte - 2025
          </h2>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart 
                data={stats.ageGroups} 
                layout="vertical" 
                margin={{ top: 5, right: 40, left: 40, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#1e293b" />
                <XAxis type="number" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 10}} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{fill: '#f1f5f9', fontSize: 11, fontWeight: 600}}
                  width={90}
                />
                <Tooltip 
                  cursor={{fill: 'rgba(255,255,255,0.05)'}}
                  contentStyle={{backgroundColor: '#0f172a', borderRadius: '16px', border: '1px solid #334155', color: '#fff'}}
                />
                <Bar dataKey="value" name="Pescadores" radius={[0, 4, 4, 0]} barSize={24}>
                  {stats.ageGroups.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index % 2 === 0 ? '#166534' : '#22c55e'} 
                    />
                  ))}
                  <LabelList 
                    dataKey="value" 
                    position="right" 
                    fill="#fff" 
                    fontSize={11} 
                    fontWeight="bold"
                    formatter={(val: number) => val.toLocaleString()}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* PIZZA: PROPORÇÃO BRASIL */}
        <section className="lg:col-span-1 bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl flex flex-col items-center justify-center space-y-6">
          <div className="text-center">
            <h2 className="text-lg font-black text-white uppercase flex items-center justify-center gap-2">
              <PieIcon className="w-5 h-5 text-indigo-500" />
              Proporção Brasil
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase mt-1">Pescadores vs Atletas</p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.brazilPie}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {stats.brazilPie.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={index === 0 ? '#1e293b' : '#6366f1'} stroke="none" />
                  ))}
                </Pie>
                <Tooltip contentStyle={{backgroundColor: '#0f172a', borderRadius: '12px', border: '1px solid #334155'}} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex gap-6 justify-center">
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-slate-800 rounded-full"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Gerais</span>
             </div>
             <div className="flex items-center gap-2">
               <div className="w-3 h-3 bg-indigo-500 rounded-full"></div>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Filiados</span>
             </div>
          </div>
        </section>

        {/* DETALHAMENTO POR ESTADO */}
        <section className="lg:col-span-2 bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-white uppercase flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            Performance por Federação (Norte)
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-slate-800 text-slate-600 text-[10px] font-black uppercase tracking-widest">
                  <th className="py-4 px-2">Estado</th>
                  <th className="py-4 px-2">Atletas</th>
                  <th className="py-4 px-2">Masc/Fem</th>
                  <th className="py-4 px-2 text-right">Eventos</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {stats.stateData.map(st => (
                  <tr key={st.name} className="hover:bg-slate-950/50 transition-colors">
                    <td className="py-4 px-2">
                       <span className="bg-slate-800 text-white px-2 py-1 rounded text-xs font-black">{st.name}</span>
                    </td>
                    <td className="py-4 px-2 font-bold text-white">{st.atletaCount}</td>
                    <td className="py-4 px-2 text-xs font-medium text-slate-400">
                      <span className="text-blue-400">{st.masc}</span> / <span className="text-pink-400">{st.fem}</span>
                    </td>
                    <td className="py-4 px-2 text-right font-black text-indigo-400">{st.eventos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ label: string, value: number, subValue: string, icon: any, color: 'emerald' | 'blue' | 'pink' }> = ({ label, value, subValue, icon: Icon, color }) => {
  const colorClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    blue: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pink: 'bg-pink-500/10 text-pink-400 border-pink-500/20'
  };

  return (
    <div className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl group hover:border-emerald-500/30 transition-all">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl border ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{label}</p>
      <p className="text-4xl font-black text-white mt-1">{value.toLocaleString('pt-BR')}</p>
      <p className="text-[10px] font-bold text-slate-600 uppercase mt-2">{subValue}</p>
    </div>
  );
}

export default RegionalStats;
