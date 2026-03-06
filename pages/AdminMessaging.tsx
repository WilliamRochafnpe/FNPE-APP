
import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Send, 
  CalendarClock, 
  UploadCloud, 
  X, 
  FileText, 
  Paperclip, 
  CheckCircle2, 
  AlertCircle,
  Users,
  ShieldCheck,
  Layout,
  Type,
  Loader2,
  Plus,
  Link as LinkIcon,
  History,
  Trash2,
  Clock,
  Search,
  User as UserIcon,
  BellRing
} from 'lucide-react';
import { useApp } from '../App';
import { AppMessage, MessageRecipientType, ArquivoUpload, User } from '../types';
import { uploadFile } from '../services/storage';

const AdminMessaging: React.FC = () => {
  const { db, setDb, user: currentUser } = useApp();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const [titulo, setTitulo] = useState('');
  const [conteudo, setConteudo] = useState('');
  const [linkExterno, setLinkExterno] = useState('');
  const [destinatario, setDestinatario] = useState<MessageRecipientType>('TODOS');
  const [anexos, setAnexos] = useState<ArquivoUpload[]>([]);
  const [agendar, setAgendar] = useState(false);
  const [dataAgendada, setDataAgendada] = useState('');

  // Estados para busca individual por ID Norte
  const [searchIdNorte, setSearchIdNorte] = useState('');
  const [selectedIndividual, setSelectedIndividual] = useState<User | null>(null);
  const [showIdSuggestions, setShowIdSuggestions] = useState(false);

  const history = useMemo(() => {
    return (db.messages || []).sort((a, b) => new Date(b.data_envio).getTime() - new Date(a.data_envio).getTime());
  }, [db.messages]);

  const idSuggestions = useMemo(() => {
    if (!searchIdNorte.trim() || searchIdNorte.length < 2) return [];
    return db.users.filter(u => 
      u.id_norte_numero?.toLowerCase().includes(searchIdNorte.toLowerCase()) ||
      u.nome_completo.toLowerCase().includes(searchIdNorte.toLowerCase())
    ).slice(0, 5);
  }, [db.users, searchIdNorte]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0) return;
    if (anexos.length + files.length > 3) {
      alert("Limite máximo de 3 anexos por mensagem.");
      return;
    }

    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadFile(file, 'mensagens/anexos');
        const newAnexo: ArquivoUpload = {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          nome: file.name,
          tipo_mime: file.type,
          tamanho: file.size,
          url_dados: url
        };
        setAnexos(prev => [...prev, newAnexo]);
      }
    } catch (err: any) {
      alert("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAnexo = (id: string) => {
    setAnexos(prev => prev.filter(a => a.id !== id));
  };

  const handleDeleteMessage = (id: string) => {
    if (!confirm("Excluir comunicado permanentemente? Esta ação não pode ser desfeita.")) return;
    setDb(prev => ({
      ...prev,
      messages: prev.messages.filter(m => m.id !== id)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!titulo.trim() || !conteudo.trim()) return;

    setLoading(true);
    
    const finalDestinatarioTipo = selectedIndividual ? 'INDIVIDUAL' : destinatario;

    const newMessage: AppMessage = {
      id: `msg-${Date.now()}`,
      titulo: titulo.trim(),
      conteudo: conteudo.trim(),
      link_externo: linkExterno.trim() || undefined,
      anexos,
      destinatario_tipo: finalDestinatarioTipo,
      destinatario_id: selectedIndividual?.id,
      data_envio: agendar ? dataAgendada : new Date().toISOString(),
      data_agendada: agendar ? dataAgendada : undefined,
      enviado_por: currentUser!.id,
      status: agendar ? 'AGENDADA' : 'ENVIADA',
      lida_por: []
    };

    setTimeout(() => {
      setDb(prev => ({
        ...prev,
        messages: [newMessage, ...(prev.messages || [])]
      }));
      setLoading(false);
      alert(agendar ? "📢 Comunicado agendado com sucesso!" : "📢 Comunicado publicado com sucesso!");
      
      // Limpar formulário
      setTitulo('');
      setConteudo('');
      setLinkExterno('');
      setAnexos([]);
      setAgendar(false);
      setDataAgendada('');
      setSelectedIndividual(null);
      setSearchIdNorte('');
    }, 800);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <header className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Comunicação Oficial</h1>
          <p className="text-slate-500 font-medium italic">Painel exclusivo para administração da FNPE.</p>
        </div>
        <div className="p-3 bg-[#6C4DE4]/10 rounded-2xl text-[#6C4DE4] border border-[#6C4DE4]/20 shadow-lg">
          <ShieldCheck className="w-8 h-8" />
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Editor */}
        <div className="lg:col-span-2 space-y-6">
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <Type className="w-3 h-3 text-[#6C4DE4]" /> Título do Comunicado
              </label>
              <input 
                required
                value={titulo}
                onChange={e => setTitulo(e.target.value)}
                placeholder="Ex: Novo Regulamento de Pesca 2025"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold text-lg outline-none focus:ring-2 focus:ring-[#6C4DE4] transition-all placeholder:text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <Layout className="w-3 h-3 text-[#6C4DE4]" /> Texto da Mensagem
              </label>
              <textarea 
                required
                value={conteudo}
                onChange={e => setConteudo(e.target.value)}
                placeholder="Descreva aqui o informativo completo que os usuários visualizarão..."
                className="w-full bg-slate-950 border border-slate-800 rounded-[32px] p-8 text-slate-200 font-medium leading-relaxed outline-none focus:ring-2 focus:ring-[#6C4DE4] transition-all h-[300px] resize-none placeholder:text-slate-800"
              />
            </div>

            <div className="space-y-2">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <LinkIcon className="w-3 h-3 text-[#6C4DE4]" /> Link de Ação (Opcional)
              </label>
              <input 
                value={linkExterno}
                onChange={e => setLinkExterno(e.target.value)}
                placeholder="https://siteoficial.com/mais-informacoes"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4] transition-all placeholder:text-slate-800"
              />
            </div>
          </section>

          {/* Anexos */}
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-500">
                <Paperclip className="w-5 h-5" />
                <h3 className="text-xs font-black uppercase tracking-widest">Documentos em Anexo (Máx 3)</h3>
              </div>
              <span className="text-[10px] font-bold text-slate-600">{anexos.length}/3</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {anexos.map(file => (
                <div key={file.id} className="flex items-center justify-between p-4 bg-slate-950 rounded-2xl border border-slate-800 group">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="p-2 bg-slate-900 rounded-xl text-emerald-500 shrink-0">
                      <FileText className="w-4 h-4" />
                    </div>
                    <p className="text-xs font-bold text-slate-400 truncate">{file.nome}</p>
                  </div>
                  <button type="button" onClick={() => removeAnexo(file.id)} className="p-2 text-slate-700 hover:text-red-500 transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {anexos.length < 3 && (
                <label className="flex items-center justify-center gap-3 p-4 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-950 transition-all text-slate-500 hover:text-emerald-500 group">
                  {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <UploadCloud className="w-5 h-5 group-hover:scale-110 transition-transform" />}
                  <span className="text-[10px] font-black uppercase tracking-widest">Subir Arquivo</span>
                  <input type="file" className="hidden" multiple onChange={handleFileUpload} disabled={uploading} />
                </label>
              )}
            </div>
          </section>
        </div>

        {/* Lado Direito: Configurações de Envio */}
        <div className="space-y-6">
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-8 sticky top-24">
            
            {/* Público Destinatário */}
            <div className="space-y-4">
              <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <Users className="w-3 h-3 text-[#6C4DE4]" /> Público Destinatário
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(['TODOS', 'ATLETA', 'PESCADOR', 'DIRETORIA', 'ADMIN'] as MessageRecipientType[]).filter(t => t !== 'INDIVIDUAL').map(type => (
                  <button
                    key={type}
                    type="button"
                    disabled={!!selectedIndividual}
                    onClick={() => setDestinatario(type)}
                    className={`p-3 rounded-xl font-black text-[9px] uppercase tracking-wider border-2 transition-all text-center ${
                      destinatario === type && !selectedIndividual
                        ? 'bg-[#6C4DE4] border-[#6C4DE4] text-white shadow-lg' 
                        : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'
                    } ${selectedIndividual ? 'opacity-30' : ''}`}
                  >
                    {type}
                  </button>
                ))}
              </div>
            </div>

            {/* BUSCA POR ID NORTE (INDIVIDUAL) */}
            <div className="space-y-4 pt-6 border-t border-slate-800">
               <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                <Search className="w-3 h-3 text-[#6C4DE4]" /> Buscar por ID Norte (Opcional)
              </label>
              
              <div className="relative">
                {selectedIndividual ? (
                  <div className="bg-[#6C4DE4]/10 border border-[#6C4DE4] p-4 rounded-2xl flex items-center justify-between group">
                    <div className="flex items-center gap-3 overflow-hidden">
                       <div className="w-8 h-8 bg-[#6C4DE4] rounded-lg flex items-center justify-center text-white shrink-0">
                          <UserIcon className="w-4 h-4" />
                       </div>
                       <div className="overflow-hidden">
                          <p className="text-xs font-bold text-white truncate">{selectedIndividual.nome_completo}</p>
                          <p className="text-[9px] font-black text-[#6C4DE4] uppercase">{selectedIndividual.id_norte_numero}</p>
                       </div>
                    </div>
                    <button 
                      type="button" 
                      onClick={() => { setSelectedIndividual(null); setSearchIdNorte(''); }} 
                      className="p-1 text-[#6C4DE4] hover:bg-[#6C4DE4] hover:text-white rounded-lg transition-all"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="relative">
                      <input 
                        value={searchIdNorte}
                        onChange={e => { setSearchIdNorte(e.target.value); setShowIdSuggestions(true); }}
                        placeholder="Nome ou ID-00000"
                        onFocus={() => setShowIdSuggestions(true)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-3 pl-4 pr-10 text-white font-bold text-xs outline-none focus:ring-2 focus:ring-[#6C4DE4]"
                      />
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-700" />
                    </div>

                    {showIdSuggestions && idSuggestions.length > 0 && (
                      <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in zoom-in-95">
                        {idSuggestions.map(u => (
                          <div 
                            key={u.id}
                            onClick={() => { setSelectedIndividual(u); setShowIdSuggestions(false); }}
                            className="p-4 hover:bg-slate-950 cursor-pointer flex items-center gap-3 border-b border-slate-800 last:border-0"
                          >
                             <div className="w-8 h-8 bg-slate-800 rounded-lg flex items-center justify-center text-slate-500">
                                {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : <UserIcon className="w-4 h-4" />}
                             </div>
                             <div>
                                <p className="text-xs font-bold text-white leading-none">{u.nome_completo}</p>
                                <p className="text-[9px] font-black text-slate-500 uppercase mt-1">{u.id_norte_numero || 'SEM ID'}</p>
                             </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
              <p className="text-[8px] text-slate-600 italic px-1">Se selecionado, a mensagem será enviada apenas para este usuário.</p>
            </div>

            {/* Agendamento */}
            <div className="space-y-6 pt-6 border-t border-slate-800">
               <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">
                    <CalendarClock className="w-3 h-3 text-[#6C4DE4]" /> Agendar Postagem
                  </label>
                  <button 
                    type="button"
                    onClick={() => setAgendar(!agendar)}
                    className={`w-12 h-6 rounded-full p-1 transition-colors ${agendar ? 'bg-[#6C4DE4]' : 'bg-slate-950 border border-slate-800'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${agendar ? 'translate-x-6' : 'translate-x-0'}`} />
                  </button>
               </div>

               {agendar && (
                 <div className="space-y-2 animate-in slide-in-from-top-2">
                    <input 
                      type="datetime-local" 
                      required={agendar}
                      value={dataAgendada}
                      onChange={e => setDataAgendada(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 focus:ring-[#6C4DE4]"
                    />
                 </div>
               )}
            </div>

            {/* Ação Final */}
            <div className="pt-6">
              <button 
                type="submit"
                disabled={loading || !titulo || !conteudo || (agendar && !dataAgendada)}
                className={`w-full py-5 rounded-[24px] font-black uppercase text-xs tracking-widest shadow-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50 ${
                  agendar 
                    ? 'bg-[#6C4DE4] text-white hover:bg-[#5A3CC2] shadow-[#6C4DE4]/20' 
                    : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-emerald-500/20'
                }`}
              >
                {loading ? <Loader2 className="w-6 h-6 animate-spin" /> : (
                  <>
                    {agendar ? <Clock className="w-5 h-5" /> : <BellRing className="w-5 h-5" />}
                    {agendar ? "📋 AGENDAR AGORA" : "📢 PUBLICAR COMUNICADO"}
                  </>
                )}
              </button>
            </div>
          </section>
        </div>
      </form>

      {/* HISTÓRICO DE MENSAGENS */}
      <section className="space-y-6">
         <div className="flex items-center gap-3 ml-2">
            <History className="text-slate-500 w-6 h-6" />
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Histórico de Comunicados</h2>
         </div>
         <div className="bg-slate-900 border border-slate-800 rounded-[40px] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead>
                     <tr className="bg-slate-950/50">
                        <th className="py-4 px-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Data / Status</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Comunicado</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-600 uppercase tracking-widest">Público</th>
                        <th className="py-4 px-8 text-[10px] font-black text-slate-600 uppercase tracking-widest text-center">Ação</th>
                     </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/50">
                     {history.length === 0 ? (
                        <tr><td colSpan={4} className="py-12 text-center text-slate-500 italic text-sm">Nenhum histórico disponível.</td></tr>
                     ) : (
                        history.map(msg => (
                           <tr key={msg.id} className="hover:bg-slate-950/40 transition-colors">
                              <td className="py-4 px-8">
                                 <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-tight">{new Date(msg.data_envio).toLocaleDateString()}</span>
                                    <span className={`text-[8px] font-black uppercase mt-1 ${msg.status === 'AGENDADA' ? 'text-amber-500' : 'text-emerald-500'}`}>
                                       {msg.status}
                                    </span>
                                 </div>
                              </td>
                              <td className="py-4 px-8 max-w-xs truncate">
                                 <p className="font-bold text-white text-sm uppercase">{msg.titulo}</p>
                              </td>
                              <td className="py-4 px-8">
                                 <span className="bg-slate-800 text-slate-400 px-2 py-1 rounded text-[8px] font-black uppercase">
                                   {msg.destinatario_tipo === 'INDIVIDUAL' ? 'DIRECIONADA' : msg.destinatario_tipo}
                                 </span>
                              </td>
                              <td className="py-4 px-8 text-center">
                                 <button 
                                    onClick={() => handleDeleteMessage(msg.id)}
                                    className="p-2 text-slate-700 hover:text-red-500 transition-colors"
                                 >
                                    <Trash2 className="w-4 h-4" />
                                 </button>
                              </td>
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

export default AdminMessaging;
