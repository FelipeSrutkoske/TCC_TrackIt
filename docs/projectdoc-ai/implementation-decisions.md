# ProjectDoc AI - Justificativa das Decisoes de Implementacao

## Formato da solucao

A solucao foi implementada como uma skill em Markdown (`SKILL.md`) porque o objetivo da atividade e orientar uma IA a executar um processo de engenharia de software. Esse formato e simples, versionavel, reutilizavel e pode ser lido por assistentes integrados ao VS Code.

## Decisoes principais

| Decisao | Justificativa |
| --- | --- |
| Usar Markdown | Facilita leitura, versionamento no Git e uso direto no TCC |
| Manter a skill em `docs/projectdoc-ai/` | Centraliza os entregaveis dentro da documentacao do projeto |
| Exigir evidencias por arquivo | Reduz risco de documentacao generica ou inventada |
| Classificar achados como `Explicit`, `Inferred`, `Gap` e `Risk` | Separa fatos verificados, inferencias, lacunas e riscos tecnicos |
| Incluir RF, RNF e matriz de rastreabilidade | Aproxima o resultado de uma documentacao academica de TCC |
| Gerar C4 como base textual | Permite versionar a arquitetura antes de desenhar diagramas finais |
| Bloquear exposicao de segredos | Atende requisito nao funcional de privacidade e seguranca |

## Separacao de responsabilidades

A skill separa o processo em tres responsabilidades:

- Analise: leitura de estrutura, codigo, configuracoes, testes e documentacao.
- Geracao textual: consolidacao em secoes padronizadas.
- Apresentacao: saida em Markdown e base textual para diagramas C4.

Essa separacao permite evoluir a skill sem reescrever tudo. Por exemplo, no futuro pode ser adicionado suporte para comparar versoes do projeto ou gerar relatorio executivo automaticamente.

## Relacao com os requisitos da atividade

| Requisito | Atendimento |
| --- | --- |
| Receber projeto aberto no VS Code | A skill orienta a analisar o repositorio atual |
| Analisar diretorios e arquivos relevantes | Checklist de exploracao do repositorio |
| Identificar linguagens e frameworks | Secao de tecnologias identificadas |
| Gerar documentacao descritiva | Template de documentacao tecnica |
| Listar regras explicitas e inferidas | Tabela de regras com tipo e evidencia |
| Apontar boas praticas e riscos | Secoes especificas de boas praticas, riscos e lacunas |
| Sugerir C4 | Estrategia para contexto, containers, componentes e codigo |
| Exportar texto organizado | Saida padronizada em Markdown |
