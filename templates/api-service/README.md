# API Service Starter Template ![Coverage](https://img.shields.io/badge/Coverage-90%25+-brightgreen)

A production-ready REST API template built with Express.js, TypeScript, PostgreSQL, and JWT authentication.

**Complexity Level:** 2-3 | **Timeline:** 3-5 days | **Tech Stack:** Express + TypeScript + PostgreSQL + Prisma

> Need the one-page checklist? Use the commands below as your quick start.

## Features

- 🚀 **Express.js** with TypeScript for type safety
- 🔐 **JWT Authentication** with bcrypt password hashing
- 🗄️ **PostgreSQL** database with Prisma ORM
- ✅ **Input Validation** with Joi schema validation
- 🛡️ **Security** with Helmet, CORS, and rate limiting
- 📝 **Logging** with Morgan
- 🧪 **Testing** setup with Jest and Supertest
- 📚 **API Documentation** ready structure
- 🐳 **Docker** ready configuration

## Quick Start

1. **Install Dependencies**

   ```bash
   npm install
   ```

2. **Setup Quality Automation** (Recommended)

   ```bash
   # Add comprehensive quality automation
   npx create-qa-architect@latest
   npm install && npm run prepare

   # Critical for API security: linting, secret detection, input validation scanning
   npm run lint              # TypeScript + security rules
   npm run security:secrets  # Scan for hardcoded secrets
   npm run security:audit    # Dependency vulnerability check
   ```

3. **Environment Setup**
   Copy the sample environment file and update values as needed:

   ```bash
   cp .env.example .env
   ```

   ```env
   NODE_ENV=development
   PORT=3000
   DATABASE_URL="postgresql://user:password@localhost:5432/api_db"
   JWT_SECRET=your-super-secret-jwt-key
   CORS_ORIGIN=http://localhost:3000
   ```

4. **Database Setup**

   ```bash
   npx prisma generate
   npx prisma db push
   ```

5. **Run Development Server**

   ```bash
   npm run dev
   ```

6. **Test the API**

   ```bash
   curl http://localhost:3000/health
   ```

7. **Optional CI Setup**
   Copy `.github/workflows/ci.yml` to your repository root to enable GitHub Actions lint/test/build checks.

## Quality & Security

- Lint: `npm run lint`
- Type-check: `npm run type-check:all`
- Tests (coverage enforced ≥90%): `npm test` or `npm run test:all`
- Performance smoke: `npm run perf:smoke`
- Security: `npm run security:audit` and `npm run security:secrets`

## Project Structure

```
api-service/
├── src/
│   ├── controllers/         # Route handlers
│   │   └── authController.ts
│   ├── middleware/          # Custom middleware
│   │   ├── auth.ts
│   │   ├── errorHandler.ts
│   │   └── notFound.ts
│   ├── routes/              # API routes
│   │   ├── auth.ts
│   │   ├── users.ts
│   │   └── health.ts
│   ├── utils/               # Utility functions
│   │   └── validation.ts
│   └── index.ts             # App entry point
├── tests/                   # Test files
├── prisma/                  # Database schema
├── package.json
└── README.md
```

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile (protected)

### Health Check

- `GET /health` - API health status

### Example Requests

**Register User:**

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Login:**

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "securepassword123"
  }'
```

**Get Profile:**

```bash
curl -X GET http://localhost:3000/api/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Environment Variables

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/api_db"

# Authentication
JWT_SECRET=your-super-secret-jwt-key

# Security
CORS_ORIGIN=http://localhost:3000
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run tests
- `npm run lint` - Run ESLint

### Database Management

- `npx prisma studio` - Open database GUI
- `npx prisma generate` - Generate Prisma client
- `npx prisma db push` - Push schema changes
- `npx prisma migrate dev` - Create and apply migration

### Testing

```bash
# Run all tests (uses mocked database - no setup required)
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- auth.test.ts
```

**Test Setup:**

- Tests use **mocked Prisma client** (no database required)
- **Server isolation**: Tests import app without starting HTTP listener
- **Fast execution**: No external dependencies
- See `tests/README.md` for advanced database testing options

## Deployment

### Railway

1. Connect GitHub repository
2. Add environment variables
3. Deploy automatically

### Heroku

1. Create Heroku app
2. Add PostgreSQL addon
3. Set environment variables
4. Deploy from Git

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["npm", "start"]
```

## Security Features

- **Password Hashing:** bcrypt with salt rounds
- **JWT Tokens:** Secure token-based authentication
- **Rate Limiting:** 100 requests per 15 minutes per IP
- **CORS:** Configurable cross-origin requests
- **Helmet:** Security headers
- **Input Validation:** Joi schema validation
- **SQL Injection Protection:** Prisma ORM

## Extending the API

### Adding New Routes

1. Create controller in `src/controllers/`
2. Add route file in `src/routes/`
3. Register route in `src/index.ts`

### Adding Database Models

1. Update `prisma/schema.prisma`
2. Run `npx prisma db push`
3. Generate client with `npx prisma generate`

### Adding Middleware

1. Create middleware function in `src/middleware/`
2. Apply to routes as needed

## Troubleshooting

### Husky ".git can't be found" Warning

**Issue:** During `npm install`, you see `.git can't be found`

