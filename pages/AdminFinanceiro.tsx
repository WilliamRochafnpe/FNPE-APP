
import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Wallet, Search, Plus, CheckCircle2,
  User as UserIcon, DollarSign, FileSpreadsheet, X, CheckCircle, Gift, Handshake
} from 'lucide-react';
import { useApp } from '../App';
import { Cobranca, Despesa, CobrancaForma } from '../types';
import { syncDatabase } from '../services/auth/supabaseAuth';
import { SUPABASE_ENABLED } from '../lib/supabase';
import { downloadCSV } from '../utils/report';

const ORIGENS_MANUAIS = ["Patrocínio", "Doação", "Taxa Administrativa", "Outros"];

const AdminFinanceiro: React.FC = () => {
  const { db, setDb, user: adminUser } = useApp();
  const [filterType, setFilterType] = useState<'todos' | 'receita' | 'despesa'>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showAddRevenue, setShowAddRevenue] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  const [newRevenue, setNewRevenue] = useState({ valor: '', forma: 'pagamento' as CobrancaForma, origem: 'Patrocínio', userId: '', obs: '' });
  const [newExpense, setNewExpense] = useState({ descricao: '', valor: '', categoria: '', data: new Date().toISOString().split('T')[0] });

  const usersFound = useMemo(() => {
    if (!userSearchTerm.trim()) return [];
    return db.users.filter(u => u.nome_completo.toLowerCase().includes(userSearchTerm.toLowerCase())).slice(0, 5);
  }, [db.users, userSearchTerm]);

  const filteredData = useMemo(() => {
    const list: any[] = [];
    (db.cobrancas || []).forEach(c => {
      const u = db.users.find(usr => usr.id === c.user_id);
      if (filterType !== 'despesa') list.push({ ...c, recordType: 'receita', date: c.data_pagamento || c.data_criacao, userName: u?.nome_completo || 'NÃO VINCULADO' });
    });
    (db.despesas || []).forEach(d => {
      if (filterType !== 'receita') list.push({ ...d, recordType: 'despesa', status: 'confirmado', forma: 'pagamento', date: d.data, userName: 'FEDERAÇÃO' });
    });
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [db, filterType]);

  const handleConfirmarReceita = async (id: string, forma: CobrancaForma) => {
    if (!adminUser) return;
    const updates = {
      status: 'confirmado' as const,
      forma,
      data_pagamento: new Date().toISOString(),
      admin_nome: adminUser.nome_completo
    };
    try {
      if (SUPABASE_ENABLED) await syncDatabase.updateCobranca(id, updates);
      setDb(prev => ({ ...prev, cobrancas: prev.cobrancas.map(c => c.id === id ? { ...c, ...updates } : c) }));
    } catch { alert("Erro ao sincronizar financeiro."); }
  };

  const handleAddRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const receita: Cobranca = {
      id: `rev-${Date.now()}`,
      user_id: newRevenue.userId || undefined,
      tipo: 'manual',
      valor: Math.round(parseFloat(newRevenue.valor.replace(',', '.')) * 100),
      status: 'confirmado',
      forma: newRevenue.forma,
      origem_receita: newRevenue.origem,
      data_criacao: new Date().toISOString(),
      data_pagamento: new Date().toISOString(),
      admin_nome: adminUser?.nome_completo
    };

    try {
      if (SUPABASE_ENABLED) {
        const inserted = await syncDatabase.insertCobranca(receita);
        setDb(prev => ({ ...prev, cobrancas: [inserted, ...prev.cobrancas] }));
      } else {
        setDb(prev => ({ ...prev, cobrancas: [receita, ...prev.cobrancas] }));
      }
      setShowAddRevenue(false);
    } catch { alert("Erro ao salvar receita."); } finally { setLoading(false); }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const despesa: Despesa = {
      id: `exp-${Date.now()}`,
      descricao: newExpense.descricao,
      valor: Math.round(parseFloat(newExpense.valor.replace(',', '.')) * 100),
      categoria: newExpense.categoria,
      data: newExpense.data
    };
    try {
      if (SUPABASE_ENABLED) {
        const inserted = await syncDatabase.insertDespesa(despesa);
        setDb(prev => ({ ...prev, despesas: [inserted, ...prev.despesas] }));
      } else {
        setDb(prev => ({ ...prev, despesas: [despesa, ...prev.despesas] }));
      }
      setShowAddExpense(false);
    } catch { alert("Erro ao salvar despesa."); } finally { setLoading(false); }
  };

  useEffect(() => {
    if (SUPABASE_ENABLED) {
      setLoading(true);
      syncDatabase.fetchAll().then(data => {
        setDb(data);
      }).catch(err => console.error(err)).finally(() => setLoading(false));
    }
  }, []);

  const handleRepairIdNorte = async () => {
    if (!SUPABASE_ENABLED) return;
    setLoading(true);
    let count = 0;
    try {
      const pendingUsers = db.users.filter(u => u.id_norte_status === 'PENDENTE');
      const allCobrancas = await syncDatabase.fetchAll().then(d => d.cobrancas || []); // Ensure fresh data

      for (const u of pendingUsers) {
        const hasCob = allCobrancas.find(c => c.user_id === u.id && c.tipo === 'id_norte');
        if (!hasCob) {
          const newCob: Cobranca = {
            id: `temp-${Date.now()}`, // Will be stripped
            user_id: u.id,
            tipo: 'id_norte',
            valor: 5000,
            status: 'pendente',
            forma: 'pendente',
            data_criacao: new Date().toISOString(),
            observacao: 'Taxa ID Norte (Recuperada)',
            admin_nome: 'SISTEMA'
          };
          await syncDatabase.insertCobranca(newCob);
          count++;
        }
      }
      if (count > 0) {
        const newData = await syncDatabase.fetchAll();
        setDb(newData); // Update full DB
        alert(`${count} solicitação(ões) recuperada(s)!`);
      } else {
        alert("Nenhuma solicitação perdida encontrada (verificado com dados atuais).");
      }
    } catch (err) {
      alert("Erro ao recuperar: " + err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-10 pb-24">
      <header className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h1 className="text-3xl font-black text-white uppercase flex items-center gap-3"><DollarSign className="w-8 h-8 text-emerald-500" /> Financeiro</h1>
        <div className="flex gap-3">
          <button onClick={() => setShowAddRevenue(true)} className="bg-emerald-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] transition-all hover:scale-105">Lançar Receita</button>
          <button onClick={() => setShowAddExpense(true)} className="bg-red-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] transition-all hover:scale-105">Lançar Despesa</button>
          <button onClick={handleRepairIdNorte} disabled={loading} className="bg-indigo-600 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] transition-all hover:scale-105 disabled:opacity-50">
            {loading ? '...' : 'Buscar Pedidos'}
          </button>
        </div>
      </header>

      <section className="bg-slate-900 rounded-[48px] border border-slate-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-slate-800 flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-tight">Fluxo de Caixa</h2>
          <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-slate-950 border border-slate-800 text-white rounded-xl p-2 text-xs font-bold uppercase">
            <option value="todos">Todos</option>
            <option value="receita">Entradas</option>
            <option value="despesa">Saídas</option>
          </select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <tbody className="divide-y divide-slate-800/50">
              {filteredData.map(item => (
                <tr key={item.id} className="hover:bg-slate-950/40">
                  <td className="p-6">
                    <p className="text-[10px] font-black text-slate-500 uppercase">{new Date(item.date).toLocaleDateString()}</p>
                    <p className="text-xs font-bold text-white uppercase">{item.observacao || item.descricao}</p>
                  </td>
                  <td className="p-6 text-right">
                    <p className={`text-sm font-black ${item.recordType === 'despesa' ? 'text-red-400' : 'text-white'}`}>R$ {(item.valor / 100).toLocaleString('pt-BR')}</p>
                  </td>
                  <td className="p-6 text-center">
                    {item.recordType === 'receita' && item.status === 'pendente' ? (
                      <div className="flex justify-center gap-2">
                        <button onClick={() => handleConfirmarReceita(item.id, 'pagamento')} title="Confirmar Pagamento" className="p-2 bg-emerald-500/10 text-emerald-500 rounded-lg"><CheckCircle className="w-4 h-4" /></button>
                        <button onClick={() => handleConfirmarReceita(item.id, 'cortesia')} title="Cortesia/Gratuito" className="p-2 bg-indigo-500/10 text-indigo-500 rounded-lg"><Gift className="w-4 h-4" /></button>
                      </div>
                    ) : <span className="text-[8px] font-black text-emerald-500 border border-emerald-500/20 px-2 py-1 rounded uppercase">Liberado</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {showAddRevenue && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-emerald-600 p-8 text-white flex justify-between">
              <h2 className="text-xl font-black uppercase">Receita Manual</h2>
              <button onClick={() => setShowAddRevenue(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddRevenue} className="p-8 space-y-4">
              <input required value={newRevenue.valor} onChange={e => setNewRevenue({ ...newRevenue, valor: e.target.value })} placeholder="Valor R$ 0,00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold" />
              <textarea value={newRevenue.obs} onChange={e => setNewRevenue({ ...newRevenue, obs: e.target.value })} placeholder="Descrição" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" />
              <button disabled={loading} className="w-full bg-emerald-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Confirmar Entrada</button>
            </form>
          </div>
        </div>
      )}

      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-950/90 z-[100] flex items-center justify-center p-4">
          <div className="bg-slate-900 w-full max-w-lg rounded-[40px] border border-slate-800 overflow-hidden shadow-2xl">
            <div className="bg-red-600 p-8 text-white flex justify-between">
              <h2 className="text-xl font-black uppercase">Lançar Despesa</h2>
              <button onClick={() => setShowAddExpense(false)}><X className="w-6 h-6" /></button>
            </div>
            <form onSubmit={handleAddExpense} className="p-8 space-y-4">
              <input required value={newExpense.valor} onChange={e => setNewExpense({ ...newExpense, valor: e.target.value })} placeholder="Valor R$ 0,00" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold" />
              <input required value={newExpense.descricao} onChange={e => setNewExpense({ ...newExpense, descricao: e.target.value })} placeholder="Descrição" className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" />
              <input type="date" required value={newExpense.data} onChange={e => setNewExpense({ ...newExpense, data: e.target.value })} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white" />
              <button disabled={loading} className="w-full bg-red-600 text-white py-5 rounded-2xl font-black uppercase text-xs">Confirmar Saída</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminFinanceiro;