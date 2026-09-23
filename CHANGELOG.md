# Histórico de versões

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
