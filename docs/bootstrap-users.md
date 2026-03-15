# Bootstrap De Usuarios Iniciais

## O Que Foi Feito

Foram aplicadas duas medidas seguindo boas praticas:

- o `register` publico agora aceita apenas `CLIENT`;
- usuarios internos do escritorio passam a ser criados por seed interno.

Arquivos relevantes:

- [src/services/authService.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/services/authService.jsx)
- [src/validators/authValidators.jsx](/home/luis-eduardo/Documentos/projetos/Advon/src/validators/authValidators.jsx)
- [scripts/seed.cjs](/home/luis-eduardo/Documentos/projetos/Advon/scripts/seed.cjs)

## Por Que Essa Abordagem

Permitir `ADMIN`, `LAWYER` ou `STAFF` por registro publico e uma falha de seguranca.

Boas praticas adotadas:

- `CLIENT` pode existir por onboarding controlado do portal;
- usuarios internos sao provisionados por processo interno;
- `ADMIN` nasce por seed ou processo administrativo autenticado;
- credenciais iniciais devem ser trocadas apos o primeiro uso em ambiente real.

## Como Usar

Depois de preparar o banco:

```bash
npx prisma generate
npx prisma db push
npm run seed
```

## Usuarios Criados Pelo Seed

- `admin@advon.local` / `Admin@123`
- `lawyer@advon.local` / `Lawyer@123`
- `staff@advon.local` / `Staff@123`
- `client@advon.local` / `Client@123`

## Permissoes Iniciais Do Staff

O seed concede ao usuario `STAFF`:

- `CLIENT_CREATE`
- `CLIENT_VIEW`
- `DOCUMENT_UPLOAD`

Essas permissoes sao apenas um ponto de partida para desenvolvimento.

## Recomendacoes

- em desenvolvimento, o seed e o caminho mais rapido para testar com front-end;
- em producao, use senha forte e altere imediatamente apos bootstrap;
- idealmente o seed de producao deve ser parametrizado por variaveis de ambiente ou executado uma unica vez.
