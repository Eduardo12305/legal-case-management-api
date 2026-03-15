# Arquitetura Profissional Da API Juridica

## 1. Problemas Da Arquitetura Atual

Os principais problemas observados na arquitetura atual sao:

- o `ADMIN` participa do fluxo operacional de processos, o que mistura governanca com execucao;
- autorizacao esta muito concentrada em role basica, com pouca expressao de ownership e responsabilidade real;
- nao existe trilha formal de auditoria para eventos sensiveis do sistema;
- o historico juridico do processo esta misturado com atualizacoes simples e nao cobre todo o contexto legal/operacional;
- nao existe versionamento formal das mudancas criticas do processo;
- a modelagem atual atende um MVP funcional, mas nao representa bem um escritorio juridico profissional.

## 2. Arquitetura Proposta

Proposta arquitetural:

- `Admin`: governanca, configuracao, usuarios, auditoria, relatorios.
- `Lawyer`: opera o processo juridico.
- `Staff`: suporte operacional, cadastro inicial, documentos e comunicacao.
- `Client`: manter apenas como papel de portal externo durante transicao, nao como papel interno do escritorio.

Padrao recomendado:

- `domain`: regras centrais do negocio.
- `application`: use cases.
- `infrastructure`: persistencia, HTTP, Prisma, logs.
- `interfaces`: controllers e rotas.

No estado atual do projeto, foi adicionada uma base intermediaria que introduz:

- modulo de `access-control`;
- modulo de `audit`;
- modulo de `legal-history`;
- modulo de `versioning`;
- exemplo de `use case` profissional para criacao de processo.

## 3. Entidades Principais

### Nucleo atual e transicional

- `User`
- `Client`
- `Process`
- `Document`
- `ProcessUpdate`

### Entidades novas para arquitetura profissional

- `AuditLog`
- `LegalEvent`
- `ProcessVersion`
- `ProcessAssignment`

Essas entidades foram adicionadas ao [prisma/schema.prisma](/home/luis-eduardo/Documentos/projetos/Advon/prisma/schema.prisma).

## 4. RBAC

Permissoes base foram modeladas em:

- [src/modules/access-control/permissions.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/access-control/permissions.jsx)

Distribuicao recomendada:

- `ADMIN`
  - gerencia usuarios
  - visualiza auditoria
  - gerencia configuracoes
  - acessa relatorios
  - nao cria processo como operacao padrao

- `LAWYER`
  - cria processos
  - altera status
  - registra movimentacoes juridicas
  - assume responsabilidade juridica

- `STAFF`
  - cadastra clientes
  - organiza documentos
  - auxilia triagem e comunicacao
  - nao executa decisoes juridicas privativas do advogado

## 5. ABAC

ABAC foi modelado com base em ownership e responsabilidade real do processo em:

- [src/modules/access-control/processPolicies.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/access-control/processPolicies.jsx)

Regras recomendadas:

- `LAWYER` so visualiza/edita processos sob sua responsabilidade.
- `STAFF` acessa apenas processos do fluxo em que esta explicitamente vinculado.
- `ADMIN` monitora e governa, mas nao executa operacao juridica por padrao.
- `CLIENT` so acessa o proprio processo no portal externo.

## 5.1 STAFF Com Permissoes Granulares

Foi adotado um modelo em dois niveis:

- `role` macro: `STAFF`
- permissao granular administrada pelo `ADMIN`

Justificativa:

- evita proliferacao de roles como `FINANCIAL_ASSISTANT`, `ADMIN_ASSISTANT`, `INTAKE_ASSISTANT` logo no inicio;
- permite diferenciar atendente, assistente juridico e assistente financeiro sem tornar o RBAC rigido demais;
- mantem limite estrutural: `STAFF` nao vira `LAWYER` nem `ADMIN`.

Implementacao base:

- schema: `UserPermission`
- middleware: `authorizePermissions`
- endpoint de gestao: `PUT /api/users/:id/staff-permissions`

Exemplo de permissoes concediveis a `STAFF`:

- `CLIENT_CREATE`
- `CLIENT_VIEW`
- `CLIENT_UPDATE`
- `DOCUMENT_UPLOAD`
- `PROCESS_INTAKE_CREATE`
- `LEGAL_EVENT_CREATE`
- `FINANCIAL_VIEW`
- `FINANCIAL_MANAGE`

Decisao importante:

- inativar usuario ou cliente continua fora do escopo de `STAFF`;
- esse tipo de acao permanece sob governanca administrativa, nao operacional.

