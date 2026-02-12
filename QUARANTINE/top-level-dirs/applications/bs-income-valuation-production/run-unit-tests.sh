#!/bin/bash
echo "Running unit tests..."
npx jest '.*/(?!integration).*\.test\.(ts|tsx)$'