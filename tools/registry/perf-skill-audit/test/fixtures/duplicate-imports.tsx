// Fixture: Duplicate imports that should be merged
// @ts-nocheck - intentionally has duplicate imports for testing

// Duplicate #1: Button from @/components/ui/button
import { Button } from '@/components/ui/button';
// Duplicate #2: Also importing from same source (simulates merge conflict or copy-paste)
import { Button as Button2 } from '@/components/ui/button';

// Separate react imports that should be merged
import { useEffect, useState } from 'react';

export function MyComponent() {
  const [open, setOpen] = useState(false);
  useEffect(() => {}, []);
  return (
    <>
      <Button onClick={() => setOpen(!open)}>Toggle</Button>
      <Button2>Also a button</Button2>
    </>
  );
}
