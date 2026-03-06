
# SQL Schema e Políticas de Segurança - FNPE (v1.2)

Execute o bloco abaixo no **SQL Editor** do seu painel Supabase para criar a estrutura e configurar as permissões.

```sql
-- ==========================================
-- 1. CRIAÇÃO DAS TABELAS
-- ==========================================

-- Tabela de Atletas (Perfis)
create table if not exists public.atletas (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  nome_completo text,
  cpf text unique,
  telefone text,
  cidade text,
  uf text,
  foto_url text,
  nivel text default 'PESCADOR',
  id_norte_status text default 'NAO_SOLICITADO',
  id_norte_numero text,
  id_norte_pdf_url text,
  id_norte_validade timestamptz,
  data_nascimento date,
  sexo text,
  tempo_pescador text,
  historia text,
  galeria text[] default '{}',
  criado_em timestamptz default now(),
  atualizado_em timestamptz default now()
);

-- Tabela de Eventos
create table if not exists public.eventos (
  id uuid default gen_random_uuid() primary key,
  codigo_certificado text unique,
  nome_evento text not null,
  descricao text,
  instituicao_organizadora text,
  responsaveis text,
  cidade text,
  uf text,
  data_evento date,
  tem_caiaque boolean default false,
  tem_embarcado boolean default false,
  tem_arremesso boolean default false,
  tem_barranco boolean default false,
  logo_url text,
  email_contato_evento text,
  contato_telefone text,
  criado_em timestamptz default now()
);

-- Tabela de Resultados (Rankings)
create table if not exists public.resultados (
  id uuid default gen_random_uuid() primary key,
  evento_id uuid references public.eventos on delete cascade,
  atleta_id uuid references public.atletas on delete cascade,
  categoria text,
  pontuacao numeric(10,2),
  colocacao int,
  id_norte_numero text,
  criado_em timestamptz default now()
);

-- Tabela de Mensagens/Comunicados
create table if not exists public.mensagens (
  id uuid default gen_random_uuid() primary key,
  titulo text,
  conteudo text,
  destinatario_tipo text,
  destinatario_id uuid,
  enviado_por uuid references public.atletas(id),
  link_externo text,
  status text default 'ENVIADA',
  lida_por uuid[] default '{}',
  anexos jsonb default '[]'::jsonb,
  data_envio timestamptz default now()
);

-- Tabela de Solicitações de Certificação
create table if not exists public.solicitacoes_evento (
  id uuid default gen_random_uuid() primary key,
  status text default 'PENDENTE',
  data_solicitacao timestamptz default now(),
  solicitado_por_usuario_id uuid references public.atletas(id),
  solicitado_por_email text,
  logo_evento text,
  nome_evento text,
  descricao text,
  periodo_inicio date,
  periodo_fim date,
  categorias text[] default '{}',
  cidade text,
  uf text,
  instituicao_nome text,
  instituicao_documento text,
  responsaveis text,
  responsaveis_contato text,
  email_contato_evento text,
  anexos jsonb default '[]'::jsonb,
  aprovado_em timestamptz,
  evento_id uuid references public.eventos(id),
  motivo_rejeicao text
);

-- Tabela Financeira: Cobranças
create table if not exists public.cobrancas (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.atletas(id) on delete set null,
  tipo text,
  valor int,
  status text default 'pendente',
  forma text default 'pendente',
  observacao text,
  admin_nome text,
  origem_receita text,
  data_pagamento timestamptz,
  data_criacao timestamptz default now()
);

-- Tabela Financeira: Despesas
create table if not exists public.despesas (
  id uuid default gen_random_uuid() primary key,
  descricao text,
  valor int,
  categoria text,
  data date,
  criado_em timestamptz default now()
);

-- Configurações Globais
create table if not exists public.configuracoes (
  id text primary key,
  nome_do_aplicativo text default 'FNPE',
  rankings_covers jsonb default '{}'::jsonb,
  atualizado_em timestamptz default now()
);

-- ==========================================
-- 2. ATIVAÇÃO DE RLS (SEGURANÇA)
-- ==========================================
alter table public.atletas enable row level security;
alter table public.eventos enable row level security;
alter table public.resultados enable row level security;
alter table public.mensagens enable row level security;
alter table public.solicitacoes_evento enable row level security;
alter table public.cobrancas enable row level security;
alter table public.despesas enable row level security;
alter table public.configuracoes enable row level security;

-- ==========================================
-- 3. POLÍTICAS DE ACESSO (POLICIES)
-- ==========================================

-- POLÍTICAS PARA ATLETAS
create policy "Qualquer um pode ver atletas" on public.atletas for select using (true);
create policy "Usuários podem editar seu próprio perfil" on public.atletas for update using (auth.uid() = id);
create policy "Admins podem tudo em atletas" on public.atletas for all using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- POLÍTICAS PARA EVENTOS E RESULTADOS
create policy "Público pode ver eventos" on public.eventos for select using (true);
create policy "Público pode ver resultados" on public.resultados for select using (true);
create policy "Apenas Admins gerenciam eventos/resultados" on public.eventos for all using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);
create policy "Apenas Admins inserem resultados" on public.resultados for insert with check (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- POLÍTICAS PARA SOLICITAÇÕES DE CERTIFICAÇÃO
create policy "Usuários veem suas próprias solicitações" on public.solicitacoes_evento for select using (auth.uid() = solicitado_por_usuario_id);
create policy "Usuários podem criar solicitações" on public.solicitacoes_evento for insert with check (auth.uid() = solicitado_por_usuario_id);
create policy "Admins veem todas as solicitações" on public.solicitacoes_evento for select using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);
create policy "Admins atualizam solicitações" on public.solicitacoes_evento for update using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- POLÍTICAS PARA MENSAGENS
create policy "Usuários veem mensagens para eles ou globais" on public.mensagens for select using (
  destinatario_tipo = 'TODOS' or destinatario_id = auth.uid() or
  exists (select 1 from public.atletas where id = auth.uid() and (nivel = 'ADMIN' or nivel = destinatario_tipo))
);
create policy "Admins criam mensagens" on public.mensagens for insert with check (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- POLÍTICAS PARA FINANCEIRO
create policy "Usuários veem suas próprias cobranças" on public.cobrancas for select using (auth.uid() = user_id);
create policy "Admins gerenciam financeiro" on public.cobrancas for all using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);
create policy "Admins gerenciam despesas" on public.despesas for all using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- POLÍTICAS PARA CONFIGURAÇÕES
create policy "Qualquer um vê configs" on public.configuracoes for select using (true);
create policy "Admins editam configs" on public.configuracoes for update using (
  exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);

-- ==========================================
-- 4. CONFIGURAÇÃO DE STORAGE (ARQUIVOS)
-- ==========================================
-- Nota: Execute isto se o bucket 'midia' já estiver criado no painel Storage.
insert into storage.buckets (id, name, public) values ('midia', 'midia', true) on conflict do nothing;

create policy "Imagens públicas para todos" on storage.objects for select using (bucket_id = 'midia');
create policy "Usuários autenticados fazem upload" on storage.objects for insert with check (
  bucket_id = 'midia' and auth.role() = 'authenticated'
);
create policy "Admins excluem arquivos" on storage.objects for delete using (
  bucket_id = 'midia' and exists (select 1 from public.atletas where id = auth.uid() and nivel = 'ADMIN')
);
```
