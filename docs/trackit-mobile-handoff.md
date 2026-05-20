# TrackIt Mobile MVP - Handoff Tecnico

## Objetivo

Este documento resume o que foi implementado no MVP mobile do motorista, quais arquivos concentram cada funcionalidade, as principais decisoes tecnicas e o que voce precisa saber para explicar ou continuar o projeto.

Escopo entregue:

- login mobile com role `MOTORISTA`
- listagem de entregas atuais do motorista
- detalhe da entrega
- iniciar entrega com mudanca de status e abertura do app de mapas
- finalizacao com nome, assinatura e GPS
- historico com metricas
- tema claro/escuro
- testes backend e mobile

## Estado atual

Verificacao fresca executada nesta worktree:

- backend unit: `10` suites, `38` testes passando
- backend e2e: `2` suites, `12` testes passando
- mobile: `14` suites, `31` testes passando
- mobile typecheck: `npx tsc --noEmit` passando

Worktree usada:

- `.worktrees/trackit-mobile-mvp`

## Visao geral da arquitetura

O fluxo ficou dividido em duas partes:

1. Backend NestJS
- endurece autenticacao para uso mobile
- entrega endpoints focados no motorista
- controla ownership e transicoes de status

2. Mobile Expo
- app React Native com autenticacao, navegacao e telas operacionais
- usa `fetch` e token JWT da API
- tema claro/escuro com mesma estrutura visual

## Backend implementado

### 1. Autenticacao mobile

Responsabilidade:

- garantir que o app mobile funcione apenas para usuarios `MOTORISTA`
- expor `driverProfileId` no login
- tipar o usuario autenticado no request

Arquivos principais:

- `backend/src/auth/auth.service.ts`
  - login retorna `access_token` e `user`
  - inclui `driverProfileId` quando houver perfil vinculado

- `backend/src/auth/mobile-driver.guard.ts`
  - bloqueia qualquer usuario que nao seja `MOTORISTA`

- `backend/src/auth/current-user.decorator.ts`
  - injeta o usuario autenticado no controller

- `backend/src/auth/interfaces/authenticated-user.interface.ts`
  - tipagem do usuario autenticado em runtime

- `backend/src/auth/jwt.config.ts`
  - centraliza resolucao segura do `JWT_SECRET`

- `backend/src/auth/jwt.strategy.ts`
  - valida o JWT e devolve o usuario autenticado tipado

- `backend/src/users/users.service.ts`
  - metodo `resolveDriverProfileId(userId)` resolve `tb_usuarios.id -> tb_motoristas.id`

Decisao importante:

- `deliveries.driverId` aponta para `tb_motoristas.id`, nao para `tb_usuarios.id`
- por isso o app nunca deve assumir que `user.id === driverId`

### 2. Endpoints do motorista

Responsabilidade:

- listar apenas entregas do motorista autenticado
- retornar historico e metricas do proprio motorista
- iniciar entrega com regra de negocio explicita

Arquivos principais:

- `backend/src/deliveries/deliveries.controller.ts`
  - `GET /deliveries/me`
  - `GET /deliveries/me/history`
  - `PATCH /deliveries/:id/start`

- `backend/src/deliveries/deliveries.service.ts`
  - `findCurrentByUser(userId)`
  - `findHistoryByUser(userId)`
  - `findOwnedByUser(userId, deliveryId)`
  - `startByUser(userId, deliveryId)`
  - `updateStatus(...)`

- `backend/src/deliveries/deliveries.module.ts`
  - injeta `UsersModule` para resolver ownership corretamente

Regras implementadas:

- `GET /deliveries/me`
  - traz apenas `AGUARDANDO_MOTORISTA` e `EM_ROTA`

- `GET /deliveries/me/history`
  - traz apenas `ENTREGUE` e `CANCELADO`
  - retorna `metrics` e `items`

- `PATCH /deliveries/:id/start`
  - apenas `MOTORISTA`
  - apenas entrega do proprio motorista
  - apenas transicao `AGUARDANDO_MOTORISTA -> EM_ROTA`

### 3. Finalizacao

Responsabilidade:

- receber o comprovante do app mobile
- validar ownership e status
- persistir finalizacao e mudar entrega para `ENTREGUE`

Arquivos principais:

