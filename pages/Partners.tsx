
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, 
  MapPin, 
  Phone, 
  Globe, 
  Instagram, 
  Plus, 
  Search, 
  Edit3, 
  Trash2, 
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  X,
  Building,
  CreditCard,
  FileText,
  Loader2,
  Image as ImageIcon
} from 'lucide-react';
import { useApp } from '../App';
import { Partner } from '../types';
import { BR_STATES } from '../data/geoBrasil';
import { uploadFile } from '../services/storage';

const Partners: React.FC = () => {
  const { db, setDb, user } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterUf, setFilterUf] = useState('');
  const [filterCidade, setFilterCidade] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const [municipios, setMunicipios] = useState<string[]>([]);
  const [loadingCidades, setLoadingCidades] = useState(false);

  const [formData, setFormData] = useState<Partial<Partner>>({
    nome_fantasia: '',
    razao_social: '',
    cnpj_cpf: '',
    telefone: '',
    endereco: '',
    cidade: '',
    uf: '',
    rede_social: '',
    website: '',
    beneficio_descricao: '',
    logo_url: ''
  });

  const isAdmin = user?.nivel === 'ADMIN';
  const isAtleta = user?.nivel === 'ATLETA';

  // IBGE Cidades para o filtro
  useEffect(() => {
    const fetchCidades = async () => {
      if (!filterUf) return;
      setLoadingCidades(true);
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${filterUf}/municipios?orderBy=nome`);
        const data = await response.json();
        setMunicipios(data.map((m: any) => m.nome));
      } catch (err) { console.error(err); } finally { setLoadingCidades(false); }
    };
    fetchCidades();
  }, [filterUf]);

  // IBGE Cidades para o formulário
  const [formMunicipios, setFormMunicipios] = useState<string[]>([]);
  useEffect(() => {
    const fetchCidades = async () => {
      if (!formData.uf) return;
      try {
        const response = await fetch(`https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.uf}/municipios?orderBy=nome`);
        const data = await response.json();
        setFormMunicipios(data.map((m: any) => m.nome));
      } catch (err) { console.error(err); }
    };
    fetchCidades();
  }, [formData.uf]);

  const filteredPartners = useMemo(() => {
    return (db.partners || []).filter(p => {
      const matchSearch = p.nome_fantasia.toLowerCase().includes(searchTerm.toLowerCase());
      const matchUf = !filterUf || p.uf === filterUf;
      const matchCidade = !filterCidade || p.cidade === filterCidade;
      return matchSearch && matchUf && matchCidade;
    });
  }, [db.partners, searchTerm, filterUf, filterCidade]);

  const handleOpenModal = (p?: Partner) => {
    if (p) {
      setEditingPartner(p);
      setFormData(p);
    } else {
      setEditingPartner(null);
      setFormData({
        nome_fantasia: '', razao_social: '', cnpj_cpf: '', telefone: '',
        endereco: '', cidade: '', uf: '', rede_social: '',
        website: '', beneficio_descricao: '', logo_url: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (!confirm("Excluir este parceiro permanentemente?")) return;
    setDb(prev => ({
      ...prev,
      partners: prev.partners.filter(p => p.id !== id)
    }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const url = await uploadFile(file, 'partners/logos');
      setFormData(prev => ({ ...prev, logo_url: url }));
    } catch (err: any) {
      alert("Erro no upload: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const partnerData: Partner = {
      ...formData as Partner,
      id: editingPartner ? editingPartner.id : `p-${Date.now()}`,
      criado_em: editingPartner ? editingPartner.criado_em : new Date().toISOString()
    };

    setDb(prev => ({
      ...prev,
      partners: editingPartner 
        ? prev.partners.map(p => p.id === partnerData.id ? partnerData : p)
        : [partnerData, ...prev.partners]
    }));

    setLoading(false);
    setIsModalOpen(false);
    alert(`✅ Parceiro ${editingPartner ? 'atualizado' : 'cadastrado'} com sucesso!`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-24">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <ShoppingBag className="w-10 h-10 text-emerald-500" />
             <h1 className="text-3xl font-black text-white tracking-tight uppercase">Parceiros FNPE</h1>
          </div>
          <p className="text-slate-500 font-medium max-w-2xl">
            Atletas da FNPE ativo têm benefícios exclusivos nas lojas conveniadas.
            Procure o <span className="text-emerald-500 font-bold uppercase">Selo Loja Parceira FNPE</span> e aproveite descontos e condições especiais.
          </p>
        </div>
        {isAdmin && (
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-emerald-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-emerald-500/20 hover:bg-emerald-500 transition-all flex items-center gap-2 active:scale-95"
          >
            <Plus className="w-5 h-5" /> Cadastrar Loja
          </button>
        )}
      </header>

      {/* FILTROS */}
      <section className="bg-slate-900 p-6 rounded-[32px] border border-slate-800 shadow-xl grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
           <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 w-5 h-5" />
           <input 
            type="text" 
            placeholder="Buscar por nome da loja..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-slate-950 border border-slate-800 rounded-2xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-white placeholder:text-slate-700"
           />
        </div>
        <div>
           <select 
            value={filterUf} 
            onChange={e => {setFilterUf(e.target.value); setFilterCidade('');}} 
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none"
           >
              <option value="">Todos os Estados</option>
              {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.nome}</option>)}
           </select>
        </div>
        <div>
           <select 
            disabled={!filterUf || loadingCidades} 
            value={filterCidade} 
            onChange={e => setFilterCidade(e.target.value)} 
            className="w-full p-4 bg-slate-950 border border-slate-800 rounded-2xl font-bold text-white outline-none focus:ring-2 focus:ring-emerald-500 appearance-none disabled:opacity-50"
           >
              <option value="">{loadingCidades ? 'Carregando...' : 'Todas as Cidades'}</option>
              {municipios.map(m => <option key={m} value={m}>{m}</option>)}
           </select>
        </div>
      </section>

      {/* GRID DE PARCEIROS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredPartners.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-slate-900 rounded-[40px] border border-dashed border-slate-800 opacity-50">
             <ShoppingBag className="w-16 h-16 text-slate-700 mx-auto mb-4" />
             <p className="text-slate-500 font-black uppercase tracking-widest text-sm">Nenhum parceiro encontrado nesta região.</p>
          </div>
        ) : (
          filteredPartners.map(partner => (
            <div 
              key={partner.id} 
              className={`bg-slate-900 rounded-[40px] border p-8 flex flex-col gap-6 shadow-xl transition-all group relative ${isAtleta ? 'border-emerald-500/30' : 'border-slate-800'}`}
            >
              {isAtleta && (
                <div className="absolute -top-3 -right-3 bg-emerald-500 text-slate-950 px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                  Benefício Ativo
                </div>
              )}

              {isAdmin && (
                <div className="absolute top-6 left-6 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <button onClick={() => handleOpenModal(partner)} className="p-2 bg-slate-950 text-indigo-400 rounded-lg border border-slate-800 hover:bg-indigo-500 hover:text-white transition-all"><Edit3 className="w-4 h-4" /></button>
                   <button onClick={() => handleDelete(partner.id)} className="p-2 bg-slate-950 text-red-400 rounded-lg border border-slate-800 hover:bg-red-500 hover:text-white transition-all"><Trash2 className="w-4 h-4" /></button>
                </div>
              )}

              <div className="flex flex-col items-center text-center gap-4">
                 <div className="w-24 h-24 bg-slate-950 rounded-[32px] border border-slate-800 overflow-hidden flex items-center justify-center p-2 shadow-inner">
                    {partner.logo_url ? <img src={partner.logo_url} className="w-full h-full object-contain" /> : <ShoppingBag className="w-10 h-10 text-slate-800" />}
                 </div>
                 <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-tight">{partner.nome_fantasia}</h3>
                    <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest mt-1 flex items-center justify-center gap-1">
                      <MapPin className="w-3 h-3" /> {partner.cidade} - {partner.uf}
                    </p>
                 </div>
              </div>

              <div className="bg-slate-950/50 p-6 rounded-[32px] border border-slate-800/50 flex-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Benefício Federativo</p>
                 <p className="text-slate-300 text-sm font-medium leading-relaxed italic">"{partner.beneficio_descricao}"</p>
              </div>

              <div className="space-y-3 pt-2">
                 <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800"><MapPin className="w-4 h-4 text-emerald-500" /></div>
                    <span className="font-medium line-clamp-1">{partner.endereco}</span>
                 </div>
                 <div className="flex items-center gap-3 text-slate-400 text-xs">
                    <div className="p-2 bg-slate-950 rounded-xl border border-slate-800"><Phone className="w-4 h-4 text-emerald-500" /></div>
                    <span className="font-bold">{partner.telefone}</span>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-2">
                 {partner.website && (
                   <a href={partner.website} target="_blank" className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-emerald-500 transition-all">
                     <Globe className="w-3 h-3" /> Website
                   </a>
                 )}
                 {partner.rede_social && (
                   <a href={partner.rede_social} target="_blank" className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white hover:border-pink-500 transition-all">
                     <Instagram className="w-3 h-3" /> Social
                   </a>
                 )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODAL DE CADASTRO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-950/95 backdrop-blur-md z-[100] flex items-center justify-center p-4">
           <div className="bg-slate-900 rounded-[48px] w-full max-w-2xl overflow-hidden shadow-2xl border border-slate-800 animate-in zoom-in-95 flex flex-col max-h-[92vh]">
              <div className="bg-emerald-600 p-8 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/10 rounded-2xl border border-white/10"><ShoppingBag className="w-6 h-6" /></div>
                    <div>
                      <h2 className="text-xl font-black uppercase tracking-tighter">{editingPartner ? 'Editar Parceiro' : 'Novo Cadastro Parceiro'}</h2>
                      <p className="text-emerald-100 text-[10px] font-black uppercase tracking-widest opacity-80">Gestão de Benefícios Atleta</p>
                    </div>
                 </div>
                 <button onClick={() => setIsModalOpen(false)} className="p-3 hover:bg-white/10 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
              </div>

              <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-10 space-y-8 custom-scrollbar">
                 {/* LOGO UPLOAD */}
                 <div className="flex flex-col items-center gap-4 py-8 bg-slate-950/50 rounded-[32px] border-2 border-dashed border-slate-800 group">
                    <div className="w-32 h-32 bg-slate-900 rounded-[40px] border border-slate-800 overflow-hidden flex items-center justify-center shadow-inner relative group-hover:border-emerald-500/50 transition-all">
                       {formData.logo_url ? <img src={formData.logo_url} className="w-full h-full object-contain" /> : <ImageIcon className="w-12 h-12 text-slate-800" />}
                    </div>
                    <label className="bg-slate-950 border border-slate-800 px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer hover:bg-slate-800 hover:text-white transition-all shadow-xl">
                       {uploading ? 'Processando...' : 'Selecionar Logo'}
                       <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} disabled={uploading} />
                    </label>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Nome Fantasia *</label>
                       <input required value={formData.nome_fantasia} onChange={e => setFormData({...formData, nome_fantasia: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Razão Social *</label>
                       <input required value={formData.razao_social} onChange={e => setFormData({...formData, razao_social: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">CNPJ ou CPF *</label>
                       <input required value={formData.cnpj_cpf} onChange={e => setFormData({...formData, cnpj_cpf: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Telefone / WhatsApp *</label>
                       <input required value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Endereço Completo *</label>
                    <input required value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Estado (UF) *</label>
                       <select required value={formData.uf} onChange={e => setFormData({...formData, uf: e.target.value, cidade: ''})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white appearance-none">
                          <option value="">Selecione...</option>
                          {BR_STATES.map(s => <option key={s.uf} value={s.uf}>{s.uf} - {s.nome}</option>)}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Cidade *</label>
                       <select required disabled={!formData.uf} value={formData.cidade} onChange={e => setFormData({...formData, cidade: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white appearance-none">
                          <option value="">Selecione...</option>
                          {formMunicipios.map(m => <option key={m} value={m}>{m}</option>)}
                       </select>
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Instagram/Rede Social</label>
                       <input value={formData.rede_social} onChange={e => setFormData({...formData, rede_social: e.target.value})} placeholder="https://instagram.com/..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Website</label>
                       <input value={formData.website} onChange={e => setFormData({...formData, website: e.target.value})} placeholder="https://..." className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 font-bold text-white" />
                    </div>
                 </div>

                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-1">Descrição do Benefício FNPE *</label>
                    <textarea required value={formData.beneficio_descricao} onChange={e => setFormData({...formData, beneficio_descricao: e.target.value})} placeholder="Descreva o desconto ou vantagem para o Atleta com ID Norte..." className="w-full bg-slate-950 border border-slate-800 rounded-[32px] p-6 text-slate-200 h-32 resize-none outline-none focus:ring-2 focus:ring-emerald-500" />
                 </div>
              </form>

              <div className="p-8 border-t border-slate-800 bg-slate-950/50 shrink-0 flex gap-4">
                 <button onClick={() => setIsModalOpen(false)} className="flex-1 py-4 font-black uppercase text-[10px] tracking-widest text-slate-500 hover:text-white transition-colors bg-slate-900 border border-slate-800 rounded-2xl">Cancelar</button>
                 <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-4 bg-emerald-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-emerald-600/30 flex items-center justify-center gap-2 hover:bg-emerald-500 active:scale-95 transition-all">
                    {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}
                    {editingPartner ? 'Salvar Alterações' : 'Confirmar Cadastro'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default Partners;
