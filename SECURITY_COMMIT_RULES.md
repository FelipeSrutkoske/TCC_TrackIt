# Security Commit Rules

- Nunca commitar arquivos `.env`, `.env.*`, credenciais, chaves privadas, certificados, dumps de banco ou tokens locais.
- Antes de commitar, conferir `git status --short --ignored` e garantir que arquivos sensiveis aparecem como ignorados, nao como rastreados.
- Se um novo arquivo local tiver segredo ou dado de maquina, adicionar um padrao correspondente ao `.gitignore` antes de continuar.
- Pastas geradas/local-only como `.expo/`, `dist/`, `node_modules/`, `.next/`, `coverage/` e `docs/superpowers/` devem permanecer fora do git.
- Exemplos de valores sensiveis que devem ficar fora do git: `DB_PASSWORD`, `JWT_SECRET`, chaves de API, tokens Bearer, certificados e URLs com usuario/senha.