- `backend/src/finalizations/finalizations.controller.ts`
  - `POST /finalizations`
  - usa `MobileDriverGuard`

- `backend/src/finalizations/finalizations.service.ts`
  - `createForUser(userId, data)`
  - usa transacao com `DataSource.transaction(...)`
  - salva finalizacao e muda status da entrega para `ENTREGUE`

- `backend/src/finalizations/dto/create-finalization.dto.ts`
  - exige:
    - `deliveryId`
    - `receiverName`
    - `signature`
    - `latitude`
    - `longitude`

Decisoes importantes:

- o app envia `signature` como string
- o backend persiste isso em `signatureUrl`
- mantive o contrato simples para o MVP

### 4. CORS e ambiente local

Arquivos principais:

- `backend/src/main.ts`
- `backend/src/cors.config.ts`

Responsabilidade:

- permitir desenvolvimento local com Expo, localhost e IPs comuns de rede local

## Mobile implementado

### 1. Bootstrap do app

Arquivos principais:

- `mobile/package.json`
  - projeto Expo

- `mobile/App.tsx`
  - entrada principal do app

- `mobile/src/navigation/AppNavigator.tsx`
  - decide entre fluxo autenticado e nao autenticado

- `mobile/src/navigation/types.ts`
  - tipagem das rotas

### 2. Tema claro e escuro

Arquivos principais:

- `mobile/src/theme/tokens.ts`
- `mobile/src/theme/AppThemeProvider.tsx`

Responsabilidade:

- manter mesma estrutura de UI
- trocar principalmente fundo, superficie, borda e contraste

Decisao visual:

- interface sobria, corporativa, sem cara de template de IA
- nada de emoji
- mesmos componentes nos dois temas

### 3. Autenticacao e sessao

Arquivos principais:

- `mobile/src/contexts/AuthContext.tsx`
  - restaura sessao do `SecureStore`
  - faz `login()` e `logout()`

- `mobile/src/services/auth.service.ts`
  - integra com `POST /auth/login`
  - bloqueia usuario que nao seja `MOTORISTA`

- `mobile/src/types/auth.ts`
  - tipos de sessao, payload e usuario

### 4. Infra de API

Arquivo principal:

- `mobile/src/lib/api.ts`

Responsabilidade:

- encapsular `fetch`
- anexar token
- resolver URL base da API

Decisao importante:

- o fallback local do mobile aponta para porta `3001`, alinhado ao backend
- para uso fora do ambiente local, o ideal e definir `EXPO_PUBLIC_API_URL`

### 5. Entregas atuais e detalhe

Arquivos principais:

- `mobile/src/services/deliveries.service.ts`
  - `listCurrentDeliveries(token)`
  - `startDelivery(id, token)`
  - `getDeliveryHistory(token)`

- `mobile/src/types/delivery.ts`
  - tipos de entrega, status e historico

- `mobile/src/screens/HomeScreen.tsx`
  - hub inicial do motorista

- `mobile/src/screens/CurrentDeliveriesScreen.tsx`
  - lista entregas atuais
  - recarrega ao focar na tela

- `mobile/src/screens/DeliveryDetailsScreen.tsx`
  - mostra dados principais da entrega
  - chama inicio de entrega
  - navega para finalizacao

- `mobile/src/utils/maps.ts`
  - abre app de mapas externo
  - Android: `geo:`
  - iOS: Apple Maps

### 6. Finalizacao

Arquivos principais:

- `mobile/src/services/finalizations.service.ts`
  - envia payload de finalizacao para `POST /finalizations`

- `mobile/src/screens/DeliveryFinalizationScreen.tsx`
  - coleta nome do recebedor
  - coleta assinatura
  - coleta GPS
  - faz submit da finalizacao

- `mobile/src/components/SignaturePadField.tsx`
  - captura gesto do usuario
  - atualiza pontos de forma segura sem perder arrasto rapido

- `mobile/src/utils/signature.ts`
  - serializa assinatura em formato compacto
  - formato atual: `sig:<width>x<height>:x1,y1;x2,y2;...`
  - foi compactado para nao estourar o limite do backend

- `mobile/src/utils/location.ts`
  - pede permissao de localizacao
  - le coordenadas atuais

Decisoes importantes:

