
import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, MapPin, Plus, Trash2, User as UserIcon, Globe } from 'lucide-react';
import { useApp } from '../App';
import { Category, User } from '../types';
import AthleteProfileModal from '../components/AthleteProfileModal';

const STATE_NAMES: Record<string, string> = {
  AC: 'Acre', AL: 'Alagoas', AP: 'Amapá', AM: 'Amazonas', BA: 'Bahia', CE: 'Ceará', DF: 'Distrito Federal', ES: 'Espírito Santo', GO: 'Goiás', MA: 'Maranhão', MT: 'Mato Grosso', MS: 'Mato Grosso do Sul', MG: 'Minas Gerais', PA: 'Pará', PB: 'Paraíba', PR: 'Paraná', PE: 'Pernambuco', PI: 'Piauí', RJ: 'Rio de Janeiro', RN: 'Rio Grande do Norte', RS: 'Rio Grande do Sul', RO: 'Rondônia', RR: 'Roraima', SC: 'Santa Catarina', SP: 'São Paulo', SE: 'Sergipe', TO: 'Tocantins'
};

const CATEGORIES: Category[] = ['CAIAQUE', 'EMBARCADO', 'ARREMESSO', 'BARRANCO'];

const RankingEstado: React.FC = () => {
  const { uf } = useParams();
  const navigate = useNavigate();
  const { db, user } = useApp();
  const [selectedType, setSelectedType] = useState<'presencial' | 'online'>('presencial');
  const [selectedCategory, setSelectedCategory] = useState<Category>('CAIAQUE');
  const [selectedAthleteProfile, setSelectedAthleteProfile] = useState<User | null>(null);

  const ranking = useMemo(() => {
    const validEvents = db.events.filter(e => e.uf === uf && (e.event_type || 'presencial') === selectedType);
    const validEventIds = new Set(validEvents.map(e => e.id));

    const athleteScores: Record<string, { userId: string, score: number }> = {};

    (db.results || []).forEach(res => {
      if (validEventIds.has(res.evento_id) && res.categoria === selectedCategory) {
        if (!athleteScores[res.atleta_id]) {
          athleteScores[res.atleta_id] = { userId: res.atleta_id, score: 0 };
        }
        athleteScores[res.atleta_id].score += res.pontuacao;
      }
    });

    // Process Team Results (New System)
    (db.eventTeams || []).forEach(team => {
      if (team.event_id && validEventIds.has(team.event_id) && team.category === selectedCategory) {
        const members = db.eventTeamMembers?.filter(tm => tm.team_id === team.id) || [];
        members.forEach(member => {
          if (member.user_id) {
            if (!athleteScores[member.user_id]) {
              athleteScores[member.user_id] = { userId: member.user_id, score: 0 };
            }
            athleteScores[member.user_id].score += (team.score || 0);
          }
        });
      }
    });

    const sorted = Object.values(athleteScores).sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort by name (optional, helps stability)
      const nameA = db.users.find(u => u.id === a.userId)?.nome_completo || '';
      const nameB = db.users.find(u => u.id === b.userId)?.nome_completo || '';
      return nameA.localeCompare(nameB);
    });

    return sorted.map((item, idx) => ({ ...item, placement: idx + 1 }));
  }, [db.results, db.events, db.eventTeams, db.eventTeamMembers, db.users, uf, selectedCategory, selectedType]);

  const stateName = STATE_NAMES[uf || ''] || uf;

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <button
            onClick={() => navigate('/app/ranking-estadual')}
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2 group transition-all"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Rankings Estaduais
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-xl flex items-center justify-center border border-emerald-500/20">
              <Trophy className="w-6 h-6" />
            </div>
            Ranking {stateName}
          </h1>
        </div>

        {user?.nivel === 'ADMIN' && (
          <button
            onClick={() => navigate('/app/eventos')}
            className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ml-auto w-fit ${selectedType === 'presencial' ? 'bg-emerald-600 text-slate-950 hover:bg-emerald-500 shadow-emerald-600/20' : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-600/20'}`}
          >
            <Plus className="w-4 h-4" /> Lançar Resultado
          </button>
        )}
      </header>

      {/* TIPO DE RANKING TOGGLE */}
      <div className="flex bg-[#10131C] border border-[#1F2733] p-1.5 rounded-[24px] shadow-xl w-fit">
        <button
          onClick={() => setSelectedType('presencial')}
          className={`flex items-center gap-3 px-8 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedType === 'presencial' ? 'bg-emerald-500 text-slate-950 shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Trophy className="w-4 h-4" />
          Ranking Presencial
        </button>
        <button
          onClick={() => setSelectedType('online')}
          className={`flex items-center gap-3 px-8 py-3 rounded-[18px] font-black text-[10px] uppercase tracking-widest transition-all ${selectedType === 'online' ? 'bg-indigo-500 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Globe className="w-4 h-4" />
          Ranking Online
        </button>
      </div>

      {/* CONTAINER PRINCIPAL DO RANKING */}
      <section className="bg-[#10131C] rounded-2xl border border-[#1F2733] shadow-2xl overflow-hidden">
        {/* TABS DE CATEGORIAS */}
        <div className="p-2 bg-black/20 border-b border-[#1F2733] flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`flex-1 min-w-[100px] py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${selectedCategory === cat
                ? 'bg-green-600 text-white shadow-lg'
                : 'text-slate-500 hover:text-slate-300 bg-transparent'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* TABELA DE RESULTADOS */}
        <div className="p-6 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[#1F2733]">
                <th className="py-4 px-4 font-black text-slate-500 uppercase text-[9px] tracking-widest w-20">Posição</th>
                <th className="py-4 px-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">Atleta / Competidor</th>
                <th className="py-4 px-4 font-black text-slate-500 uppercase text-[9px] tracking-widest">ID Norte</th>
                <th className="py-4 px-4 font-black text-slate-500 uppercase text-[9px] tracking-widest text-right">Pontuação Total</th>
                {user?.nivel === 'ADMIN' && <th className="py-4 px-4 font-black text-slate-500 uppercase text-[9px] tracking-widest text-center">Ações</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1F2733]">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan={user?.nivel === 'ADMIN' ? 5 : 4} className="py-20 text-center text-slate-500 italic text-sm font-medium">
                    Nenhum atleta ranqueado nesta categoria para {stateName}.
                  </td>
                </tr>
              ) : (
                ranking.map((item) => {
                  const athlete = db.users.find(u => u.id === item.userId);
                  const isCurrentUser = athlete?.id === user?.id;

                  return (
                    <tr key={item.userId} className={`hover:bg-[#0f111a] transition-colors group ${isCurrentUser ? 'bg-emerald-500/5' : ''}`}>
                      <td className="py-5 px-4">
                        <div className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-[11px] border ${item.placement === 1 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                          item.placement === 2 ? 'bg-slate-300/10 text-slate-300 border-slate-300/20' :
                            item.placement === 3 ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 'bg-slate-900 text-slate-500 border-slate-800'
                          }`}>
                          {item.placement}º
                        </div>
                      </td>
                      <td className="py-5 px-4">
                        <button
                          onClick={() => athlete && setSelectedAthleteProfile(athlete)}
                          className="text-left group/btn"
                        >
                          <p className="font-bold text-white uppercase tracking-tight group-hover/btn:text-emerald-400 transition-colors text-sm">
                            {athlete?.nome_completo}
                          </p>
                          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-0.5">
                            {athlete?.cidade} / {athlete?.uf}
                          </p>
                        </button>
                      </td>
                      <td className="py-5 px-4">
                        <span className="font-mono bg-slate-950 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest border border-[#1F2733]">
                          {athlete?.id_norte_numero || '---'}
                        </span>
                      </td>
                      <td className="py-5 px-4 text-right">
                        <div className={`font-black text-lg tracking-tighter ${isCurrentUser ? 'text-emerald-400' : 'text-white'}`}>
                          {item.score.toLocaleString('pt-BR')}
                        </div>
                      </td>
                      {user?.nivel === 'ADMIN' && (
                        <td className="py-5 px-4 text-center">
                          <button className="p-2 text-slate-600 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* RODAPÉ INFORMATIVO */}
      <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/10 flex items-center gap-4">
        <MapPin className="text-emerald-500 w-6 h-6 shrink-0" />
        <p className="text-xs text-slate-500 font-medium leading-relaxed">
          Esta classificação representa a somatória de todos os <strong>Eventos Certificados</strong> realizados no estado de {stateName}.
          Os pontos são atualizados automaticamente após a homologação dos resultados oficiais pela FNPE.
        </p>
      </div>

      {selectedAthleteProfile && (
        <AthleteProfileModal
          athlete={selectedAthleteProfile}
          db={db}
          onClose={() => setSelectedAthleteProfile(null)}
        />
      )}
    </div>
  );
};

export default RankingEstado;
