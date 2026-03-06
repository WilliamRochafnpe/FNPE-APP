
import * as fs from 'fs';
import * as path from 'path';

/**
 * Script de Geração Automática do Mapa do App FNPE
 * Objetivo: Analisar App.tsx e gerar docs/APP_MAP.md
 */

// Fix: Cast process to any to access cwd() method which may not be present in the standard Process type definition in some TS environments
const APP_PATH = path.join((process as any).cwd(), 'App.tsx');
// Fix: Cast process to any to access cwd() method which may not be present in the standard Process type definition in some TS environments
const OUTPUT_PATH = path.join((process as any).cwd(), 'docs', 'APP_MAP.md');

function generateMap() {
  console.log('--- Gerando Mapa do App FNPE ---');

  if (!fs.existsSync(APP_PATH)) {
    console.error('App.tsx não encontrado!');
    return;
  }

  const content = fs.readFileSync(APP_PATH, 'utf-8');
  
  // Regex simples para capturar rotas
  const routeRegex = /<Route\s+path="([^"]+)"\s+element={([^}]+)}/g;
  let match;
  const routes: { path: string, component: string }[] = [];

  while ((match = routeRegex.exec(content)) !== null) {
    routes.push({ path: match[1], component: match[2].replace('<', '').replace(' />', '').replace('Gate', '').trim() });
  }

  // Mapeamento de nomes amigáveis para o diagrama
  const friendlyNames: Record<string, string> = {
    '/': 'Dashboard / Início',
    '/login': 'Login (Root)',
    '/login/email': 'Entrada de E-mail',
    '/login/codigo': 'Verificação de Código',
    '/login/perfil': 'Completar Perfil',
    '/login/recuperar': 'Recuperação de Conta',
    '/eventos': 'Lista de Eventos',
    '/eventos/:id': 'Detalhes do Evento',
    '/solicitar-certificacao': 'Solicitar Certificação',
    '/ranking-estadual': 'Rankings por UF',
    '/ranking-estadual/:uf': 'Detalhe do Ranking',
    '/atletas': 'Galeria de Atletas',
    '/admin': 'Admin: Gestão Base',
    '/admin-dashboard': 'Admin: Métricas',
    '/comunicacao': 'Admin: Notificações',
    '/admin/certificacoes': 'Admin: Pedidos Pendentes',
    '/id-norte': 'Emissão de ID Norte',
    '/consultar-id-norte': 'Consulta Pública ID',
    '/perfil': 'Meu Perfil',
    '/mapa': 'Mapa do Sistema'
  };

  let mermaid = '```mermaid\nflowchart TD\n';
  mermaid += '    Start((Início)) --> L1[Login /login/email]\n';
  mermaid += '    L1 --> L2[Verificação /login/codigo]\n';
  mermaid += '    L2 --> PCheck{Perfil Completo?}\n';
  mermaid += '    PCheck -- Não --> L3[Cadastro /login/perfil]\n';
  mermaid += '    PCheck -- Sim --> App([Área Logada /app])\n';
  mermaid += '    App --> D[Dashboard]\n';

  routes.forEach(r => {
    if (r.path.startsWith('/') && !r.path.includes('login')) {
      const name = friendlyNames[r.path] || r.component;
      mermaid += `    App --- R_${r.path.replace(/\//g, '_').replace(/:/g, '')}[${name}]\n`;
    }
  });

  mermaid += '```';

  const markdown = `# Mapa do App FNPE\n\nEste documento é gerado automaticamente a partir das rotas do arquivo \`App.tsx\`.\n\n## Fluxograma de Navegação\n\n${mermaid}\n\n## Lista de Rotas\n\n| Rota | Componente | Descrição |\n|------|------------|-----------|\n${routes.map(r => `| \`${r.path}\` | \`${r.component}\` | ${friendlyNames[r.path] || '-'} |`).join('\n')}\n\n--- \n*Gerado em: ${new Date().toLocaleString()}*`;

  if (!fs.existsSync(path.dirname(OUTPUT_PATH))) {
    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  }

  fs.writeFileSync(OUTPUT_PATH, markdown);
  console.log('Arquivo docs/APP_MAP.md atualizado com sucesso!');
}

generateMap();