- a assinatura nao foi enviada como imagem grande/base64 longa
- para o MVP, optei por um payload compacto e legivel, reduzindo risco de falha no banco
- a tela tem guarda contra double submit

### 7. Historico e metricas

Arquivos principais:

- `mobile/src/screens/HistoryScreen.tsx`
  - carrega historico do backend
  - mostra metricas
  - lista entregas encerradas

- `mobile/src/components/MetricCard.tsx`
  - card reutilizavel de indicador

Metricas exibidas:

- `totalConcluidas`
- `totalEmRota`
- `totalCanceladas`
- `taxaConclusao`

### 8. Componentes de UI base

Arquivos principais:

- `mobile/src/components/AppScreen.tsx`
- `mobile/src/components/AppHeader.tsx`
- `mobile/src/components/AppCard.tsx`
- `mobile/src/components/PrimaryButton.tsx`
- `mobile/src/components/SecondaryButton.tsx`
- `mobile/src/components/StatusBadge.tsx`
- `mobile/src/components/DeliveryCard.tsx`
- `mobile/src/components/InfoRow.tsx`
- `mobile/src/components/LoadingState.tsx`
- `mobile/src/components/EmptyState.tsx`

Responsabilidade:

- padronizar layout, leitura operacional, CTA e estados de UI

## Testes implementados

### Backend

Arquivos principais:

- `backend/src/auth/auth.service.spec.ts`
- `backend/src/auth/jwt.config.spec.ts`
- `backend/src/auth/jwt.strategy.spec.ts`
- `backend/src/auth/mobile-driver.guard.spec.ts`
- `backend/src/users/users.service.spec.ts`
- `backend/src/deliveries/deliveries.service.spec.ts`
- `backend/src/finalizations/finalizations.service.spec.ts`
- `backend/test/mobile-driver-deliveries.e2e-spec.ts`
- `backend/test/app.e2e-spec.ts`

O que esses testes cobrem:

- login mobile
- bloqueio por role
- resolucao de perfil do motorista
- listagem `me`
- historico `me/history`
- iniciar entrega
- finalizar entrega
- ownership
- validacao HTTP dos campos obrigatorios

### Mobile

Arquivos principais:

- `mobile/src/__tests__/LoginScreen.test.tsx`
- `mobile/src/__tests__/AuthContext.test.tsx`
- `mobile/src/__tests__/AppNavigator.test.tsx`
- `mobile/src/__tests__/ThemeProvider.test.tsx`
- `mobile/src/__tests__/api.test.ts`
- `mobile/src/__tests__/deliveries.service.test.ts`
- `mobile/src/__tests__/finalizations.service.test.ts`
- `mobile/src/__tests__/CurrentDeliveriesScreen.test.tsx`
- `mobile/src/__tests__/DeliveryDetailsScreen.test.tsx`
- `mobile/src/__tests__/DeliveryFinalizationScreen.test.tsx`
- `mobile/src/__tests__/HistoryScreen.test.tsx`
- `mobile/src/__tests__/SignaturePadField.test.tsx`
- `mobile/src/__tests__/maps.test.ts`
- `mobile/src/__tests__/signature.test.ts`

O que esses testes cobrem:

- login e restauracao de sessao
- navegacao autenticada
- URL base da API
- service de entregas
- service de finalizacao
- tela de entregas atuais
- tela de detalhe
- inicio de entrega
- mapa externo
- validacao de assinatura e GPS
- historico e metricas
- serializacao compacta da assinatura

### E2E mobile

Arquivo principal:

- `mobile/.maestro/login-delivery-flow.yaml`

Fluxo coberto no script:

- login
- abrir entregas
- abrir detalhe
- iniciar entrega
- voltar ao app depois do mapa externo
- finalizar entrega
- tratar permissao de localizacao com labels comuns
- validar resultado no historico

Observacao:

- o arquivo Maestro foi criado e refinado, mas nao foi executado neste ambiente

## Como explicar as principais decisoes

### Por que criar endpoints `me`?

Porque o app mobile nao e um dashboard admin. O motorista precisa de contratos diretos, curtos e seguros, sempre scoped ao proprio usuario.

### Por que resolver `driverProfileId` no backend?

Porque a entrega referencia `tb_motoristas.id`, enquanto o JWT representa `tb_usuarios.id`.

### Por que a finalizacao usa transacao?

