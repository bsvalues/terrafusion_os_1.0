import React, { useState, useEffect, useRef } from 'react';
import { Search, 
  Mic, 
  Camera,
  Zap,
  TrendingUp,
  Users,
  FileText,
  MapPin,
  DollarSign,
  Clock,
  Activity,
  Brain,
  Sparkles
 } from '@mui/icons-material';
import StaffCommandCenter from './StaffCommandCenter';
import TerraFusionCore from './TerraFusionCore';

// The ENTIRE Public Portal Interface
const ChampionshipPortal: React.FC = () => {
  const [mode, setMode] = useState<'public' | 'command' | 'core'>('public');
  const [query, setQuery] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [aiThinking, setAiThinking] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({
    searchesNow: 47,
    recordsIndexed: 1129788,
    avgResponseTime: 0.003,
    citizensServed: 206873
  });

  // Real-time stats animation
  useEffect(() => {
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        searchesNow: prev.searchesNow + Math.floor(Math.random() * 3),
        citizensServed: prev.citizensServed + Math.floor(Math.random() * 2)
      }));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // AI Natural Language Understanding
  const understandQuery = (input: string) => {
    const understanding = {
      'dog license': ['animal permit', 'pet registration', 'animal control'],
      'build a deck': ['building permit', 'construction', 'residential alteration'],
      'new mcdonalds': ['commercial permit', 'planning commission', 'conditional use'],
      'water bill': ['utility records', 'consumption history', 'meter readings'],
      'who owns': ['property records', 'assessor', 'parcel ownership'],
      'car accident': ['police report', 'incident report', 'collision'],
      'trash pickup': ['waste management', 'collection schedule', 'solid waste'],
      'council meeting': ['agenda', 'minutes', 'public hearing', 'commission']
    };

    // Find what they really mean
    const normalized = input.toLowerCase();
    for (const [key, values] of Object.entries(understanding)) {
      if (normalized.includes(key)) {
        return values[0];
      }
    }
    return input;
  };

  // The Championship Search
  const executeSearch = async () => {
    if (!query.trim()) return;
    
    setIsSearching(true);
    setAiThinking(true);
    
    // AI processes natural language
    const understood = understandQuery(query);
    
    // Simulate lightning-fast search
    setTimeout(() => {
      setAiThinking(false);
      setResults([
        {
          type: 'instant_answer',
          title: 'Found exactly what you need',
          content: `Your ${understood} has been located`,
          confidence: 98,
          sources: 3,
          time: 0.003
        },
        {
          type: 'document',
          title: 'Building Permit #2024-0847',
          department: 'Building & Safety',
          status: 'Approved',
          date: '2024-01-15',
          relevance: 95
        },
        {
          type: 'insight',
          title: 'AI Discovery',
          content: 'Similar permits in your area typically take 3-5 days for approval',
          icon: '💡'
        }
      ]);
      setIsSearching(false);
    }, 300); // 300ms - feels instant
  };

  // Voice Search
  const startVoiceSearch = () => {
    setIsListening(true);
    // In production: Web Speech API
    setTimeout(() => {
      setQuery("When's my trash picked up?");
      setIsListening(false);
      executeSearch();
    }, 2000);
  };

  // Public Portal - THE ENTIRE INTERFACE
  if (mode === 'public') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-blue-900 text-white overflow-hidden">
        {/* Ambient Background Animation */}
        <div className="absolute inset-0 overflow-hidden"><>

          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob"></div>
          <div
</> className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-2000"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-blob animation-delay-4000"></div>
        </div>

        {/* Minimal Header */}
        <header className="relative z-10 p-6">
          <div className="flex justify-between items-center max-w-7xl mx-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-600 rounded-xl flex items-center justify-center"><>

                <Zap className="text-white" size={20} />
              </div>
              <span
</> className="text-xl font-bold">Terrafusion</span>
              <span className="text-sm opacity-60">Benton County</span>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setMode('core')}
                className="text-sm opacity-60 hover:opacity-100 transition-opacity flex items-center gap-1"
              ><>

                <Brain size={14} />
                System Core
              </button>
              <button
