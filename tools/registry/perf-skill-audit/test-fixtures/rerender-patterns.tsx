// @ts-nocheck
/**
 * Rerender Scanner Self-Test Fixtures
 * Phase 4M2: Rerender Pattern Validation
 *
 * These fixtures intentionally contain rerender anti-patterns
 * to validate scanner detection and classification.
 *
 * NOTE: @ts-nocheck is required because these patterns are intentionally
 * invalid to test the scanner's detection capabilities.
 *
 * LOCATION: This file is in tools/registry/** (allowed surface)
 * so it WILL appear in actionable reports if scanner is working.
 */

import React, { createContext, useCallback, useMemo, useState } from 'react';

// ============================================================
// FIXTURE 1: inline-object (should flag, auto-fixable)
// Inline object prop creates new reference each render
// ============================================================
// perf-skill:test-fixture:inline-object
export function InlineObjectComponent() {
  return <ChildComponent config={{ theme: 'dark', size: 'large' }} data={{ items: 10 }} />;
}

// ============================================================
// FIXTURE 2: inline-array (should flag, auto-fixable)
// Inline array prop creates new reference each render
// ============================================================
// perf-skill:test-fixture:inline-array
export function InlineArrayComponent() {
  const items = ['a', 'b', 'c'];
  return <ListComponent options={['option1', 'option2']} values={[1, 2, 3]} />;
}

// ============================================================
// FIXTURE 3: inline-fn (should flag, auto-fixable)
// Inline function prop creates new function each render
// ============================================================
// perf-skill:test-fixture:inline-fn
export function InlineFnComponent({ id }) {
  return <Button onClick={() => handleClick(id)} onHover={() => handleHover()} />;
}

// ============================================================
// FIXTURE 4: setstate-nonfunctional (should flag, auto-fixable)
// Non-functional setState may cause stale state issues
// ============================================================
// perf-skill:test-fixture:setstate-nonfunctional
export function NonFunctionalSetStateComponent() {
  const [count, setCount] = useState(0);
  const [value, setValue] = useState(10);

  const increment = () => {
    setCount(count + 1);
    setValue(value - 1);
  };

  return <button onClick={increment}>{count}</button>;
}

// ============================================================
// FIXTURE 5: context-value (should flag, review-only)
// Inline object in Provider value causes all consumers to rerender
// ============================================================
// perf-skill:test-fixture:context-value
const MyContext = createContext({});

export function ContextValueComponent({ children }) {
  const [state, setState] = useState('value');
  return <MyContext.Provider value={{ state, setState }}>{children}</MyContext.Provider>;
}

// ============================================================
// FIXTURE 6: list-hotspot (should flag, review-only)
// List render without memo may cause child rerenders
// ============================================================
// perf-skill:test-fixture:list-hotspot
export function ListHotspotComponent({ items }) {
  return (
    <div>
      {items.map(item => (
        <ExpensiveItemComponent
          key={item.id}
          item={item}
          onClick={() => handleItemClick(item.id)}
        />
      ))}
    </div>
  );
}

// ============================================================
// FIXTURE 7: suppressed (should NOT flag)
// Has explicit ignore pragma
// ============================================================
export function SuppressedComponent() {
  // perf-skill:ignore-rerender
  return <ChildComponent config={{ intentionallyInline: true }} />;
}

// ============================================================
// FIXTURE 8: clean patterns (should NOT flag)
// Properly memoized versions
// ============================================================
export function CleanComponent({ id }) {
  const config = useMemo(() => ({ theme: 'dark' }), []);
  const items = useMemo(() => ['a', 'b'], []);
  const handleClick = useCallback(() => onClick(id), [id]);

  return <ChildComponent config={config} items={items} onClick={handleClick} />;
}

// ============================================================
// FIXTURE 9: functional setState (should NOT flag)
// Proper functional setState pattern
// ============================================================
export function FunctionalSetStateComponent() {
  const [count, setCount] = useState(0);

  const increment = () => {
    setCount(prev => prev + 1);
  };

  return <button onClick={increment}>{count}</button>;
}

// ============================================================
// Stub declarations
// ============================================================
declare const ChildComponent: React.FC<any>;
declare const ListComponent: React.FC<any>;
declare const Button: React.FC<any>;
declare const ExpensiveItemComponent: React.FC<any>;
declare function handleClick(id: any): void;
declare function handleHover(): void;
declare function handleItemClick(id: any): void;
declare function onClick(id: any): void;
