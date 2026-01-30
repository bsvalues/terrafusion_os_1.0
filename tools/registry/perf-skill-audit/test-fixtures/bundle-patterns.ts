// @ts-nocheck
/**
 * Bundle Scanner Self-Test Fixtures
 * Phase 4M1: Bundle/Import Pattern Validation
 *
 * These fixtures intentionally contain import anti-patterns
 * to validate scanner detection and classification.
 *
 * NOTE: @ts-nocheck is required because these imports are intentionally
 * invalid to test the scanner's detection capabilities.
 *
 * LOCATION: This file is in tools/registry/** (allowed surface)
 * so it WILL appear in actionable reports if scanner is working.
 */

// ============================================================
// FIXTURE 1: barrel-import (should be detected, auto-fixable)
// Import from directory path that triggers barrel import
// ============================================================
// perf-skill:test-fixture:barrel-import
import { debounce, formatDate, parseJSON } from '../utils';
import { Button, Card, Dialog, Input, Modal } from './components';

// ============================================================
// FIXTURE 2: heavy-import (should be detected, review-only)
// Import from known heavy library without tree-shaking
// ============================================================
// perf-skill:test-fixture:heavy-import
import { filter, groupBy, map, reduce, sortBy } from 'lodash';

// ============================================================
// FIXTURE 3: direct-import (should NOT be detected)
// Clean direct import from specific module path
// ============================================================
// perf-skill:test-fixture:direct-import (should be clean)

// ============================================================
// FIXTURE 4: pragma-ignored (should be suppressed)
// Has explicit ignore pragma
// ============================================================
// perf-skill:ignore-bundle
import { everything, fromBarrel } from './barrel-directory';

// ============================================================
// FIXTURE 5: high-risk-pattern (should be detected)
// Import from known problematic directory patterns
// ============================================================
// perf-skill:test-fixture:high-risk
import { SomeHook } from '@terrafusion/hooks';
import { SharedThing } from '../shared';
import { ServiceClient } from './services';

// ============================================================
// FIXTURE 6: safe-external (should NOT be detected)
// External package imports with extension
// ============================================================
// perf-skill:test-fixture:safe-external (should be clean)
import { readFile } from 'fs/promises';
import * as path from 'path';
import React from 'react';

// ============================================================
// Stub exports (prevent unused import warnings)
// ============================================================
export const stubs = {
  Button,
  Card,
  Modal,
  Dialog,
  Input,
  formatDate,
  parseJSON,
  debounce,
  map,
  filter,
  reduce,
  groupBy,
  sortBy,
  everything,
  fromBarrel,
  SomeHook,
  SharedThing,
  ServiceClient,
  React,
  path,
  readFile,
};
