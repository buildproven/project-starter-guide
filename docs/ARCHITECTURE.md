# Architecture

This document describes the architecture and organization of the Project Starter Guide.

## Project Structure

```
project-starter-guide/
├── docs/                          # Documentation
│   ├── ARCHITECTURE.md            # Architecture overview
│   ├── TESTING.md                 # Testing strategy
│   └── DEPLOYMENT.md              # Deployment guidance
├── templates/                      # Starter templates
│   ├── about-me-page/             # Static portfolio template
│   ├── saas-level-1/              # Full-stack SaaS starter
│   ├── api-service/               # REST API template
│   └── mobile-app/                # React Native mobile app
├── scripts/                        # Build and automation scripts
├── CHANGELOG.md                    # Version history
├── CONTRIBUTING.md                # Contribution guidelines
└── README.md                       # Main documentation
```

## Core Concepts

### Complexity Levels

The project uses a 5-tier complexity model to help developers choose appropriate technology stacks:

- **Level 1**: Static & Simple (Landing pages, portfolios)
- **Level 2**: Dynamic Frontend (Interactive web apps)
- **Level 3**: Full-Stack Applications (SaaS, dashboards)
- **Level 4**: Scalable Systems (High-traffic, microservices)
- **Level 5**: Enterprise Grade (Mission-critical systems)

### Templates

Templates are production-ready starters that demonstrate best practices for each complexity level:

- **about-me-page**: Level 1 - Simple HTML/CSS/JS portfolio
- **saas-level-1**: Level 3 - Next.js + Supabase + Stripe
- **api-service**: Level 3 - Node.js REST API with testing
- **mobile-app**: Level 2/3 - React Native Expo app

## Quality Automation

All templates include integrated quality automation:

- **ESLint** - Code quality and security rules
- **Prettier** - Consistent code formatting
- **Husky** - Pre-commit hooks
- **GitHub Actions** - CI/CD pipeline
- **Testing** - Jest/Vitest integration

See [TESTING.md](./TESTING.md) for detailed testing strategy.

## Documentation Strategy

Documentation is organized into:

1. **User-facing** - README, guides, quick start
2. **Technical** - Architecture, API documentation
3. **Operational** - Deployment, monitoring, releases

## Contributing

See [CONTRIBUTING.md](../CONTRIBUTING.md) for guidelines on adding new templates or improving documentation.