</>
                onClick={() => setMode('command')}
                className="text-sm opacity-60 hover:opacity-100 transition-opacity"
              >
                Staff Login →
              </button>
            </div>
          </div>
        </header>

        {/* THE ENTIRE CITIZEN INTERFACE */}
        <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-200px)] px-6">
          {!results.length ? (
            <>
              {/* The One Search Box */}
              <div className="text-center mb-8 animate-fade-in"><>

                <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-white to-blue-300 bg-clip-text text-transparent">
                  What can we help you find?
                </h1>
                <p
</> className="text-xl opacity-80">
                  Just type like you talk. We'll understand.
                </p>
              </div>

              <div className="w-full max-w-3xl">
                <div className="relative group">
                  {/* Glow Effect */}
                  <div className="absolute -inset-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-200"></div>
                  
                  {/* Search Input */}
                  <div className="relative bg-white/10 backdrop-blur-xl rounded-2xl p-2 border border-white/20">
                    <div className="flex items-center gap-3">
                      <Search className="text-white/60 ml-4" size={24} />
                      <input
                        ref={searchInputRef}
                        type="text"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && executeSearch()}
                        placeholder="Try: 'building permit for my deck' or 'who owns 123 Main St'"
                        className="flex-1 bg-transparent text-white text-lg py-4 px-2 outline-none placeholder-white/40"
                        autoFocus
                      />
                      <button
                        onClick={startVoiceSearch}
                        className={`p-3 rounded-xl transition-all ${
                          isListening 
                            ? 'bg-red-500 animate-pulse' 
                            : 'hover:bg-white/10'
                        }`}
                      ><>

                        <Mic className="text-white" size={20} />
                      </button>
                      <button
</> className="p-3 hover:bg-white/10 rounded-xl transition-all"><>

                        <Camera className="text-white" size={20} />
                      </button>
                      <button
</>
                        onClick={executeSearch}
                        className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Search
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Examples */}
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  <span className="text-sm opacity-60">Popular:</span>
                  {[
                    'My property tax',
                    'Building permits near me',
                    'Next council meeting',
                    'Business license'
                  ].map(example => (
                    <button
                      key={example}
                      onClick={() => {
                        setQuery(example);
                        executeSearch();
                      }}
                      className="px-4 py-2 bg-white/10 rounded-full text-sm hover:bg-white/20 transition-all"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              {/* Live Stats Ticker */}
              <div className="flex gap-8 mt-16 text-center animate-fade-in-delay">
                <div><>

                  <div className="text-3xl font-bold text-blue-300">
                    {stats.searchesNow}
                  </div>
                  <div
</> className="text-sm opacity-60">searches now</div>
                </div>
                <div><>

                  <div className="text-3xl font-bold text-green-300">
                    {stats.avgResponseTime}s
                  </div>
                  <div
</> className="text-sm opacity-60">avg response</div>
                </div>
                <div><>

                  <div className="text-3xl font-bold text-purple-300">
                    {stats.recordsIndexed.toLocaleString()}
                  </div>
                  <div
</> className="text-sm opacity-60">records indexed</div>
                </div>
                <div><>

                  <div className="text-3xl font-bold text-pink-300">
                    {stats.citizensServed.toLocaleString()}
                  </div>
                  <div
</> className="text-sm opacity-60">citizens served</div>
                </div>
              </div>
            </>
          ) : (
            /* Search Results */
            <div className="w-full max-w-4xl animate-fade-in">
              <button
                onClick={() => {
                  setResults([]);
                  setQuery('');
                  searchInputRef.current?.focus();
                }}
                className="mb-6 text-sm opacity-60 hover:opacity-100"
              >
                ← New search
              </button>

              {/* AI Thinking Animation */}
              {aiThinking && (
                <div className="mb-6 p-4 bg-white/10 rounded-xl backdrop-blur-xl border border-white/20">
                  <div className="flex items-center gap-3">
                    <Brain className="text-purple-400 animate-pulse" size={24} />
                    <span>AI is understanding your request...</span>
                  </div>
                </div>
              )}

              {/* Results */}
              <div className="space-y-4">
                {results.map((result /* , index */) => (
                  <div
                    key={index}
                    className="bg-white/10 backdrop-blur-xl rounded-xl p-6 border border-white/20 hover:bg-white/15 transition-all animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                  >
                    {result.type === 'instant_answer' && (
                      <div>
                        <div className="flex items-center gap-2 mb-3">
                          <Sparkles className="text-yellow-400" size={20} /><>

                          <span className="text-yellow-400 font-semibold">Instant Answer</span>
                          <span
</> className="text-xs opacity-60 ml-auto">
                            {result.time}s • {result.confidence}% confident
                          </span>
                        </div><>

                        <h3 className="text-xl font-bold mb-2">{result.title}</h3>
                        <p
</> className="opacity-90">{result.content}</p>
                      </div>
                    )}

                    {result.type === 'document' && (
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <FileText className="text-blue-400" size={20} />
                              <span className="text-sm text-blue-400">{result.department}</span>
                            </div><>

                            <h3 className="text-lg font-bold">{result.title}</h3>
                            <p
</> className="text-sm opacity-70 mt-1">
                              {result.date} • Status: {result.status}
                            </p>
                          </div>
                          <button className="px-4 py-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-all">
                            View
                          </button>
                        </div>
                      </div>
                    )}

                    {result.type === 'insight' && (
                      <div className="flex items-start gap-3"><>

                        <span className="text-2xl">{result.icon}</span>
                        <div
</>><>

                          <h4 className="font-semibold mb-1">{result.title}</h4>
                          <p
</> className="text-sm opacity-80">{result.content}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>

        {/* Bottom Status Bar */}
        <footer className="fixed bottom-0 left-0 right-0 p-4 bg-black/20 backdrop-blur-xl border-t border-white/10">
          <div className="max-w-7xl mx-auto flex items-center justify-between text-sm">
            <div className="flex items-center gap-2"><>

              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span
</> className="opacity-60">All systems operational</span>
            </div>
            <div className="opacity-60">
              Last updated: {new Date().toLocaleTimeString()}
            </div>
          </div>
        </footer>
      </div>
    );
  }

  // Command Center (Staff Dashboard)
  if (mode === 'command') {
    return <StaffCommandCenter onReturnToPublic={() => setMode('public')} />;
  }

  // Terrafusion Core System View
  if (mode === 'core') {
    return (
      <div>
        <div className="absolute top-4 right-4 z-50 flex gap-2">
          <button
            onClick={() => setMode('public')}
            className="px-4 py-2 bg-blue-600/80 backdrop-blur hover:bg-blue-700 rounded-lg transition-colors text-white flex items-center gap-2"
          >
            ← Back to Portal
          </button>
        </div>
        <TerraFusionCore />
      </div>
    );
  }
};

export default ChampionshipPortal;

// CSS for animations
const styles = `
@keyframes blob {
  0% { transform: translate(0px, 0px) scale(1); }
  33% { transform: translate(30px, -50px) scale(1.1); }
  66% { transform: translate(-20px, 20px) scale(0.9); }
  100% { transform: translate(0px, 0px) scale(1); }
}

@keyframes fade-in {
  from { opacity: 0; transform: translateY(20px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slide-up {
  from { opacity: 0; transform: translateY(40px); }
  to { opacity: 1; transform: translateY(0); }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.animation-delay-4000 {
  animation-delay: 4s;
}

.animate-fade-in {
  animation: fade-in 0.8s ease-out;
}

.animate-fade-in-delay {
  animation: fade-in 0.8s ease-out 0.3s both;
}

.animate-slide-up {
  animation: slide-up 0.5s ease-out both;
}
`;

// Add styles to document
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement("style");
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}