# Testing Strategy

This document outlines the testing approach used across all Project Starter Guide templates.

## Testing Philosophy

We follow a **risk-based testing strategy** that focuses on:

1. **Critical paths** - Core business logic and user journeys
2. **Integration points** - API calls, database operations, auth flows
3. **Edge cases** - Error handling, boundary conditions
4. **Security** - Input validation, authentication, authorization

## Test Types

### Unit Tests

- **Purpose**: Verify individual functions and components work correctly
- **Tools**: Jest, Vitest
- **Coverage Target**: 80%+ for critical code paths
- **Example**: Testing utility functions, component rendering

### Integration Tests

- **Purpose**: Verify multiple components work together correctly
- **Tools**: Jest, Supertest (for APIs)
- **Focus**: API endpoints, database operations, auth flows
- **Example**: Login flow → session creation → authenticated requests

### End-to-End Tests

- **Purpose**: Test complete user workflows
- **Tools**: Playwright, Cypress
- **Scope**: Critical user journeys only
- **Example**: Sign up → verify email → log in → use feature

## Template-Specific Testing

### about-me-page

- Basic HTML/CSS validation
- Link validation
- Mobile responsiveness checks

### saas-level-1

- Unit tests for utility functions
- Integration tests for API routes
- Auth flow testing (NextAuth)
- Database operation tests
- E2E tests for critical user journeys

### api-service

- Unit tests for business logic
- Integration tests for API endpoints
- Error handling tests
- Request validation tests

### mobile-app

- Component unit tests
- Navigation flow tests
- API integration tests
- Platform-specific testing (iOS/Android)

## Running Tests

### Standard Commands

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- path/to/test.spec.ts
```

### Pre-commit Testing

Git hooks (via Husky) automatically run tests before commits. This ensures:

- Code quality standards are met
- No broken tests are committed
- Coverage thresholds are maintained

## Continuous Integration

GitHub Actions automatically:

1. Run all tests on PR creation
2. Check code coverage
3. Validate build success
4. Run security scans

## Best Practices

1. **Write tests as you code** - Don't leave testing for the end
2. **Test behavior, not implementation** - Focus on what, not how
3. **Keep tests isolated** - Each test should be independent
4. **Use meaningful descriptions** - Test names should explain what they test
5. **Avoid flaky tests** - Use proper waits and avoid timing dependencies
6. **Mock external services** - Don't rely on external APIs in tests

## Coverage Goals

| Category   | Target |
| ---------- | ------ |
| Statements | 80%+   |
| Branches   | 75%+   |
| Functions  | 80%+   |
| Lines      | 80%+   |

## Troubleshooting

### Tests timing out

- Check for missing async/await
- Increase timeout for slow operations: `jest.setTimeout(10000)`

### Flaky tests

- Remove time-based assertions
- Use proper test utilities (waitFor, screen queries)
- Mock API responses

### Coverage not increasing

- Focus on critical paths first
- Don't aim for 100% - focus on meaningful coverage
- Consider integration tests instead of excessive unit tests

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Vitest Guide](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Docs](https://playwright.dev/)
