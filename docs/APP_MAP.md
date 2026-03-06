
# Mapa do App FNPE

Este documento é gerado automaticamente a partir das rotas do arquivo `App.tsx`.

## Fluxograma de Navegação

```mermaid
flowchart TD
    Start((Início)) --> L1[Login /login/email]
    L1 --> L2[Verificação /login/codigo]
    L2 --> PCheck{Perfil Completo?}
    PCheck -- Não --> L3[Cadastro /login/perfil]
    PCheck -- Sim --> App([Área Logada /app])
    App --> D[Dashboard]
    App --- R__[/app]
    App --- R__eventos[Lista de Eventos]
    App --- R__eventos_id[Detalhes do Evento]
    App --- R__solicitar-certificacao[Solicitar Certificação]
    App --- R__ranking-estadual[Rankings por UF]
    App --- R__ranking-estadual_uf[Detalhe do Ranking]
    App --- R__atletas[Galeria de Atletas]
    App --- R__admin[Admin: Gestão Base]
    App --- R__admin-dashboard[Admin: Métricas]
    App --- R__comunicacao[Admin: Notificações]
    App --- R__admin_certificacoes[Admin: Pedidos Pendentes]
    App --- R__id-norte[Emissão de ID Norte]
    App --- R__consultar-id-norte[Consulta Pública ID]
    App --- R__perfil[Meu Perfil]
    App --- R__mapa[Mapa do Sistema]
```

## Lista de Rotas

| Rota | Componente | Descrição |
|------|------------|-----------|
| `/` | `Dashboard` | Dashboard / Início |
| `/eventos` | `Events` | Lista de Eventos |
| `/eventos/:id` | `EventDetails` | Detalhes do Evento |
| `/solicitar-certificacao` | `CertificationRequestForm` | Solicitar Certificação |
| `/ranking-estadual` | `Rankings` | Rankings por UF |
| `/ranking-estadual/:uf` | `RankingEstado` | Detalhe do Ranking |
| `/atletas` | `Athletes` | Galeria de Atletas |
| `/admin` | `Admin` | Admin: Gestão Base |
| `/admin-dashboard` | `AdminDashboard` | Admin: Métricas |
| `/comunicacao` | `AdminCommunication` | Admin: Notificações |
| `/admin/certificacoes` | `AdminCertificationRequests` | Admin: Pedidos Pendentes |
| `/id-norte` | `IdNortePage` | Emissão de ID Norte |
| `/consultar-id-norte` | `ConsultarIdNorte` | Consulta Pública ID |
| `/perfil` | `Profile` | Meu Perfil |
| `/mapa` | `AppMap` | Mapa do Sistema |

--- 
*Gerado em: 22/05/2025, 14:00:00*
