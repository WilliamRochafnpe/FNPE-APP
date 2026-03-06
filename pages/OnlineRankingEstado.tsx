
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Trophy, ArrowLeft, Globe, Medal, Star, MapPin } from 'lucide-react';
import { onlineRankingService } from '../services/onlineRankingService';

const OnlineRankingEstado: React.FC = () => {
    const { uf } = useParams();
    const navigate = useNavigate();
    const [ranking, setRanking] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (uf) loadData();
    }, [uf]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await onlineRankingService.fetchStateRanking(uf!);
            setRanking(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-screen-md mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <button onClick={() => navigate('/app/ranking-online')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 font-black uppercase text-[10px] tracking-[0.2em] transition-all group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar Estados
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-indigo-500/30 rounded-full text-indigo-400 font-bold text-xs uppercase tracking-widest">
                    <MapPin className="w-3 h-3" /> {uf} - ONLINE
                </div>
            </header>

            <section className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-2xl overflow-hidden">
                <div className="bg-slate-950 p-8 md:p-12 border-b border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-48 h-48 bg-indigo-600/10 blur-[60px] rounded-full -mr-24 -mt-24"></div>
                    <div className="relative z-10 space-y-4">
                        <div className="flex items-center gap-3">
                            <Globe className="w-6 h-6 text-indigo-500" />
                            <span className="text-xs font-black text-indigo-500 uppercase tracking-[0.3em]">Federação Norte</span>
                        </div>
                        <h1 className="text-4xl font-black text-white uppercase tracking-tight">Ranking {uf} <span className="text-indigo-500">Online</span></h1>
                        <p className="text-slate-500 font-medium max-w-md italic">A classificação abaixo reflete a soma de todos os pontos conquistados em eventos virtuais oficiais.</p>
                    </div>
                </div>

                <div className="p-6 md:p-10">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-800/30">
                                {ranking.length === 0 ? (
                                    <tr><td className="py-20 text-center text-slate-600 italic font-black uppercase tracking-widest text-xs opacity-50">Nenhum atleta ranqueado neste estado.</td></tr>
                                ) : (
                                    ranking.map((res, idx) => (
                                        <tr key={res.atleta_id} className="group hover:bg-slate-950/40 transition-colors">
                                            <td className="py-6 px-4 w-20">
                                                <div className="relative">
                                                    <span className={`w-10 h-10 flex items-center justify-center rounded-xl font-black text-xs border ${idx === 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/30 shadow-lg shadow-amber-500/10' : 'bg-slate-900 text-slate-500 border-slate-800'}`}>
                                                        {idx + 1}º
                                                    </span>
                                                    {idx < 3 && <Star className={`w-4 h-4 absolute -top-2 -right-2 fill-current ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-300' : 'text-amber-700'}`} />}
                                                </div>
                                            </td>
                                            <td className="py-6 px-4">
                                                <p className="font-black text-white uppercase text-base tracking-tight group-hover:text-indigo-400 transition-colors">{res.nome_completo}</p>
                                                <div className="flex items-center gap-4 mt-1">
                                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">ID NORTE: {res.id_norte_numero || 'PENDENTE'}</p>
                                                    <span className="w-1 h-1 bg-slate-800 rounded-full"></span>
                                                    <p className="text-[10px] font-black text-emerald-500/70 uppercase tracking-widest">{res.eventos_contados} Eventos</p>
                                                </div>
                                            </td>
                                            <td className="py-6 px-4 text-right">
                                                <div className="flex flex-col items-end">
                                                    <span className="text-2xl font-black text-white tabular-nums">{(res.pontuacao_total || 0).toLocaleString('pt-BR')}</span>
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Pontos Totais</span>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Trophy className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Top Score Geral</p>
                        <p className="text-lg font-black text-white uppercase truncate">{ranking[0]?.nome_completo || '-'}</p>
                    </div>
                </div>
                <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-800 flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-500/10 rounded-2xl flex items-center justify-center shrink-0">
                        <Medal className="w-6 h-6 text-indigo-500" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Atletas Ativos</p>
                        <p className="text-lg font-black text-white uppercase tabular-nums">{ranking.length}</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OnlineRankingEstado;
