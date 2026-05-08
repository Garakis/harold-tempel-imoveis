# Harold Tempel Imóveis — Web

Site público + painel administrativo para a Harold Tempel Imóveis (Mococa/SP), substituindo a plataforma Kenlo.

## Stack

- **Next.js 16** (App Router, Turbopack default, Node runtime)
- **TypeScript 5**
- **Tailwind CSS v4** (CSS-first com `@theme`)
- **Supabase** (Postgres + Auth + Storage)
- **lucide-react** (ícones — exceto marcas Facebook/Instagram que vêm em `social-icons.tsx`)

## Comandos

```bash
npm run dev      # http://localhost:3000
npm run build    # build de produção
npm run start    # servir build local
```

## Variáveis de ambiente

Veja [`.env.example`](./.env.example). O `.env.local` já está populado pro projeto Supabase de dev.

| Variável | Necessário | Descrição |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | sim | URL do projeto Supabase |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | sim | Publishable key (substitui anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | não | Necessário só pra operações admin que ignorem RLS |
| `RESEND_API_KEY` | não | Para e-mails transacionais (a configurar) |
| `NEXT_PUBLIC_SITE_URL` | sim | URL canônica do site (OG, sitemap) |

## Estrutura

```
src/
├── app/
│   ├── layout.tsx                    Root (fontes, metadata)
│   ├── (public)/                     Site público com header/footer/whatsapp
│   │   ├── layout.tsx
│   │   ├── page.tsx                  Home
│   │   ├── imoveis/[[...filters]]/   Listagem (catch-all)
│   │   ├── imovel/[slug]/[codigo]/   Ficha
│   │   ├── sobre/                    Quem somos
│   │   ├── financiamento/
│   │   ├── fale-conosco/
│   │   ├── cadastre-seu-imovel/
│   │   ├── encomende-seu-imovel/
│   │   └── politica-de-privacidade/
│   └── admin/
│       ├── login/                    Standalone (sem sidebar)
│       └── (authed)/                 Auth-gated com sidebar
│           ├── layout.tsx
│           ├── page.tsx              Dashboard
│           ├── imoveis/
│           ├── leads/
│           ├── agenda/
│           ├── proprietarios/
│           ├── configuracoes/
│           └── usuarios/
├── components/
│   ├── ui/                           Primitivos (Button, Input, Card)
│   ├── site/                         Header, Footer, Logo, Hero, PropertyCard...
│   └── admin/                        Sidebar, futuros widgets admin
├── lib/
│   ├── supabase/
│   │   ├── server.ts                 Cliente server (Server Components)
│   │   ├── client.ts                 Cliente browser (Client Components)
│   │   ├── middleware.ts             updateSession para o proxy
│   │   └── database.types.ts         Tipos auto-gerados
│   ├── domain/
│   │   └── properties.ts             Domínio: tipos, slug, código, labels
│   ├── mock/                         Dados mock (remover quando admin estiver populado)
│   ├── settings.ts                   Site settings cacheados
│   └── utils.ts                      cn(), formatBRL(), formatArea()
└── proxy.ts                          Next.js 16 middleware (auth gate /admin)
```

## Pontos importantes Next.js 16

- `params` e `searchParams` são **Promise** — sempre `await`
- `cookies()`, `headers()`, `draftMode()` são async
- Middleware foi renomeado pra `proxy` (Node runtime, sem edge)
- `next/image` usa `images.remotePatterns` (não `domains`)
- Sem `next lint` — usar ESLint diretamente

## Banco de dados (Supabase)

Migrations aplicadas:

- `001_extensions_and_taxonomy` — extensões, profiles, cities, neighborhoods, types, purposes
- `002_properties_photos_owners` — núcleo: properties, property_photos, owners
- `003_leads_visits_settings_storage` — leads, visits, site_settings + bucket de fotos
- `004_security_hardening` — search_path nas funções, lockdown do bucket público

RLS:
- Tabelas públicas (cities, neighborhoods, types, purposes, settings, profiles): SELECT público
- Properties/photos: SELECT público apenas se `is_published=true AND status='ativo'`
- Owners (PII), leads, visits: apenas autenticados
- Lead INSERT: público (forms)

## Próximos passos (não cobertos no MVP inicial)

1. Criar primeiro usuário (Harold) via Supabase dashboard ou Server Action de bootstrap
2. Implementar wizard de cadastro de imóvel (4 passos)
3. Edição de imóvel em abas
4. Upload de fotos com marca d'água via `sharp`
5. Server Actions de submissão de forms públicos → leads
6. Notificação por e-mail (Resend) quando lead chega
7. Sitemap dinâmico
8. Deploy (Cloudflare Pages ou Vercel)
9. Migração de dados (script de scraping do Kenlo)
