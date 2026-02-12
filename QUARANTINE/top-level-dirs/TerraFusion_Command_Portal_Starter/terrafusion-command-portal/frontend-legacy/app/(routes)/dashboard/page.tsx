'use client';
import useSWR from 'swr';
const fetcher = (url:string)=>fetch(url).then(r=>r.json());
export default function Dashboard(){
  const { data } = useSWR('http://localhost:8787/api/portal/health', fetcher);
  return (
    <section>
      <h1>Supreme Commander Dashboard</h1>
      <p>System snapshot of all workspaces.</p>
      <pre style={{background:'#f6f8fa',padding:12,overflow:'auto'}}>
        {JSON.stringify(data||{status:"loading"}, null, 2)}
      </pre>
    </section>
  );
}
