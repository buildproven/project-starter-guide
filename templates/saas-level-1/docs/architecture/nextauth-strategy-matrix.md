# NextAuth Strategy Matrix

Complete reference for understanding how NextAuth selects adapters, strategies, and session sources based on provider configuration.

## Strategy Selection Matrix

| Scenario                | Providers         | Adapter | Strategy   | Session Source  | Use Case                        |
| ----------------------- | ----------------- | ------- | ---------- | --------------- | ------------------------------- |
| **OAuth Configured**    | GitHub/Google     | Prisma  | `database` | Prisma user     | Production with real auth       |
| **OAuth + Mock**        | GitHub + Dev Mock | Prisma  | `database` | Prisma user     | Local dev with real OAuth       |
| **Mock Only (Dev)**     | Mock/Credentials  | none    | `jwt`      | Token           | Development without OAuth setup |
| **No Providers (Prod)** | -                 | -       | -          | **FATAL ERROR** | Fail fast on startup            |
| **Email Provider**      | Email             | Prisma  | `database` | Prisma user     | Passwordless authentication     |

## Provider Detection Logic

```typescript
const hasOAuthProviders = providers.some(
  p => p.id === 'github' || p.id === 'google' || p.id === 'email'
)

// Adapter selection
adapter: hasOAuthProviders ? PrismaAdapter(getPrisma()) : undefined

// Strategy selection
strategy: hasOAuthProviders ? 'database' : 'jwt'
```

**Key Rule**: Presence of ANY OAuth/email provider triggers database strategy, even if credentials providers are also present.

## Session Callback Behavior

### Database Strategy (OAuth Providers)

```typescript
async session({ session, token, user }) {
  // user comes from Prisma adapter (already populated)
  // Preserve existing session.user.id from database
  if (!session.user.id) {
    session.user.id = user?.id || token?.sub || ''
  }
  return session
}
```

**Critical**: Never overwrite `session.user.id` unconditionally when using database strategy. Prisma pre-populates this field.

### JWT Strategy (Credentials Only)

```typescript
async session({ session, token, user }) {
  // user is undefined, token contains all data
  // session.user.id not pre-populated
  if (!session.user.id) {
    session.user.id = token?.sub || ''
  }
  return session
}
```

## Production Validation

### Required Environment Variables

**Minimum for Production**:

- `NEXTAUTH_SECRET` - **REQUIRED** (prevents per-instance secrets)
- At least one auth provider:
  - `GITHUB_ID` + `GITHUB_SECRET`, or
  - `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET`, or
  - Email provider configuration

### Fail-Fast Checks

1. **No Providers Check** (Line ~77):

```typescript
if (providers.length === 0 && process.env.NODE_ENV === 'production') {
  throw new Error('[auth] FATAL: No authentication providers configured')
}
```

2. **Missing Secret Check** (Line ~110):

```typescript
if (process.env.NODE_ENV === 'production' && !process.env.NEXTAUTH_SECRET) {
  throw new Error('[auth] FATAL: NEXTAUTH_SECRET is required in production')
}
```

## Database Requirements

| Strategy   | DATABASE_URL Required | Prisma Migrations Required |
| ---------- | --------------------- | -------------------------- |
| `database` | ✅ Yes                | ✅ Yes                     |
| `jwt`      | ❌ No                 | ❌ No                      |

**Dev Tip**: Use JWT strategy (credentials only) for quick local testing without database setup.

## Common Pitfalls

### ❌ Wrong: Overwriting Session User ID

```typescript
session.user.id = user?.id || token?.sub || ''
// Problem: Overwrites Prisma-populated id with '' on subsequent requests
```

### ✅ Right: Preserving Session User ID

```typescript
if (!session.user.id) {
  session.user.id = user?.id || token?.sub || ''
}
// Solution: Only set if not already populated by Prisma
```

### ❌ Wrong: Always Adding Dev Credentials

```typescript
if (process.env.NODE_ENV === 'development') {
  providers.push(CredentialsProvider({...}))
}
// Problem: Dev credentials trigger JWT mode even with OAuth configured
```

### ✅ Right: Only Add Mock When No Providers

```typescript
if (providers.length === 0) {
  providers.push(CredentialsProvider({...}))
}
// Solution: Mock only as fallback, not alongside OAuth
```

## Testing Scenarios

### Scenario 1: OAuth Login with Database

```bash
# Environment
export GITHUB_ID="real-client-id"
export GITHUB_SECRET="real-client-secret"
export DATABASE_URL="postgresql://..."
export NEXTAUTH_SECRET="production-secret"
export NODE_ENV="production"

# Expected
# - Strategy: database
# - Adapter: Prisma
# - Session: User from database
# - session.user.id: Persistent across requests
```

### Scenario 2: Local Development without OAuth

```bash
# Environment
export NEXTAUTH_SECRET="dev-secret"
export NEXTAUTH_URL="http://localhost:3000"
export NODE_ENV="development"

# Expected
# - Strategy: jwt
# - Adapter: none
# - Session: User from token
# - Mock provider available
```

### Scenario 3: Production Misconfiguration

```bash
# Environment
export NODE_ENV="production"
# No providers, no secret

# Expected
# - Application fails to start
# - Clear error message
# - No mock provider offered
```

## Session Persistence

### Database Strategy Flow

1. User logs in with OAuth
2. NextAuth creates user + account rows in Prisma
3. Session stored in database with userId reference
4. On subsequent requests:
   - Session loaded from database
   - `session.user` already has `id` from Prisma
   - Session callback **preserves** existing id

### JWT Strategy Flow

1. User logs in with credentials
2. JWT token created with user data
3. No database write
4. On subsequent requests:
   - Token decoded
   - `session.user` does **not** have id
   - Session callback **sets** id from `token.sub`

## Connection Management

### With Database Strategy

```typescript
// lib/prisma.ts - Singleton pattern
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({...})

// Prevents connection pool exhaustion
```

### With JWT Strategy

```typescript
// No Prisma client needed
// No database connections
// Pure token-based auth
```

## Debugging Checklist

If auth is not working:

1. **Check provider detection**:

   ```typescript
   console.log('hasOAuthProviders:', hasOAuthProviders)
   console.log('strategy:', authOptions.session.strategy)
   ```

2. **Verify session.user.id**:

   ```typescript
   // In session callback
   console.log('session.user.id before:', session.user?.id)
   console.log('user.id:', user?.id)
   console.log('token.sub:', token?.sub)
   ```

3. **Check environment**:

   ```bash
   echo "NODE_ENV: $NODE_ENV"
   echo "NEXTAUTH_SECRET: ${NEXTAUTH_SECRET:0:10}..."
   echo "GITHUB_ID: ${GITHUB_ID:+set}"
   echo "DATABASE_URL: ${DATABASE_URL:+set}"
   ```

4. **Validate production checks**:
   ```bash
   # Should fail in production without providers
   NODE_ENV=production node -e "require('./src/app/api/auth/[...nextauth]/route')"
   ```

## References

- [NextAuth.js Adapters](https://next-auth.js.org/adapters/overview)
- [Session Strategies](https://next-auth.js.org/configuration/options#session)
- [Prisma Adapter](https://next-auth.js.org/adapters/prisma)
- [Session Callbacks](https://next-auth.js.org/configuration/callbacks#session-callback)
