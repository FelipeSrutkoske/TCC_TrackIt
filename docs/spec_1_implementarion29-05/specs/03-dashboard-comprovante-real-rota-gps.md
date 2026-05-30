# Spec 03 - Dashboard: comprovante real com rota por GPS

## Objetivo

Remover mocks do comprovante de entrega e exibir dados reais de finalizacao, assinatura, recebedor, GPS e rota no mapa usando GPS de inicio e GPS de finalizacao.

## Contexto atual

- Componente atual: `frontend/dashcontrole/src/app/components/DeliveryProofModal.tsx`.
- Pagina atual: `frontend/dashcontrole/src/app/entregas/page.tsx`.
- O componente possui comentario informando dados mockados.
- A pagina passa `finalization={null}`, mesmo quando a API retorna `finalization`.
- Existe `MapRoute` em `frontend/dashcontrole/src/app/components/MapRoute.tsx` para desenhar direcoes entre origem e destino.

## Arquivos a modificar

- `frontend/dashcontrole/src/services/deliveries.service.ts`
- `frontend/dashcontrole/src/app/entregas/page.tsx`
- `frontend/dashcontrole/src/app/components/DeliveryProofModal.tsx`

## Tipos do service

Adicionar tipo para finalizacao real:

```ts
export interface DeliveryFinalization {
  id: number;
  deliveryId: number;
  receiverName: string;
  receiverDocument?: string | null;
  receiverRelation?: string | null;
  signatureUrl?: string | null;
  photoUrl?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  finalizedAt?: string | null;
}
```

Atualizar `Entrega`:

```ts
finalization?: DeliveryFinalization | null;
latitudeInicio?: number | string | null;
longitudeInicio?: number | string | null;
dataHoraInicio?: string | null;
details?: DeliveryDetail[];
```

## Ajuste em `/entregas/page.tsx`

Substituir o envio fixo de `null`:

```tsx
finalization={null}
```

por:

```tsx
finalization={entregaSelecionada.finalization ?? null}
latitudeInicio={entregaSelecionada.latitudeInicio ?? null}
longitudeInicio={entregaSelecionada.longitudeInicio ?? null}
dataHoraInicio={entregaSelecionada.dataHoraInicio ?? null}
detalhesEntrega={entregaSelecionada.details ?? []}
```

## Props do `DeliveryProofModal`

Usar nomes descritivos:

```ts
interface DeliveryProofModalProps {
  isOpen: boolean;
  onClose: () => void;
  deliveryId: number;
  destinationAddress: string;
  driverName?: string;
  finalization?: DeliveryFinalization | null;
  latitudeInicio?: number | string | null;
  longitudeInicio?: number | string | null;
  dataHoraInicio?: string | null;
  detalhesEntrega?: DeliveryDetail[];
}
```

Remover `allowDraw` e `SignatureCanvas` do comprovante, pois assinatura no dashboard deve ser somente leitura e vir de `tb_finalizacoes`.

## Regras de exibicao

### Entrega sem finalizacao

Mostrar estado claro:

`Entrega ainda nao finalizada. O comprovante sera liberado apos a baixa no mobile.`

Nao exibir mock de recebedor, assinatura ou coordenadas.

### Finalizacao sem GPS de inicio

Mostrar dados reais de finalizacao e aviso:

`GPS de inicio nao registrado para esta entrega. A rota completa nao pode ser desenhada.`

Exibir mapa apenas com ponto final quando houver `finalization.latitude` e `finalization.longitude`.

### Finalizacao com GPS de inicio e GPS final

Usar `MapRoute`:

```tsx
<MapRoute
  origin={{ lat: latitudeInicioNumerica, lng: longitudeInicioNumerica }}
  destination={{ lat: latitudeFinalNumerica, lng: longitudeFinalNumerica }}
  height={260}
  label="Rota registrada da entrega"
/>
```

Origem: `tb_entregas.latitude_inicio` e `tb_entregas.longitude_inicio`.

Destino: `tb_finalizacoes.latitude_finalizacao` e `tb_finalizacoes.longitude_finalizacao`.

## Conversao de coordenadas

Criar funcao local simples no componente:

```ts
function converterCoordenada(valor?: number | string | null): number | null {
  if (valor === null || valor === undefined || valor === '') {
    return null;
  }

  const numero = Number(valor);
  return Number.isFinite(numero) ? numero : null;
}
```

Usar essa funcao para evitar erro quando TypeORM retornar decimal como string.

## Dados do comprovante

Exibir:

- Numero da entrega.
- Endereco de destino.
- Motorista.
- Nome do recebedor.
- Documento do recebedor.
- Parentesco ou cargo.
- Data de finalizacao.
- Coordenadas de inicio, quando existirem.
- Coordenadas de finalizacao, quando existirem.
- Assinatura digital, quando `signatureUrl` existir.
- Foto do local, quando `photoUrl` existir.
- Detalhes da entrega, quando `detalhesEntrega.length > 0`.

## Detalhes da carga no comprovante

Mostrar lista resumida:

- Descricao.
- Categoria.
- Quantidade.
- Peso kg.
- Volume m3.
- Valor declarado.

Formatar valores numericos com fallback seguro:

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
```

## Criterios de aceite

- O componente nao contem dados mockados.
- Entrega sem finalizacao mostra estado vazio honesto.
- Entrega finalizada mostra recebedor, assinatura e GPS reais.
- Quando inicio e finalizacao possuem coordenadas, o mapa desenha rota.
- Quando faltar GPS de inicio, o comprovante informa a limitacao sem quebrar.
- `/entregas/page.tsx` passa `entregaSelecionada.finalization`, nao `null` fixo.
- `findAll` do backend deve retornar `finalization`, conforme Spec 01.

## Verificacao

Executar no diretorio `frontend/dashcontrole`:

```bash
npm run lint
npm run build
```

Resultado esperado:

- Lint sem erros.
- Build Next.js concluido sem erro.

## Checkpoints de execucao

- 2026-05-29: Spec 03 iniciada sem subagentes. TDD formal limitado porque `frontend/dashcontrole` nao tem runner de testes de componente configurado; verificacao sera feita por `npm run lint` e `npm run build`.
- 2026-05-29: `DeliveryProofModal` reescrito como componente somente leitura com dados reais, sem fallback mockado e sem canvas de assinatura. `/entregas/page.tsx` passou a enviar `finalization`, GPS de inicio e `details` reais.
- 2026-05-29: Verificacao da Spec 03 executada. `npm run lint` passou com 0 erros e 1 warning preexistente de `<img>` em `Header`; `npm run build` passou. Busca em `DeliveryProofModal.tsx` confirmou ausencia de `mock`, `MOCK`, `allowDraw`, `SignatureCanvas` e `finalization={null}`.
