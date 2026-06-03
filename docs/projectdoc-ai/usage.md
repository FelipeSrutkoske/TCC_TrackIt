# ProjectDoc AI - Documentacao de Uso

## Finalidade

ProjectDoc AI orienta uma IA no VS Code ou em outro ambiente de desenvolvimento a analisar um repositorio aberto e gerar documentacao tecnica estruturada para apoio ao TCC.

## Como usar

1. Abra o projeto no VS Code.
2. Garanta que a IA tenha acesso aos arquivos do repositorio.
3. Informe o comando principal:

```text
Analise este projeto e gere uma documentacao tecnica completa com regras de negocio, arquitetura, boas praticas, riscos, lacunas e base textual para diagramas C4. Use evidencias do repositorio e marque o que for inferido.
```

4. Solicite que a saida seja gravada em `docs/generated/` ou em outro caminho definido pelo projeto.
5. Revise as secoes marcadas como `Inferred`, `Gap` e `Risk` antes de usar o texto no TCC.

## Entradas analisadas

- codigo-fonte do backend, frontend e mobile
- arquivos de configuracao e dependencias
- testes automatizados
- documentacao existente
- diagramas existentes
- nomes de classes, funcoes, modulos, telas, servicos e entidades

## Saidas esperadas

- resumo executivo
- escopo e metodologia da analise
- tecnologias identificadas
- estrutura do projeto
- arquitetura e componentes principais
- requisitos funcionais e nao funcionais
- regras de negocio com evidencias
- modelo de dominio
- fluxos principais
- matriz de rastreabilidade
- boas praticas, riscos e lacunas
- base textual para diagramas C4
- recomendacoes tecnicas

## Cuidados

- Nao copiar valores de `.env`, tokens, senhas, chaves privadas ou credenciais.
- Nao apresentar inferencias como fatos.
- Nao gerar regras de negocio genericas sem evidencia no repositorio.
- Registrar limites da analise quando algum modulo nao puder ser verificado.
