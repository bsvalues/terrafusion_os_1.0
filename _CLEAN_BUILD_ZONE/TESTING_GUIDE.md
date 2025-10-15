# 🧪 TerraFusion Frontend Testing Guide

## Overview

This document describes the testing infrastructure and best practices for the TerraFusion Frontend application.

**Testing Stack:**
- **Jest** - Test runner and framework
- **React Testing Library** - Component testing utilities
- **@testing-library/user-event** - User interaction simulation
- **@testing-library/jest-dom** - Custom Jest matchers

---

## 📁 File Structure

```
frontend/
├── jest.config.ts              # Jest configuration
├── src/
│   ├── setupTests.ts           # Global test setup
│   ├── test-utils.tsx          # Custom testing utilities
│   ├── __mocks__/              # Mock files
│   │   └── fileMock.ts        # Static asset mocks
│   └── components/
│       └── ui/
│           ├── button.tsx
│           ├── button.test.tsx
│           ├── input.tsx
│           └── input.test.tsx
```

---

## 🚀 Running Tests

### Run all tests
```bash
npm test
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run specific test file
```bash
npm test button.test.tsx
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="Rendering"
```

---

## ✍️ Writing Tests

### Basic Component Test

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button Component', () => {
  it('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });
});
```

### Testing User Interactions

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

it('allows typing text', async () => {
  render(<Input />);
  const input = screen.getByRole('textbox');
  
  await userEvent.type(input, 'Hello World');
  
  expect(input).toHaveValue('Hello World');
});
```

### Testing Callbacks

```tsx
it('triggers onClick handler', async () => {
  const handleClick = jest.fn();
  render(<Button onClick={handleClick}>Click</Button>);
  
  await userEvent.click(screen.getByRole('button'));
  
  expect(handleClick).toHaveBeenCalledTimes(1);
});
```

---

## 🎯 Testing Best Practices

### 1. **Query Priority (React Testing Library)**

Use queries in this order:
1. `getByRole` - Most accessible
2. `getByLabelText` - Form inputs
3. `getByPlaceholderText` - Inputs with placeholders
4. `getByText` - Text content
5. `getByTestId` - Last resort only

**✅ Good:**
```tsx
screen.getByRole('button', { name: /submit/i })
screen.getByLabelText(/email/i)
```

**❌ Bad:**
```tsx
screen.getByTestId('submit-button')
screen.getByClassName('btn-primary')
```

### 2. **Async Operations**

Always await user interactions:

```tsx
// ✅ Good
await userEvent.click(button);
await userEvent.type(input, 'text');

// ❌ Bad
userEvent.click(button);  // Not awaited!
```

### 3. **Accessibility Testing**

Test keyboard navigation and screen reader support:

```tsx
it('is keyboard accessible', async () => {
  render(<Button>Accessible</Button>);
  
  await userEvent.tab();
  expect(screen.getByRole('button')).toHaveFocus();
  
  await userEvent.keyboard('{Enter}');
  // Assert action occurred
});
```

### 4. **Test Organization**

Group related tests with `describe` blocks:

```tsx
describe('Button Component', () => {
  describe('Rendering', () => {
    it('renders with text', () => {});
    it('renders with icon', () => {});
  });
  
  describe('Interactions', () => {
    it('handles click', () => {});
    it('handles keyboard', () => {});
  });
  
  describe('Accessibility', () => {
    it('has button role', () => {});
    it('supports keyboard', () => {});
  });
});
```

### 5. **Avoid Implementation Details**

Test behavior, not implementation:

**✅ Good:**
```tsx
// Tests what the user sees and does
expect(screen.getByRole('button')).toHaveTextContent('Submit');
await userEvent.click(screen.getByRole('button'));
```

**❌ Bad:**
```tsx
// Tests internal state and methods
expect(component.state.isSubmitting).toBe(true);
component.instance().handleSubmit();
```

---

## 🔍 Common Matchers

### Element Queries
```tsx
expect(element).toBeInTheDocument()
expect(element).toBeVisible()
expect(element).toBeEmptyDOMElement()
expect(element).toBeDisabled()
expect(element).toBeEnabled()
expect(element).toBeRequired()
```

### Text and Content
```tsx
expect(element).toHaveTextContent('text')
expect(element).toHaveValue('value')
expect(element).toHaveDisplayValue('value')
```

### Attributes
```tsx
expect(element).toHaveAttribute('type', 'email')
expect(element).toHaveClass('btn-primary')
expect(element).toHaveStyle({ color: 'red' })
```

### Focus
```tsx
expect(element).toHaveFocus()
```

---

## 🎭 Mocking

### Mock Functions
```tsx
const mockFn = jest.fn();
mockFn('arg1', 'arg2');

