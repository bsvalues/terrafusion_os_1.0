#!/bin/bash

echo "=== Running Authentication Bypass Tests ==="
npx jest --testMatch="**/__tests__/unit/auth-bypass.test.ts" --verbose

echo "=== Running Auth Context Tests ==="
npx jest --testMatch="**/__tests__/unit/auth-context.test.tsx" --verbose

echo "All auth-related tests completed!"