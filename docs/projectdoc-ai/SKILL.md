---
name: projectdoc-ai
description: Use when analyzing a software repository to generate technical documentation for TCC work, including business rules, architecture, quality risks, maintenance recommendations, and textual bases for C4 diagrams.
---

# ProjectDoc AI

## Overview

ProjectDoc AI is a repository analysis skill for generating structured technical documentation from real project evidence. Its core principle is: document only what can be supported by code, configuration, tests, existing documentation, or clearly marked inference.

For this TCC project, use it to analyze TrackIt, a delivery management system with backend, administrative frontend, and mobile driver app.

## When to Use

Use this skill when the user asks to:

- analyze a project and generate technical documentation
- identify business rules from source code, tests, comments, names, and documentation
- describe architecture, modules, technologies, dependencies, and layers
- produce a documentation artifact for TCC, handoff, banca, or maintenance
- suggest C4 diagrams based on repository evidence
- find documentation gaps, inconsistencies, quality risks, or missing tests

Do not use it for a quick README summary unless the user explicitly wants full technical analysis.

## Required Input

Analyze the currently opened repository. Consider these inputs when present:

- root files: `README.md`, `DESIGN.md`, security notes, setup guides
- package/config files: `package.json`, lockfiles, env examples, Docker, TypeScript, ESLint, test configs
- source code: controllers, services, models/entities, screens, components, routes, contexts, utilities
- tests: unit, e2e, UI, service, integration, mocks, fixtures
- existing docs: diagrams, handoff files, architecture notes, business flow files
- comments and names: classes, functions, modules, routes, DTOs, schemas, enums, statuses

Never expose secrets. If `.env`, `.env.local`, certificates, tokens, private keys, or credentials appear, mention only that sensitive configuration exists and must be protected.

## Repository Exploration Checklist

Before writing the final documentation, inspect evidence in this order:

| Step | What to inspect | Purpose |
| --- | --- | --- |
| 1 | Root files and `docs/` | Understand project goal, existing documentation, diagrams, and gaps |
| 2 | Package/config files | Identify languages, frameworks, scripts, tooling, and dependencies |
| 3 | Directory structure | Map modules, layers, frontend/backend/mobile boundaries |
| 4 | Entrypoints and routing | Identify app boot, API routes, screens, navigation, guards, middleware |
| 5 | Domain files | Extract entities, DTOs, services, status enums, validation, business transitions |
| 6 | Tests | Confirm expected behavior, edge cases, and implemented rules |
| 7 | Documentation cross-check | Compare code behavior with documented behavior |
| 8 | Quality scan | Identify risks, missing coverage, coupling, duplication, unclear contracts |

If a section cannot be verified, write `Nao identificado no repositorio analisado` instead of inventing content.

## Evidence Rules

Every important claim must be tagged as one of:

| Tag | Meaning | Example |
| --- | --- | --- |
| Explicit | Directly present in code, tests, config, or docs | `PATCH /deliveries/:id/start` changes status to `EM_ROTA` |
| Inferred | Reasonable conclusion from names, structure, or repeated behavior | A `finalizations` module represents delivery proof of completion |
| Gap | Expected information is absent, incomplete, or inconsistent | No C4 diagram text exists for mobile containers |
| Risk | Technical or process concern that can affect quality | Sensitive values in `.env.local` must not be committed or exposed |

Prefer file references when possible: `backend/src/deliveries/deliveries.service.ts`, `mobile/src/services/...`, `docs/trackit-mobile-handoff.md`.

Do not produce architecture descriptions, recommendations, or business rules without a link to repository evidence. If evidence is missing, mark the item as `Gap`. If the conclusion depends on naming or structure, mark it as `Inferred` and explain why.

The documentation is not complete until each business rule, main flow, and architectural component has at least one of: evidence, justified inference, or declared gap.

## Extraction Pattern

Use this sequence to extract reliable business and architecture information:

