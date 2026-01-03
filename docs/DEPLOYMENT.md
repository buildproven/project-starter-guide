# Deployment

This document covers deployment strategies and procedures for Project Starter Guide templates.

## Deployment Platforms

### Level 1-2 Projects (Static & Dynamic Frontend)

**Recommended Platforms:**

- [Vercel](https://vercel.com) - Git-connected, edge functions, analytics
- [Netlify](https://netlify.com) - Static hosting, forms, serverless functions
- [GitHub Pages](https://pages.github.com) - Free static hosting

**Setup:**

1. Push code to GitHub
2. Connect repository on platform
3. Configure build settings (if needed)
4. Deploy automatically on push to main branch

### Level 3 Projects (Full-Stack Applications)

**Recommended Platforms:**

- [Vercel](https://vercel.com) - Next.js native, database integrations
- [Railway.app](https://railway.app) - Simple full-stack deployment
- [Render](https://render.com) - Backend + database hosting

**Architecture:**

- Frontend: Deployed to CDN/edge network
- API: Serverless functions or containerized backend
- Database: Managed database service (Supabase, PlanetScale, MongoDB Atlas)

### Level 4-5 Projects (Enterprise Grade)

**Recommended Platforms:**

- [AWS](https://aws.amazon.com) - Comprehensive cloud services
- [Google Cloud](https://cloud.google.com) - Data and ML capabilities
- [Azure](https://azure.microsoft.com) - Enterprise integrations

**Architecture:**

- Containerized services (Docker)
- Orchestration (Kubernetes)
- Load balancing and auto-scaling
- Multi-region deployment for redundancy

## Pre-Deployment Checklist

Before deploying to production:

### Code Quality

- [ ] All tests pass locally
- [ ] ESLint checks pass
- [ ] No console warnings or errors
- [ ] No hardcoded secrets in code

### Configuration

- [ ] Environment variables configured
- [ ] Database migrations run
- [ ] API keys and credentials set up
- [ ] CDN/caching configured (if applicable)

### Security

- [ ] HTTPS enabled
- [ ] CORS configured correctly
- [ ] Authentication/authorization working
- [ ] Sensitive data encrypted
- [ ] Security headers set

### Performance

- [ ] Bundle size within targets
- [ ] API response times acceptable
- [ ] Database queries optimized
- [ ] Images optimized and lazy-loaded

### Monitoring

- [ ] Error tracking (Sentry, LogRocket)
- [ ] Analytics configured
- [ ] Uptime monitoring enabled
- [ ] Logs aggregation set up

## Deployment Workflows

### Vercel Deployment (Next.js)

```bash
# 1. Install Vercel CLI
npm install -g vercel

# 2. Deploy (first time)
vercel

# 3. Set environment variables
vercel env add DATABASE_URL
vercel env add API_KEY

# 4. Redeploy with new env vars
vercel redeploy
```

### Railway Deployment (Full-Stack)

```bash
# 1. Install Railway CLI
npm install -g @railway/cli

# 2. Login
railway login

# 3. Link project
railway link

# 4. Deploy
railway up
```

### Manual Docker Deployment

```bash
# 1. Build Docker image
docker build -t myapp:latest .

# 2. Tag for registry
docker tag myapp:latest registry.example.com/myapp:latest

# 3. Push to registry
docker push registry.example.com/myapp:latest

# 4. Deploy (using kubectl, docker-compose, etc.)
```

## Environment Variables

### Development

```bash
# .env.local (git-ignored)
DATABASE_URL=postgresql://localhost/myapp_dev
API_KEY=dev-key-12345
NODE_ENV=development
```

### Production

```bash
# Set in platform dashboard or deployment config
# Never commit to git
DATABASE_URL=postgresql://prod-db.example.com/myapp
API_KEY=prod-key-xxxxx
NODE_ENV=production
```

## Database Migrations

### Running Migrations

```bash
# Before deploying new code with schema changes
npm run migrate:latest

# Verify migration
npm run migrate:status
```

### Rollback

```bash
# If migration fails
npm run migrate:rollback
```

## Zero-Downtime Deployments

### Blue-Green Deployment

1. Deploy new version to separate environment (green)
2. Test thoroughly
3. Switch traffic to new version
4. Keep old version (blue) as rollback

### Canary Deployment

1. Deploy to small percentage of traffic (5-10%)
2. Monitor metrics and errors
3. Gradually increase percentage
4. Roll back if issues detected

## Monitoring & Observability

### Essential Metrics

- **Error rate** - Percentage of failed requests
- **Response time** - API latency and page load time
- **Uptime** - Availability percentage
- **CPU/Memory** - Server resource utilization

### Tools

- [Sentry](https://sentry.io) - Error tracking
- [LogRocket](https://logrocket.com) - Session replay
- [Datadog](https://datadoghq.com) - Infrastructure monitoring
- [New Relic](https://newrelic.com) - APM and observability

## Rollback Procedure

If deployment causes issues:

```bash
# Revert to previous version
vercel rollback

# Or manually:
git revert <commit-hash>
git push origin main
```

## Performance Optimization

### Frontend

- Enable gzip compression
- Minify and bundle code
- Optimize images (WebP, lazy loading)
- Use CDN for static assets
- Implement caching headers

### Backend

- Database query optimization
- Implement caching (Redis)
- Rate limiting
- Connection pooling
- API response pagination

## Disaster Recovery

### Regular Backups

- Database: Daily encrypted backups
- Code: Version controlled in Git
- Configuration: Stored securely

### Recovery Testing

- Test backup restoration quarterly
- Document recovery procedures
- Keep runbooks updated

## Common Issues

### Deployment Fails

1. Check build logs
2. Verify environment variables
3. Check dependency compatibility
4. Review recent code changes

### Slow Performance

1. Check server resources
2. Review application logs
3. Analyze database queries
4. Check external API latency

### High Error Rate

1. Check error logs
2. Review recent deployments
3. Check database connectivity
4. Verify API dependencies

## Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Netlify Docs](https://docs.netlify.com)
- [Railway Documentation](https://docs.railway.app)
- [Docker Best Practices](https://docs.docker.com/develop/dev-best-practices/)
- [Kubernetes Docs](https://kubernetes.io/docs/)
