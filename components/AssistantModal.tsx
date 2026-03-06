


import React, { useState } from 'react';
import { X, Send, Bot, User, AlertCircle, ExternalLink } from 'lucide-react';
import { askAssistant } from '../geminiService';

interface Message {
  role: 'bot' | 'user';
  text: string;
  sources?: { uri: string; title: string }[];
}

const AssistantModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    { 
      role: 'bot', 
      text: 'Olá, pescador! Como posso lhe ajudar? Qual a sua dúvida na FNPE?' 
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setLoading(true);
    setError(null);

    try {
      // Fix: askAssistant now returns text and grounding sources
      const response = await askAssistant(userMsg);
      setMessages(prev => [...prev, { 
        role: 'bot', 
        text: response.text,
        sources: response.sources 
      }]);
    } catch (err: any) {
      setError(err.message || "Erro ao conectar com a IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg flex flex-col h-[600px] overflow-hidden">
        <div className="bg-emerald-600 p-4 text-white flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bot className="w-6 h-6" />
            <div>
              <h3 className="font-bold leading-none uppercase tracking-tighter">Assistente FNPE</h3>
              <span className="text-[10px] opacity-80 uppercase font-black">Online agora</span>
            </div>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded-xl transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] p-4 rounded-2xl flex flex-col gap-2 ${
                m.role === 'user' ? 'bg-emerald-600 text-white rounded-tr-none' : 'bg-slate-900 border border-slate-800 text-slate-100 rounded-tl-none shadow-xl'
              }`}>
                <div className="flex gap-3">
                  {m.role === 'bot' && <Bot className="w-5 h-5 flex-shrink-0 text-emerald-500" />}
                  <p className="text-sm whitespace-pre-wrap font-medium">{m.text}</p>
                </div>
                
                {/* Fix: Display grounding metadata sources if available */}
                {m.role === 'bot' && m.sources && m.sources.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Fontes:</p>
                    <div className="flex flex-wrap gap-2">
                      {m.sources.map((s, idx) => (
                        <a 
                          key={idx} 
                          href={s.uri} 
                          target="_blank" 
                          rel="noreferrer"
                          className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-400 bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10 transition-colors"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span className="truncate max-w-[120px]">{s.title || 'Referência'}</span>
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl shadow-sm rounded-tl-none flex gap-2 items-center">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-.15s]" />
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-.3s]" />
              </div>
            </div>
          )}
          {error && (
            <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl flex items-center gap-3 text-xs border border-red-500/20">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-black uppercase tracking-widest">Atenção</p>
                <p>{error}</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-slate-800 bg-slate-900">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Digite sua dúvida..."
              className="flex-1 bg-slate-950 border border-slate-800 text-white rounded-2xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-slate-600"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="bg-emerald-600 text-white p-3 rounded-2xl hover:bg-emerald-500 disabled:opacity-50 transition-all shadow-lg active:scale-95"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssistantModal;