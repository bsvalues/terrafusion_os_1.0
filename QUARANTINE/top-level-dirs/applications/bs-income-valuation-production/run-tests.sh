#!/bin/bash

echo "=== Running Authentication Bypass Tests ==="
npx jest --testMatch="**/__tests__/unit/auth-bypass.test.ts" --verbose

echo "=== Running Auth Context Tests ==="
npx jest --testMatch="**/__tests__/unit/auth-context.test.tsx" --verbose

echo "=== Running Dashboard API Tests ==="
npx jest --testMatch="**/__tests__/integration/dashboard-api.test.ts" --verbose

echo "=== Running Protected Routes Tests ==="
npx jest --testMatch="**/__tests__/integration/protected-routes.test.ts" --verbose

echo "=== Running Schema Tests ==="
npx jest --testMatch="**/__tests__/unit/schema.test.ts" --verbose

echo "All tests completed!"