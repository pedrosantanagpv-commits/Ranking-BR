# Ranking BR — v0.1.0

Primeira versão da plataforma de rankings das cooperativas BR. O projeto foi preparado para rodar com **Next.js + Vercel + Firebase** e utilizar o Google Apps Script como integração auxiliar.

## O que já funciona

- tela de login;
- autenticação por e-mail e senha com Firebase;
- validação do perfil salvo no Firestore;
- perfis `DEV` e `ADMIN`;
- rotas internas protegidas;
- dashboard responsivo;
- navegação completa da aplicação;
- seleção de relatório `.xls` ou `.xlsx`;
- modo demonstração quando o Firebase ainda não está configurado;
- endpoint de teste no Apps Script.

Os números exibidos no dashboard são demonstrativos nesta versão.

## 1. Colocar no GitHub

Envie **todo o conteúdo desta pasta** para a raiz do seu repositório. O arquivo `package.json` precisa ficar na raiz.

Estrutura principal:

```text
ranking-br/
├── app/
├── components/
├── lib/
├── public/
├── apps-script/
├── firestore.rules
├── storage.rules
├── package.json
└── README.md
```

## 2. Preparar o Firebase

No console do Firebase:

1. crie ou abra o projeto do Ranking BR;
2. em **Authentication → Sign-in method**, ative **E-mail/senha**;
3. crie o **Firestore Database**;
4. ative o **Storage**;
5. em **Configurações do projeto → Seus apps**, registre um aplicativo Web;
6. copie as informações do objeto `firebaseConfig`.

### Variáveis do Firebase

Duplique `.env.example` com o nome `.env.local` e preencha:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=sua_chave
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=seu-projeto
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=seu-projeto.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=seu_id
NEXT_PUBLIC_FIREBASE_APP_ID=seu_app_id
```

Nunca envie o `.env.local` para o GitHub. Ele já está bloqueado no `.gitignore`.

## 3. Criar Pedro e Caio

Em **Firebase Authentication → Users**, crie os dois usuários usando os e-mails e senhas que vocês escolherem.

Depois copie o `UID` de cada usuário e crie manualmente no Firestore:

### Documento `usuarios/{UID_DO_PEDRO}`

```json
{
  "nome": "Pedro",
  "email": "email_do_pedro",
  "perfil": "DEV",
  "ativo": true
}
```

### Documento `usuarios/{UID_DO_CAIO}`

```json
{
  "nome": "Caio Santiago",
  "email": "email_do_caio",
  "perfil": "ADMIN",
  "ativo": true
}
```

Use o `UID` do Authentication como **ID do documento**, exatamente igual. A coleção deve se chamar `usuarios`, toda em minúsculas.

## 4. Publicar as regras

Abra as abas de regras do Firestore e do Storage e cole o conteúdo destes arquivos:

- `firestore.rules`
- `storage.rules`

Depois clique em **Publicar**.

As regras permitem que o ADMIN opere rankings, equipes, executivos e arquivos. Somente o DEV pode gerenciar usuários e configurações técnicas.

## 5. Testar no computador

Com Node.js instalado:

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000`.

Se o Firebase ainda não estiver configurado, use o botão **Acessar demonstração**. Esse modo existe apenas para visualizar e testar a interface.

## 6. Importar na Vercel

1. abra a Vercel;
2. clique em **Add New → Project**;
3. importe o repositório do GitHub;
4. mantenha o framework detectado como **Next.js**;
5. em **Environment Variables**, cadastre as seis variáveis `NEXT_PUBLIC_FIREBASE_...` do `.env.example`;
6. clique em **Deploy**.

Depois disso, cada atualização enviada ao GitHub pode gerar um novo deploy automaticamente.

## 7. Configurar o Apps Script

No seu projeto do Google Apps Script:

1. substitua o conteúdo do `Code.gs` pelo arquivo `apps-script/Code.gs` deste pacote;
2. clique em **Implantar → Nova implantação**;
3. selecione **App da Web**;
4. execute como você;
5. permita acesso para qualquer pessoa que possua o link;
6. copie a URL terminada em `/exec`.

Ao abrir essa URL, você deve receber um JSON com `"status":"online"`.

Se quiser já guardar a URL no projeto, adicione na Vercel:

```env
NEXT_PUBLIC_APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_ID/exec
```

## Observação importante

A v0.1.0 entrega a estrutura visual e técnica. A leitura real do relatório, o cálculo do ranking e o histórico entram na v0.2.0. O botão **Processar relatório** fica desativado até um arquivo ser selecionado, mas ainda não envia nem grava dados nesta versão.