**Cause:** You copied the template files instead of cloning with git

**Fix:**
```bash
git init
git add .
git commit -m "Initial commit"
npm install  # Re-run to set up git hooks
```

**Impact:** None - this only affects git hooks setup. The API works fine without git hooks.

---

### npm Audit Vulnerabilities

**Issue:** `npm install` reports 27 vulnerabilities (6 low, 21 moderate)

**Status:** ✅ **Expected - mostly dev dependencies**

**Details:**
- Most vulnerabilities are in development tools (testing, linting)
- See `.security-waivers.json` for documented waivers
- Production dependencies are minimal and secure

**Action:**
1. Review `.security-waivers.json` for rationale
2. Run `npm audit --production` to see only production vulnerabilities
3. Update dependencies periodically

**Safe to ignore** for development environments

---

### Database Connection Errors

**Issue:** `Error: Can't reach database server at localhost:5432`

**Fixes:**

1. **Check DATABASE_URL in .env:**
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/api_db"
   ```

2. **Verify PostgreSQL is running:**
   ```bash
   # macOS (Homebrew)
   brew services list | grep postgresql
   brew services start postgresql

   # Linux
   sudo systemctl status postgresql
   sudo systemctl start postgresql

   # Check if listening on port
   lsof -i :5432
   ```

3. **Create database:**
   ```bash
   # Using psql
   createdb api_db

   # Or via SQL
   psql postgres
   CREATE DATABASE api_db;
   \q
   ```

4. **Test connection:**
   ```bash
   psql -U postgres -d api_db -c "SELECT 1;"
   ```

5. **Push Prisma schema:**
   ```bash
   npx prisma db push
   ```

---

### Prisma Client Errors

**Issue:** `Cannot find module '@prisma/client'` or `PrismaClient is not a constructor`

**Fixes:**

1. **Generate Prisma client:**
   ```bash
   npx prisma generate
   ```

2. **Reinstall if needed:**
   ```bash
   rm -rf node_modules
   npm install
   ```

3. **Check prisma schema:**
   - Ensure `prisma/schema.prisma` exists
   - Verify datasource and generator blocks are present

---

### JWT Authentication Errors

**Issue:** `JsonWebTokenError: invalid token` or `jwt must be provided`

**Common causes:**

1. **Missing JWT_SECRET:**
   ```env
   # Add to .env
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   ```

2. **Token not sent in Authorization header:**
   ```bash
   # Correct format
   curl -H "Authorization: Bearer YOUR_TOKEN" http://localhost:3000/api/auth/profile
   ```

3. **Token expired:**
   - Tokens expire after 24 hours by default
   - Login again to get new token

4. **Wrong token format:**
   - Must be `Bearer <token>`, not just `<token>`

---

### Port Already in Use

**Issue:** `Error: listen EADDRINUSE: address already in use :::3000`

**Fixes:**

1. **Find and kill process:**
   ```bash
   # macOS/Linux
   lsof -ti:3000 | xargs kill -9

   # Windows
   netstat -ano | findstr :3000
   taskkill /PID <PID> /F
   ```

2. **Use different port:**
   ```env
   # .env
   PORT=3001
   ```

---

### CORS Errors

**Issue:** Browser shows `Access-Control-Allow-Origin` errors

**Fixes:**

1. **Set CORS_ORIGIN in .env:**
   ```env
   CORS_ORIGIN=http://localhost:3000
   ```

2. **For multiple origins:**
   ```typescript
   // src/index.ts
   app.use(cors({
     origin: ['http://localhost:3000', 'http://localhost:3001'],
     credentials: true
   }));
   ```

3. **Allow all origins (development only!):**
   ```env
   CORS_ORIGIN=*
   ```

---

### TypeScript Build Errors

**Issue:** `tsc` compilation fails

**Common fixes:**

1. **Clear build directory:**
   ```bash
   rm -rf dist
   npm run build
   ```

2. **Check tsconfig.json:**
   - Ensure `outDir` is set to `"dist"`
   - Verify `include` covers all source files

3. **Fix import paths:**
   - Use `.js` extensions in imports (not `.ts`)
   - Or configure module resolution properly

---

### Tests Failing

**Issue:** `npm test` shows failures

**Common causes:**

1. **Database connection in tests:**
   - Tests use **mocked Prisma client** (no real database needed)
   - Check `tests/__mocks__/@prisma/client.ts` exists

2. **Environment variables:**
   - Tests load from `.env.test` if present
   - Or fall back to `.env`

3. **Port conflicts:**
   - Tests should import `app` not start server
   - See existing tests for pattern

---

### Request Validation Errors

**Issue:** Getting 400 errors with "validation error"

**Check:**

1. **Request body format:**
   ```bash
   # Must be valid JSON
   curl -X POST http://localhost:3000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{"name":"John","email":"john@example.com","password":"password123"}'
   ```

2. **Required fields:**
   - name: string (required)
   - email: valid email format (required)
   - password: minimum 6 characters (required)

3. **Content-Type header:**
   - Must be `application/json`

---

### Password Hashing Errors

**Issue:** `bcrypt` errors during registration/login

**Fixes:**

1. **Rebuild bcrypt:**
   ```bash
   npm rebuild bcrypt
   ```

2. **If rebuild fails, reinstall:**
   ```bash
   npm uninstall bcrypt
   npm install bcrypt
   ```

3. **Platform-specific issues:**
   - May need Python and build tools
   - See bcrypt documentation for your OS

---

### Deployment Issues

**Issue:** API works locally but fails in production

**Checklist:**

1. **Environment variables set:**
   - DATABASE_URL
   - JWT_SECRET
   - NODE_ENV=production
   - PORT (if required by platform)

2. **Database accessible:**
   - Production database reachable from deployment
   - Firewall/security groups allow connections
   - SSL mode if required

3. **Build command:**
   ```bash
   npm run build && npm start
   ```

4. **Database migrations:**
   ```bash
   npx prisma migrate deploy
   ```

---

### Rate Limiting Triggered

**Issue:** Getting 429 "Too Many Requests" errors

**Cause:** Rate limiting (100 requests per 15 minutes per IP)

**Fixes:**

1. **Wait 15 minutes for limit to reset**

2. **Adjust rate limits for development:**
   ```typescript
   // src/index.ts
   const limiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 1000, // Increase for development
   });
   ```

3. **Disable in development:**
   ```typescript
   if (process.env.NODE_ENV !== 'development') {
     app.use(limiter);
   }
   ```

---

### Docker Issues

**Issue:** Docker build or run failures

**Common fixes:**

1. **Build from dist directory:**
   ```bash
   # Build first
   npm run build

   # Then Docker build
   docker build -t api-service .
   ```

2. **Environment variables:**
   ```bash
   docker run -e DATABASE_URL="..." -e JWT_SECRET="..." api-service
   ```

3. **Database connection from container:**
   - Use host's IP, not `localhost`
   - Or use Docker networks

---

### Logging Issues

**Issue:** Logs not showing or incorrect format

**Fixes:**

1. **Check NODE_ENV:**
   ```env
   # Development - detailed logs
   NODE_ENV=development

   # Production - minimal logs
   NODE_ENV=production
   ```

2. **Morgan middleware:**
   - Logs to console by default
   - Check middleware is not removed

3. **Custom logging:**
   - Add `console.log` for debugging
   - Use logging library (winston, pino) for production

---

### Still Having Issues?

1. **Check Express documentation:** https://expressjs.com
2. **Prisma troubleshooting:** https://www.prisma.io/docs/guides/troubleshooting
3. **JWT debugging:** https://jwt.io
4. **Review validation results:** See `claudedocs/fresh-clone-validation-results.md`

**Need more help?** Open an issue with:
- Node version (`node --version`)
- npm version (`npm --version`)
- Database type and version
- Operating system
- Full error message/stack trace
- Steps to reproduce

## Docker Deployment

The API service includes complete Docker support for both development and production environments.

### Production Deployment

```bash
# Build and run with PostgreSQL
docker-compose up -d

# Check service health
curl http://localhost:3000/health
curl http://localhost:3000/health/ready
```

### Development Environment

```bash
# Run development server with hot reloading
docker-compose --profile dev up api-dev

# Or build production image locally
docker build -t api-service .
docker run -p 3000:3000 api-service
```

### Configuration

Environment variables for Docker deployment:

```bash
DATABASE_URL=postgresql://api_user:api_password@db:5432/api_service
JWT_SECRET=your-super-secret-jwt-key-change-in-production
NODE_ENV=production
CORS_ORIGIN=http://localhost:3000
```

### Health Checks

The Docker setup includes health checks for both the API service and PostgreSQL:
- **API Health**: `GET /health` (liveness probe)
- **API Ready**: `GET /health/ready` (readiness probe with DB check)
- **Database**: PostgreSQL `pg_isready` check

## License

MIT License - free to use for personal and commercial projects.
