# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start development server on localhost:3000
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

### Environment Variables Required
- `NEXT_PUBLIC_SUPABASE_URL` - Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` - Supabase public API key
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Supabase anonymous key

## Architecture Overview

### Core Application Structure
This is a **Next.js 14 App Router** application for digital document signing called "SeukSeuk" (슥슥). The app allows users to upload documents, define signature areas, and collect digital signatures.

### Route Groups & Layout Structure
The app uses Next.js route groups for organization:
- `(auth)/` - Authentication pages (login, register)
- `(document)/` - Document management (upload, view details)
- `(sign)/` - Document signing flow

### Data Layer - Supabase Integration
**Database Schema:**
- `documents` table: Stores document metadata with statuses (draft → published → completed)
- `signatures` table: Signature areas with coordinates and signature data

**Supabase Client Architecture:**
- `lib/supabase/server.ts` - Server-side client with cookie handling
- `lib/supabase/client.ts` - Browser client for client components
- `lib/supabase/middleware.ts` - Route protection middleware (currently not active in middleware.ts)

### Authentication & Authorization
Authentication uses Supabase Auth with route protection logic defined in `lib/supabase/middleware.ts`:
- Public routes: `/`, `/login`, `/register`, `/auth`, `/error`
- Protected routes: All others redirect to `/login` if unauthenticated

### Document Workflow
1. **Upload** (`/upload`) - User uploads document, defines signature areas
2. **Publish** - Document status changes from `draft` → `published`, generates short URL
3. **Sign** (`/sign/[shortUrl]`) - External users sign via shared link
4. **Complete** - All signatures collected, status becomes `completed`

### Internationalization (i18n)
- Context-based i18n using `contexts/language-context.tsx`
- Supports Korean (ko) and English (en)
- localStorage persistence for language preference
- Comprehensive translation keys covering all UI text

### UI Architecture
- **Design System**: shadcn/ui with Radix UI primitives
- **Styling**: Tailwind CSS with next-themes for dark/light mode
- **Components**: Modular component structure in `/components` with ui/ subfolder
- **Responsive**: Mobile-first design with responsive layouts

### Key Business Logic
**Document Actions** (`app/actions/document-actions.ts`):
- Document upload with unique filename generation
- Signature area management (create, update, delete)
- Password protection with bcrypt hashing
- Document expiration handling
- Signed document storage in Supabase Storage

### File Upload & Storage
- Uses Supabase Storage buckets: `documents` and `signed-documents`
- Generates UUID-based filenames for security
- Canvas-based signature capture and image generation
- Supports password-protected documents

### State Management
- React Context for language and theme
- Server Actions for data mutations
- Client-side state with useState/useEffect patterns

### Development Notes
- ESLint and TypeScript errors are ignored during builds (see next.config.mjs)
- Images are unoptimized in config
- bcryptjs for password hashing (server-side only)
- Canvas API for signature capture and document merging

### Component Patterns
- Server Components for data fetching
- Client Components for interactivity (signature capture, modals)
- Consistent use of TypeScript with proper type definitions
- Form handling with proper loading states and error handling
- 개발환경은 백그라운드에서 따로 띄우면 안됨. 직접 띄울 예정.
- 항상 시작전 serena project activate 후 최우선으로 사용 project name: new-seuk