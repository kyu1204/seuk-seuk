# SeukSeuk Project Overview

## Project Purpose
SeukSeuk (슥슥) is a **digital document signing platform** that allows users to:
- Upload documents and define signature areas
- Share documents via short URLs for external signing
- Collect digital signatures with Canvas-based signature capture
- Generate signed documents with password protection
- Support bilingual interface (Korean/English)

## Architecture Overview

### Framework & Core Technology
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript (strict mode enabled)
- **Database**: Supabase (PostgreSQL + Auth + Storage)
- **Styling**: Tailwind CSS with shadcn/ui design system
- **Icons**: Lucide React
- **Deployment**: Vercel (inferred from next.config.mjs)

### Project Structure
```
app/
├── (auth)/          # Authentication pages (login, register)
├── (document)/      # Document management (upload, view details)
├── (sign)/          # Document signing flow
├── actions/         # Server actions for data mutations
└── components/      # Shared components

components/
├── ui/              # shadcn/ui components (50+ components)
└── [feature-components].tsx

lib/
├── supabase/        # Supabase client configuration
├── utils.ts         # Utility functions (cn helper)
└── [other-utilities].ts

contexts/
└── language-context.tsx  # i18n context
```

### Route Groups Pattern
Uses Next.js route groups for logical organization:
- `(auth)` - Authentication flow
- `(document)` - Document management 
- `(sign)` - Signing workflow

## Key Features

### Authentication & Authorization
- Supabase Auth integration
- Route protection middleware (defined but not active)
- Public routes: `/`, `/login`, `/register`, `/auth`, `/error`
- Protected routes: All others redirect to `/login`

### Document Workflow
1. **Upload** (`/upload`) - Upload document, define signature areas
2. **Publish** - Status: `draft` → `published`, generates short URL
3. **Sign** (`/sign/[shortUrl]`) - External users sign via shared link
4. **Complete** - All signatures collected, status becomes `completed`

### Internationalization
- Context-based i18n system (not library-based)
- Supports Korean (`ko`) and English (`en`)
- localStorage persistence for language preference
- Comprehensive translation coverage (300+ keys)

### Technical Features
- **Canvas-based Signature Capture**: Real-time signature drawing
- **Document Expiration**: Time-based document access control
- **Password Protection**: bcrypt hashing for secure documents
- **File Storage**: Supabase Storage with UUID-based filenames
- **Theme System**: next-themes with light/dark modes

## Database Schema
```sql
documents:
- id (uuid, primary key)
- filename (text)
- file_url (text)
- short_url (text, unique)
- status (text: draft|published|completed)
- created_at (timestamp)
- expires_at (timestamp) -- newly added

signatures:
- id (uuid, primary key)
- document_id (uuid, foreign key)
- signature_data (text) -- base64 image
- coordinates (json) -- {x, y, width, height}
- created_at (timestamp)
```

## Security Considerations
- UUID-based file naming for security
- Password hashing with bcryptjs
- Supabase RLS (Row Level Security) assumed
- Environment variables for API keys
- HTTPS enforcement (Supabase)

## Performance Optimizations
- Image optimization disabled in Next.js config
- Build errors ignored for rapid development
- Static file caching via Vercel/CDN
- Server-side rendering for SEO