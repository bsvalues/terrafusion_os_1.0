// Fixture: Component without client directive but uses hooks
import { useEffect, useState } from 'react';

export function Counter() {
  const [count, setCount] = useState(0);

  useEffect(() => {
    console.log('Count changed:', count);
  }, [count]);

  return <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>;
}
