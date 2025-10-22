# Contributing to DPD Poland SDK

Thank you for your interest in contributing to the DPD Poland SDK! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and professional
- Focus on constructive feedback
- Help create a welcoming environment for all contributors

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm, yarn, or pnpm

### Setup

```bash
# Clone the repository
git clone https://github.com/ematu/dpd-sdk.git
cd dpd-sdk

# Install dependencies
npm install

# Run validation
npm run validate
```

## Development Workflow

### 1. Create a Branch

```bash
git checkout -b feature/your-feature-name
# or
git checkout -b fix/issue-number-description
```

### 2. Make Changes

Follow the code standards outlined below.

### 3. Test Your Changes

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Format code
npm run format

# Run tests
npm test

# Full validation
npm run validate
```

### 4. Commit Your Changes

We follow conventional commits:

```bash
git commit -m "feat: add new tracking feature"
git commit -m "fix: resolve SOAP client timeout issue"
git commit -m "docs: update API reference"
```

Commit types:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes (formatting, etc.)
- `refactor:` Code refactoring
- `test:` Test additions or changes
- `chore:` Build process or auxiliary tool changes

### 5. Push and Create Pull Request

```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Code Standards

### TypeScript

- **Type Safety**: Use strict TypeScript, no `any` types
- **Runtime Validation**: Use Zod for all external data
- **Error Handling**: Always handle errors gracefully
- **JSDoc**: Add JSDoc comments for public APIs

### Code Style

- **Formatting**: Prettier (automatic)
- **Linting**: ESLint (strict rules)
- **File Length**: Maximum 300 lines, ideal 200 lines
- **Function Complexity**: Keep functions small and focused

### Example

```typescript
/**
 * Generates domestic package numbers
 *
 * @param packages - Array of packages to process
 * @returns Package generation response
 * @throws {DPDServiceError} When API call fails
 */
async generatePackageNumbers(
  packages: DomesticPackage[]
): Promise<PackageGenerationResponse> {
  // Validate input
  const validated = packages.map(pkg => 
    validateInput(DomesticPackageSchema, pkg)
  );

  // Call API with error handling
  const result = await invokeSoapMethod(/* ... */);

  // Validate response
  const parsed = ResponseSchema.safeParse(result);
  if (!parsed.success) {
    throw new DPDServiceError('Invalid response');
  }

  return parsed.data;
}
```

## Testing

### Writing Tests

- Use Vitest
- Write unit tests for all services
- Mock external dependencies (SOAP client)
- Test error scenarios
- Aim for 70% coverage minimum, 90% for critical paths

### Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('DomesticService', () => {
  it('should generate package numbers successfully', async () => {
    // Arrange
    const mockClient = createMockClient();
    const service = new DomesticService(mockClient);

    // Act
    const result = await service.generatePackageNumbers([mockPackage]);

    // Assert
    expect(result.packages).toHaveLength(1);
    expect(result.packages[0].waybill).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    // Test error scenarios
  });
});
```

## Documentation

- Update README.md for new features
- Add JSDoc comments for public APIs
- Create examples for complex features
- Update CHANGELOG.md

## Pull Request Process

### PR Checklist

- [ ] Code follows project standards
- [ ] Tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Documentation updated
- [ ] Examples added (if applicable)
- [ ] CHANGELOG.md updated

### PR Description Template

```markdown
## Description
Brief description of changes

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
How has this been tested?

## Checklist
- [ ] Tests pass
- [ ] Linting passes
- [ ] Documentation updated
```

## Code Review

- All PRs require approval before merging
- Address review comments promptly
- Keep discussions professional and constructive

## Project Structure

```
dpd-sdk/
├── src/
│   ├── client.ts           # Main client
│   ├── services/           # Service implementations
│   ├── types/              # Type definitions
│   └── utils/              # Utility functions
├── tests/                  # Test files
├── examples/               # Usage examples
├── dist/                   # Build output
└── docs/                   # Documentation
```

## Key Principles

1. **Type Safety First**: Always use strict TypeScript
2. **Runtime Validation**: Validate all external data
3. **Error Handling**: Comprehensive error management
4. **Performance**: Efficient and optimized code
5. **Security**: Never expose credentials
6. **Maintainability**: Clean, readable, documented code

## Questions?

- Open an issue for questions
- Check existing issues and PRs
- Read the documentation

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
