# Plano de implementacao - Integracao dashboard/mobile com detalhes da entrega

> Para execucao por agentes: implementar tarefa por tarefa, com testes antes da alteracao principal sempre que houver cobertura existente. Marcar cada item conforme for concluido.

**Origem dos requisitos:** `docs/implementations/requirements/1_implementation29-05.md`

**Objetivo:** criar o fluxo completo para cadastrar entregas com detalhes no dashboard, expor esses dados no mobile, coletar GPS no inicio da rota e usar finalizacao real no comprovante.

**Arquitetura:** a entrega continua sendo o agregado principal. `tb_detalhes_entrega` fica como relacao 1:N de `tb_entregas`, e o GPS de inicio fica na propria `tb_entregas` usando as colunas ja criadas: `latitude_inicio`, `longitude_inicio`, `data_hora_inicio`. O dashboard consome a API NestJS via service client-side; o mobile captura coordenadas com `expo-location` antes de chamar o endpoint de inicio.

**Stack:** NestJS, TypeORM, MySQL, Next.js App Router, React, Expo React Native, Jest.

---

## Ordem recomendada

1. Backend: entidade, DTOs, persistencia de detalhes e GPS de inicio usando tabelas/colunas ja existentes.
2. Backend: testes de criacao, listagem e inicio com GPS.
3. Dashboard: service e rota `/entregas/criarEntrega`.
4. Dashboard: comprovante real com rota GPS inicio -> GPS finalizacao.
5. Mobile: captura de GPS no inicio e exibicao dos detalhes.
6. Validacao integrada: criar entrega no dashboard, iniciar no mobile, finalizar no mobile, visualizar comprovante no dashboard.

## Specs deste implementation

1. `01-backend-detalhes-entrega-gps-inicio.md`
2. `02-dashboard-criar-entrega-com-detalhes.md`
3. `03-dashboard-comprovante-real-rota-gps.md`
4. `04-mobile-detalhes-entrega-gps-inicio.md`

## Contrato principal da entrega

Payload de criacao esperado pelo backend:

```json
{
  "motoristaId": 14,
  "destinationAddress": "Rua A, 100 - Centro",
  "deliveryEstimate": "2026-05-30T18:00:00.000Z",
  "status": "AGUARDANDO_MOTORISTA",
  "detalhesEntrega": [
    {
      "descricao": "Caixa de documentos",
      "categoria": "Documentos",
      "pesoKg": 1.25,
      "volumeM3": 0.015,
      "quantidade": 1,
      "valorDeclarado": 250.0
    }
  ]
}
```

Payload de inicio esperado pelo backend:

```json
{
  "latitudeInicio": -23.5505,
  "longitudeInicio": -46.6333
}
```

Resposta de entrega esperada nas rotas admin e mobile:

```json
{
  "id": 9,
  "driverId": 14,
  "companyId": null,
  "destinationAddress": "Rua A, 100 - Centro",
  "deliveryEstimate": "2026-05-30T18:00:00.000Z",
  "createdAt": "2026-05-29T12:00:00.000Z",
  "status": "EM_ROTA",
  "latitudeInicio": -23.5505,
  "longitudeInicio": -46.6333,
  "dataHoraInicio": "2026-05-29T12:15:00.000Z",
  "details": [
    {
      "id": 1,
      "entregaId": 9,
      "descricao": "Caixa de documentos",
      "categoria": "Documentos",
      "pesoKg": "1.250",
      "volumeM3": "0.0150",
      "quantidade": 1,
      "valorDeclarado": "250.00"
    }
  ],
  "finalization": null
}
```

## Criterios de aceite integrados

- Uma entrega pode ser criada no dashboard com pelo menos um detalhe de carga.
- A API persiste `tb_entregas` e `tb_detalhes_entrega` de forma atomica usando a estrutura ja existente no banco.
- O mobile lista e exibe os detalhes da entrega.
- O mobile coleta GPS antes de iniciar a entrega.
- A API salva `latitude_inicio`, `longitude_inicio` e `data_hora_inicio` ao iniciar.
- O comprovante do dashboard usa dados reais de `tb_finalizacoes`.
- O mapa do comprovante desenha rota quando existem GPS de inicio e GPS de finalizacao.
- O comprovante nunca exibe dados mockados.

## Comandos de verificacao

Backend:

```bash
npm test -- deliveries.service.spec.ts
npm run build
```

Frontend dashboard:

```bash
npm run lint
npm run build
```

Mobile:

```bash
npm test -- deliveries.service.test.ts DeliveryDetailsScreen.test.tsx DeliveryFinalizationScreen.test.tsx
```
