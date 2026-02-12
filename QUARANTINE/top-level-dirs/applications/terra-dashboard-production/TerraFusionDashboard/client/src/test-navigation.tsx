import { Link, useLocation } from "wouter";

export default function TestNavigation() {
  const [location, setLocation] = useLocation();

  return (
    <div className="p-8 bg-gray-100 min-h-screen">
<>
      <h1 className="text-2xl font-bold mb-4">Navigation Test</h1>
      <p
</> className="mb-4">Current location: {location}</p>
      
      <div className="space-y-2">
        <div>
          <Link href="/analytics" className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
            Go to Analytics
          </Link>
        </div>
        <div>
          <Link href="/agents" className="bg-green-500 text-white px-4 py-2 rounded mr-2">
            Go to Agents
          </Link>
        </div>
        <div>
          <Link href="/ide" className="bg-purple-500 text-white px-4 py-2 rounded mr-2">
            Go to IDE
          </Link>
        </div>
        <div>
          <Link href="/orchestrator" className="bg-orange-500 text-white px-4 py-2 rounded mr-2">
            Go to Orchestrator
          </Link>
        </div>
        <div>
          <Link href="/parcel-workbench" className="bg-red-500 text-white px-4 py-2 rounded mr-2">
            Go to Parcel Workbench
          </Link>
        </div>
        <div>
          <button 
            onClick={() => setLocation('/analytics')}
            className="bg-gray-500 text-white px-4 py-2 rounded mr-2"
          >
            Navigate to Analytics (programmatic)
          </button>
        </div>
      </div>
    </div>
  );
}