expect(mockFn).toHaveBeenCalled();
expect(mockFn).toHaveBeenCalledTimes(1);
expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
```

### Mock Return Values
```tsx
const mockFn = jest.fn().mockReturnValue('result');
const mockFn = jest.fn().mockResolvedValue('async result');
const mockFn = jest.fn().mockRejectedValue(new Error('error'));
```

### Mock Modules
```tsx
jest.mock('./api', () => ({
  fetchData: jest.fn().mockResolvedValue({ data: 'mock' }),
}));
```

---

## 📊 Coverage Goals

**Current Thresholds:**
- Branches: 50%
- Functions: 50%
- Lines: 50%
- Statements: 50%

**Target Goals (by Week 4):**
- Branches: 80%
- Functions: 80%
- Lines: 80%
- Statements: 80%

View coverage report:
```bash
npm test -- --coverage
open coverage/lcov-report/index.html
```

---

## 🐛 Debugging Tests

### Run single test with logs
```bash
npm test -- button.test.tsx --verbose
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Current File",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["${fileBasename}", "--runInBand"],
  "console": "integratedTerminal",
  "internalConsoleOptions": "neverOpen"
}
```

### Print element for debugging
```tsx
import { screen } from '@testing-library/react';
screen.debug(); // Print entire document
screen.debug(element); // Print specific element
```

---

## 📚 Example Test Patterns

### Testing Forms
```tsx
it('submits form with input values', async () => {
  const handleSubmit = jest.fn();
  render(
    <form onSubmit={handleSubmit}>
      <Input name="email" />
      <Button type="submit">Submit</Button>
    </form>
  );
  
  await userEvent.type(screen.getByRole('textbox'), 'test@example.com');
  await userEvent.click(screen.getByRole('button'));
  
  expect(handleSubmit).toHaveBeenCalled();
});
```

### Testing Async Operations
```tsx
it('shows loading state', async () => {
  render(<AsyncComponent />);
  
  expect(screen.getByText(/loading/i)).toBeInTheDocument();
  
  await waitForElementToBeRemoved(() => screen.queryByText(/loading/i));
  
  expect(screen.getByText(/loaded/i)).toBeInTheDocument();
});
```

### Testing Error States
```tsx
it('displays error message', async () => {
  render(<Form />);
  
  await userEvent.type(screen.getByLabelText(/email/i), 'invalid');
  await userEvent.click(screen.getByRole('button', { name: /submit/i }));
  
  expect(await screen.findByText(/invalid email/i)).toBeInTheDocument();
});
```

---

## 🎯 Next Steps

### Week 1, Day 3 (Current)
- ✅ Jest configuration created
- ✅ Test utilities setup
- ✅ Button component tests (18 tests)
- ✅ Input component tests (24 tests)
- 🎯 Run tests and verify 100% pass

### Week 2
- Add tests for remaining 11 documented components
- Achieve 60% coverage
- Add integration tests

### Week 3-4
- Achieve 80% coverage target
- Add E2E tests with Playwright
- Visual regression tests with Storybook
- Performance testing

---

## 📖 Resources

- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Library Queries](https://testing-library.com/docs/queries/about)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [Testing Best Practices](https://kentcdodds.com/blog/testing-implementation-details)

---

<div align="center">

**Built with ❤️ THE TERRAFUSION WAY**

*Test-Driven Excellence for Production-Ready Components*

</div>
