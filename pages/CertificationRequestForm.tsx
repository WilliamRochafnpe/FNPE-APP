
import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Calendar, MapPin, Trophy, ShieldCheck, 
  Trash2, Image as ImageIcon, FileText, CheckCircle2, 
  AlertCircle, UploadCloud, Users, Loader2, Mail, Info,
  PlusCircle, Phone, Building, Star, Award, Zap, ChevronRight
} from 'lucide-react';
import { useApp } from '../App';
import { Category, ArquivoUpload as UploadFile, CertificationRequest, Cobranca } from '../types';
import { isCpfValid, isCnpjValid, normalizeDocument } from '../utils/cpf';
import { uploadFile } from '../services/storage';
import { BR_STATES } from '../data/geoBrasil';
import { syncDatabase } from '../services/auth/supabaseAuth';
import { IS_SUPABASE } from '../services/auth';

const CertificationRequestForm: React.FC = () => {
  const { user, setDb } = useApp();
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [requestId] = useState(`cert-${Date.now()}`);

  const [logoEvento, setLogoEvento] = useState<string | null>(null);
  const [nomeEvento, setNomeEvento] = useState('');
  const [descricao, setDescricao] = useState('');
  const [periodoInicio, setPeriodoInicio] = useState('');
  const [periodoFim, setPeriodoFim] = useState('');
  const [categorias, setCategorias] = useState<Category[]>([]);
  const [cidade, setCidade] = useState('');
  const [uf, setUf] = useState('');
  
  const [instituicaoNome, setInstituicaoNome] = useState('');
  const [instituicaoDocumento, setInstituicaoDocumento] = useState('');

  const [responsáveis, setResponsáveis] = useState([
    { nome: '', telefone: '' },
    { nome: '', telefone: '' },
    { nome: '', telefone: '' }
  ]);

  const [emailContatoEvento, setEmailContatoEvento] = useState('');
  const [anexos, setAnexos] = useState<UploadFile[]>([]);
  
  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fetchCidades = async () => {
      if (!uf) {
        setMunicipios([]);
        return;
      }
      setLoadingCidades(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`,
          { signal: controller.signal }
        );
        const data = await response.json();
        setMunicipios(data.map((m: any) => m.nome));
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Erro ao buscar cidades do IBGE:", err);
          setMunicipios([]);
        }
      } finally {
        setLoadingCidades(false);
      }
    };
    fetchCidades();
    return () => controller.abort();
  }, [uf]);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, `requests/${user.id}/logo`);
      setLogoEvento(url);
    } catch (err: any) {
      setError("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleAnexoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []) as File[];
    if (files.length === 0 || !user) return;
    
    setUploading(true);
    try {
      for (const file of files) {
        const url = await uploadFile(file, `requests/${user.id}/anexos`);
        setAnexos(prev => [...prev, {
          id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          nome: file.name,
          tipo_mime: file.type,
          tamanho: file.size,
          url_dados: url
        }]);
      }
    } catch (err: any) {
      setError("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const removeAnexo = (id: string) => {
    setAnexos(prev => prev.filter(a => a.id !== id));
  };

  const toggleCategory = (cat: Category) => {
    setCategorias(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const updateResponsavel = (index: number, field: 'nome' | 'telefone', value: string) => {
    const newResps = [...responsáveis];
    newResps[index][field] = value;
    setResponsáveis(newResps);
  };

  const validate = () => {
    if (!nomeEvento || !periodoInicio || !periodoFim || !cidade || !uf || !instituicaoNome || !instituicaoDocumento || !emailContatoEvento) {
      setError("Preencha todos os campos obrigatórios (*).");
      return false;
    }
    if (categorias.length === 0) {
      setError("Selecione pelo menos uma categoria.");
      return false;
    }
    const doc = normalizeDocument(instituicaoDocumento);
    if (doc.length !== 11 && doc.length !== 14) {
      setError("CPF ou CNPJ da instituição inválido.");
      return false;
    }
    if (doc.length === 11 && !isCpfValid(doc)) {
      setError("CPF da instituição inválido.");
      return false;
    }
    if (doc.length === 14 && !isCnpjValid(doc)) {
      setError("CNPJ da instituição inválido.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !user) return;

    setLoading(true);
    setError(null);

    const responsaveisStr = responsáveis.map(r => r.nome).filter(Boolean).join('; ');
    const responsaveisContatosStr = responsáveis.map(r => r.telefone).filter(Boolean).join('; ');

    const newRequest: CertificationRequest = {
      id: requestId,
      status: 'PENDENTE',
      data_solicitacao: new Date().toISOString(),
      solicitado_por_usuario_id: user.id,
      solicitado_por_email: user.email,
      logo_evento: logoEvento || undefined,
      nome_evento: nomeEvento,
      descricao,
      periodo_inicio: periodoInicio,
      periodo_fim: periodoFim,
      categorias,
      cidade,
      uf,
      instituicao_nome: instituicaoNome,
      instituicao_documento: instituicaoDocumento,
      responsaveis: responsaveisStr,
      responsaveis_contato: responsaveisContatosStr,
      email_contato_evento: emailContatoEvento,
      anexos
    };

    try {
      if (IS_SUPABASE) {
        await syncDatabase.insertCertificationRequest(newRequest);
      }

      setDb(prev => ({
        ...prev,
        certificationRequests: [newRequest, ...(prev.certificationRequests || [])]
      }));

      setSuccess(true);
      setTimeout(() => navigate('/app/eventos'), 3000);
    } catch (err: any) {
      setError("Erro ao enviar solicitação: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-24 h-24 bg-emerald-500 text-slate-950 rounded-full flex items-center justify-center shadow-2xl shadow-emerald-500/20">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black text-white uppercase tracking-tight">Solicitação Enviada!</h2>
          <p className="text-slate-500 max-w-xs mx-auto">Nossa equipe técnica analisará os dados e entrará em contato em até 48h úteis.</p>
        </div>
      </div>
    );
  }

  if (!showForm) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 pb-24 max-w-4xl mx-auto px-4">
        <header className="space-y-4">
          <button 
            onClick={() => navigate('/app/eventos')} 
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para Eventos
          </button>
          <div className="flex items-center gap-4">
            <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-500">
              <Trophy className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter uppercase">Certifique Seu Evento</h1>
              <p className="text-emerald-500 font-bold uppercase text-[10px] tracking-widest mt-1">Homologação Oficial FNPE</p>
            </div>
          </div>
        </header>

        <section className="bg-slate-900 p-8 md:p-12 rounded-[56px] border border-slate-800 shadow-2xl space-y-12">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">Seu evento na Federação Norte</h2>
            </div>
            <p className="text-slate-400 text-lg leading-relaxed font-medium">
              Transforme seu torneio, campeonato ou circuito de pesca em um evento profissional certificado. Eventos credenciados pela FNPE passam a valer pontos para o <span className="text-emerald-500 font-bold">Ranking Norte de Pesca Esportiva</span>, e os participantes com ID Norte são reconhecidos como atletas oficiais da pesca esportiva da Região Norte.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-slate-800">
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-indigo-400">
                   <Award className="w-6 h-6" />
                   <h3 className="font-black uppercase tracking-widest text-sm">Eventos Profissionais</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Ao receber o credenciamento da FNPE, o seu evento torna-se também classificatório para os eventos oficiais da Federação Norte, como campeonatos estaduais e <span className="text-slate-300 font-bold">Copa Norte</span>.
                </p>
             </div>
             <div className="space-y-4">
                <div className="flex items-center gap-3 text-emerald-400">
                   <Zap className="w-6 h-6" />
                   <h3 className="font-black uppercase tracking-widest text-sm">Reconhecimento Atleta</h3>
                </div>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Os participantes que possuem a ID Norte são reconhecidos como atletas oficiais, com pontuação registrada, histórico esportivo e inserção no sistema federativo nacional da modalidade.
                </p>
             </div>
          </div>
        </section>

        <div className="bg-emerald-600 p-8 md:p-12 rounded-[56px] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-8 group">
           <div className="space-y-2 text-center md:text-left">
              <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Tudo Pronto?</h2>
              <p className="text-emerald-100 font-medium">Tenha em mãos os dados da instituição e responsáveis.</p>
           </div>
           <button 
             onClick={() => setShowForm(true)}
             className="w-full md:w-auto bg-white text-slate-900 px-10 py-6 rounded-[32px] font-black uppercase text-sm tracking-widest hover:bg-emerald-50 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95"
           >
             Iniciar Certificação
             <ChevronRight className="w-5 h-5" />
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700 pb-24">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-1">
          <button 
            onClick={() => setShowForm(false)} 
            className="flex items-center gap-2 text-slate-500 hover:text-emerald-500 font-black uppercase text-[10px] tracking-[0.2em] mb-2 transition-all group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Voltar para Benefícios
          </button>
          <h1 className="text-3xl font-black text-white tracking-tight uppercase flex items-center gap-3">
             <ShieldCheck className="w-8 h-8 text-emerald-500" /> Dados da Solicitação
          </h1>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
            <div className="flex items-center gap-3 text-emerald-500">
               <Trophy className="w-6 h-6" />
               <h2 className="text-lg font-black uppercase tracking-tight">Informações Básicas</h2>
            </div>

            <div className="space-y-4">
               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome do Evento *</label>
                  <input required value={nomeEvento} onChange={e => setNomeEvento(e.target.value)} placeholder="Ex: 5º Torneio de Pesca de Macapá" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
               </div>

               <div>
                  <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Descrição Breve</label>
                  <textarea value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Conte um pouco sobre o evento, local exato e premiações..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-medium text-white outline-none h-32 resize-none" />
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Início do Evento *</label>
                    <input type="date" required value={periodoInicio} onChange={e => setPeriodoInicio(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Fim do Evento *</label>
                    <input type="date" required value={periodoFim} onChange={e => setPeriodoFim(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Estado (UF) *</label>
                    <select required value={uf} onChange={e => {setUf(e.target.value); setCidade('');}} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-black text-white outline-none appearance-none">
                       <option value="">Selecione...</option>
                       {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.nome}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Cidade / Município *</label>
                    <div className="relative">
                       <select required disabled={!uf || loadingCidades} value={cidade} onChange={e => setCidade(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none appearance-none disabled:opacity-50">
                          <option value="">{loadingCidades ? 'Carregando...' : 'Selecione a cidade...'}</option>
                          {municipios.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                       <MapPin className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-700 w-4 h-4" />
                    </div>
                  </div>
               </div>
            </div>
          </section>

          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-8">
             <div className="space-y-4">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Categorias Disponíveis *</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                   {(['CAIAQUE', 'EMBARCADO', 'ARREMESSO', 'BARRANCO'] as Category[]).map(cat => (
                      <button key={cat} type="button" onClick={() => toggleCategory(cat)} className={`py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border-2 transition-all ${categorias.includes(cat) ? 'bg-emerald-500 border-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-950 border-slate-800 text-slate-600 hover:border-slate-700'}`}>{cat}</button>
                   ))}
                </div>
             </div>

             <div className="pt-6 border-t border-slate-800 space-y-6">
                <div className="flex items-center gap-3 text-emerald-500">
                  <Building className="w-6 h-6" />
                  <h2 className="text-lg font-black uppercase tracking-tight">Instituição Organizadora</h2>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">Nome da Associação/Empresa *</label>
                      <input required value={instituicaoNome} onChange={e => setInstituicaoNome(e.target.value)} placeholder="Ex: Clube Amigos da Pesca" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">CPF ou CNPJ *</label>
                      <input required value={instituicaoDocumento} onChange={e => setInstituicaoDocumento(e.target.value)} placeholder="00.000.000/0000-00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                   </div>
                </div>
             </div>
          </section>

          <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 text-emerald-500">
                  <Users className="w-6 h-6" />
                  <h2 className="text-lg font-black uppercase tracking-tight">Responsáveis Técnicos</h2>
                </div>
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">Até 3 pessoas</p>
             </div>

             <div className="space-y-4">
                {responsáveis.map((resp, idx) => (
                   <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-950 rounded-2xl border border-slate-800">
                      <input value={resp.nome} onChange={e => updateResponsavel(idx, 'nome', e.target.value)} placeholder={`Nome do Responsável ${idx+1}`} className="bg-transparent border-none text-sm font-bold text-white outline-none" />
                      <input value={resp.telefone} onChange={e => updateResponsavel(idx, 'telefone', e.target.value)} placeholder="Telefone/WhatsApp" className="bg-transparent border-none text-sm font-medium text-emerald-500 outline-none" />
                   </div>
                ))}
             </div>

             <div className="pt-6 border-t border-slate-800">
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 ml-1">E-mail para Contato do Evento *</label>
                <div className="relative">
                   <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 w-5 h-5" />
                   <input type="email" required value={emailContatoEvento} onChange={e => setEmailContatoEvento(e.target.value)} placeholder="torneio@exemplo.com.br" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 pl-12 font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
             </div>
          </section>
        </div>

        <div className="lg:col-span-1 space-y-6">
           <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-8 sticky top-24">
              <div className="text-center space-y-4">
                 <div className="w-32 h-32 bg-slate-950 rounded-[40px] border-2 border-dashed border-slate-800 mx-auto flex items-center justify-center overflow-hidden group">
                    {logoEvento ? <img src={logoEvento} className="w-full h-full object-cover" /> : <ImageIcon className="w-12 h-12 text-slate-800 group-hover:text-emerald-500 transition-colors" />}
                 </div>
                 <label className="inline-block bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-800 hover:text-white transition-all shadow-xl">
                    Selecionar Logo
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                 </label>
              </div>

              <div className="space-y-4">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Documentação (PDF/Imagens)</h3>
                    <span className="text-[9px] font-bold text-emerald-500">{anexos.length} anexos</span>
                 </div>
                 <div className="space-y-2">
                    {anexos.map(file => (
                       <div key={file.id} className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                          <span className="text-[10px] font-bold text-slate-400 truncate max-w-[150px]">{file.nome}</span>
                          <button type="button" onClick={() => removeAnexo(file.id)} className="text-slate-600 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                       </div>
                    ))}
                    <label className="flex items-center justify-center gap-2 p-4 border-2 border-dashed border-slate-800 rounded-2xl cursor-pointer hover:bg-slate-950 transition-all text-slate-500 hover:text-emerald-500 group">
                       <UploadCloud className="w-4 h-4 group-hover:scale-110 transition-transform" />
                       <span className="text-[9px] font-black uppercase">Anexar Arquivos</span>
                       <input type="file" className="hidden" multiple onChange={handleAnexoUpload} />
                    </label>
                 </div>
              </div>

              <div className="bg-emerald-500/5 p-6 rounded-3xl border border-emerald-500/10 space-y-3">
                 <div className="flex items-center gap-2 text-emerald-500">
                    <Info className="w-4 h-4" />
                    <h4 className="text-[9px] font-black uppercase tracking-widest">Taxa de Certificação</h4>
                 </div>
                 <p className="text-slate-400 text-xs leading-relaxed font-medium">Após o envio, será gerada uma cobrança de <strong>R$ 100,00</strong> para análise e homologação federativa.</p>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-start gap-3 animate-pulse">
                   <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                   <p className="text-[10px] text-red-400 font-bold uppercase leading-tight">{error}</p>
                </div>
              )}

              <button 
                type="submit" 
                disabled={loading || uploading}
                className="w-full bg-emerald-600 text-white font-black py-5 rounded-[24px] shadow-2xl shadow-emerald-600/30 hover:bg-emerald-500 transition-all flex items-center justify-center gap-3 uppercase text-xs tracking-widest active:scale-95 disabled:opacity-50"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><CheckCircle2 className="w-5 h-5" /> Enviar Solicitação</>}
              </button>
           </section>
        </div>
      </form>
    </div>
  );
};

export default CertificationRequestForm;
