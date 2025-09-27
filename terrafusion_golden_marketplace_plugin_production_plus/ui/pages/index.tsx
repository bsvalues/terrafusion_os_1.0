import { useEffect, useState } from 'react';
import { health, fib } from '../lib/service';

export default function GoldenHome(){
  const [info, setInfo] = useState<any>(null);
  const [fibOut, setFibOut] = useState<any>(null);
  const [n, setN] = useState(40);

  useEffect(()=>{ health().then(setInfo); },[]);
  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">Golden Optimization Suite (φ)</h1>
      <section className="p-4 rounded-xl border">
        <h2 className="text-xl font-semibold">Service Health</h2>
        <pre className="text-sm">{JSON.stringify(info, null, 2)}</pre>
      </section>
      <section className="p-4 rounded-xl border space-y-2">
        <h2 className="text-xl font-semibold">Fibonacci</h2>
        <div className="flex gap-2">
          <input className="border px-2 py-1 rounded" type="number" value={n} onChange={e=>setN(parseInt(e.target.value,10))}/>
          <button className="px-3 py-1 rounded bg-black text-white" onClick={async()=>setFibOut(await fib(n))}>Compute</button>
        </div>
        <pre className="text-sm">{JSON.stringify(fibOut, null, 2)}</pre>
      </section>
      <section className="p-4 rounded-xl border space-y-2">
        <h2 className="text-xl font-semibold">Try APIs</h2>
        <p>POST /api/opt/golden-section &nbsp;|&nbsp; POST /api/graph/golden-laplacian</p>
      </section>
    </div>
  );
}
