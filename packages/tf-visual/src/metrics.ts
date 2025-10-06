export type Metrics = { cpu: number; net: number; focus: number }; // 0..1
export const MetricsBridge = () => {
  let m: Metrics = { cpu: 0.15, net: 0.12, focus: 0.2 };
  // Demo "load" modes; replace with real OS metrics later
  const set = (k: keyof Metrics, v: number) => (m[k] = Math.max(0, Math.min(1, v)));
  const jitter = () => { m.net = Math.max(0, Math.min(1, m.net + (Math.random()-0.5)*0.02)); };
  setInterval(jitter, 120);
  return { get: () => ({ ...m }), set };
};

