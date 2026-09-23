# Ranking BR — v0.2.0

Versão funcional da plataforma de ranking das cooperativas BR, construída com Next.js, Vercel e Firebase.

## O que funciona nesta versão

- login real com Firebase Authentication;
- perfis `DEV` e `ADMIN`;
- leitura do relatório **Gestão Adesão** no formato `.xls` exportado pelo sistema;
- reconhecimento automático de executivos pelo campo `Voluntário`;
- contagem apenas de veículos com situação `ATIVO`;
- 1 ponto por veículo e desempate pela maior previsão financeira;
- identificação de duplicidades pelo chassi;
- prévia antes de gravar qualquer dado;
- cadastro e composição de equipes;
- cadastro de executivos, equipe e foto;
- histórico de fechamentos com a equipe preservada no momento da confirmação;
- ranking de executivos e de equipes;
- comparação de posição com o fechamento anterior;
- dashboard com dados reais;
- geração da arte Top 3 em Feed 4:5 ou Story 9:16;
- download da arte em PNG.

## Privacidade e armazenamento

O relatório é processado localmente no navegador. Nomes de associados, placas e chassis não são enviados ao Firebase. O banco recebe somente dados consolidados do fechamento, como executivo, equipe, quantidade e previsão.

O Firebase Storage não precisa ser ativado. As fotos dos executivos são reduzidas para 420 × 420 pixels e guardadas no próprio cadastro do Firestore. Isso mantém o projeto compatível com o plano Spark sem faturamento.

## Atualizar o GitHub

Envie todo o conteúdo desta pasta para a raiz do mesmo repositório usado pela Vercel. O `package.json` precisa permanecer na raiz.

Depois do envio, a Vercel iniciará um novo deploy automaticamente. As variáveis de ambiente já cadastradas continuam salvas e não precisam ser digitadas novamente.

## Publicar as regras do Firestore

No Firebase Console:

1. abra **Firestore Database**;
2. entre na aba **Regras**;
3. substitua o conteúdo pelo arquivo `firestore.rules` desta versão;
4. clique em **Publicar**.

As coleções utilizadas são:

- `usuarios`;
- `equipes`;
- `executivos`;
- `imports`;
- `rankings`;
- `configuracoes`.

## Atualizar o Apps Script mantendo a mesma URL

1. substitua o conteúdo atual pelo arquivo `apps-script/Code.gs`;
2. clique em **Implantar → Gerenciar implantações**;
3. abra a implantação atual pelo ícone de lápis;
4. em **Versão**, escolha **Nova versão**;
5. clique em **Implantar**.

A URL terminada em `/exec` permanece a mesma.

## Variáveis da Vercel

Esta versão utiliza as mesmas variáveis já cadastradas:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_APPS_SCRIPT_URL=
```

As variáveis `NEXT_PUBLIC_` da configuração Web do Firebase podem permanecer como **Config** na Vercel.

## Primeiro uso recomendado

1. abra **Equipes** e crie os nomes das equipes que já conhece;
2. abra **Importar relatório** e selecione o Gestão Adesão `.xls`;
3. confira os  participantes identificados;
4. escolha a equipe de cada pessoa na própria prévia;
5. confirme o fechamento;
6. abra **Executivos** para ajustar nomes e cadastrar as fotos;
7. consulte **Rankings**;
8. abra **Gerar arte** e baixe o Top 3.

Os participantes ainda não cadastrados são criados automaticamente na confirmação. Nos próximos relatórios, o sistema os reconhecerá pelo nome normalizado, ignorando diferenças de letras maiúsculas e acentos.

## Teste local

```bash
npm install
npm run dev
```

Depois acesse `http://localhost:3000`.

## Regras fixadas para a v0.2.0

- entram no ranking somente linhas com situação `ATIVO`;
- nova adesão, produção e troca de titularidade contam quando o veículo estiver ativo;
- cada chassi único vale 1 ponto;
- o primeiro desempate é a maior soma da previsão financeira;
- a equipe fica registrada como estava na data do fechamento;
- o mesmo arquivo não pode ser confirmado duas vezes.
