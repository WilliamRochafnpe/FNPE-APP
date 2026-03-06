
import React, { useState, useMemo } from 'react';
import { 
  MessageSquare, 
  Calendar, 
  Download, 
  FileText, 
  CheckCircle, 
  ChevronRight, 
  X, 
  ArrowLeft,
  Clock,
  ExternalLink,
  ShieldAlert,
  Link as LinkIcon,
  CheckCheck,
  Award
} from 'lucide-react';
import { useApp } from '../App';
import { AppMessage } from '../types';

const UserMessages: React.FC = () => {
  const { db, setDb, user } = useApp();
  const [selectedMsg, setSelectedMsg] = useState<AppMessage | null>(null);

  const myMessages = useMemo(() => {
    if (!user) return [];
    return (db.messages || []).filter(msg => {
      const isRecipient = msg.destinatario_tipo === 'TODOS' || 
                         msg.destinatario_tipo === user.nivel ||
                         msg.destinatario_id === user.id;
      const isEnviada = msg.status === 'ENVIADA';
      return isRecipient && isEnviada;
    }).sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime());
  }, [db.messages, user]);

  const handleOpenMessage = (msg: AppMessage) => {
    setSelectedMsg(msg);
    if (!msg.lida_por?.includes(user!.id)) {
      setDb(prev => ({
        ...prev,
        messages: prev.messages.map(m => 
          m.id === msg.id 
            ? { ...m, lida_por: [...(m.lida_por || []), user!.id] } 
            : m
        )
      }));
    }
  };

  const markAllAsRead = () => {
    if (!user || myMessages.length === 0) return;
    setDb(prev => ({
      ...prev,
      messages: prev.messages.map(m => {
        const isRecipient = m.destinatario_tipo === 'TODOS' || 
                           m.destinatario_tipo === user.nivel ||
                           m.destinatario_id === user.id;
        if (isRecipient && !m.lida_por?.includes(user.id)) {
          return { ...m, lida_por: [...(m.lida_por || []), user.id] };
        }
        return m;
      })
    }));
  };

  const formatDate = (isoStr: string) => {
    return new Date(isoStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20 max-w-4xl mx-auto px-4 md:px-0">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Mensagens</h1>
          <p className="text-slate-500 font-medium italic">Comunicados oficiais e notificações da Federação.</p>
        </div>
        {myMessages.some(m => !m.lida_por?.includes(user!.id)) && (
          <button 
            onClick={markAllAsRead}
            className="flex items-center gap-2 text-indigo-400 font-black uppercase text-[10px] tracking-widest hover:text-indigo-300 transition-all border border-indigo-400/20 px-4 py-2 rounded-xl bg-indigo-400/5 shadow-sm"
          >
            <CheckCheck className="w-4 h-4" /> Marcar todas como lidas
          </button>
        )}
      </header>

      <div className="bg-slate-900 rounded-[40px] border border-slate-800 shadow-xl overflow-hidden divide-y divide-slate-800/50">
        {myMessages.length === 0 ? (
          <div className="py-24 text-center space-y-4">
             <MessageSquare className="w-16 h-16 text-slate-800 mx-auto opacity-50" />
             <p className="text-slate-600 font-black uppercase tracking-widest text-sm">Nenhuma mensagem recebida.</p>
          </div>
        ) : (
          myMessages.map(msg => {
            const isRead = msg.lida_por?.includes(user!.id);
            const isSystemAuto = msg.destinatario_tipo === 'INDIVIDUAL';
            
            return (
              <div 
                key={msg.id} 
                onClick={() => handleOpenMessage(msg)}
                className={`p-6 flex items-center justify-between cursor-pointer hover:bg-slate-950 transition-all group ${!isRead ? 'bg-indigo-500/5 border-l-4 border-l-indigo-500' : 'border-l-4 border-l-transparent opacity-60'}`}
              >
                <div className="flex items-center gap-6 overflow-hidden flex-1">
                   <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border transition-all ${!isRead ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>
                      {isSystemAuto ? <Award className="w-5 h-5 text-emerald-500" /> : msg.destinatario_tipo === 'ADMIN' ? <ShieldAlert className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                   </div>
                   <div className="overflow-hidden flex-1 pr-4">
                      <div className="flex items-center gap-3 mb-1">
                         <h3 className={`font-black uppercase tracking-tight truncate ${!isRead ? 'text-white' : 'text-slate-400'}`}>{msg.titulo}</h3>
                         {!isRead && <span className="w-2 h-2 bg-indigo-500 rounded-full shrink-0 animate-pulse"></span>}
                      </div>
                      <p className="text-xs text-slate-500 font-medium truncate opacity-60">
                        {msg.conteudo.substring(0, 80)}...
                      </p>
                   </div>
                </div>
                <div className="flex items-center gap-4">
                   <div className="hidden md:flex flex-col items-end">
                      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{formatDate(msg.data_envio)}</p>
                      {(msg.anexos.length > 0 || msg.link_externo) && (
                        <div className="flex items-center gap-2 mt-1 text-indigo-500">
                           {msg.link_externo && <LinkIcon className="w-3 h-3" />}
                           {msg.anexos.length > 0 && <span className="text-[8px] font-bold uppercase">{msg.anexos.length} ANEXOS</span>}
                        </div>
                      )}
                   </div>
                   <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-white group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            );
          })
        )}
      </div>

      {selectedMsg && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setSelectedMsg(null)}>
           <div 
            className="bg-slate-900 w-full max-w-2xl rounded-[48px] overflow-hidden border border-slate-800 shadow-2xl flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-300"
            onClick={e => e.stopPropagation()}
           >
             <div className="bg-[#6C4DE4] p-8 text-white flex justify-between items-start shrink-0 shadow-lg">
                <div className="space-y-4">
                   <button onClick={() => setSelectedMsg(null)} className="flex items-center gap-2 text-indigo-100/60 font-black uppercase text-[10px] tracking-widest hover:text-white transition-colors">
                      <ArrowLeft className="w-4 h-4" /> Voltar para lista
                   </button>
                   <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">{selectedMsg.titulo}</h2>
                   <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest border border-white/10">OFICIAL FNPE</span>
                      <span className="text-[10px] font-bold text-indigo-100/60 uppercase">{formatDate(selectedMsg.data_envio)}</span>
                   </div>
                </div>
                <button onClick={() => setSelectedMsg(null)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
             </div>

             <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar">
                <div className="prose prose-invert max-w-none">
                   <p className="text-slate-300 text-lg leading-relaxed font-medium whitespace-pre-wrap">
                      {selectedMsg.conteudo}
                   </p>
                </div>

                {selectedMsg.link_externo && (
                   <div className="bg-[#6C4DE4]/5 p-8 rounded-[32px] border border-[#6C4DE4]/20 flex flex-col items-center text-center gap-4 shadow-inner">
                      <LinkIcon className="w-8 h-8 text-[#6C4DE4]" />
                      <div>
                        <h4 className="text-white font-black uppercase text-sm">Link Relacionado</h4>
                        <p className="text-slate-500 text-xs mt-1">Este comunicado possui uma ação externa.</p>
                      </div>
                      <a 
                        href={selectedMsg.link_externo} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-[#6C4DE4] text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl shadow-[#6C4DE4]/20 hover:scale-105 transition-all flex items-center gap-2"
                      >
                        Acessar Agora <ExternalLink className="w-3 h-3" />
                      </a>
                   </div>
                )}

                {selectedMsg.anexos.length > 0 && (
                   <section className="space-y-4 pt-10 border-t border-slate-800">
                      <div className="flex items-center gap-2 text-emerald-500">
                         <Download className="w-5 h-5" />
                         <h4 className="text-xs font-black uppercase tracking-widest">Documentos Anexados</h4>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                         {selectedMsg.anexos.map(file => (
                            <a 
                              key={file.id} 
                              href={file.url_dados} 
                              target="_blank" 
                              rel="noreferrer"
                              className="flex items-center justify-between p-5 bg-slate-950 rounded-3xl border border-slate-800 hover:border-emerald-500/50 hover:bg-slate-900 transition-all group"
                            >
                               <div className="flex items-center gap-4 overflow-hidden">
                                  <div className="p-3 bg-slate-900 rounded-2xl text-emerald-500 group-hover:scale-110 transition-transform">
                                     <FileText className="w-5 h-5" />
                                  </div>
                                  <div className="overflow-hidden">
                                     <p className="text-sm font-bold text-slate-200 truncate pr-4">{file.nome}</p>
                                     <p className="text-[9px] font-black text-slate-600 uppercase">{(file.tamanho / 1024).toFixed(1)} KB</p>
                                  </div>
                               </div>
                               <Download className="w-4 h-4 text-slate-700 group-hover:text-emerald-500 transition-colors" />
                            </a>
                         ))}
                      </div>
                   </section>
                )}
             </div>

             <div className="p-8 bg-slate-950/50 border-t border-slate-800 flex justify-center shrink-0">
                <button 
                  onClick={() => setSelectedMsg(null)}
                  className="px-10 py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black uppercase text-xs tracking-[0.2em] rounded-[24px] transition-all"
                >
                  Fechar Mensagem
                </button>
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default UserMessages;
