
import React from 'react';
import { Network, Map as MapIcon, ArrowRight, Shield, User, Trophy, CreditCard, ExternalLink, Code } from 'lucide-react';

const AppMap: React.FC = () => {
  const routes = [
    { path: '/login/email', label: 'Login', icon: User, flow: 'Autenticação' },
    { path: '/app', label: 'Dashboard Principal', icon: MapIcon, flow: 'Navegação' },
    { path: '/app/id-norte', label: 'ID Norte (Solicitar/Ver)', icon: CreditCard, flow: 'Atleta' },
    { path: '/app/ranking-estadual', label: 'Rankings Estaduais', icon: Trophy, flow: 'Competição' },
    { path: '/app/eventos', label: 'Eventos Certificados', icon: ExternalLink, flow: 'Competição' },
    { path: '/app/admin-dashboard', label: 'Painel Admin (Métricas)', icon: Shield, flow: 'Gestão' },
    { path: '/app/perfil', label: 'Perfil do Atleta', icon: User, flow: 'Atleta' },
  ];

  const mermaidCode = `flowchart TD
    Start((Início)) --> Login[Login /login/email]
    Login --> Code[Verificação /login/codigo]
    Code --> ProfileCheck{Perfil Completo?}
    ProfileCheck -- Não --> Complete[Cadastro /login/perfil]
    ProfileCheck -- Sim --> Dashboard[Dashboard /app]
    Dashboard --> ID[ID Norte]
    Dashboard --> Rankings[Rankings]
    Dashboard --> Events[Eventos]
    Dashboard --> Admin[Admin Dashboard]`;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <Network className="text-emerald-500 w-8 h-8" />
          <h1 className="text-3xl font-black text-white tracking-tight uppercase">Mapa do Sistema</h1>
        </div>
        <p className="text-slate-500 font-medium italic">Visão geral da arquitetura de navegação e fluxos do app FNPE.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <section className="bg-slate-900 p-8 rounded-[40px] border border-slate-800 shadow-xl space-y-6">
          <h2 className="text-lg font-black text-white flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            Fluxograma Mermaid (Código)
          </h2>
          <div className="bg-slate-950 p-6 rounded-3xl border border-slate-800 relative group">
            <pre className="text-emerald-500 font-mono text-xs overflow-x-auto whitespace-pre-wrap">
              {mermaidCode}
            </pre>
            <button 
              onClick={() => {
                navigator.clipboard.writeText(mermaidCode);
                alert('Código Mermaid copiado para a área de transferência!');
              }}
              className="absolute top-4 right-4 p-2 bg-slate-900 text-slate-400 hover:text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all border border-slate-800"
            >
              <Code className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-slate-500 italic">O diagrama acima pode ser colado em editores como o <a href="https://mermaid.live" target="_blank" rel="noreferrer" className="text-emerald-500 underline">Mermaid Live Editor</a> para visualização gráfica total.</p>
        </section>

        <section className="space-y-4">
          <h2 className="text-lg font-black text-white flex items-center gap-2 ml-2">
            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
            Principais Pontos de Entrada
          </h2>
          <div className="grid grid-cols-1 gap-3">
            {routes.map((route) => (
              <div key={route.path} className="bg-slate-900 p-5 rounded-3xl border border-slate-800 flex items-center justify-between hover:border-emerald-500/50 transition-all group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950 rounded-2xl text-slate-500 group-hover:text-emerald-500 transition-colors">
                    <route.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{route.label}</p>
                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{route.flow}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                   <span className="text-[10px] font-mono text-slate-700 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">{route.path}</span>
                   <ArrowRight className="w-4 h-4 text-slate-800 group-hover:text-emerald-500 group-hover:translate-x-1 transition-all" />
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="bg-emerald-500/5 p-8 rounded-[40px] border border-emerald-500/10 flex flex-col md:flex-row items-center gap-6">
        <div className="p-4 bg-emerald-500/10 rounded-3xl text-emerald-500">
          <Shield className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-black text-white">Documentação Dinâmica</h3>
          <p className="text-slate-500 text-sm mt-1 leading-relaxed">
            Este mapa é mantido através do script <code>app:map</code>. Ele analisa o arquivo de rotas em tempo real para garantir que a documentação técnica nunca esteja desatualizada em relação ao código de produção.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AppMap;
