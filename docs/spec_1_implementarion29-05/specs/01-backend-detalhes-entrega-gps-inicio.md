# Spec 01 - Backend: detalhes da entrega e GPS de inicio

## Objetivo

Adicionar suporte backend para detalhes de carga da entrega e persistencia da localizacao de inicio capturada pelo motorista no mobile.

## Contexto atual

- Backend usa NestJS, TypeORM e MySQL.
- `synchronize: false` em `backend/src/app.module.ts`, entao estrutura de banco deve ser aplicada por SQL controlado.
- `tb_entregas` ja possui as colunas:
  - `latitude_inicio`
  - `longitude_inicio`
  - `data_hora_inicio`
- `tb_detalhes_entrega` ja existe no banco e deve ser apenas mapeada no TypeORM.
- `DeliveriesService.startByUser()` hoje apenas muda status para `EM_ROTA`.
- `CreateDeliveryDto` hoje nao aceita detalhes da entrega.

## Estrutura de banco

Nao criar SQL para esta spec. O banco ja possui `tb_detalhes_entrega` e as colunas de GPS de inicio em `tb_entregas`.

A implementacao deve apenas mapear e consumir a estrutura existente:

- `tb_detalhes_entrega.id`
- `tb_detalhes_entrega.entrega_id`
- `tb_detalhes_entrega.descricao`
- `tb_detalhes_entrega.categoria`
- `tb_detalhes_entrega.peso_kg`
- `tb_detalhes_entrega.volume_m3`
- `tb_detalhes_entrega.quantidade`
- `tb_detalhes_entrega.valor_declarado`
- `tb_entregas.latitude_inicio`
- `tb_entregas.longitude_inicio`
- `tb_entregas.data_hora_inicio`

## Arquivos a criar

- `backend/src/deliveries/entities/delivery-detail.entity.ts`
- `backend/src/deliveries/dto/create-delivery-detail.dto.ts`
- `backend/src/deliveries/dto/start-delivery.dto.ts`

## Arquivos a modificar

- `backend/src/deliveries/entities/delivery.entity.ts`
- `backend/src/deliveries/dto/create-delivery.dto.ts`
- `backend/src/deliveries/deliveries.module.ts`
- `backend/src/deliveries/deliveries.controller.ts`
- `backend/src/deliveries/deliveries.service.ts`
- `backend/src/deliveries/deliveries.service.spec.ts`

## Entidade `DeliveryDetail`

Responsabilidade: mapear `tb_detalhes_entrega` e expor os dados dos itens/carga ligados a uma entrega.

Campos da entidade:

- `id`: number
- `entregaId`: number, coluna `entrega_id`
- `delivery`: relacao `ManyToOne` com `Delivery`, `onDelete: 'CASCADE'`
- `descricao`: string, coluna `descricao`
- `categoria`: string, coluna `categoria`, default `Geral`
- `pesoKg`: string ou number, coluna decimal `peso_kg`
- `volumeM3`: string ou number, coluna decimal `volume_m3`
- `quantidade`: number, coluna `quantidade`
- `valorDeclarado`: string ou number, coluna decimal `valor_declarado`

Preferencia de contrato: manter `pesoKg`, `volumeM3` e `valorDeclarado` como nomes publicos intuitivos no JSON. O MySQL/TypeORM pode serializar decimais como string; frontend e mobile devem aceitar string ou number.

## Alteracao da entidade `Delivery`

Adicionar campos:

- `latitudeInicio`: coluna `latitude_inicio`, decimal(10,8), nullable
- `longitudeInicio`: coluna `longitude_inicio`, decimal(11,8), nullable
- `dataHoraInicio`: coluna `data_hora_inicio`, datetime, nullable
- `details`: relacao `OneToMany` com `DeliveryDetail`

Manter os campos existentes sem renomear para evitar refatoracao ampla do MVP.

## DTO `CreateDeliveryDetailDto`

Validacoes esperadas:

- `descricao`: obrigatoria, string, maximo 150 caracteres.
- `categoria`: opcional, string, maximo 50 caracteres, default de banco `Geral` quando ausente.
- `pesoKg`: obrigatorio, numero maior que 0.
- `volumeM3`: obrigatorio, numero maior que 0.
- `quantidade`: obrigatoria, inteiro maior que 0.
- `valorDeclarado`: obrigatorio, numero maior ou igual a 0.

## DTO `CreateDeliveryDto`

Adicionar propriedade:

- `detalhesEntrega`: array obrigatorio com pelo menos um `CreateDeliveryDetailDto`.

Regras:

- Rejeitar payload sem `detalhesEntrega`.
- Rejeitar payload com `detalhesEntrega: []`.
- Continuar aceitando `motoristaId` como alias de `driverId`, pois o dashboard ja usa esse padrao.

## DTO `StartDeliveryDto`

Criar payload para `PATCH /deliveries/:id/start`:

```ts
export class StartDeliveryDto {
  latitudeInicio: number;
  longitudeInicio: number;
}
```

Validacoes esperadas:

