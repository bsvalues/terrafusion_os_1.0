#!/bin/bash

echo "=== Running Dashboard API Tests ==="
npx jest --testMatch="**/__tests__/integration/dashboard-api.test.ts" --verbose

echo "=== Running Protected Routes Tests ==="
npx jest --testMatch="**/__tests__/integration/protected-routes.test.ts" --verbose

echo "=== Running Valuation Tests ==="
npx jest --testMatch="**/__tests__/integration/valuation.test.ts" --verbose

echo "All integration tests completed!"