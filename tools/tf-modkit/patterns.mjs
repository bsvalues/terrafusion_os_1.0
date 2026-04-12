/**
 * tf-modkit — Detection Patterns
 * ================================
 * Known-bad patterns from Replit webapp clones that need conversion
 * to TerraFusion OS native modules.
 */

/** Files that are ALWAYS dead in an OS module context */
export const REPLIT_ARTIFACTS = [
  '.replit',
  'replit.nix',
  'generated-icon.png',
  'theme.json',
  'drizzle.config.ts',
  'drizzle.config.js',
  '.migration-manifest.json',
  'cookies.txt',
];

/** Standalone-project artifacts that shouldn't exist inside a monorepo package */
export const STANDALONE_ARTIFACTS = [
  '.github',
  '.cursor',
  '.gitignore',          // monorepo root owns this
  'pnpm-lock.yaml',     // monorepo root owns this
  'package-lock.json',  // npm artifact — monorepo uses pnpm
  'yarn.lock',
];

/** Files indicating dead Electron wrappers (OS shell provides this) */
export const ELECTRON_ARTIFACTS = [
  'electron.js',
  'preload.js',
  'electron-builder.json',
  'electron-builder.yml',
];

/** Windows/Python launcher scripts (dead in OS context) */
export const LAUNCHER_ARTIFACTS = [
  /^START_.*\.bat$/i,
  /^launch_.*\.py$/i,
  /^start-.*\.bat$/i,
  /\.code-workspace$/,
];

/** Express/Node server indicators */
export const EXPRESS_INDICATORS = {
  deps: [
    'express', 'express-session', 'express-rate-limit', 'express-validator',
    'passport', 'passport-local', 'connect-pg-simple', 'memorystore',
    'cors', 'multer', 'ws', 'compression', 'helmet',
  ],
  files: ['server/index.ts', 'server/index.js', 'server/core-index.ts'],
};

/** Flask/Python backend indicators */
export const FLASK_INDICATORS = {
  files: ['app.py', 'backend/app.py', 'requirements.txt', 'backend/requirements.txt'],
  deps: ['flask', 'flask-cors', 'flask-sqlalchemy'],
};

/** Next.js indicators */
export const NEXTJS_INDICATORS = {
  files: ['next.config.mjs', 'next.config.js', 'next.config.ts', 'app/layout.tsx', 'app/page.tsx'],
  deps: ['next'],
};

/** Dead database drivers (OS uses .NET EF Core) */
export const DEAD_DB_DEPS = [
  'drizzle-orm', 'drizzle-zod', 'drizzle-kit',
  '@neondatabase/serverless', 'pg', 'postgres', 'better-sqlite3',
  '@supabase/supabase-js', '@supabase/ssr', 'mssql',
  'connect-pg-simple',
];

/** Dead auth deps (OS provides auth via OsContext postMessage) */
export const DEAD_AUTH_DEPS = [
  'passport', 'passport-local', 'express-session', 'memorystore',
  'bcryptjs', 'bcrypt', 'jsonwebtoken',
  '@replit/vite-plugin-replit-auth',
];

/** Replit-specific deps */
export const REPLIT_DEPS = [
  '@replit/vite-plugin-shadcn-theme-json',
  '@replit/vite-plugin-replit-auth',
  '@replit/vite-plugin-runtime-error-modal',
  '@replit/agent',
];

/** Dead server-side deps that have no client purpose */
export const DEAD_SERVER_DEPS = [
  'basic-ftp', 'autocannon', 'tsx', 'esbuild',
  'cross-env', // only needed for server scripts
];

/** Secrets patterns to detect in files */
export const SECRET_PATTERNS = [
  { name: 'Supabase Key', regex: /eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/  },
  { name: 'OpenAI Key', regex: /sk-[A-Za-z0-9]{20,}/ },
  { name: 'Anthropic Key', regex: /sk-ant-[A-Za-z0-9]{20,}/ },
  { name: 'Generic Secret', regex: /SECRET[_=]\s*["']?[A-Za-z0-9+/=]{16,}/i },
  { name: 'Database URL', regex: /postgres(ql)?:\/\/[^"'\s]+/i },
];

/** Auth files that should be deleted (OsContext.tsx is the only keeper) */
export const DEAD_AUTH_FILES = [
  /auth-context\.tsx$/,
  /AuthContext\.tsx$/,
  /enhanced-auth-provider\.tsx$/,
  /SupabaseAuthContext\.tsx$/,
  /use-auth\.(ts|tsx)$/,
  /useAuth\.(ts|tsx)$/,
  /use-auto-?login.*\.(ts|tsx)$/,
  /devAuth\.(ts|tsx)$/,
  /localStorageAuth\.(ts|tsx)$/,
  /protected-route\.tsx$/,
  /county-network-auth\.tsx$/,
  /auth-error-boundary\.tsx$/,
  /auth-page\.tsx$/,
  /login-page\.tsx$/,
  /register-page\.tsx$/,
  /AutoLogin\.tsx$/,
  /replitAuth.*\.(ts|tsx)$/,
];

/** Dead reference patterns to grep for post-conversion */
export const DEAD_REFERENCE_PATTERNS = [
  'bcbs',
  'replit',
  'supabase',
  '@shared/schema',
  'passport',
  'express-session',
  'drizzle',
  'useAuth',
  'AuthProvider',
  'ProtectedRoute',
];
