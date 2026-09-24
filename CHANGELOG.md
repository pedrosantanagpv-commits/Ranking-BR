# Histórico de versões

## v0.2.3 — Consolidação SGA Leves + SGA Truck

- duas áreas obrigatórias de importação, uma para cada SGA;
- leitura paralela dos relatórios Gestão Adesão de Leves e Truck;
- união automática de executivos e cooperativas em um único fechamento;
- soma de placas e previsão de faturamento nos dois sistemas;
- ticket médio calculado sobre o total consolidado;
- remoção e sinalização de chassis repetidos entre os sistemas;
- auditoria separada de cada arquivo e do resultado consolidado;
- histórico salva a identificação dos dois relatórios usados.

## v0.2.2 — Equipes por cooperativa

- leitura automática do código `BR.xx` na coluna Cooperativa;
- mapeamento padrão das 11 equipes informadas;
- inclusão de todas as demais cooperativas no ranking;
- sinalização de códigos ainda sem nome de equipe configurado;
- vínculo automático dos executivos, sem seleção manual repetitiva;
- ranking coletivo calculado diretamente pelos veículos ativos de cada cooperativa.

## v0.2.1 — Evolução e indicadores financeiros

- coluna `Prev. Fat.` nos rankings de executivos e equipes;
- coluna `T. Médio`, calculada pela previsão de faturamento dividida pela quantidade de placas;
- movimentação de equipes em relação ao fechamento anterior;
- sinalização de quem subiu, desceu ou manteve a posição;
- prévia de importação com placas, previsão de faturamento e ticket médio.

## v0.2.0 — Ranking funcional

- importação real do relatório Gestão Adesão `.xls`;
- leitura correta do HTML em codificação Windows-1252;
- validação do layout e deduplicação por chassi;
- regra de contagem somente para veículos ativos;
- desempate por previsão financeira;
- prévia completa antes da confirmação;
- criação automática de novos executivos;
- CRUD de equipes e executivos;
- vínculo de participantes às equipes;
- fotos comprimidas no Firestore, sem Firebase Storage;
- histórico com composição da equipe preservada por fechamento;
- ranking de executivos e equipes;
- evolução de posição entre fechamentos;
- dashboard conectado aos dados reais;
- arte Top 3 para Feed e Story com download em PNG;
- relatório original e dados individuais de associados não são armazenados.

## v0.1.0 — Base visual e autenticação

- identidade visual inicial do Ranking BR;
- login integrado ao Firebase Authentication;
- perfis `DEV` e `ADMIN`;
- proteção das páginas internas;
- dashboard e navegação responsivos;
- regras iniciais do Firestore;
- endpoint de teste para o Google Apps Script;
- estrutura pronta para Vercel.
