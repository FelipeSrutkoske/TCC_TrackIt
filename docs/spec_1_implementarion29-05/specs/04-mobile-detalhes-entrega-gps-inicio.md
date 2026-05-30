# Spec 04 - Mobile: detalhes da entrega e GPS de inicio

## Objetivo

Alterar o app mobile para consumir os detalhes da entrega e capturar GPS no momento em que o motorista inicia a rota.

## Contexto atual

- Mobile usa Expo React Native e TypeScript.
- GPS ja e usado na finalizacao via `mobile/src/utils/location.ts`.
- `DeliveryDetailsScreen` chama `startDelivery(id, token)` sem coordenadas.
- `DeliveryFinalizationScreen` captura GPS final antes de chamar `finalizeDelivery`.
- `Delivery` nao possui `details`, `latitudeInicio`, `longitudeInicio` ou `dataHoraInicio`.

## Arquivos a modificar

- `mobile/src/types/delivery.ts`
- `mobile/src/services/deliveries.service.ts`
- `mobile/src/screens/DeliveryDetailsScreen.tsx`
- `mobile/src/screens/DeliveryFinalizationScreen.tsx`
- `mobile/src/components/DeliveryCard.tsx`, se for exibido resumo leve na lista.
- `mobile/src/__tests__/deliveries.service.test.ts`
- `mobile/src/__tests__/DeliveryDetailsScreen.test.tsx`
- `mobile/src/__tests__/DeliveryFinalizationScreen.test.tsx`

## Tipos mobile

Atualizar `mobile/src/types/delivery.ts`:

```ts
export type DeliveryDetail = {
  id: number;
  entregaId: number;
  descricao: string;
  categoria?: string | null;
  pesoKg: number | string;
  volumeM3: number | string;
  quantidade: number;
  valorDeclarado: number | string;
};

export type Delivery = {
  id: number;
  driverId: number;
  companyId?: number | null;
  company?: {
    id: number;
    corporateName: string;
    tradeName?: string | null;
  } | null;
  destinationAddress: string;
  deliveryEstimate?: string | null;
  createdAt?: string | null;
  status: DeliveryStatus;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  details?: DeliveryDetail[];
  finalization?: {
    receiverName?: string | null;
    receiverDocument?: string | null;
    receiverRelation?: string | null;
    signatureUrl?: string | null;
    photoUrl?: string | null;
    latitude?: number | string | null;
    longitude?: number | string | null;
    finalizedAt?: string | null;
  } | null;
};
```

## Service mobile

Alterar `startDelivery` em `mobile/src/services/deliveries.service.ts`:

```ts
export type StartDeliveryCoordinates = {
  latitudeInicio: number;
  longitudeInicio: number;
};

export async function startDelivery(
  id: number,
  token: string,
  localizacaoInicioEntrega: StartDeliveryCoordinates,
): Promise<Delivery> {
  return apiRequest<Delivery>(`/deliveries/${id}/start`, {
    method: 'PATCH',
    token,
    body: localizacaoInicioEntrega,
  });
}
```

Manter `listCurrentDeliveries` e `getDeliveryHistory` nos mesmos endpoints. A Spec 01 garante que eles passem a retornar `details`.

## Captura de GPS no inicio

Alterar `DeliveryDetailsScreen.handleStart()`:

1. Validar token.
2. Chamar `getCurrentCoordinates()` antes de iniciar.
3. Se retorno for `null`, mostrar erro e nao chamar API.
4. Chamar `startDelivery(delivery.id, token, { latitudeInicio, longitudeInicio })`.
5. Atualizar estado com entrega retornada.
6. Abrir mapa externo com endereco de destino.

Fluxo esperado:

```ts
const coordenadasInicio = await getCurrentCoordinates();

if (!coordenadasInicio) {
  setError('Nao foi possivel capturar a localizacao de inicio da entrega.');
  return;
}

const updatedDelivery = await startDelivery(delivery.id, session.accessToken, {
  latitudeInicio: coordenadasInicio.latitude,
  longitudeInicio: coordenadasInicio.longitude,
});
```

## Exibicao dos detalhes em `DeliveryDetailsScreen`

Adicionar card `Detalhes da carga` abaixo dos dados principais.

Quando `delivery.details` estiver vazio ou ausente:

`Nenhum detalhe de carga informado para esta entrega.`

Quando houver detalhes, mostrar para cada item:

- Descricao.
- Categoria.
- Quantidade.
- Peso kg.
- Volume m3.
- Valor declarado.

Funcoes auxiliares recomendadas:

