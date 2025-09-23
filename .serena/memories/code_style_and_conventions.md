# SeukSeuk Code Style and Conventions

## TypeScript Configuration

### Strict Mode
- **Strict TypeScript**: Enabled in tsconfig.json
- **Type Safety**: Explicit typing preferred, `any` avoided
- **Target**: ES6+ for modern browser support
- **Module Resolution**: Bundler (Next.js specific)

### Import Patterns
```typescript
// Type imports
import type React from "react"
import type { Metadata } from "next"

// Regular imports
import { createServerSupabase } from '@/lib/supabase/server'
import { Button } from "@/components/ui/button"
```

## Naming Conventions

### Files and Directories
```
- kebab-case for files: theme-toggle.tsx, language-context.tsx
- PascalCase for components: ThemeToggle, LanguageProvider
- camelCase for utilities: generateShortUrl, createServerSupabase
- Route groups: (auth), (document), (sign)
```

### Variables and Functions
```typescript
// camelCase for variables and functions
const shortUrl = generateShortUrl()
const { language, setLanguage } = useLanguage()

// PascalCase for components and types
type LanguageContextType = {...}
export function ThemeToggle() {...}

// UPPER_SNAKE_CASE for constants
const DATABASE_URL = process.env.DATABASE_URL
```

## Component Patterns

### Functional Components
```typescript
// Preferred pattern - functional components with TypeScript
export function ComponentName({ prop1, prop2 }: Props) {
  return <div>...</div>
}

// Client components marked explicitly
"use client"

// Server components are default (no marking needed)
```

### Props Typing
```typescript
// Interface for props
interface Props {
  children: ReactNode
  className?: string
  variant?: "default" | "outline"
}

// Inline typing for simple props
export function Component({ children }: { children: ReactNode }) {
  // ...
}
```

### Hooks Usage
```typescript
// Custom hooks with proper naming
export function useLanguage() {
  const context = useContext(LanguageContext)
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider")
  }
  return context
}

// State initialization with proper types
const [mounted, setMounted] = useState<boolean>(false)
const [language, setLanguageState] = useState<Language>("ko")
```

## File Organization

### Directory Structure
```
components/
├── ui/              # shadcn/ui primitives
├── [feature].tsx    # Feature-specific components
└── index.ts         # Re-exports (if needed)

app/
├── (group)/         # Route groups
├── layout.tsx       # Layouts
├── page.tsx         # Pages
└── loading.tsx      # Loading states
```

### Import Order
```typescript
// 1. React and Next.js
import type React from "react"
import { useEffect, useState } from "react"
import { useTheme } from "next-themes"

// 2. External libraries
import { Moon, Sun } from "lucide-react"
import bcrypt from 'bcryptjs'

// 3. Internal components and utilities
import { Button } from "@/components/ui/button"
import { useLanguage } from "@/contexts/language-context"
import { createServerSupabase } from '@/lib/supabase/server'
```

## Styling Conventions

### Tailwind CSS
```typescript
// Use cn() utility for conditional classes
import { cn } from "@/lib/utils"

className={cn(
  "base-classes",
  variant === "outline" && "outline-classes",
  className // Allow className override
)}
```

### CSS Variables
```css
/* Follow shadcn/ui color system */
:root {
  --background: 0 0% 100%;
  --foreground: 222.2 84% 4.9%;
  --primary: 222.2 47.4% 11.2%;
}
```

## State Management

### React Context Pattern
```typescript
// Context creation with default values
const LanguageContext = createContext<LanguageContextType>({
  language: "ko",
  setLanguage: () => {},
  t: (key) => key,
})

// Provider pattern
export function LanguageProvider({ children }: { children: ReactNode }) {
  // State and logic
  return <LanguageContext.Provider value={{...}}>{children}</LanguageContext.Provider>
}
```

### Server Actions
```typescript
// "use server" directive at top
"use server"

// Explicit error handling
export async function uploadDocument(formData: FormData) {
  try {
    // Implementation
    return { success: true, data }
  } catch (error) {
    console.error('Error:', error)
    return { error: 'Error message' }
  }
}
```

## Error Handling

### Try-Catch Pattern
```typescript
try {
  const result = await riskyOperation()
  return { success: true, data: result }
} catch (error) {
  console.error('Operation failed:', error)
  return { error: 'User-friendly error message' }
}
```

### Conditional Rendering
```typescript
// Early returns for loading/error states
if (!mounted) {
  return <LoadingComponent />
}

if (error) {
  return <ErrorComponent message={error} />
}

// Main component logic
return <MainComponent />
```

## Internationalization Patterns

### Translation Usage
```typescript
// Use translation function consistently
const { t } = useLanguage()

return (
  <h1>{t("home.hero.title")}</h1>
  <p>{t("home.hero.description")}</p>
)
```

### Translation Keys
```typescript
// Hierarchical key structure
"home.hero.title"
"login.form.email"
"error.validation.required"
```

## Environment and Configuration

### Environment Variables
```typescript
// Next.js public variables
process.env.NEXT_PUBLIC_SUPABASE_URL
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

// Server-side only variables
process.env.SUPABASE_SERVICE_ROLE_KEY
```

### Configuration Files
- **next.config.mjs**: ESM format, minimal config
- **tailwind.config.ts**: TypeScript config with shadcn/ui setup
- **tsconfig.json**: Strict TypeScript configuration
- **components.json**: shadcn/ui configuration

## Code Quality

### ESLint Configuration
- **Build-time**: ESLint runs on `npm run lint`
- **Build ignoring**: Errors ignored during builds (next.config.mjs)
- **TypeScript**: Build errors also ignored (rapid development mode)

### Comments and Documentation
```typescript
// Minimal comments, prefer self-documenting code
// JSDoc for complex functions
/**
 * Generate a random short URL for document sharing
 * @returns {string} Random alphanumeric string
 */
function generateShortUrl(): string {
  return Math.random().toString(36).substring(2, 15)
}
```

### Security Practices
- **UUID generation**: crypto.randomUUID() for file names
- **Password hashing**: bcryptjs for password protection
- **Environment variables**: Never commit secrets to repository
- **Input validation**: Server-side validation in actions