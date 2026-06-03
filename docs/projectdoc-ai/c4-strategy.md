# ProjectDoc AI - Estrategia para Diagramas C4

## Objetivo

A estrategia C4 da skill transforma evidencias do repositorio em uma base textual para diagramas de arquitetura. A skill nao deve inventar componentes: cada elemento precisa vir de codigo, configuracao, documentacao ou inferencia declarada.

## Nivel 1 - Contexto

Perguntas respondidas:

- Qual e o sistema analisado?
- Quem usa o sistema?
- Quais sistemas externos se comunicam com ele?
- Que dados entram e saem?

Aplicacao ao TrackIt:

- Sistema: TrackIt.
- Atores: motorista e operador administrativo.
- Sistemas externos: aplicativo de mapas, servico de email quando aplicavel, banco MySQL.
- Dados principais: credenciais, entregas, status, comprovante, assinatura, GPS.

## Nivel 2 - Containers

Perguntas respondidas:

- Quais aplicacoes executaveis compoem o sistema?
- Quais tecnologias sustentam cada parte?
- Como os containers se comunicam?

Aplicacao ao TrackIt:

| Container | Tecnologia | Responsabilidade | Evidencia |
| --- | --- | --- | --- |
| Mobile app | Expo/React Native | Operacao do motorista | `mobile/package.json` |
| Backend API | NestJS/TypeORM | Regras de negocio e persistencia | `backend/package.json`, `backend/src/app.module.ts` |
| Admin dashboard | Next.js | Controle administrativo | `frontend/dashcontrole/package.json` |
| Banco de dados | MySQL | Persistencia relacional | `backend/src/app.module.ts` |

## Nivel 3 - Componentes

Perguntas respondidas:

- Quais modulos internos existem em cada container?
- Que responsabilidade cada modulo possui?
- Quais componentes concentram regras de negocio?

Componentes relevantes do TrackIt:

- `AuthModule`: autenticacao e JWT.
- `DeliveriesModule`: CRUD, estatisticas, ownership e status de entregas.
- `FinalizationsModule`: comprovante, GPS, assinatura e conclusao da entrega.
- `UsersModule`: usuarios e resolucao do perfil de motorista.
- Mobile services: chamadas para endpoints de entregas, autenticacao e finalizacao.
- Dashboard services: chamadas administrativas para entregas, usuarios e ocorrencias.

## Nivel 4 - Codigo

Usar somente quando um fluxo precisar ser explicado em detalhe. No TrackIt, o fluxo mais indicado e a finalizacao de entrega:

1. `DeliveryFinalizationScreen` coleta dados do recebedor, assinatura e localizacao.
2. `finalizeDelivery` envia `POST /finalizations`.
3. `FinalizationsController.create` exige JWT e `MobileDriverGuard`.
4. `FinalizationsService.createForUser` valida ownership e status `EM_ROTA`.
5. A transacao salva `Finalization` e altera `Delivery` para `ENTREGUE`.

## Regras de qualidade para C4

- Todo ator, container ou componente deve ter evidencia.
- Relacionamentos devem indicar direcao e tipo de comunicacao.
- Incertezas devem ser marcadas como `Inferred` ou `Gap`.
- O texto C4 deve ser versionado antes de virar imagem.
- Diagramas finais podem ser feitos em Draw.io, PlantUML, Structurizr ou Mermaid.
