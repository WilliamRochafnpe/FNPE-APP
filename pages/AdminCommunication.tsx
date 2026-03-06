
import React, { useState, useMemo } from 'react';
import { Send, Users, Shield, Search, CheckSquare, Square, Sparkles, MessageCircle, AlertCircle } from 'lucide-react';
import { useApp } from '../App';
import { askAssistant } from '../geminiService';

const AdminCommunication: React.FC = () => {
  const { db, user: currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<'PESCADORES' | 'ATLETAS'>('PESCADORES');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loadingIA, setLoadingIA] = useState(false);
  const [sending, setSending] = useState(false);

  const list = useMemo(() => {
    return db.users.filter(u => {
      const matchesSearch = u.nome_completo.toLowerCase().includes(searchTerm.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const isTarget = activeTab === 'PESCADORES' ? u.id_norte_status !== 'APROVADO' : u.id_norte_status === 'APROVADO';
      return matchesSearch && isTarget && u.id !== currentUser?.id;
    });
  }, [db.users, activeTab, searchTerm, currentUser]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const selectAll = () => {
    if (selectedIds.length === list.length) setSelectedIds([]);
    else setSelectedIds(list.map(u => u.id));
  };

  const handleImproveMessage = async () => {
    if (!message.trim()) return;
    setLoadingIA(true);
    try {
      const prompt = `Melhore esta mensagem de notificação para ${activeTab === 'PESCADORES' ? 'pescadores que ainda não solicitaram a ID Norte' : 'atletas profissionais da federação'}. Deixe-a profissional, motivadora e direta: "${message}"`;
      const improved = await askAssistant(prompt);
      // Fixed: access .text property from AssistantResponse to correctly update the string state
      setMessage(improved.text);
    } catch (err) {
      alert("Erro ao usar IA para melhorar a mensagem.");
    } finally {
      setLoadingIA(false);
    }
  };

  const handleSend = () => {
    if (selectedIds.length === 0 || !message.trim()) return;
    setSending(true);
    // Simula envio
    setTimeout(() => {
      alert(`Mensagem enviada com sucesso para ${selectedIds.length} usuários!`);
      setMessage('');
      setSelectedIds([]);
      setSending(false);
    }, 1000);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Comunicação Admin</h1>
        <p className="text-slate-500">Notifique pescadores sem ID Norte ou envie comunicados para atletas.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lado Esquerdo: Lista de Usuários */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-2 bg-slate-50 border-b border-slate-100 flex gap-2">
              <button 
                onClick={() => { setActiveTab('PESCADORES'); setSelectedIds([]); }}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'PESCADORES' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Users className="w-4 h-4" />
                Sem ID Norte
              </button>
              <button 
                onClick={() => { setActiveTab('ATLETAS'); setSelectedIds([]); }}
                className={`flex-1 py-3 px-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  activeTab === 'ATLETAS' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:bg-slate-200'
                }`}
              >
                <Shield className="w-4 h-4" />
                Atletas
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 flex items-center gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
                <input 
                  type="text" 
                  placeholder="Filtrar por nome..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <button 
                onClick={selectAll}
                className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl hover:bg-indigo-100"
              >
                {selectedIds.length === list.length ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                Todos
              </button>
            </div>

            <div className="max-h-[500px] overflow-y-auto divide-y divide-slate-50">
              {list.length === 0 ? (
                <div className="p-10 text-center text-slate-400 italic">Nenhum usuário encontrado.</div>
              ) : (
                list.map(u => (
                  <div 
                    key={u.id} 
                    onClick={() => toggleSelect(u.id)}
                    className={`p-4 flex items-center gap-4 cursor-pointer transition-colors ${
                      selectedIds.includes(u.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${
                      selectedIds.includes(u.id) ? 'bg-indigo-600 border-indigo-600' : 'border-slate-200 bg-white'
                    }`}>
                      {selectedIds.includes(u.id) && <CheckSquare className="w-4 h-4 text-white" />}
                    </div>
                    <div className="w-10 h-10 bg-slate-200 rounded-full flex items-center justify-center text-slate-500 font-bold overflow-hidden">
                      {u.foto_url ? <img src={u.foto_url} className="w-full h-full object-cover" /> : u.nome_completo.charAt(0)}
                    </div>
                    <div className="flex-1">
                      <p className="font-bold text-slate-900 leading-none">{u.nome_completo}</p>
                      <p className="text-xs text-slate-400 mt-1">{u.email}</p>
                    </div>
                    <span className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                      u.id_norte_status === 'APROVADO' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {u.id_norte_status === 'APROVADO' ? 'FILIADO' : 'PENDENTE'}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Lado Direito: Compositor de Mensagem */}
        <div className="lg:col-span-1 space-y-4">
          <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-6 sticky top-24">
            <div className="flex items-center gap-3 text-indigo-600">
              <MessageCircle className="w-6 h-6" />
              <h2 className="text-xl font-bold">Nova Notificação</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Destinatários</label>
                <div className="bg-slate-50 p-3 rounded-2xl text-sm font-bold text-indigo-600 flex items-center justify-between">
                  <span>{selectedIds.length} selecionado(s)</span>
                  <Users className="w-4 h-4" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-2">
                  <label className="block text-xs font-black text-slate-400 uppercase tracking-widest">Sua Mensagem</label>
                  <button 
                    onClick={handleImproveMessage}
                    disabled={loadingIA || !message.trim()}
                    className="flex items-center gap-1 text-[10px] font-black uppercase text-indigo-600 hover:text-indigo-800 disabled:opacity-30 transition-all"
                  >
                    <Sparkles className="w-3 h-3" />
                    Aprimorar com IA
                  </button>
                </div>
                <textarea 
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  placeholder="Escreva sua mensagem personalizada..."
                  className="w-full bg-slate-50 border border-transparent rounded-2xl p-4 h-48 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all resize-none text-sm"
                />
              </div>

              <div className="bg-amber-50 p-4 rounded-2xl flex items-start gap-3 border border-amber-100">
                <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <p className="text-[10px] text-amber-800 font-medium leading-relaxed">
                  As mensagens serão enviadas para o painel de notificações e e-mail dos usuários selecionados.
                </p>
              </div>

              <button 
                onClick={handleSend}
                disabled={sending || selectedIds.length === 0 || !message.trim()}
                className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl shadow-xl shadow-indigo-500/30 hover:bg-indigo-700 hover:-translate-y-1 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {sending ? (
                   <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Enviar Notificação
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCommunication;
