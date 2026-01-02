# Testing Setup

## Overview

This API service includes a complete testing setup with Jest and Supertest for integration testing.

## Test Configuration

### Server Setup

- **App Export**: Tests import `src/app.ts` (Express app without server startup)
- **Server Isolation**: `src/index.ts` only starts server when run directly
- **No Port Conflicts**: Tests don't start HTTP listener, preventing hanging

### Database Testing

- **Intelligent Mocking**: Prisma client is mocked in `tests/setup.ts` with realistic return values
- **No External Dependencies**: Tests run without requiring PostgreSQL
- **Fast Execution**: In-memory mocks for quick test runs
- **Realistic Responses**: Mocks return proper user objects for JWT generation and validation

## Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm test:watch

# Run specific test file
npm test auth.test.ts
```

## Test Structure

```
tests/
├── setup.ts          # Test configuration and mocks
├── auth.test.ts       # Authentication endpoint tests
└── README.md          # This documentation
```

## Database Testing Options

### Option 1: Mocked Prisma (Default)

- ✅ Fast execution
- ✅ No external dependencies
- ✅ Isolated tests
- ❌ Doesn't test actual database logic

### Option 2: SQLite In-Memory (Advanced)

For more realistic database testing:

1. **Update Prisma schema:**

   ```prisma
   datasource db {
     provider = "sqlite"
     url      = "file:./test.db"
   }
   ```

2. **Install SQLite support:**

   ```bash
   npm install --save-dev sqlite3
   ```

3. **Update test setup:**
   ```typescript
   // Remove Prisma mocking
   // Add real database setup/teardown
   ```

### Option 3: Test Database (Production-like)

For full integration testing:

1. **Setup test PostgreSQL database**
2. **Use separate DATABASE_URL for tests**
3. **Add database migrations in test setup**
4. **Clean database between tests**

## Example Test

```typescript
import request from 'supertest'
import app from '../src/app'

describe('API Endpoints', () => {
  it('should return health status', async () => {
    const response = await request(app).get('/health')

    expect(response.status).toBe(200)
    expect(response.body.status).toBe('OK')
  })
})
```

## Best Practices

1. **Import app, not index**: Always import from `src/app.ts` in tests
2. **Mock external dependencies**: Database, email services, etc.
3. **Clean state**: Reset mocks between tests
4. **Fast tests**: Avoid real network calls or database queries
5. **Descriptive names**: Clear test descriptions for better debugging