1. Identify actors: user roles, external systems, administrators, drivers, APIs, databases.
2. Identify domain nouns: delivery, driver, finalization, user, route, status, signature, GPS.
3. Identify domain verbs: login, assign, list, start, finalize, cancel, update status, collect proof.
4. Identify constraints: ownership, authentication, role guards, allowed status transitions, required fields.
5. Confirm constraints in tests when available.
6. Mark unconfirmed behavior as inferred, not explicit.
7. Convert findings into business rules using objective language.

Business rule format:

```markdown
- BR-001: [Explicit] A driver can access only deliveries assigned to their own driver profile.
  Evidence: `backend/src/deliveries/deliveries.service.ts`, `docs/trackit-mobile-handoff.md`.
  Impact: Prevents a driver from viewing or changing another driver's deliveries.
```

## Output Template

Generate the final documentation with these sections, in this order:

```markdown
# Documentacao Tecnica Gerada - [Project Name]

## 1. Resumo Executivo
[Short description of the system, target users, and main value.]

## 2. Escopo da Analise
- Repository path or project name
- Date of analysis
- Areas inspected
- Areas not inspected or unavailable

## 3. Metodologia da Analise
- Search strategy
- Evidence sources
- Criteria used to classify findings as Explicit, Inferred, Gap, or Risk
- Privacy precautions

## 4. Tecnologias Identificadas
| Area | Technologies | Evidence |
| --- | --- | --- |

## 5. Estrutura do Projeto
[Directory map with responsibilities.]

## 6. Arquitetura e Organizacao
- Architectural style
- Main layers/modules
- Communication between parts
- Persistence and external integrations

## 7. Componentes Principais
| Component | Responsibility | Evidence |
| --- | --- | --- |

## 8. Requisitos Funcionais Identificados
| ID | Requirement | Type | Evidence | Status |
| --- | --- | --- | --- | --- |

## 9. Requisitos Nao Funcionais Identificados
| ID | Requirement | Quality Attribute | Evidence | Status |
| --- | --- | --- | --- | --- |

## 10. Regras de Negocio
| ID | Rule | Type | Evidence | Impact |
| --- | --- | --- | --- | --- |

## 11. Modelo de Dominio
- Main entities
- States and transitions
- Relationships
- Domain events, if identifiable

## 12. Fluxos Principais
[Operational flows with numbered steps.]

## 13. Matriz de Rastreabilidade
| Item | Type | Evidence | Related Flow | Related Component | Risk or Gap |
| --- | --- | --- | --- | --- | --- |

## 14. Boas Praticas Identificadas
| Practice | Evidence | Benefit |
| --- | --- | --- |

## 15. Riscos, Desvios e Inconsistencias
| Item | Type | Evidence | Recommendation |
| --- | --- | --- | --- |

## 16. Lacunas de Documentacao
| Gap | Evidence | Suggested Action |
| --- | --- | --- |

## 17. Base Textual para Diagramas C4
### 17.1 Contexto
### 17.2 Containers
### 17.3 Componentes
### 17.4 Codigo, se aplicavel

## 18. Recomendacoes Tecnicas
[Objective, prioritized improvements.]

## 19. Relatorio Executivo para Banca, se solicitado
[Short non-code summary focused on value, maturity, risks, and next steps.]

## 20. Conclusao Tecnica
[Final assessment grounded in evidence.]
```

## C4 Strategy

Generate textual bases for C4 diagrams instead of drawing final diagrams unless the user asks for image generation.

For every C4 level, include:

- elements
- responsibilities
- technologies
- relationships
- evidence
- gaps or uncertainties

### Context Diagram

Identify:

- system name and purpose
- primary users and roles
- external systems such as map apps, email services, database, or authentication providers
- high-level data exchanged

TrackIt example:

- User: driver using mobile app
- User: administrative operator using dashboard
- System: TrackIt delivery management platform
- External system: maps application for route support
- External system: email service for delivery proof, if implemented or planned
- Database: MySQL used by backend persistence

