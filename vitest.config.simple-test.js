import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'test-workspace',
      environment: 'node',
      include: ['tests/**/*.test.ts']
    }
  }
])