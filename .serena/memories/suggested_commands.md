# SeukSeuk Development Commands

## Essential Development Commands

### Core Development
```bash
# Start development server (localhost:3000)
npm run dev

# Build for production
npm run build

# Start production server
npm run start

# Run ESLint (code quality checking)
npm run lint
```

### Package Management
```bash
# Install dependencies (uses package-lock.json)
npm install

# Install specific package
npm install [package-name]

# Install dev dependency
npm install --save-dev [package-name]
```

### Environment Setup
Required environment variables (see CLAUDE.md):
```bash
# Create .env.local file with:
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your_supabase_public_key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## System Commands (macOS/Darwin)

### File Operations
```bash
# List files/directories
ls -la

# Find files by pattern
find . -name "*.tsx" -type f

# Search file contents
grep -r "searchterm" ./src

# Change directory
cd [directory]

# Copy files
cp source destination

# Move/rename files
mv source destination

# Remove files/directories
rm -rf [path]
```

### Git Commands
```bash
# Check status
git status

# Add changes
git add .
git add [specific-file]

# Commit changes
git commit -m "commit message"

# Push changes
git push origin [branch-name]

# Pull changes
git pull origin [branch-name]

# Create new branch
git checkout -b [new-branch-name]

# Switch branches
git checkout [branch-name]

# View commit history
git log --oneline
```

### Process Management
```bash
# Kill process by port (if dev server stuck)
lsof -ti:3000 | xargs kill -9

# Check running processes
ps aux | grep node

# Monitor system resources
top
htop  # if installed
```

## Project-Specific Commands

### Supabase (if using local development)
```bash
# Note: Project uses hosted Supabase, but for local development:
npx supabase start
npx supabase stop
npx supabase status
```

### shadcn/ui Component Management
```bash
# Add new UI component
npx shadcn-ui@latest add [component-name]

# Example: Add button component
npx shadcn-ui@latest add button

# List available components
npx shadcn-ui@latest add
```

### TypeScript
```bash
# Type checking (build includes this)
npx tsc --noEmit

# Watch mode type checking
npx tsc --noEmit --watch
```

## Testing Commands
**Note**: No testing framework currently configured
To add testing:
```bash
# For Jest + React Testing Library
npm install --save-dev jest @testing-library/react @testing-library/jest-dom

# For Vitest (faster alternative)
npm install --save-dev vitest @testing-library/react jsdom
```

## Deployment Commands

### Vercel Deployment
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# Deploy to production
vercel --prod
```

### Manual Build Verification
```bash
# Test production build locally
npm run build && npm run start
```

## Debugging Commands

### Next.js Debugging
```bash
# Run with debug info
DEBUG=* npm run dev

# Clear Next.js cache
rm -rf .next

# Analyze bundle size
npm run build && npx @next/bundle-analyzer
```

### Package Management Issues
```bash
# Clear npm cache
npm cache clean --force

# Remove node_modules and reinstall
rm -rf node_modules package-lock.json && npm install

# Check for outdated packages
npm outdated

# Update packages
npm update
```

## Performance Monitoring
```bash
# Check bundle size
npm run build
# Look for bundle analysis in output

# Profile build
npm run build -- --profile

# Memory usage
node --max-old-space-size=4096 ./node_modules/.bin/next build
```