Para evitar salvar comprovante sem fechar a entrega, ou fechar a entrega sem persistir a finalizacao.

### Por que a assinatura nao virou imagem/base64 grande?

Porque o backend atual armazena a assinatura em campo curto. No MVP, foi mais seguro enviar uma representacao compacta dos pontos capturados.

### Por que o mobile recarrega entregas ao focar a tela?

Para evitar status stale depois que o motorista inicia uma entrega e volta da tela de detalhe.

## Esta funcional ja?

Sim, no sentido de codigo e integracao do MVP:

- backend implementado
- mobile implementado
- testes backend e mobile passando

Mas isso nao significa automaticamente que basta plugar o celular e tudo vai abrir sem configurar ambiente.

## Se eu plugar um celular, o app roda?

Resposta curta:

- potencialmente sim
- mas voce ainda precisa subir backend e apontar o app para a API acessivel pelo celular

### O que precisa para rodar no celular real

1. Backend em execucao

No diretório `backend`:

```bash
npm install
npm run start:dev
```

Por padrao, o backend vai responder na porta `3001`.

2. Celular e maquina na mesma rede

Se o celular for fisico, ele precisa enxergar o IP da sua maquina.

3. Definir a URL da API para o mobile

No diretório `mobile`, rode o Expo com a URL do backend exposta para a rede:

```bash
EXPO_PUBLIC_API_URL=http://SEU_IP_LOCAL:3001 npm start
```

Exemplo:

```bash
EXPO_PUBLIC_API_URL=http://192.168.0.15:3001 npm start
```

4. Abrir no celular via Expo Go

No diretório `mobile`:

```bash
npm install
npm start
```

Depois escaneia o QR Code no Expo Go.

### O que pode impedir de funcionar de primeira

- backend nao estar acessivel pelo IP da rede
- firewall bloqueando a porta `3001`
- `EXPO_PUBLIC_API_URL` nao configurada corretamente no celular fisico
- banco/backend local sem dados validos para login de motorista
- labels de permissao de localizacao variarem no aparelho, se voce testar Maestro depois

## O que eu recomendaria voce testar manualmente agora

1. Login com um usuario `MOTORISTA`
2. Abrir entregas atuais
3. Abrir uma entrega `AGUARDANDO_MOTORISTA`
4. Iniciar entrega
5. Voltar ao app e verificar se a entrega foi para `EM_ROTA`
6. Finalizar com nome, assinatura e GPS
7. Abrir historico e conferir metricas/registro

## Pendencias pequenas nao bloqueantes

- o Maestro nao foi executado aqui
- `HistoryScreen` ainda pode ganhar mais testes de estado vazio/erro
- o formato compacto de assinatura serve para o MVP, mas pode ser evoluido depois se voce quiser uma prova visual mais rica

## Resumo final

O MVP mobile do motorista do TrackIt ficou implementado de ponta a ponta no codigo, com backend e app mobile integrados no contrato principal.

Se alguem te perguntar "onde esta X?", use este mapa:

- auth mobile: `backend/src/auth/*`, `mobile/src/contexts/AuthContext.tsx`, `mobile/src/services/auth.service.ts`
- entregas atuais: `backend/src/deliveries/*`, `mobile/src/screens/CurrentDeliveriesScreen.tsx`
- iniciar entrega: `backend/src/deliveries/deliveries.controller.ts`, `backend/src/deliveries/deliveries.service.ts`, `mobile/src/screens/DeliveryDetailsScreen.tsx`
- finalizacao: `backend/src/finalizations/*`, `mobile/src/screens/DeliveryFinalizationScreen.tsx`, `mobile/src/services/finalizations.service.ts`
- historico: `backend/src/deliveries/deliveries.service.ts`, `mobile/src/screens/HistoryScreen.tsx`
- assinatura: `mobile/src/components/SignaturePadField.tsx`, `mobile/src/utils/signature.ts`
- GPS: `mobile/src/utils/location.ts`
- mapas: `mobile/src/utils/maps.ts`
- navegacao: `mobile/src/navigation/AppNavigator.tsx`
- tema: `mobile/src/theme/*`
- testes backend: `backend/**/*.spec.ts`, `backend/test/*.e2e-spec.ts`
- testes mobile: `mobile/src/__tests__/*`
