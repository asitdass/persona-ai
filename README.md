# PersonaAI

AI-powered platform that allows anyone to create a personalized AI assistant that represents them professionally. Visitors can ask questions naturally instead of reading through static portfolios.

## Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Database**: Supabase PostgreSQL + pgvector
- **Auth**: Supabase Auth (via `@supabase/ssr`)
- **Storage**: Supabase Storage
- **ORM**: Drizzle ORM
- **AI**: OpenAI (GPT-4o-mini + text-embedding-3-small) via Vercel AI SDK
- **Rate Limiting**: Upstash Redis
- **Styling**: Tailwind CSS

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (with `pgvector` extension enabled)
- An OpenAI API key
- An Upstash Redis instance (for rate limiting)

### Setup

1. Clone and install:

```bash
npm install
```

2. Copy the environment file and fill in your values:

```bash
cp .env.local .env.local
```

Required environment variables:
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anon/public key
- `SUPABASE_SERVICE_ROLE_KEY` - Supabase service role key
- `DATABASE_URL` - PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key
- `UPSTASH_REDIS_REST_URL` - Upstash Redis REST URL
- `UPSTASH_REDIS_REST_TOKEN` - Upstash Redis REST token
- `NEXT_PUBLIC_APP_URL` - Your app URL (http://localhost:3000 for dev)

3. Run the database migration in Supabase SQL editor:

```sql
-- Copy contents of drizzle/0001_initial_schema.sql
```

4. Create a storage bucket named `documents` in Supabase Storage.

5. Run the development server:

```bash
npm run dev
```

### Deployment (Vercel)

1. Push to GitHub
2. Import to Vercel
3. Add all environment variables
4. Deploy

## Project Structure

```
src/
├── app/
│   ├── api/
│   │   ├── analytics/        # Analytics data API
│   │   ├── assistant/        # Assistant CRUD API
│   │   ├── documents/        # Document upload & processing
│   │   ├── profile/          # Profile CRUD API
│   │   └── public/
│   │       ├── assistant/    # Public assistant config
│   │       └── chat/         # Public streaming chat (RAG)
│   ├── auth/callback/        # Supabase auth callback
│   ├── dashboard/            # Protected dashboard pages
│   ├── embed/[publicKey]/    # Embeddable chat UI (iframe)
│   ├── login/                # Login page
│   └── signup/               # Signup page
├── components/
│   ├── dashboard/            # Dashboard navigation
│   └── ui/                   # Reusable UI components
├── lib/
│   ├── db/                   # Drizzle ORM schema & client
│   ├── ingestion/            # Document parsing, chunking, embedding
│   ├── rag/                  # Retrieval & prompt construction
│   ├── supabase/             # Supabase client utilities
│   ├── security.ts           # Security helpers
│   ├── utils.ts              # General utilities
│   └── validations.ts        # Zod schemas
├── middleware.ts             # Auth guard + CORS
public/
├── widget.js                 # Embeddable widget script
└── test-widget.html          # Widget test page
drizzle/
└── 0001_initial_schema.sql   # Database migration
```

## How It Works

1. **Sign up** and create your profile
2. **Upload** your documents (resume, project docs, blogs)
3. **Customize** your AI assistant's personality and appearance
4. **Embed** the widget on your portfolio with one line of code
5. **Visitors** can ask questions and get instant AI-powered answers

## Widget Integration

Add this to any website:

```html
<script src="https://your-app.vercel.app/widget.js" data-assistant="pk_your_key" data-url="https://your-app.vercel.app"></script>
```
