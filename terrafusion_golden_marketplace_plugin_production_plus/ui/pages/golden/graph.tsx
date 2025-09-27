import { useState } from 'react';

export default function GoldenGraph(){
  const [matrix, setMatrix] = useState('[[0,1,0],[1,0,1],[0,1,0]]');
  const [result, setResult] = useState<any>(null);

  async function run(){
    const res = await fetch('/api/graph/golden-laplacian', {
      method:'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer <JWT>' },
      body: JSON.stringify({ adjacency: JSON.parse(matrix), filter:'golden_lowpass' })
    });
    setResult(await res.json());
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">Golden Laplacian</h1>
      <textarea className="w-full border rounded p-2 h-40" value={matrix} onChange={e=>setMatrix(e.target.value)} />
      <button className="px-3 py-1 rounded bg-black text-white" onClick={run}>Analyze</button>
      <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
    </div>
  );
}
