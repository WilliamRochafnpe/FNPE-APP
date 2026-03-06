
import React, { useState, useEffect } from 'react';
import { 
  Save, 
  Download, 
  Upload, 
  History, 
  Trash2, 
  ShieldCheck, 
  AlertTriangle,
  Clock,
  CheckCircle2,
  FileJson
} from 'lucide-react';
import { useApp } from '../App';
import { 
  saveDB, 
  exportJSON, 
  importJSONFile, 
  createSnapshot, 
  listSnapshots, 
  deleteSnapshot,
  validateDB,
  loadDB
} from '../db';
import { Snapshot, DB } from '../types';

const BackupRestorePanel: React.FC = () => {
  const { db, setDb, user, setUser } = useApp();
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [status, setStatus] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  useEffect(() => {
    setSnapshots(listSnapshots());
  }, []);

  const notify = (type: 'success' | 'error' | 'info', message: string) => {
    setStatus({ type, message });
    setTimeout(() => setStatus(null), 4000);
  };

  const handleManualSave = () => {
    saveDB(db);
    setLastSaved(new Date().toLocaleTimeString());
    notify('success', 'Dados persistidos localmente com sucesso!');
  };

  const handleExport = () => {
    exportJSON(db);
    notify('info', 'Download do backup iniciado.');
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Criar snapshot preventivo antes de importar
      createSnapshot(db, "Antes de importar arquivo JSON");
      
      const newDB = await importJSONFile(file);
      applyNewDB(newDB, 'Backup importado com sucesso!');
    } catch (err: any) {
      notify('error', err.message || 'Erro ao importar arquivo.');
    } finally {
      e.target.value = ''; // Limpar input
    }
  };

  const handleCreateSnapshot = () => {
    const label = prompt("Dê um nome para este snapshot (opcional):") || "Manual";
    createSnapshot(db, label);
    setSnapshots(listSnapshots());
    notify('success', 'Snapshot criado com sucesso!');
  };

  const handleRestoreSnapshot = (snap: Snapshot) => {
    if (!confirm(`Restaurar snapshot de ${new Date(snap.criado_em).toLocaleString()}? O estado atual será salvo em um novo snapshot.`)) return;

    // Snapshot do estado atual antes de restaurar
    createSnapshot(db, "Antes de restaurar snapshot");
    
    applyNewDB(snap.dados, 'Sistema restaurado para o ponto selecionado.');
  };

  const applyNewDB = (newDB: DB, successMsg: string) => {
    // 1. Persistir no Storage
    saveDB(newDB);
    
    // 2. Atualizar Estado Global
    setDb(newDB);
    setSnapshots(listSnapshots());

    // 3. Validar Sessão
    if (user) {
      const foundUser = newDB.users.find(u => u.id === user.id);
      if (foundUser) {
        // Sincroniza dados do usuário se ele mudou no novo DB
        setUser(foundUser);
      } else {
        // Se o usuário logado não existe no novo DB, desloga
        setUser(null);
      }
    }

    notify('success', successMsg);
  };

  const handleDeleteSnapshot = (id: string) => {
    if (!confirm("Excluir este snapshot permanentemente?")) return;
    deleteSnapshot(id);
    setSnapshots(listSnapshots());
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <ShieldCheck className="text-emerald-500 w-5 h-5" />
        <h2 className="text-xl font-black text-slate-900">Segurança e Backup</h2>
      </div>

      {status && (
        <div className={`p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-top-2 ${
          status.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
          status.type === 'error' ? 'bg-red-50 text-red-700 border border-red-100' : 'bg-indigo-50 text-indigo-700 border border-indigo-100'
        }`}>
          {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
          <span className="text-sm font-bold">{status.message}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Painel Principal de Ações */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm space-y-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Ações Rápidas</h3>
            {lastSaved && <span className="text-[10px] text-emerald-500 font-bold">Salvo às {lastSaved}</span>}
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={handleManualSave}
              className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-emerald-50 hover:border-emerald-100 transition-all group"
            >
              <Save className="w-6 h-6 text-slate-400 group-hover:text-emerald-500" />
              <span className="text-[10px] font-black uppercase text-slate-600">Salvar DB</span>
            </button>

            <button 
              onClick={handleCreateSnapshot}
              className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-indigo-50 hover:border-indigo-100 transition-all group"
            >
              <History className="w-6 h-6 text-slate-400 group-hover:text-indigo-500" />
              <span className="text-[10px] font-black uppercase text-slate-600">Snapshot</span>
            </button>

            <button 
              onClick={handleExport}
              className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-amber-50 hover:border-amber-100 transition-all group"
            >
              <Download className="w-6 h-6 text-slate-400 group-hover:text-amber-600" />
              <span className="text-[10px] font-black uppercase text-slate-600">Exportar</span>
            </button>

            <label className="flex flex-col items-center gap-2 p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-blue-50 hover:border-blue-100 transition-all group cursor-pointer">
              <Upload className="w-6 h-6 text-slate-400 group-hover:text-blue-500" />
              <span className="text-[10px] font-black uppercase text-slate-600">Importar</span>
              <input type="file" className="hidden" accept=".json" onChange={handleImport} />
            </label>
          </div>
        </div>

        {/* Lista de Snapshots */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Histórico Local (10)</h3>
            <Clock className="w-4 h-4 text-slate-300" />
          </div>
          
          <div className="flex-1 space-y-2 overflow-y-auto max-h-[160px] pr-2 custom-scrollbar">
            {snapshots.length === 0 ? (
              <div className="text-center py-8 text-slate-300 italic text-xs">Nenhum snapshot registrado.</div>
            ) : (
              snapshots.map(snap => (
                <div key={snap.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 group">
                  <div className="overflow-hidden">
                    <p className="text-[10px] font-black text-slate-800 truncate">{snap.etiqueta || 'Sem nome'}</p>
                    <p className="text-[8px] text-slate-400 font-bold">{new Date(snap.criado_em).toLocaleString()}</p>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleRestoreSnapshot(snap)}
                      className="p-1.5 text-indigo-500 hover:bg-indigo-100 rounded-lg transition-colors"
                      title="Restaurar"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => exportJSON(snap.dados)}
                      className="p-1.5 text-emerald-500 hover:bg-emerald-100 rounded-lg transition-colors"
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteSnapshot(snap.id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"
                      title="Excluir"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const RotateCcw: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
  </svg>
);

export default BackupRestorePanel;
