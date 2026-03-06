
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
    Calendar, Trophy, Plus, Trash2, ArrowLeft,
    Image as ImageIcon, FileText, Globe, Medal
} from 'lucide-react';
import { useApp } from '../App';
import { Category, EventCertified } from '../types';
import { onlineRankingService } from '../services/onlineRankingService';
import { supabase } from '../lib/supabase';

const OnlineEventDetails: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useApp();
    const [event, setEvent] = useState<EventCertified | null>(null);
    const [results, setResults] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const categories = useMemo(() => {
        if (!event) return [];
        const cats: Category[] = [];
        if (event.tem_caiaque) cats.push('CAIAQUE');
        if (event.tem_embarcado) cats.push('EMBARCADO');
        if (event.tem_arremesso) cats.push('ARREMESSO');
        return cats;
    }, [event]);

    const [activeTab, setActiveTab] = useState<Category>('CAIAQUE');

    useEffect(() => {
        if (categories.length > 0 && !categories.includes(activeTab)) {
            setActiveTab(categories[0]);
        }
    }, [categories]);

    useEffect(() => {
        if (id) loadData();
    }, [id]);

    const loadData = async () => {
        setLoading(true);
        try {
            const ev = await onlineRankingService.fetchEventById(id!);
            setEvent(ev);
            const res = await onlineRankingService.fetchResultsByEvent(id!);
            setResults(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const filteredResults = useMemo(() => {
        return results.filter(r => r.categoria === activeTab);
    }, [results, activeTab]);

    const handleAddResult = async () => {
        const atletaIdNorte = prompt("Digite o ID Norte do Atleta:");
        if (!atletaIdNorte) return;

        const pontuacao = prompt("Digite a Pontuação:");
        if (!pontuacao || isNaN(Number(pontuacao))) return;

        try {
            // Busca atleta pelo ID Norte
            const { data: atleta, error: aErr } = await supabase
                .from('atletas')
                .select('id, nome_completo, id_norte_numero')
                .eq('id_norte_numero', atletaIdNorte)
                .single();

            if (aErr || !atleta) {
                alert("Atleta não encontrado com este ID Norte.");
                return;
            }

            const { data: newRes, error: iErr } = await supabase
                .from('online_results')
                .insert({
                    evento_id: id,
                    atleta_id: atleta.id,
                    id_norte_numero: atleta.id_norte_numero,
                    categoria: activeTab,
                    pontuacao: Number(pontuacao)
                })
                .select('*, atletas(nome_completo, id_norte_numero)')
                .single();

            if (iErr) throw iErr;

            setResults(prev => [...prev, newRes]);
            alert("Resultado lançado com sucesso!");
        } catch (err) {
            alert("Erro ao lançar resultado.");
        }
    };

    const handleDeleteResult = async (resId: string) => {
        if (!confirm("Remover este resultado?")) return;
        try {
            const { error } = await supabase.from('online_results').delete().eq('id', resId);
            if (error) throw error;
            setResults(prev => prev.filter(r => r.id !== resId));
        } catch (err) {
            alert("Erro ao remover.");
        }
    };

    if (loading) return (
        <div className="flex justify-center py-40">
            <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!event) return <div className="p-8 text-center font-black text-white py-20 uppercase tracking-widest">Evento Online não encontrado.</div>;

    return (
        <div className="max-w-screen-md mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
            <header className="flex items-center justify-between">
                <button onClick={() => navigate('/app/ranking-online/eventos')} className="flex items-center gap-2 text-slate-500 hover:text-indigo-500 font-black uppercase text-[10px] tracking-[0.2em] transition-all group">
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                    Voltar para Eventos Online
                </button>
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-900 border border-indigo-500/30 rounded-full text-indigo-400 font-bold text-xs">
                    <Globe className="w-3 h-3" />
                    MÓDULO ONLINE
                </div>
            </header>

            <section className="bg-slate-900 p-8 rounded-[32px] border border-slate-800 shadow-xl space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full -mr-16 -mt-16"></div>

                <div className="flex items-start gap-6">
                    <div className="w-24 h-24 bg-slate-950 rounded-[24px] overflow-hidden border-2 border-slate-800 shadow-2xl flex items-center justify-center shrink-0">
                        {event.logo_url ? <img src={event.logo_url} className="w-full h-full object-cover" /> : <Trophy className="w-10 h-10 text-slate-800" />}
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-white uppercase tracking-tight leading-tight">{event.nome_evento}</h1>
                        <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase">
                            <Calendar className="w-4 h-4 text-indigo-500" />
                            {new Date(event.data_evento).toLocaleDateString('pt-BR')}
                        </div>
                        <p className="text-slate-500 italic text-sm">"{event.descricao}"</p>
                    </div>
                </div>
            </section>

            <section className="bg-slate-900 rounded-[32px] border border-slate-800 shadow-xl overflow-hidden">
                <div className="p-2 bg-slate-950 border-b border-slate-800 flex flex-wrap gap-2">
                    {categories.map(cat => (
                        <button key={cat} onClick={() => setActiveTab(cat)} className={`flex-1 py-3 px-4 rounded-xl font-black uppercase tracking-widest text-[9px] transition-all ${activeTab === cat ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}>{cat}</button>
                    ))}
                </div>

                <div className="p-6 md:p-8">
                    <div className="flex flex-col sm:flex-row justify-between items-center mb-8 gap-4">
                        <h2 className="text-xl font-black text-white uppercase tracking-tight flex items-center gap-2">
                            <Medal className="w-5 h-5 text-indigo-500" />
                            Ranking: {activeTab}
                        </h2>
                        {user?.nivel === 'ADMIN' && (
                            <button
                                onClick={handleAddResult}
                                className="w-full sm:w-auto bg-indigo-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
                            >
                                <Plus className="w-4 h-4" /> Lançar Resultado Online
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <tbody className="divide-y divide-slate-800/50">
                                {filteredResults.length === 0 ? (
                                    <tr><td className="py-16 text-center text-slate-600 italic font-black uppercase tracking-widest text-[10px] opacity-50">Nenhum resultado online registrado para {activeTab}.</td></tr>
                                ) : (
                                    filteredResults.sort((a, b) => b.pontuacao - a.pontuacao).map((res, idx) => (
                                        <tr key={res.id} className="group hover:bg-slate-950/50 transition-colors">
                                            <td className="py-5 px-4 w-16">
                                                <span className={`w-8 h-8 flex items-center justify-center rounded-lg font-black text-[11px] border ${idx === 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 'bg-slate-900 text-slate-500'}`}>
                                                    {idx + 1}º
                                                </span>
                                            </td>
                                            <td className="py-5 px-4">
                                                <p className="font-bold text-white uppercase text-sm">{res.atletas?.nome_completo || 'Atleta'}</p>
                                                <p className="text-[9px] font-black text-slate-500 uppercase">ID NORTE: {res.id_norte_numero}</p>
                                            </td>
                                            <td className="py-5 px-4 text-right">
                                                <div className="font-black text-lg text-white">{(res.pontuacao || 0).toLocaleString('pt-BR')} PTS</div>
                                            </td>
                                            {user?.nivel === 'ADMIN' && (
                                                <td className="py-5 px-4 w-12 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button onClick={() => handleDeleteResult(res.id)} className="p-2 hover:bg-slate-800 rounded-lg text-slate-500 hover:text-red-500 transition-colors">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </section>
        </div>
    );
};


export default OnlineEventDetails;
