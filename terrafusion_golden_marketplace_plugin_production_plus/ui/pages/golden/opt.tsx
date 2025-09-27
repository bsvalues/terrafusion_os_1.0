import { useState } from 'react';

export default function GoldenOpt(){
  const [payload, setPayload] = useState(JSON.stringify(
    { func:'quadratic', params:{a:1,b:-4,c:5}, bounds:[0,5], tol:1e-6 }, null, 2
  ));
  const [result, setResult] = useState<any>(null);

  async function run(){
    const res = await fetch('/api/opt/golden-section', {
      method:'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <JWT>' },
      body: payload
    });
    setResult(await res.json());
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Golden-Section Optimizer</h1>
      <textarea className="w-full border rounded p-2 h-56" value={payload} onChange={e=>setPayload(e.target.value)} />
      <button className="px-3 py-1 rounded bg-black text-white" onClick={run}>Optimize</button>
      <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
