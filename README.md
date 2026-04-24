# TicketDesk — Sistema de Suporte por Tickets

Stack: Next.js 14 (App Router) + Supabase Auth + PostgreSQL + RLS

---

## 1. Configurar o Supabase

### 1.1 Criar projeto
1. Acesse https://supabase.com e crie um novo projeto
2. Guarde a **Project URL** e a **Anon Key** (Settings → API)

### 1.2 Executar o schema SQL
1. No dashboard do Supabase, vá em **SQL Editor**
2. Cole o conteúdo de `supabase_schema.sql` e execute
3. Isso cria: profiles, tickets, ticket_messages, RLS policies, triggers

### 1.3 Configurar Auth (opcional)
- Para testes locais, desabilite a confirmação de email:
  Authentication → Providers → Email → desabilitar "Confirm email"

---

## 2. Configurar o projeto Next.js

### 2.1 Clonar e instalar
```bash
npm install
```

### 2.2 Criar variáveis de ambiente
```bash
cp .env.local.example .env.local
```

Edite `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=https://SEU_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_anon_key_aqui
```

### 2.3 Rodar localmente
```bash
npm run dev
```

Acesse: http://localhost:3000

---

## 3. Estrutura de arquivos

```
ticket-system/
├── app/
│   ├── layout.tsx                  # Root layout + fonts
│   ├── globals.css                 # Design system completo
│   ├── page.tsx                    # Redirect → /dashboard
│   ├── login/
│   │   └── page.tsx                # Login + registro (client)
│   ├── dashboard/
│   │   ├── layout.tsx              # Layout com Sidebar (server)
│   │   └── page.tsx                # Stats + tickets recentes
│   ├── tickets/
│   │   ├── layout.tsx              # Layout com Sidebar (server)
│   │   ├── page.tsx                # Listagem de tickets
│   │   ├── new/
│   │   │   └── page.tsx            # Criar novo ticket (client)
│   │   └── [id]/
│   │       └── page.tsx            # Detalhe + mensagens (server)
│   └── api/
│       ├── tickets/route.ts        # GET /api/tickets, POST /api/tickets
│       └── messages/route.ts       # POST /api/messages
├── components/
│   ├── Sidebar.tsx                 # Sidebar com navegação (client)
│   ├── TicketReplyForm.tsx         # Form de resposta (client)
│   └── TicketStatusUpdate.tsx      # Atualizar status — só agentes (client)
├── lib/
│   └── supabase/
│       ├── client.ts               # Browser client (SSR)
│       └── server.ts               # Server client (cookies)
├── types/
│   └── index.ts                    # Profile, Ticket, TicketMessage
├── middleware.ts                   # Auth guard + redirect
├── supabase_schema.sql             # Schema completo com RLS
├── .env.local.example
├── next.config.js
├── tsconfig.json
└── package.json
```

---

## 4. Funcionalidades implementadas

| Feature | Detalhe |
|---|---|
| Login / Registro | Supabase Auth com email+senha |
| Middleware de auth | Redirect automático para /login |
| Dashboard | Stats de tickets por status |
| Listar tickets | Filtrado por usuário via RLS |
| Criar ticket | Título, descrição, prioridade |
| Visualizar ticket | Detalhe + histórico de mensagens |
| Responder ticket | Mensagem pública no ticket |
| Atualizar status | Apenas agentes/admins |
| RLS completo | Políticas por role no PostgreSQL |
| API Routes | GET e POST /api/tickets, POST /api/messages |

---

## 5. Como promover um usuário a agente

No **SQL Editor** do Supabase:

```sql
UPDATE public.profiles
SET role = 'agent'
WHERE email = 'email-do-agente@exemplo.com';
```

Agentes podem ver todos os tickets e atualizar status.

---

## 6. Variáveis de ambiente

| Variável | Descrição |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Chave anônima pública |
