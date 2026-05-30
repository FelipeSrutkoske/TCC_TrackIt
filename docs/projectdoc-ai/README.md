# ProjectDoc AI 

Este diretorio concentra as atividades sobre criacao de uma skill integrada ao fluxo de desenvolvimento para gerar documentacao tecnica de projetos de software.

## Entregaveis

| Exigencia | Arquivo |
| --- | --- |
| Skill funcional ou prototipo | `SKILL.md` |
| Documentacao de uso | `usage.md` |
| Documentacao tecnica gerada pela skill | `generated-technical-documentation.md` |
| Justificativa das decisoes de implementacao | `implementation-decisions.md` |
| Exemplos de saida em projeto real ou simulado | `output-examples.md` |
| Estrategia para gerar diagramas C4 | `c4-strategy.md` |

## Comando principal

```text
Analise este projeto e gere uma documentacao tecnica completa com regras de negocio, arquitetura, boas praticas, riscos, lacunas e base textual para diagramas C4. Use evidencias do repositorio e marque o que for inferido.
```

## Projeto usado como exemplo real

O prototipo foi aplicado ao proprio repositorio TrackIt, um sistema de gestao de entregas composto por:

- backend NestJS com TypeORM e MySQL
- aplicativo mobile Expo/React Native para motoristas
- painel administrativo Next.js
- documentacao e diagramas existentes em `docs/`
