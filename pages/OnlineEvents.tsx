
import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Plus, Search, Phone, Image as ImageIcon, Edit3, Trash2, ShieldCheck, Globe } from 'lucide-react';
import { useApp } from '../App';
import { EventCertified } from '../types';
import EventFormModal from '../components/EventFormModal';
import { onlineRankingService } from '../services/onlineRankingService';

const OnlineEvents: React.FC = () => {
    const { user, isMaster } = useApp();
    const navigate = useNavigate();
    const [events, setEvents] = useState<EventCertified[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
    const [editingEvent, setEditingEvent] = useState<EventCertified | undefined>(undefined);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        loadEvents();
    }, []);

    const loadEvents = async () => {
        setLoading(true);
        try {
            const data = await onlineRankingService.fetchEvents();
            setEvents(data);
        } catch (err) {
            console.error("Erro ao carregar eventos online:", err);
        } finally {
            setLoading(false);
        }
    };

    const displayEvents = useMemo(() => {
        return events.filter(e =>
            (e.nome_evento || '').toLowerCase().includes(filter.toLowerCase()) ||
            (e.cidade || '').toLowerCase().includes(filter.toLowerCase()) ||
            (e.uf || '').toLowerCase().includes(filter.toLowerCase())
        );
    }, [events, filter]);

    const handleOpenCreate = () => {
        setFormMode('create');
        setEditingEvent(undefined);
        setIsModalOpen(true);
    };

    const handleOpenEdit = (e: React.MouseEvent, event: EventCertified) => {
        e.preventDefault();
        e.stopPropagation();
        setFormMode('edit');
        setEditingEvent(event);
        setIsModalOpen(true);
    };

    const handleDelete = async (e: React.MouseEvent, eventId: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (confirm("Tem certeza que deseja remover este evento ONLINE? Todos os resultados vinculados serão perdidos.")) {
            try {
                await onlineRankingService.deleteEvent(eventId);
                setEvents(prev => prev.filter(ev => ev.id !== eventId));
            } catch (err) {
                alert("Erro ao excluir evento");
            }
        }
    };

    const handleSaveEvent = async (eventData: EventCertified) => {
        try {
            const saved = await onlineRankingService.saveEvent(eventData);
            if (formMode === 'create') {
                setEvents(prev => [saved, ...prev]);
            } else {
                setEvents(prev => prev.map(ev => ev.id === saved.id ? saved : ev));
            }
            setIsModalOpen(false);
        } catch (err) {
            alert("Erro ao salvar evento");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <Globe className="w-6 h-6 text-indigo-500 animate-pulse" />
                        <span className="bg-indigo-500/10 text-indigo-500 text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest border border-indigo-500/20">Módulo Online</span>
                    </div>
                    <h1 className="text-3xl font-black text-white tracking-tight uppercase">
                        Ranking Online - Eventos
                    </h1>
                    <p className="text-slate-500 font-medium italic">
                        Competições realizadas exclusivamente em ambiente virtual.
                    </p>
                </div>

                <div className="flex gap-2">
                    {isMaster && (
                        <button
                            onClick={handleOpenCreate}
                            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95 flex items-center gap-2"
                        >
                            <Plus className="w-5 h-5" />
                            Criar Evento Online
                        </button>
                    )}
                </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-[32px] border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center">
                <div className="relative flex-1 w-full">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Pesquisar eventos online..."
                        value={filter}
                        onChange={e => setFilter(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-white placeholder:text-slate-700"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {displayEvents.length === 0 ? (
                        <div className="col-span-full py-20 text-center bg-slate-900 rounded-[40px] border border-dashed border-slate-800">
                            <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
                            <p className="text-slate-600 font-bold italic">Nenhum evento online encontrado.</p>
                        </div>
                    ) : (
                        displayEvents.map((event) => (
                            <div key={event.id} className="relative group">
                                {isMaster && (
                                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                                        <button onClick={(e) => handleOpenEdit(e, event)} className="p-2 bg-slate-900/90 backdrop-blur-sm text-indigo-400 rounded-xl shadow-lg hover:bg-indigo-600 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                                        <button onClick={(e) => handleDelete(e, event.id)} className="p-2 bg-slate-900/90 backdrop-blur-sm text-red-400 rounded-xl shadow-lg hover:bg-red-600 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                )}

                                <Link to={`/app/ranking-online/evento/${event.id}`} className="block h-full">
                                    <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1">
                                        <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                                            {event.logo_url ? (
                                                <img src={event.logo_url} alt={event.nome_evento} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                            ) : (
                                                <div className="w-full h-full bg-slate-950 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-800" /></div>
                                            )}
                                            <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm">Online</div>
                                        </div>
                                        <div className="p-6 flex-1 flex flex-col">
                                            <div className="flex items-center gap-2 mb-3">
                                                <Calendar className="w-4 h-4 text-indigo-500" />
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(event.data_evento).toLocaleDateString('pt-BR')}</span>
                                            </div>
                                            <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors uppercase">{event.nome_evento}</h3>
                                            <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-2 font-medium leading-relaxed">{event.descricao}</p>
                                            <div className="space-y-3 pt-4 border-t border-slate-800">
                                                <div className="flex flex-wrap gap-2">
                                                    {event.tem_caiaque && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Caiaque</span>}
                                                    {event.tem_embarcado && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Embarcado</span>}
                                                    {event.tem_arremesso && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Arremesso</span>}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            </div>
                        ))
                    )}
                </div>
            )}

            <EventFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSave={handleSaveEvent}
                mode={formMode}
                initialData={editingEvent}
            />
        </div>
    );
};

export default OnlineEvents;
