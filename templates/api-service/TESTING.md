# Testing Documentation

## Integration Testing Approach

### Current Implementation (Template)

The template uses **safe temporary schema files** for SQLite testing due to Prisma's provider validation constraints.

**Technical Constraint**: Prisma validates that DATABASE_URL protocol matches the schema provider. Using `provider = "postgresql"` with `DATABASE_URL = "file:..."` fails with error P1012.

**Safety-First Approach**:

- ✅ **No tracked file modification**: Creates temp schema outside tracked files
- ✅ **Parallel execution protection**: Lock mechanism prevents race conditions
- ✅ **Comprehensive cleanup**: All temp files removed automatically
- ✅ **CI repository-wide checking**: Guards against any test artifacts

### Production Recommendation

For production applications, use **PostgreSQL for tests** with Docker containers:

```yaml
# docker-compose.test.yml
version: '3.8'
services:
  test-db:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: test_db
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - '5433:5432'
```

**Benefits**:

- ✅ No schema modification required
- ✅ Database parity between prod and test
- ✅ No provider/URL mismatch
- ✅ Full PostgreSQL feature compatibility

### Template Implementation Details

**Current approach** (for template demonstration):

1. **Temp Schema**: Creates `.tmp-schema.test.prisma` (gitignored, never tracked)
2. **Parallel Safety**: Lock file prevents concurrent test runs
3. **Clean Architecture**: Uses `--schema` flag to isolate operations
4. **Comprehensive Cleanup**: All temp files removed in teardown
5. **Repository Protection**: CI checks entire repo for artifacts

**Safety measures**:

- Temp files in gitignored locations (never risk tracked files)
- Parallel execution lock prevents race conditions
- Repository-wide CI dirty-tree detection
- Error handling cleans up all temp files
- Clear production upgrade path documented

### Running Tests

```bash
# Integration tests (current template)
npm run test:integration

# Verify no artifacts left behind
npm run test:git-clean
```

### Migrating to PostgreSQL Testing

To upgrade from template to production testing:

1. **Start PostgreSQL container**:

   ```bash
   docker-compose -f docker-compose.test.yml up -d
   ```

2. **Update globalSetup.ts**:

   ```typescript
   process.env.DATABASE_URL = 'postgresql://test:test@localhost:5433/test_db'
   ```

3. **Remove schema modification logic**:

   ```bash
   # No more schema.replace() calls needed
   npx prisma db push --force-reset  # Works directly with PostgreSQL
   ```

4. **Verify CI pipeline**:
   ```bash
   npm run test:integration  # Should pass without schema changes
   ```

This approach eliminates all provider/URL mismatches and schema modification requirements.