## 6. Auditoria

Estrutura implementada:

- schema: `AuditLog`
- servico: [src/modules/audit/auditService.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/audit/auditService.jsx)
- repositorio: [src/modules/audit/auditRepository.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/audit/auditRepository.jsx)

Campos importantes do audit log:

- `actorId`
- `action`
- `entityType`
- `entityId`
- `context`
- `metadata`
- `ipAddress`
- `userAgent`
- `createdAt`

Essa estrutura atende rastreabilidade tecnica e governanca.

## 7. Logs Juridicos

Logs juridicos profissionais nao sao iguais a log tecnico.

Para isso foi criada a entidade `LegalEvent`, com base em:

- tipo do evento
- autor
- processo
- titulo
- descricao
- metadata

Implementacao base:

- [src/modules/legal-history/legalEventService.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/legal-history/legalEventService.jsx)
- [src/modules/legal-history/legalEventRepository.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/legal-history/legalEventRepository.jsx)

Exemplos de eventos juridicos:

- processo criado
- status alterado
- documento adicionado
- responsavel alterado
- observacao juridica relevante
- movimentacao interna

## 8. Versionamento

Versionamento formal foi modelado com `ProcessVersion`.

Cada versao guarda:

- `processId`
- `versionNumber`
- `changedById`
- `changeType`
- `previousData`
- `newData`
- `createdAt`

Implementacao base:

- [src/modules/versioning/processVersionService.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/versioning/processVersionService.jsx)
- [src/modules/versioning/processVersionRepository.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/versioning/processVersionRepository.jsx)

Isso permite reconstruir:

- quem alterou
- o que alterou
- estado anterior
- estado novo
- quando aconteceu

## 9. Estrutura De Pastas Recomendada

Estrutura alvo:

```text
src/
  app.jsx
  server.js
  config/
  modules/
    access-control/
    audit/
    legal-history/
    processes/
      useCases/
    versioning/
    shared/
  controllers/
  routes/
  middlewares/
  repositories/
  services/
  utils/
  validators/
```

Justificativa:

- mantem compatibilidade com a base atual;
- cria um caminho claro para migrar de services genericos para use cases;
- reduz acoplamento entre HTTP, regra de negocio e persistencia.

## 10. Exemplo De Fluxo Profissional

Exemplo implementado:

- [src/modules/processes/useCases/createProcessUseCase.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/modules/processes/useCases/createProcessUseCase.jsx)

O fluxo do use case:

1. valida RBAC/ABAC;
2. bloqueia `ADMIN` na operacao padrao de criacao;
3. valida cliente;
4. cria processo com advogado responsavel;
5. grava auditoria;
6. grava evento juridico;
7. grava versao inicial do processo.

## Decisoes Tecnicas Importantes

### Sobre Admin

Foi adotada a decisao tecnica de que `ADMIN` nao cria processos por padrao.

Justificativa:

- reduz mistura entre governanca e operacao;
- melhora seguranca;
- melhora rastreabilidade;
- reflete segregacao real de funcao em escritorio juridico profissional.

### Sobre Staff

Foi adicionada a role `STAFF` para representar atendente/funcionario operacional.

Justificativa:

- `CLIENT` nao representa operacao interna;
- `STAFF` deixa o dominio mais correto;
- facilita ABAC por fluxo de trabalho.

### Sobre Cliente

`CLIENT` foi mantido por compatibilidade com a base atual, mas deve ser tratado como papel de portal externo, nao como role interna do escritorio.

## Endpoints Protegidos Recomendados

Exemplos de politica:

- `POST /processes`
  - apenas `LAWYER`
- `PATCH /processes/:id/status`
  - `LAWYER` responsavel
- `POST /processes/:id/documents`
  - `LAWYER` responsavel ou `STAFF` vinculado
- `GET /audit-logs`
  - apenas `ADMIN`
- `PATCH /users/:id/role`
  - apenas `ADMIN`

## Caminho De Evolucao

Ordem recomendada de migracao real:

1. introduzir `STAFF` e separar fluxo interno de `CLIENT`;
2. mover criacao de processo para `LAWYER`;
3. gravar `AuditLog` em login, mudanca de status e gestao de usuarios;
4. gravar `LegalEvent` em eventos juridicos;
5. gravar `ProcessVersion` em alteracoes relevantes;
6. substituir autorizacoes simples de rota por politicas ABAC centrais.
