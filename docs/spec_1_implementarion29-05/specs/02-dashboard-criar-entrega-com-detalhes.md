# Spec 02 - Dashboard: criar entrega com detalhes

## Objetivo

Adicionar no frontend `frontend/dashcontrole` uma rota clara para criar entregas com detalhes de carga, consumindo o backend real.

## Decisao de rota

Usar rota descritiva:

`/entregas/criarEntrega`

Arquivo:

`frontend/dashcontrole/src/app/entregas/criarEntrega/page.tsx`

Nao usar nome generico para a rota, porque deixa o fluxo operacional menos claro.

## Contexto atual

- Next.js App Router em `frontend/dashcontrole/src/app`.
- Pagina atual de entregas: `frontend/dashcontrole/src/app/entregas/page.tsx`.
- Service atual: `frontend/dashcontrole/src/services/deliveries.service.ts`.
- Formularios existentes usam `useState`, HTML inputs e validacao simples.
- Nao ha React Query, SWR, zod ou react-hook-form.

## Arquivos a criar

- `frontend/dashcontrole/src/app/entregas/criarEntrega/page.tsx`

## Arquivos a modificar

- `frontend/dashcontrole/src/services/deliveries.service.ts`
- `frontend/dashcontrole/src/app/entregas/page.tsx`

## Tipos do service

Adicionar interfaces em `deliveries.service.ts`:

```ts
export interface DeliveryDetail {
  id: number;
  entregaId: number;
  descricao: string;
  categoria: string | null;
  pesoKg: number | string;
  volumeM3: number | string;
  quantidade: number;
  valorDeclarado: number | string;
}

export interface CreateDeliveryDetailInput {
  descricao: string;
  categoria?: string;
  pesoKg: number;
  volumeM3: number;
  quantidade: number;
  valorDeclarado: number;
}

export interface CreateDeliveryInput {
  motoristaId?: number;
  destinationAddress: string;
  deliveryEstimate?: string;
  status?: StatusEntrega;
  detalhesEntrega: CreateDeliveryDetailInput[];
}
```

Atualizar `Entrega` com:

```ts
details?: DeliveryDetail[];
latitudeInicio?: number | string | null;
longitudeInicio?: number | string | null;
dataHoraInicio?: string | null;
```

Adicionar metodo:

```ts
create(data: CreateDeliveryInput): Promise<Entrega> {
  return apiFetch<Entrega>('/deliveries', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}
```

## Tela `/entregas/criarEntrega`

Responsabilidade: formulario de criacao da entrega e seus detalhes.

Campos da entrega:

- `destinationAddress`: obrigatorio.
- `deliveryEstimate`: opcional.
- `motoristaId`: opcional, selecionado a partir de motoristas carregados por `usersService.getAll()`.
- `status`: default `AGUARDANDO_MOTORISTA`.

Campos de cada detalhe:

- `descricao`: obrigatorio.
- `categoria`: opcional, default visual `Geral`.
- `pesoKg`: obrigatorio, maior que 0.
- `volumeM3`: obrigatorio, maior que 0.
- `quantidade`: obrigatorio, inteiro maior que 0.
- `valorDeclarado`: obrigatorio, maior ou igual a 0.

Estado recomendado:

```ts
const [destinationAddress, setDestinationAddress] = useState('');
const [deliveryEstimate, setDeliveryEstimate] = useState('');
const [motoristaId, setMotoristaId] = useState('');
const [detalhesEntrega, setDetalhesEntrega] = useState<CreateDeliveryDetailInput[]>([
  {
    descricao: '',
    categoria: 'Geral',
    pesoKg: 0,
    volumeM3: 0,
    quantidade: 1,
    valorDeclarado: 0,
  },
]);
const [salvandoEntrega, setSalvandoEntrega] = useState(false);
const [erroCriacaoEntrega, setErroCriacaoEntrega] = useState<string | null>(null);
```

Funcoes com nomes descritivos:

