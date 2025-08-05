# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` - Starts Next.js development server
- **Build**: `npm run build` - Creates production build
- **Production server**: `npm start` - Starts production server
- **Linting**: `npm run lint` - Runs Next.js ESLint

## Architecture Overview

This is a Next.js 14 document signing application with the following key architectural components:

### Core Structure
- **App Router**: Uses Next.js App Router with TypeScript
- **UI Framework**: Radix UI components with Tailwind CSS styling
- **Internationalization**: Custom language context supporting Korean and English
- **State Management**: React hooks and context for local state

### Key Components
- **Document Processing**: Client-side image handling with HTML5 Canvas API for signature overlay
- **Signature Areas**: Interactive area selection system for defining signature zones
- **URL Generation**: Short URL system for sharing signing links (demo uses localStorage)

### Important Files
- `contexts/language-context.tsx` - Bilingual support with comprehensive translations
- `app/actions/document-actions.ts` - Server action for document processing using node-canvas
- `components/document-upload.tsx` - Main document upload and area selection interface
- `components/area-selector.tsx` - Interactive signature area selection tool
- `lib/client-image-merger.ts` - Client-side image processing utilities

### Configuration Notes
- TypeScript strict mode enabled
- ESLint and TypeScript errors ignored during builds (development configuration)
- Images are unoptimized for deployment flexibility
- Path aliases configured with `@/*` pointing to project root

### Styling System
- Tailwind CSS for utility-first styling
- Custom CSS variables for theming in `globals.css`
- Dark/light theme support via next-themes
- Responsive design patterns throughout

### Development Patterns
- All user-facing text uses translation keys via `t()` function
- Client components marked with "use client" directive
- Server actions for image processing operations
- localStorage used for demo data persistence (replace with database in production)

## Development Memories

- 최우선으로 serena mcp를 활용할 수 있다면 꼭 사용
- 작업 종료될 때에는 항상 git commit을 해서 변경사항을 저장
- supabase 관련 동작은 supabase mcp를 활용