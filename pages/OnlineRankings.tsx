
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Globe, Award } from 'lucide-react';
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

const OnlineRankings: React.FC = () => {
    const { db } = useApp();
    const navigate = useNavigate();

    // Puxa as capas específicas do módulo ONLINE
    const rankingsCovers = db.settings?.onlineRankingsCovers || {};

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-screen-xl mx-auto px-4 md:px-0">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-5 h-5 text-indigo-500 animate-pulse" />
                        <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-500/20">Módulo Online</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">Rankings Estaduais Online</h1>
                    <p className="text-slate-500 font-medium italic">Classificação geral baseada em torneios virtuais.</p>
                </div>

                <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-[20px] shadow-xl self-start md:self-center">
                    <button
                        onClick={() => navigate('/app/ranking-estadual')}
                        className="px-6 py-2.5 rounded-[14px] text-slate-500 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                        <Trophy className="w-4 h-4" />
                        Presencial
                    </button>
                    <button
                        className="px-6 py-2.5 rounded-[14px] bg-indigo-500 text-white font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-2"
                    >
                        <Globe className="w-4 h-4" />
                        Online
                    </button>
                </div>
            </header>

            {/* Grid de Rankings Estilo Eventos (Identico ao presencial) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {STATES.map((state) => (
                    <div
                        key={state.uf}
                        onClick={() => navigate(`/app/ranking-online/${state.uf}`)}
                        className="group relative bg-[#10131C] rounded-2xl overflow-hidden border border-slate-800 shadow-md hover:scale-[1.02] hover:border-indigo-500/50 transition-all cursor-pointer flex flex-col h-[300px]"
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
                                    <Trophy className="w-12 h-12 text-indigo-900" />
                                    <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em]">Padrão Online</span>
                                </div>
                            )}
                            {/* Overlay de gradiente */}
                            <div className="absolute inset-0 bg-gradient-to-t from-[#10131C] via-transparent to-transparent" />
                        </div>

                        {/* Conteúdo do Card */}
                        <div className="p-5 flex-1 flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors leading-tight uppercase tracking-tight">
                                    {state.name}
                                </h3>
                            </div>

                            <div className="flex items-center gap-2 pt-4 border-t border-slate-800/50">
                                <Globe className="w-4 h-4 text-indigo-500" />
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Torneio Virtual</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Banner Informativo Consistente */}
            <div className="bg-indigo-500/5 p-8 rounded-[32px] border border-indigo-500/10 flex flex-col md:flex-row items-center gap-6 mt-12 shadow-inner">
                <div className="bg-indigo-500/10 p-4 rounded-2xl text-indigo-500">
                    <Award className="w-8 h-8" />
                </div>
                <div>
                    <h2 className="text-xl font-black text-white uppercase tracking-tight">Cálculo Online</h2>
                    <p className="text-slate-500 text-sm max-w-3xl mt-1 leading-relaxed">
                        O ranking estadual **ONLINE** considera exclusivamente a somatória de resultados obtidos em eventos virtuais. Estes pontos são independentes do ranking presencial, permitindo uma disputa justa e exclusiva no ambiente virtual.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default OnlineRankings;
