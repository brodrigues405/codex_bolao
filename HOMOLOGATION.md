# Homologation Checklist

Checklist rapido para validar o app localmente com Docker antes do deploy na Vercel.

## 1. Preparacao local

1. Copiar `.env.docker.example` para `.env.docker`
2. Subir o ambiente:
   `docker compose up --build`
3. Abrir:
   `http://localhost:3000`
4. Entrar com:
   `admin / admin123`

## 2. Fluxos principais

### Login publico

Verificar:

- tela de login abre sem quebra visual no celular
- QR Code aparece corretamente
- texto para quem ainda nao tem conta esta visivel
- botao de copiar Pix funciona
- login com usuario invalido mostra erro legivel

### Home sem login

Verificar:

- hero principal sem textos corrompidos
- cards e botoes encaixam bem no mobile
- ranking resumido fica legivel no celular
- agenda mostra status de jogo sem sobreposicao

### Home logada

Verificar:

- navegacao superior funciona em mobile
- abas `Dados do bolao` e `Dados do participante` alternam corretamente
- cards de metricas nao quebram em telas pequenas

### Palpites

Verificar:

- filtros por status e grupo funcionam
- jogo de estreia aparece primeiro quando aplicavel
- formulario aceita somente inteiros de `0` a `99`
- mensagem de ajuda aparece antes do envio
- modal `Visualizar palpites dos colegas` abre e fecha corretamente
- fechamento do modal funciona por clique fora e tecla `Escape`

### Ranking

Verificar:

- aba do jogo do Brasil funciona
- aba do ranking geral funciona
- linhas do ranking ficam em formato de cards no mobile
- nomes longos de participantes nao estouram o layout

### Admin

Verificar:

- criar participante funciona
- redefinir senha temporaria funciona
- ativar e desativar participante pede confirmacao
- marcar pago pede confirmacao
- excluir usuario sem palpites pede confirmacao
- sincronizar tabela oficial pede confirmacao
- buscar resultados oficiais pede confirmacao

## 3. Banco e dados

Verificar:

- `matches` carregados no banco
- `predictions` sendo criados e atualizados
- `app_users.must_change_password` funcionando no primeiro acesso
- ranking refletindo resultados oficiais apos sincronizacao

## 4. Build de producao

Rodar:

```bash
npm.cmd run build
```

Esperado:

- build sem erro de TypeScript
- build sem erro de rotas do App Router

## 5. Antes da Vercel

Confirmar:

- `DATABASE_URL` correta para producao
- banco remoto com `supabase/schema.sql` aplicado
- seed remoto com `supabase/seed.sql` aplicado
- se usar Supabase remoto, nao deixar host `db` em variaveis de producao

## 6. Pos-deploy

Verificar em producao:

- login real funcionando
- home publica carregando
- leitura e gravacao de palpites funcionando
- ranking carregando
- admin sincronizando seeds e resultados
