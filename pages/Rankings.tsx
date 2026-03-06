
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Image as ImageIcon, Award, Globe } from 'lucide-react';
import { useApp } from '../App';

const STATES = [
  { uf: 'AC', name: 'Acre' },
  { uf: 'AM', name: 'Amazonas' },
  { uf: 'AP', name: 'Amapá' },
  { uf: 'PA', name: 'Pará' },
  { uf: 'RO', name: 'Rondônia' },
  { uf: 'RR', name: 'Roraima' },
  { uf: 'TO', name: 'Tocantins' }
];

const Rankings: React.FC = () => {
  const { db } = useApp();
  const navigate = useNavigate();

  const rankingsCovers = db.settings?.rankingsCovers || {};

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-screen-xl mx-auto px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Rankings Estaduais</h1>
          <p className="text-slate-500 font-medium italic">Classificação geral oficial por federação estadual.</p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-[20px] shadow-xl self-start md:self-center">
          <button
            onClick={() => { /* Opção de filtro global pode ser adicionada aqui ou na navegação */ }}
            className="px-6 py-2.5 rounded-[14px] bg-emerald-500 text-slate-950 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2"
          >
            <Trophy className="w-4 h-4" />
            Presencial
          </button>
          <button
            onClick={() => { /* Implementar navegação para novo ranking online integrado */ }}
            className="px-6 py-2.5 rounded-[14px] text-slate-600 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
          >
            <Globe className="w-4 h-4" />
            Online
          </button>
        </div>
      </header>

      {/* Grid de Rankings Estilo Eventos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {STATES.map((state) => (
          <div
            key={state.uf}
            onClick={() => navigate(`/app/ranking-estadual/${state.uf}`)}
            className="group relative bg-[#10131C] rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:scale-[1.02] hover:border-emerald-500/50 transition-all cursor-pointer flex flex-col h-[300px]"
          >
            {/* Selo do Estado */}
            <div className="absolute top-3 right-3 z-10 bg-[#1E293B] text-white text-[10px] font-black px-2.5 py-1 rounded-md shadow-lg uppercase tracking-widest border border-white/5">
              {state.uf}
            </div>

            {/* Topo do Card: Imagem ou Icone */}
            <div className="h-[160px] w-full bg-slate-950 relative overflow-hidden flex items-center justify-center shrink-0">
              {rankingsCovers[state.uf] ? (
                <img
                  src={rankingsCovers[state.uf]}
                  alt={`Ranking ${state.name}`}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
              ) : (
                <div className="flex flex-col items-center gap-2 opacity-40 group-hover:opacity-100 transition-opacity">
                  <Trophy className="w-12 h-12 text-[#475569]" />
                </div>
              )}
              {/* Overlay de gradiente */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#10131C] via-transparent to-transparent" />
            </div>

            {/* Conteúdo do Card */}
            <div className="p-5 flex-1 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors leading-tight uppercase tracking-tight">
                  {state.name}
                </h3>
              </div>

              <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                <Award className="w-4 h-4 text-emerald-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Circuito Norte</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Banner Informativo Consistente */}
      <div className="bg-emerald-500/5 p-8 rounded-[32px] border border-emerald-500/10 flex flex-col md:flex-row items-center gap-6 mt-12 shadow-inner">
        <div className="bg-emerald-500/10 p-4 rounded-2xl text-emerald-500">
          <Award className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Cálculo de Pontuação</h2>
          <p className="text-slate-500 text-sm max-w-3xl mt-1 leading-relaxed">
            Os rankings estaduais consideram a somatória de todos os resultados homologados em **Eventos Certificados** ocorridos dentro da UF correspondente. Atletas com ID Norte regularizado pontuam automaticamente em todas as etapas.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Rankings;
