
import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Trophy, Plus, Search, Phone, Image as ImageIcon, Edit3, Trash2, ShieldCheck, Globe } from 'lucide-react';
import { useApp } from '../App';
import { EventCertified } from '../types';
import EventFormModal from '../components/EventFormModal';

const Events: React.FC = () => {
  const { db, setDb, user, isMaster } = useApp();
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingEvent, setEditingEvent] = useState<EventCertified | undefined>(undefined);
  const [filter, setFilter] = useState('');
  const [selectedType, setSelectedType] = useState<'presencial' | 'online'>('presencial');

  const displayEvents = useMemo(() => {
    let baseEvents = (db.events || []).filter(e => (e.event_type || 'presencial') === selectedType);
    return baseEvents.filter(e =>
      (e.nome_evento || '').toLowerCase().includes(filter.toLowerCase()) ||
      (e.cidade || '').toLowerCase().includes(filter.toLowerCase()) ||
      (e.uf || '').toLowerCase().includes(filter.toLowerCase())
    ).sort((a, b) => new Date(b.data_evento).getTime() - new Date(a.data_evento).getTime());
  }, [db.events, filter, selectedType]);

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

  const handleDelete = (e: React.MouseEvent, eventId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (confirm("Tem certeza que deseja remover este evento certificado? Todos os resultados vinculados serão perdidos.")) {
      setDb(prev => ({
        ...prev,
        events: prev.events.filter(ev => ev.id !== eventId),
        results: prev.results.filter(res => res.evento_id !== eventId)
      }));
    }
  };

  const handleSaveEvent = (eventData: EventCertified) => {
    setDb(prev => {
      if (formMode === 'create') {
        return { ...prev, events: [...prev.events, eventData] };
      } else {
        return {
          ...prev,
          events: prev.events.map(ev => ev.id === eventData.id ? eventData : ev)
        };
      }
    });
    setIsModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">
            Eventos Certificados
          </h1>
          <p className="text-slate-500 font-medium italic">
            Calendário oficial de competições homologados pela FNPE.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-[20px] shadow-xl self-start md:self-center">
          <button
            onClick={() => setSelectedType('presencial')}
            className={`px-6 py-2.5 rounded-[14px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${selectedType === 'presencial' ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            <Trophy className="w-4 h-4" />
            Presencial
          </button>
          <button
            onClick={() => setSelectedType('online')}
            className={`px-6 py-2.5 rounded-[14px] font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2 ${selectedType === 'online' ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-white'}`}
          >
            <Globe className="w-4 h-4" />
            Online
          </button>
        </div>

        <div className="flex gap-2">
          {user?.nivel === 'ADMIN' ? (
            <>
              <button
                onClick={handleOpenCreate}
                className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-indigo-700 shadow-xl shadow-indigo-500/20 transition-all active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Certificar Evento
              </button>
              <button
                onClick={() => navigate('/app/admin/certificacoes')}
                className="bg-slate-800 text-slate-300 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 hover:text-slate-950 shadow-xl transition-all active:scale-95"
              >
                <ShieldCheck className="w-5 h-5" />
                Solicitações
              </button>
            </>
          ) : (
            <button
              onClick={() => navigate('/app/solicitar-certificacao')}
              className="bg-emerald-500 text-slate-950 px-6 py-3 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-400 shadow-xl shadow-emerald-500/20 transition-all active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" />
              Solicitar Certificação
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-[32px] border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
          <input
            type="text"
            placeholder="Pesquisar por nome, cidade ou UF..."
            value={filter}
            onChange={e => setFilter(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-white placeholder:text-slate-700"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {displayEvents.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900 rounded-[40px] border border-dashed border-slate-800">
            <Trophy className="w-12 h-12 text-slate-800 mx-auto mb-4" />
            <p className="text-slate-600 font-bold italic">Nenhum evento certificado encontrado.</p>
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

              <Link to={`/app/eventos/${event.id}`} className="block h-full">
                <div className="bg-slate-900 rounded-[40px] overflow-hidden shadow-xl border border-slate-800 hover:border-indigo-500/50 transition-all duration-300 h-full flex flex-col group-hover:-translate-y-1">
                  <div className="aspect-video w-full bg-slate-950 relative overflow-hidden">
                    {event.logo_url ? (
                      <img src={event.logo_url} alt={event.nome_evento} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full bg-slate-950 flex items-center justify-center"><ImageIcon className="w-12 h-12 text-slate-800" /></div>
                    )}
                    <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm">{event.uf}</div>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-4 h-4 text-indigo-500" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{new Date(event.data_evento).toLocaleDateString('pt-BR')}</span>
                    </div>
                    <h3 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-indigo-400 transition-colors">{event.nome_evento}</h3>
                    <p className="text-slate-400 text-sm mb-6 flex-1 line-clamp-2 font-medium leading-relaxed">{event.descricao}</p>
                    <div className="space-y-3 pt-4 border-t border-slate-800">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-slate-300 text-xs font-bold uppercase"><MapPin className="w-4 h-4 text-emerald-500" />{event.cidade}</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {event.tem_caiaque && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Caiaque</span>}
                        {event.tem_embarcado && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Embarcado</span>}
                        {event.tem_arremesso && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Arremesso</span>}
                        {event.tem_barranco && <span className="text-[9px] font-black bg-slate-950 text-slate-500 px-2 py-1 rounded-lg border border-slate-800 uppercase">Barranco</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            </div>
          ))
        )}
      </div>

      <EventFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSave={handleSaveEvent} mode={formMode} initialData={editingEvent} />
    </div>
  );
};

export default Events;
