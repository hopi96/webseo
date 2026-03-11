# SEO Analytics Dashboard (WebSEO)

## Overview

A comprehensive SEO analytics and editorial content management dashboard. Built for analyzing website SEO performance, tracking keywords, monitoring traffic, generating AI-powered editorial calendars, and auto-publishing to social networks.

## User Preferences

- **Communication**: Simple, everyday language
- **Language**: French (user communicates in French)
- **Data**: Real SEO data, no mock data
- **Interface**: Full French translation
- **Design**: Soft and gentle aesthetics (pastel colors, not flashy)

## System Architecture

### Frontend
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Routing**: Wouter
- **State Management**: TanStack Query (React Query)
- **UI**: Shadcn/ui on Radix UI primitives
- **Styling**: Tailwind CSS, mobile-first responsive

### Backend
- **Runtime**: Node.js with TypeScript (tsx for dev)
- **Framework**: Express.js RESTful API
- **Auth & DB**: Supabase (PostgreSQL with RLS, Supabase Auth)
- **ORM**: Drizzle ORM (secondary, for schema definitions)
- **Port**: 5000

### Key Services
- **supabase-service.ts**: Central database service (sites, content, prompts, users)
- **content-generator-service.ts**: AI content generation (Claude/Anthropic primary, OpenAI/DALL-E for images)
- **content-calendar-service.ts**: AI editorial calendar generation (OpenAI GPT-4o)
- **seo-analysis-service.ts**: SEO analysis with PageSpeed Insights
- **social-publisher-service.ts**: Auto-publishing to social networks (Twitter, etc.)
- **monitoring-agent-service.ts**: AI monitoring summaries

## Required Environment Secrets

### Critical (app won't load data without these)
- `SUPABASE_URL` - Your Supabase project URL
- `SUPABASE_ANON_KEY` - Supabase anonymous/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key (admin access)

### Frontend (Vite build)
- `VITE_SUPABASE_URL` - Same as SUPABASE_URL (for client-side auth)
- `VITE_SUPABASE_ANON_KEY` - Same as SUPABASE_ANON_KEY

### AI Features (optional, enables AI generation)
- `ANTHROPIC_API_KEY` - Claude API key (content generation)
- `OPENAI_API_KEY` - OpenAI key (calendar generation, DALL-E images)

### Social Publishing (optional)
- `TWITTER_API_KEY`, `TWITTER_API_SECRET`, `TWITTER_ACCESS_TOKEN`, `TWITTER_ACCESS_TOKEN_SECRET`
- Facebook, LinkedIn tokens per site (stored in `social_params` in DB)

## Database (Supabase)

All data is in Supabase PostgreSQL. Key tables:
- `sites` - Websites with SEO analysis JSON, social params
- `editorial_contents` - Content calendar entries
- `system_prompts` - AI prompts per platform
- `site_prompts` - Per-site custom prompts
- `user_roles` - User access roles (superadmin, admin, site_user)
- `user_sites` - User-to-site access mapping
- `publication_logs` - Social publishing history

## Workflow

- **Dev**: `cross-env NODE_ENV=development tsx server/index.ts` on port 5000
- **Build**: `vite build && esbuild server/index.ts ...`
- **Start (prod)**: `node dist/index.js`

## Migration Notes (Replit import)

- Fixed: OpenAI client initialized at module level without null guard (crashed on startup)
- Fixed: Windows-only `predev` script bypassed (workflow runs tsx directly)
- The app uses Supabase for auth + database — Supabase credentials must be configured as secrets
- The Replit PostgreSQL (`DATABASE_URL`) is provisioned but not actively used (Supabase is the primary DB)
