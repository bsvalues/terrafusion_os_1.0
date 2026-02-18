import { useEffect, useState } from 'react';
import { loadCanonLayout, saveCanonLayout, type CanonLayoutV1 } from './layoutPersistence';

export function useCanonLayout(): [CanonLayoutV1, (next: CanonLayoutV1) => void] {
  const [layout, setLayout] = useState<CanonLayoutV1>(() => loadCanonLayout());

  useEffect(() => {
    saveCanonLayout(layout);
  }, [layout]);

  return [layout, setLayout];
}