```ts
function formatarNumeroDecimal(valor: number | string, casas: number): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }
  return numero.toLocaleString('pt-BR', {
    minimumFractionDigits: casas,
    maximumFractionDigits: casas,
  });
}

function formatarMoeda(valor: number | string): string {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) {
    return '-';
  }
  return numero.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });
}
```

## Exibicao dos detalhes em `DeliveryFinalizationScreen`

Adicionar resumo antes dos campos do recebedor:

- Titulo: `Conferencia da carga`.
- Mostrar os mesmos detalhes da tela de detalhes.
- Nao enviar detalhes no `POST /finalizations`, porque eles ja pertencem a entrega.

## Resumo opcional no card da lista

Em `DeliveryCard`, exibir apenas um resumo leve para nao poluir a lista:

- Quantidade total dos itens.
- Categoria do primeiro item.

Regra:

- Se `details` estiver ausente ou vazio, nao exibir resumo.
- Se houver mais de uma categoria, exibir `N itens de carga`.

## Testes obrigatorios

### `mobile/src/__tests__/deliveries.service.test.ts`

Atualizar teste de `startDelivery` para esperar body:

```ts
expect(mockApiRequest).toHaveBeenCalledWith('/deliveries/1/start', {
  method: 'PATCH',
  token: 'token-1',
  body: {
    latitudeInicio: -23.5505,
    longitudeInicio: -46.6333,
  },
});
```

### `mobile/src/__tests__/DeliveryDetailsScreen.test.tsx`

Adicionar mock de `getCurrentCoordinates`.

Teste 1: inicia entrega com GPS.

- Arrange: `getCurrentCoordinates` retorna `{ latitude: -23.5505, longitude: -46.6333 }`.
- Assert: `startDelivery` chamado com coordenadas.
- Assert: mapa externo aberto apos inicio.

Teste 2: nao inicia sem GPS.

- Arrange: `getCurrentCoordinates` retorna `null`.
- Assert: `startDelivery` nao chamado.
- Assert: erro `Nao foi possivel capturar a localizacao de inicio da entrega.` aparece.

Teste 3: renderiza detalhes da carga.

- Arrange: entrega com `details` contendo descricao `Caixa de documentos`.
- Assert: texto `Caixa de documentos` aparece.

### `mobile/src/__tests__/DeliveryFinalizationScreen.test.tsx`

Adicionar caso para exibir detalhes antes da finalizacao:

- Arrange: `route.params.delivery.details` com um item.
- Assert: titulo `Conferencia da carga` aparece.
- Assert: descricao do item aparece.

## Criterios de aceite

- Mobile nao inicia entrega sem GPS de inicio.
- Mobile envia `latitudeInicio` e `longitudeInicio` para o backend.
- Entrega retornada pelo backend atualiza estado local.
- Detalhes da entrega aparecem na tela de detalhes.
- Detalhes da entrega aparecem na tela de finalizacao para conferencia.
- Finalizacao continua enviando apenas recebedor, assinatura e GPS final.
- Testes mobile cobrem service, inicio com GPS, erro sem GPS e exibicao dos detalhes.

## Verificacao

Executar no diretorio `mobile`:

```bash
npm test -- deliveries.service.test.ts DeliveryDetailsScreen.test.tsx DeliveryFinalizationScreen.test.tsx
```

Resultado esperado:

- Testes relacionados a entregas passando.

## Checkpoints de execucao

- 2026-05-29: Spec 04 iniciada sem subagentes. Escopo confirmado: atualizar mobile para detalhes da carga, capturar GPS ao iniciar entrega e manter finalizacao enviando apenas dados do recebedor/assinatura/GPS final.
- 2026-05-29: Testes RED adicionados em `deliveries.service.test.ts`, `DeliveryDetailsScreen.test.tsx` e `DeliveryFinalizationScreen.test.tsx` para body de GPS no inicio, bloqueio sem GPS, exibicao de detalhes e conferencia da carga.
- 2026-05-29: RED verificado com `npm test -- deliveries.service.test.ts DeliveryDetailsScreen.test.tsx DeliveryFinalizationScreen.test.tsx`. Resultado esperado: falhas por `startDelivery` sem body de GPS, ausencia de bloqueio sem GPS e ausencia dos cards de detalhes/conferencia da carga.
- 2026-05-29: Implementacao mobile aplicada: tipos `DeliveryDetail`, `StartDeliveryCoordinates`, body de GPS no service, captura de `getCurrentCoordinates()` antes de iniciar e componente reutilizavel `DeliveryDetailsSummary` nas telas de detalhes/finalizacao. Verificacao focada passou com 3 suites e 12 testes.
- 2026-05-29: Verificacao ampliada executada. `npm test` mobile completo passou com 19 suites e 51 testes; `npx tsc --noEmit` passou sem erros.
