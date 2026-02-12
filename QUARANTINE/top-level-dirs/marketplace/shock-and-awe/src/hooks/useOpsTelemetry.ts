import { useEffect, useState } from 'react';
import { ConsciousnessStream, SwarmHealthEvent } from '../services/ConsciousnessStream';

export function useOpsTelemetry(url?: string) {
  const [events, setEvents] = useState<SwarmHealthEvent[]>([]);
  useEffect(() => {
    const stream = new ConsciousnessStream(url);
    stream.on((e) => setEvents((prev) => [...prev.slice(-999), e]));
    stream.connect();
    return () => stream.close();
  }, [url]);
  return { events };
}
