
import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, MapPin, Trophy, Calendar, Building, Phone, Mail, Loader2, Save, Sparkles, UploadCloud, FileText, Trash2, PlusCircle, MinusCircle, Globe } from 'lucide-react';
import { EventCertified, Category, ArquivoUpload } from '../types';
import { BR_STATES } from '../data/geoBrasil';
import { uploadFile } from '../services/storage';
import { useApp } from '../App';

interface EventFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: EventCertified) => void;
  mode: 'create' | 'edit';
  initialData?: EventCertified;
}

const EventFormModal: React.FC<EventFormModalProps> = ({ isOpen, onClose, onSave, mode, initialData }) => {
  const { user } = useApp();
  const [formData, setFormData] = useState<Partial<EventCertified>>({
    nome_evento: '',
    descricao: '',
    descricao_economica: '',
    instituicao_organizadora: '',
    cnpj_instituicao: '',
    cidade: '',
    uf: '',
    data_evento: '',
    data_fim: '',
    tem_caiaque: false,
    tem_embarcado: false,
    tem_arremesso: false,
    tem_barranco: false,
    logo_url: '',
    contato_telefone: '',
    email_contato_evento: ''
  });

  const [responsaveisList, setResponsaveisList] = useState<{ nome: string; telefone: string }[]>([
    { nome: '', telefone: '' }
  ]);

  const [anexos, setAnexos] = useState<ArquivoUpload[]>([]);
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setFormData(initialData);
      if (initialData.responsaveis_dados) {
        setResponsaveisList(initialData.responsaveis_dados);
      } else {
        // Fallback or empty default
        setResponsaveisList([{ nome: '', telefone: initialData.contato_telefone || '' }]);
      }
      setAnexos(initialData.arquivos || []);
    } else if (isOpen) {
      setFormData({
        nome_evento: '', descricao: '', descricao_economica: '', instituicao_organizadora: '', cnpj_instituicao: '',
        cidade: '', uf: '', data_evento: '', data_fim: '', tem_caiaque: false,
        tem_embarcado: false, tem_arremesso: false, tem_barranco: false, logo_url: '',
        contato_telefone: '', email_contato_evento: ''
      });
      setResponsaveisList([{ nome: '', telefone: '' }]);
      setAnexos([]);
    }
  }, [mode, initialData, isOpen]);

  useEffect(() => {
    const fetchCidades = async () => {
      if (!formData.uf) {
        setMunicipios([]);
        return;
      }
      setLoadingCidades(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios?orderBy=nome`);
        const data = await response.json();
        setMunicipios(data.map((m: any) => m.nome));
      } catch (err) {
        console.error("Erro ao carregar cidades do IBGE:", err);
        setMunicipios([]);
      } finally {
        setLoadingCidades(false);
      }
    };
    fetchCidades();
  }, [formData.uf]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, logo_url: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRespChange = (index: number, field: 'nome' | 'telefone', value: string) => {
    const newList = [...responsaveisList];
    newList[index][field] = value;
    setResponsaveisList(newList);
  };

  const addResponsavel = () => {
    if (responsaveisList.length < 3) {
      setResponsaveisList([...responsaveisList, { nome: '', telefone: '' }]);
    }
  };

  const removeResponsavel = (index: number) => {
    if (responsaveisList.length > 1) {
      setResponsaveisList(responsaveisList.filter((_, i) => i !== index));
    }
  };

  const handleAnexoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0 || !user) return;
    setUploading(true);
    try {
      const newAnexos: ArquivoUpload[] = [];
      for (const file of files) {
        const url = await uploadFile(file, `events/${Date.now()}/files`);
        newAnexos.push({
          id: `f-${Math.random().toString(36)}`,
          nome: file.name,
          tipo_mime: file.type,
          tamanho: file.size,
          url_dados: url
        });
      }
      setAnexos(prev => [...prev, ...newAnexos]);
    } catch (err: any) {
      alert("Erro upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.nome_evento || !formData.data_evento || !formData.cidade || !formData.uf) {
      alert("Nome, Data, Cidade e UF são obrigatórios.");
      return;
    }
    if (!responsaveisList[0].nome || !responsaveisList[0].telefone) {
      alert("O primeiro responsável é obrigatório (Nome e Telefone).");
      return;
    }

    const eventToSave = {
      ...formData,
      // Se for edição, mantém o ID existente. Se for criação, deixa o banco gerar (removendo o ID manual).
      id: mode === 'edit' ? formData.id : undefined,
      uf: formData.uf.toUpperCase().trim(),
      cidade: formData.cidade.trim(),
      // Ensure specific ID format if new
      codigo_certificado: formData.codigo_certificado || `ID Evento - ${countRand}`,
      criado_em: mode === 'create' ? new Date().toISOString() : formData.criado_em,

      responsaveis: responsaveisList.map(r => r.nome).join('; '),
      contato_telefone: responsaveisList.map(r => r.telefone).join('; '),
      responsaveis_dados: responsaveisList,

      arquivos: anexos,
    } as EventCertified;

    onSave(eventToSave);
  };

  if (!isOpen) return null;

  const toggleCategory = (cat: Category) => {
    const key = `tem_${cat.toLowerCase()}` as keyof EventCertified;
    setFormData(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-slate-900 rounded-[40px] w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[95vh] animate-in zoom-in-95 duration-200 border border-slate-800">
        {/* HEADER */}
        <div className="bg-indigo-600 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center border border-white/10 backdrop-blur-sm">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tighter uppercase leading-none">{mode === 'create' ? 'Certificar Evento' : 'Editar Evento'}</h2>
              <p className="text-indigo-100 text-[10px] font-black uppercase tracking-widest mt-1.5 opacity-80">{mode === 'create' ? 'Novo Cadastro Federativo' : 'Ajuste de Dados Oficiais'}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar bg-slate-900">
          {/* LOGO */}
          <div className="flex flex-col items-center gap-4 py-8 border-2 border-dashed border-slate-800 rounded-[32px] bg-slate-950/50 group">
            <div className="w-32 h-32 bg-slate-900 rounded-[32px] border border-slate-800 overflow-hidden flex items-center justify-center shadow-xl relative group-hover:border-emerald-500/50 transition-all duration-500">
              {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-cover" /> : <ImageIcon className="w-10 h-10 text-slate-800" />}
            </div>
            <label className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-800 hover:text-white transition-all shadow-xl flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-500" /> Mudar Logo do Evento
              <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
            </label>
          </div>

          <div className="space-y-6">
            {/* NOME E DESCRICAO */}
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Evento *</label>
                <input required value={formData.nome_evento} onChange={e => setFormData({ ...formData, nome_evento: e.target.value })} placeholder="Título oficial do torneio" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição</label>
                <textarea value={formData.descricao} onChange={e => setFormData({ ...formData, descricao: e.target.value })} placeholder="Resumo do evento..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição Econômica</label>
                <textarea value={formData.descricao_economica} onChange={e => setFormData({ ...formData, descricao_economica: e.target.value })} placeholder="Impacto econômico, premiações, etc..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-medium outline-none focus:ring-2 focus:ring-indigo-500 h-24 resize-none" />
              </div>

              {/* TIPO DE EVENTO */}
              <div className="pt-4 border-t border-slate-800/50">
                <label className="block text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-3 ml-1">Tipo de Evento *</label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, event_type: 'presencial' })}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.event_type === 'presencial' ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                  >
                    <Trophy className={`w-5 h-5 ${formData.event_type === 'presencial' ? 'text-slate-950' : 'text-slate-700'}`} />
                    <span className="font-black text-[11px] uppercase tracking-widest">Presencial</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, event_type: 'online' })}
                    className={`flex items-center justify-center gap-3 p-4 rounded-2xl border-2 transition-all ${formData.event_type === 'online' ? 'bg-indigo-500 border-indigo-500 text-white shadow-lg shadow-indigo-500/20' : 'bg-slate-950 border-slate-800 text-slate-500 hover:border-slate-700'}`}
                  >
                    <Globe className={`w-5 h-5 ${formData.event_type === 'online' ? 'text-white' : 'text-slate-700'}`} />
                    <span className="font-black text-[11px] uppercase tracking-widest">Online</span>
                  </button>
                </div>
              </div>
            </div>

            {/* DATAS E LOCAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data Início *</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
                  <input type="date" required value={formData.data_evento} onChange={e => setFormData({ ...formData, data_evento: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Data Final</label>
                <div className="relative">
                  <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
                  <input type="date" value={formData.data_fim} onChange={e => setFormData({ ...formData, data_fim: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-3">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidade *</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
                  <select required disabled={!formData.uf || loadingCidades} value={formData.cidade} onChange={e => setFormData({ ...formData, cidade: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-6 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:opacity-50">
                    <option value="">{loadingCidades ? 'Carregando...' : 'Selecione...'}</option>
                    {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">UF *</label>
                <select required value={formData.uf} onChange={e => setFormData({ ...formData, uf: e.target.value, cidade: '' })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 text-center font-black text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="">--</option>
                  {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf}</option>)}
                </select>
              </div>
            </div>

            {/* INSTITUICAO E RESPONSAVEIS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Instituição</label>
                  <input value={formData.instituicao_organizadora} onChange={e => setFormData({ ...formData, instituicao_organizadora: e.target.value })} placeholder="Ex: Associação de Pesca" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">CNPJ (Opcional)</label>
                  <input value={formData.cnpj_instituicao} onChange={e => setFormData({ ...formData, cnpj_instituicao: e.target.value })} placeholder="00.000.000/0000-00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white font-bold outline-none" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Responsáveis (Máx 3)</label>
                  <button type="button" onClick={addResponsavel} disabled={responsaveisList.length >= 3} className="text-emerald-500 hover:text-emerald-400 disabled:opacity-50"><PlusCircle size={20} /></button>
                </div>
                {responsaveisList.map((resp, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input value={resp.nome} onChange={e => handleRespChange(idx, 'nome', e.target.value)} placeholder={`Nome Responsável ${idx + 1} *`} className="flex-[2] bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none" />
                    <input value={resp.telefone} onChange={e => handleRespChange(idx, 'telefone', e.target.value)} placeholder="Telefone *" className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white font-bold outline-none" />
                    {idx > 0 && <button type="button" onClick={() => removeResponsavel(idx)} className="text-red-500 hover:text-red-400 px-2"><MinusCircle size={20} /></button>}
                  </div>
                ))}
              </div>
            </div>

            {/* CATEGORIAS */}
            <div className="space-y-2 pt-4 border-t border-slate-800">
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categorias Disponíveis</label>
              <div className="grid grid-cols-2 gap-3">
                {(['CAIAQUE', 'EMBARCADO', 'ARREMESSO', 'BARRANCO'] as Category[]).map(cat => (
                  <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`py-3 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${!!formData[`tem_${cat.toLowerCase()}` as keyof EventCertified] ? 'bg-emerald-500 text-slate-950 border-emerald-500' : 'bg-slate-950 text-slate-600 border-slate-800'}`}>{cat}</button>
                ))}
              </div>
            </div>

            {/* ARQUIVOS */}
            <div className="space-y-4 pt-4 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Arquivos (PDF, Word, Imagens)</label>
                <span className="text-[9px] font-bold text-emerald-500">{anexos.length} Anexados</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {anexos.map((file, i) => (
                  <div key={i} className="bg-slate-950 border border-slate-800 px-3 py-2 rounded-xl flex items-center gap-2">
                    <FileText size={14} className="text-slate-400" />
                    <span className="text-xs text-slate-300 truncate max-w-[100px]">{file.nome}</span>
                    <button type="button" onClick={() => setAnexos(anexos.filter((_, idx) => idx !== i))} className="text-slate-600 hover:text-red-500"><X size={14} /></button>
                  </div>
                ))}
                <label className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 rounded-xl flex items-center gap-2 cursor-pointer hover:bg-emerald-500/20 text-emerald-500 transition-all">
                  {uploading ? <Loader2 size={14} className="animate-spin" /> : <UploadCloud size={14} />}
                  <span className="text-[10px] font-black uppercase">Adicionar</span>
                  <input type="file" className="hidden" multiple onChange={handleAnexoUpload} disabled={uploading} />
                </label>
              </div>
            </div>

          </div>
        </form>

        <div className="p-8 border-t border-slate-800 bg-slate-950/50 shrink-0 flex gap-4">
          <button type="button" onClick={onClose} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-all bg-slate-900 border border-slate-800 rounded-2xl">Cancelar</button>
          <button onClick={handleSubmit} disabled={uploading} className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase text-[11px] tracking-widest rounded-2xl shadow-xl hover:bg-indigo-500 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            <Save className="w-5 h-5" />
            {mode === 'create' ? 'Certificar Oficialmente' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EventFormModal;