### Container Diagram

Identify deployable or executable parts:

- Mobile app: Expo/React Native driver app
- Backend API: NestJS application
- Admin dashboard: Next.js frontend
- Database: MySQL

Describe communication:

- mobile app calls backend API over HTTP with JWT
- admin dashboard communicates with backend API
- backend persists domain data in MySQL through TypeORM

### Component Diagram

For each container, identify internal modules:

- Backend: auth, users, deliveries, drivers, finalizations, guards, DTOs, entities
- Mobile: navigation, auth context, screens, services, API client, utilities for location/maps/signature
- Frontend: pages, components, data access layer, layout/theme if present

### Code Diagram

Use only when one flow needs deeper explanation, such as delivery finalization, authentication, or status transition. Include classes/functions and the call sequence, not every file.

## Quality Criteria

The generated documentation is acceptable only if it satisfies all criteria:

- methodology of analysis is explicit
- specific repository facts replace generic project descriptions
- business rules include evidence and are not vague
- inferred rules are clearly marked as inferred
- functional and non-functional requirements are extracted when evidence exists
- a traceability matrix links rules, flows, components, evidence, and risks
- domain entities, states, and transitions are described when identifiable
- secrets are not printed
- diagrams are based on identified actors, containers, and components
- recommendations are objective and actionable
- risks distinguish implementation gaps from documentation gaps
- the output can be reused in TCC documentation without heavy rewriting

## Common Mistakes

| Mistake | Correction |
| --- | --- |
| Writing generic architecture text before reading files | Inspect configs, entrypoints, modules, services, screens, and tests first |
| Treating guesses as facts | Mark as `Inferred` or `Gap` |
| Listing technologies without evidence | Reference package/config files |
| Exposing environment values | Mention presence of sensitive config without copying values |
| Producing C4 diagrams detached from the repo | Derive C4 actors, containers, and components from inspected files |
| Ignoring tests | Use tests to confirm behavior and identify missing coverage |
| Mixing implementation detail with business rule | Keep business rule user/domain-focused and put implementation in evidence |
| Skipping traceability | Link rules, flows, components, and risks through the traceability matrix |
| Hiding limits of analysis | State unavailable areas and classify them as gaps |

## Example Command

Use this prompt when invoking the skill:

```text
Analise este projeto e gere uma documentacao tecnica completa com regras de negocio, arquitetura, boas praticas, riscos, lacunas e base textual para diagramas C4. Use evidencias do repositorio e marque o que for inferido.
```

## TrackIt Initial Focus

For this repository, prioritize these areas first:

- `README.md`: existing business flow and architecture summary
- `docs/trackit-mobile-handoff.md`: implemented mobile MVP behavior and file references
- `backend/package.json`: NestJS, TypeORM, MySQL, JWT, validation, tests
- `backend/src/`: auth, deliveries, finalizations, users, drivers, entities, DTOs, guards
- `mobile/package.json`: Expo, React Native, navigation, secure store, location, SVG, Jest
- `mobile/src/`: screens, services, navigation, auth context, signature, location, maps
- `frontend/dashcontrole/package.json`: Next.js, React, Tailwind, TypeScript
- `docs/*.drawio` and `docs/*.png`: existing business, backend, and frontend flow diagrams

Initial expected business themes:

- authenticated access with JWT
- role restriction for mobile driver flows
- driver ownership over deliveries
- delivery status transitions from waiting to route to delivered
- finalization with receiver name, signature, and GPS data
- administrative assignment and tracking of deliveries

Confirm each item in code/tests before presenting it as explicit.

## Recommended File Outputs

When producing documentation from this skill, write files under `docs/generated/`:

- `docs/generated/technical-documentation.md`
- `docs/generated/c4-basis.md`
- `docs/generated/executive-report.md`, if the user needs banca-oriented summary

Keep the skill itself in `docs/projectdoc-ai/SKILL.md`.