- `adicionarDetalheEntrega()`
- `removerDetalheEntrega(indiceDetalhe: number)`
- `atualizarDetalheEntrega(indiceDetalhe: number, campo: keyof CreateDeliveryDetailInput, valor: string | number)`
- `validarFormularioCriarEntrega()`
- `enviarFormularioCriarEntrega()`

## Validacao no frontend

Antes de chamar API:

- Endereco de destino deve ter texto.
- Deve existir ao menos um item em `detalhesEntrega`.
- Cada detalhe deve ter `descricao` preenchida.
- `pesoKg` deve ser maior que 0.
- `volumeM3` deve ser maior que 0.
- `quantidade` deve ser inteiro maior que 0.
- `valorDeclarado` deve ser maior ou igual a 0.

Mensagens recomendadas:

- `Informe o endereco de destino.`
- `Adicione pelo menos um detalhe da entrega.`
- `Preencha a descricao de todos os detalhes.`
- `Peso, volume e quantidade devem ser maiores que zero.`
- `Valor declarado nao pode ser negativo.`

## Navegacao

Na pagina `frontend/dashcontrole/src/app/entregas/page.tsx`:

- Adicionar botao `Criar entrega` na area de acoes/filtro.
- O botao deve navegar para `/entregas/criarEntrega`.
- Apos criacao bem-sucedida, redirecionar para `/entregas`.

## Layout esperado

A tela deve seguir o visual atual do dashboard:

- `Header` com titulo `Criar entrega`.
- Card principal com dados gerais.
- Card/lista de detalhes da carga.
- Botao para adicionar item.
- Botao principal `Criar entrega`.
- Botao secundario ou link para voltar para `/entregas`.

## Payload enviado

Exemplo:

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
      "valorDeclarado": 250
    }
  ]
}
```

Se nao houver motorista selecionado, omitir `motoristaId` do payload.

## Criterios de aceite

- `/entregas/criarEntrega` carrega sem erro.
- Usuario consegue adicionar e remover detalhes da entrega.
- Usuario nao consegue enviar formulario sem detalhe valido.
- `deliveriesService.create()` envia `POST /deliveries`.
- Criacao bem-sucedida redireciona para `/entregas`.
- A lista `/entregas` passa a exibir a entrega criada apos recarregar dados.
- Nomes novos de rota, estados e funcoes sao descritivos e relacionados a criacao da entrega.

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

- 2026-05-29: Spec 02 iniciada sem subagentes. Escopo confirmado: criar service/pagina `/entregas/criarEntrega`, formulario com `detalhesEntrega`, botao de navegacao na listagem e verificacao por lint/build do dashboard.
- 2026-05-29: Baseline do dashboard verificada antes da implementacao. `npm run build` passou; `npm run lint` ja falhava em arquivos existentes (`Header`, `dashboard/page`, `entregas/page`, `deliveries.service`) antes da Spec 02.
- 2026-05-29: Implementacao inicial criada: tipos e `deliveriesService.create`, pagina `src/app/entregas/criarEntrega/page.tsx`, botao `Criar entrega` em `/entregas` e uso de `salvando` no modal de motorista.
- 2026-05-29: Primeira verificacao apos implementacao: `npm run build` passou e confirmou rota `/entregas/criarEntrega`; `npm run lint` ficou bloqueado apenas por erros baseline restantes em `Header` e `dashboard/page`.
- 2026-05-29: Ajustes minimos aplicados em `Header` e `dashboard/page` para desbloquear lint global sem mudar comportamento funcional da Spec 02.
- 2026-05-29: Verificacao final da Spec 02 executada. `npm run lint` passou sem erros, mantendo 1 warning preexistente de `<img>` em `Header`; `npm run build` passou e listou a rota `/entregas/criarEntrega`.
- 2026-05-29: Verificacao repetida apos checkpoint: `npm run lint` continuou com 0 erros e 1 warning de `<img>` em `Header`; `npm run build` passou novamente.
