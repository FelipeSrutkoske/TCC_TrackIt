# ProjectDoc AI - Exemplos de Saida

## Exemplo 1 - Regra de negocio extraida do TrackIt

```markdown
| ID | Regra | Tipo | Evidencia | Impacto |
| --- | --- | --- | --- | --- |
| RN-005 | Uma entrega so pode iniciar se estiver em `AGUARDANDO_MOTORISTA`. | Explicit | `backend/src/deliveries/deliveries.service.ts` | Impede transicoes invalidas de status. |
```

## Exemplo 2 - Risco tecnico identificado

```markdown
| Item | Tipo | Evidencia | Recomendacao |
| --- | --- | --- | --- |
| Algumas rotas administrativas usam apenas JWT | Risk | `backend/src/deliveries/deliveries.controller.ts` | Avaliar controle por perfil para operacoes sensiveis. |
```

## Exemplo 3 - Base textual C4 de containers

```markdown
Containers:
- Mobile Expo/React Native: usado pelo motorista para consultar entregas, iniciar rota e enviar comprovante.
- Backend NestJS: centraliza autenticacao, regras de negocio, status e persistencia.
- Dashboard Next.js: usado pela administracao para acompanhar entregas e estatisticas.
- MySQL: persiste usuarios, motoristas, entregas, ocorrencias e finalizacoes.

Relacionamentos:
- Mobile -> Backend: HTTP com JWT.
- Dashboard -> Backend: HTTP com JWT.
- Backend -> MySQL: TypeORM.
```

## Exemplo 4 - Saida simulada para outro projeto

```markdown
Projeto: Sistema de Agendamento de Consultas

RN-001: [Explicit] Um paciente so pode cancelar consultas futuras.
Evidencia: `src/appointments/appointments.service.ts`.
Impacto: evita cancelamento retroativo de historico medico.

Gap-001: [Gap] Nao foi identificado teste cobrindo conflito de horarios entre profissionais.
Acao sugerida: criar teste unitario para agendamentos simultaneos no mesmo profissional.

C4 Contexto:
- Usuario paciente acessa app web.
- Usuario recepcionista acessa painel administrativo.
- Sistema envia notificacoes por email.
- Banco relacional armazena pacientes, profissionais e consultas.
```
