# Como Rodar o TrackIt

## Visao geral

Este projeto agora tem 3 partes relevantes:

- `backend/` -> API NestJS
- `frontend/dashcontrole/` -> dashboard web
- `mobile/` -> app Expo do motorista

## Portas esperadas

- dashboard: `3000`
- backend: `3001`
- expo: porta dinamica do Expo dev server

## 1. Backend

Diretorio:

```bash
backend/
```

Instalar dependencias:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run start:dev
```

Se estiver tudo certo, a API deve ficar disponivel em algo como:

```text
http://localhost:3001
```

## 2. Dashboard web

Diretorio:

```bash
frontend/dashcontrole/
```

Instalar dependencias:

```bash
npm install
```

Rodar em desenvolvimento:

```bash
npm run dev
```

Abrir no navegador:

```text
http://localhost:3000
```

## 3. Mobile

Diretorio:

```bash
mobile/
```

Instalar dependencias:

```bash
npm install
```

### Rodando no Android emulator

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001 npm start
```

Ou:

```bash
EXPO_PUBLIC_API_URL=http://10.0.2.2:3001 npm run android
```

### Rodando no celular fisico

Celular e computador precisam estar na mesma rede.

Descubra o IP local da sua maquina, por exemplo `192.168.0.15`, e rode:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.15:3001 npm start
```

Depois abra no Expo Go lendo o QR Code.

## Ordem recomendada para subir tudo

1. subir o backend
2. subir o dashboard
3. subir o mobile com `EXPO_PUBLIC_API_URL`

## Exemplo rapido

Terminal 1:

```bash
cd backend
npm install
npm run start:dev
```

Terminal 2:

```bash
cd frontend/dashcontrole
npm install
npm run dev
```

Terminal 3 no celular fisico:

```bash
cd mobile
npm install
EXPO_PUBLIC_API_URL=http://192.168.0.15:3001 npm start
```

## Testes

### Backend

```bash
cd backend
npm test
npm run test:e2e
```

### Mobile

```bash
cd mobile
npm test
npx tsc --noEmit
```

## Problemas comuns

### O mobile nao consegue logar

Verifique:

- backend realmente rodando na `3001`
- `EXPO_PUBLIC_API_URL` apontando para o IP certo
- celular e PC na mesma rede
- firewall nao bloqueando a porta `3001`

### O dashboard abre mas a API falha

Verifique se o backend subiu corretamente e se variaveis de ambiente locais estao corretas.

### O Expo abre mas nao conecta no celular

Verifique:

- mesma rede Wi-Fi
- Expo Go instalado
- IP correto no `EXPO_PUBLIC_API_URL`

## Observacao importante

O mobile esta funcional, mas para aparelho fisico o ponto mais importante e sempre configurar corretamente o `EXPO_PUBLIC_API_URL`.