- `latitudeInicio`: obrigatoria, numero entre -90 e 90.
- `longitudeInicio`: obrigatoria, numero entre -180 e 180.

## Alteracao do controller

Alterar assinatura de inicio:

```ts
@Patch(':id/start')
@UseGuards(MobileDriverGuard)
start(
  @Param('id') id: string,
  @CurrentUser() user: AuthenticatedUser,
  @Body() body: StartDeliveryDto,
) {
  return this.deliveriesService.startByUser(user.id, +id, body);
}
```

## Alteracao do service

### Criacao de entrega

`DeliveriesService.create()` deve:

1. Receber `CreateDeliveryDto`.
2. Extrair `detalhesEntrega` do payload.
3. Resolver `motoristaId` para `driverId`, quando enviado.
4. Abrir transacao com `DataSource.transaction`.
5. Salvar `Delivery`.
6. Salvar cada `DeliveryDetail` com `entregaId` da entrega criada.
7. Retornar a entrega criada usando `findOne(id)` para incluir relacoes.

### Inicio de entrega

`DeliveriesService.startByUser()` deve:

1. Validar que a entrega pertence ao motorista autenticado.
2. Validar status `AGUARDANDO_MOTORISTA`.
3. Atualizar:
   - `status: EM_ROTA`
   - `latitudeInicio`
   - `longitudeInicio`
   - `dataHoraInicio: new Date()`
4. Retornar a entrega atualizada com `details`, `company`, `occurrences` e `finalization`.

## Relacoes nas consultas

Atualizar as consultas para incluir `details`:

- `findAll`: `company`, `driver`, `driver.user`, `occurrences`, `finalization`, `details`
- `findOne`: `company`, `driver`, `driver.user`, `occurrences`, `finalization`, `details`
- `findCurrentByUser`: `company`, `occurrences`, `finalization`, `details`
- `findHistoryByUser`: `company`, `occurrences`, `finalization`, `details`
- `findOwnedByUser`: `company`, `occurrences`, `finalization`, `details`

`findAll` deve incluir `finalization` para permitir comprovante real no dashboard sem chamada extra.

## Testes obrigatorios

Arquivo: `backend/src/deliveries/deliveries.service.spec.ts`

Adicionar cobertura para:

1. Criacao de entrega com `detalhesEntrega` salva entrega e detalhes em transacao.
2. Criacao sem detalhes rejeitada pelo DTO em teste de validacao ou pelo service com erro claro.
3. `findCurrentByUser` inclui `details` nas relacoes.
4. `findHistoryByUser` inclui `details` nas relacoes.
5. `startByUser` salva `latitudeInicio`, `longitudeInicio`, `dataHoraInicio` e muda status para `EM_ROTA`.
6. `startByUser` rejeita entrega fora de `AGUARDANDO_MOTORISTA` sem atualizar GPS.

## Criterios de aceite

- `POST /deliveries` cria entrega e detalhes no mesmo fluxo.
- `GET /deliveries` retorna `details` e `finalization`.
- `GET /deliveries/:id` retorna `details` e `finalization`.
- `GET /deliveries/me` retorna `details` para o mobile.
- `GET /deliveries/me/history` retorna `details` para historico mobile.
- `PATCH /deliveries/:id/start` exige GPS de inicio.
- Inicio de entrega salva `latitude_inicio`, `longitude_inicio` e `data_hora_inicio`.
- Nenhuma alteracao depende de `synchronize: true`.

## Verificacao

Executar no diretorio `backend`:

```bash
npm test -- deliveries.service.spec.ts
npm run build
```

Resultado esperado:

- Testes de entregas passando.
- Build NestJS concluido sem erro de TypeScript.

## Checkpoints de execucao

- 2026-05-29: Spec 01 iniciada. Escopo confirmado: backend de detalhes da entrega, GPS de inicio ja existente em `tb_entregas`, sem delegacao para subagentes.
- 2026-05-29: Testes RED adicionados em `backend/src/deliveries/deliveries.service.spec.ts`. Verificacao executada: `npm test -- deliveries.service.spec.ts` falhou como esperado porque `delivery-detail.entity.ts` ainda nao existe.
- 2026-05-29: Implementacao backend inicial concluida para entidade `DeliveryDetail`, DTOs, relacoes, criacao transacional e GPS de inicio. Verificacao executada: `npm test -- deliveries.service.spec.ts` passou com 11 testes.
- 2026-05-29: SQL manual removido porque o usuario confirmou que `tb_detalhes_entrega` ja existe. As colunas de GPS de inicio tambem ja existem; a implementacao apenas mapeia e usa essas estruturas.
- 2026-05-29: Verificacao final da Spec 01 executada. `npm test -- deliveries.service.spec.ts` passou com 11 testes; `npm run build` passou; `npm test` backend completo passou com 11 suites e 41 testes.
- 2026-05-29: Ajuste de revisao aplicado para rejeitar `descricao` vazia em `CreateDeliveryDetailDto`. Verificacao repetida: teste focado passou com 11 testes, build passou e suite backend completa passou com 11 suites e 41 testes.
