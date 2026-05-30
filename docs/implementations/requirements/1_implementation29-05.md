## Features a serem implementadas a seguir ##

1. A partir de agora que temos o MVP do projeto rodando funcional (e2e mobile), fazendo login, rota, entrega, maps. Vamos iniciar a integracao do app mobile com o frontend /frontend/dashcontrole:
   a. Vamos comecar com o basico, crie uma rota do next para criar as entregas. E ainda vamos implementar esses dados futuramente no mobile tambem, pois desenhei a tabela de detalhes da entrega para mostrar o que de fato eh aquela entrega. Abaixo segue a estrutura da nova tabela. Com ela, criar um fluxo de criacao da entrega ja com os novos detalhes:
        tb_detalhes_entrega,"CREATE TABLE `tb_detalhes_entrega` (
          `id` int NOT NULL AUTO_INCREMENT,
          `entrega_id` int NOT NULL,
          `descricao` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
          `categoria` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT 'Geral',
          `peso_kg` decimal(10,3) NOT NULL,
          `volume_m3` decimal(10,4) NOT NULL,
          `quantidade` int NOT NULL DEFAULT '1',
          `valor_declarado` decimal(10,2) NOT NULL,
          PRIMARY KEY (`id`),
          KEY `fk_item_entrega` (`entrega_id`),
          CONSTRAINT `fk_item_entrega` FOREIGN KEY (`entrega_id`) REFERENCES `tb_entregas` (`id`) ON DELETE CASCADE
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
  

  b. Tambem no frontend, vamos "desmockar" os dados de detalhe do componente de comprovante de entrega que ja tem (Vamos melhora-lo agora), vamos usar os dados da assinatura que ja esta gravado na tb_finalizacoes, assinatura, dados de gps, recebedor, basicamente tudo que tem la, incluindo o desenho da rota no maps ja ... 

  c. Quero que tambem, pense, analise o que temos, e pense em acoplamentos/melhorias/coisas novas interessantes a inserir no projeto.

2. Altere a parte do mobile para pegar os dados novos da tb_detalhes_entrega tambem.

**FINAL**

- Com esses dados, gere specs nesse diretorio acima ../specs/ ou seja, trackit-mobile-mvp/docs/spec_1_implementarion29-05/specs1, 2, 3 ... Ou seja, gere uma pasta desse implementation (Uma pasta das specs desse implementation para cada implementation que eu criar (para organizarmos melhor.)).
- Para cada spec, crie com nome descritivo e bem implementado os requisitos, com passos bem definidos.
