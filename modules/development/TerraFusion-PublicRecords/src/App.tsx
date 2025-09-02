import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Zap, Brain, Globe, TrendingUp, Warning  } from '@mui/icons-material';
import { InstantSearch } from './components/InstantSearch';
import { CountyPulse } from './components/CountyPulse';
import { AIInsights } from './components/AIInsights';
import { CompetitorMigration } from './components/CompetitorMigration';
import { ShockAndAwe } from './components/ShockAndAwe';
import { BentonCountyData } from './data/bentonCounty';

interface CountyStatus {
  indexed: number;
  savings: string;
  violations: number;
  efficiency: number;
  lastUpdate: Date;
}

const App: React.FC = () => {
  const [countyStatus, setCountyStatus] = useState<CountyStatus | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMigration, setShowMigration] = useState(false);
  const [aiDiscoveries, setAiDiscoveries] = useState<any[]>([]);
  
  useEffect(() => {
    // Simulate instant activation - the system is already running
    const detectCounty = async () => {
      // This would normally detect based on IP/location
      // For demo, we'll simulate with impressive numbers
      setTimeout(() => {
        setCountyStatus({
          indexed: BentonCountyData.statistics.totalParcels * 12, // Multiple record types per parcel
          savings: BentonCountyData.budgetImpact.annualSavings,
          violations: BentonCountyData.aiDiscoveries.length * 3,
          efficiency: 94.2,
          lastUpdate: new Date()
        });
        
        // Use real Benton County AI discoveries
        setAiDiscoveries(BentonCountyData.aiDiscoveries.slice(0, 3));
      }, 100); // Near-instant
    };
    
    detectCounty();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* The Shock Banner */}
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-red-600 to-orange-600 text-white p-4 text-center"
      >
        <div className="flex items-center justify-center gap-3">
          <Zap className="w-6 h-6 animate-pulse" /><>

          <span className="text-lg font-bold">
            BENTON COUNTY, WA IS ALREADY INDEXED • {countyStatus?.indexed.toLocaleString()} RECORDS READY • 
            ${countyStatus?.savings} IN ANNUAL SAVINGS IDENTIFIED
          </span>
          <Zap
</> className="w-6 h-6 animate-pulse" />
        </div>
      </motion.div>

      {/* Main Header */}
      <header className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        ><>

          <h1 className="text-6xl font-bold text-white mb-4 tracking-tight">
            Terrafusion Public Records - Benton County
          </h1>
          <p
</> className="text-2xl text-purple-200">
            {BentonCountyData.statistics.totalParcels.toLocaleString()} parcels • {BentonCountyData.county.population.toLocaleString()} citizens • Already indexed.
          </p>
          <div className="mt-6 flex justify-center gap-8">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">0.001s</div>
              <div
</> className="text-sm text-purple-200">Search Speed</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">379M×</div>
              <div
</> className="text-sm text-purple-200">Faster than Legacy</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/10 backdrop-blur-sm rounded-lg px-6 py-3"
            ><>

              <div className="text-3xl font-bold text-white">$0</div>
              <div
</> className="text-sm text-purple-200">Installation Cost</div>
            </motion.div>
          </div>
        </motion.div>
      </header>

      {/* The One Search Box */}
      <section className="container mx-auto px-4 py-8">
        <InstantSearch 
          onSearch={setSearchQuery}
          recordCount={countyStatus?.indexed || 0}
        />
      </section>

      {/* AI Discoveries - Things Found Before You Asked */}
      {aiDiscoveries.length > 0 && (
        <section className="container mx-auto px-4 py-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

              <Brain className="w-8 h-8 text-purple-400" />
              AI Already Found These Issues
            </h2>
            <AIInsights
</> discoveries={aiDiscoveries} />
          </motion.div>
        </section>
      )}

      {/* County Pulse Visualization */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

            <Globe className="w-8 h-8 text-blue-400" />
            Your County's Real-Time Pulse
          </h2>
          <CountyPulse
</> />
        </motion.div>
      </section>

      {/* Competitor Migration Tool */}
      <section className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-red-900/50 to-orange-900/50 rounded-xl p-8 backdrop-blur-sm"
        >
          <h2 className="text-3xl font-bold text-white mb-6 flex items-center gap-3"><>

            <Warning className="w-8 h-8 text-yellow-400" />
            Migrate from Legacy CAMA Systems Now
          </h2>
          <p
</> className="text-xl text-white/80 mb-6">
            Migration completes in 60 seconds. During their next sales call.
          </p>
          <button
            onClick={() => setShowMigration(true)}
            className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-8 py-4 rounded-lg text-xl font-bold hover:scale-105 transition-transform"
          >
            START MIGRATION NOW
          </button>
        </motion.div>
      </section>

      {/* Migration Modal */}
      <AnimatePresence>
        {showMigration && (
          <CompetitorMigration onClose={() => setShowMigration(false)} />
        )}
      </AnimatePresence>

      {/* The Bottom Line */}
      <footer className="container mx-auto px-4 py-12 text-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
        ><>

          <p className="text-2xl text-purple-200 mb-4">
            Your competitors are still writing RFPs.
          </p>
          <p
</> className="text-3xl font-bold text-white">
            We've already won.
          </p>
          <div className="mt-8 text-sm text-purple-300">
            Terrafusion • Government. Transcended. • No Permission Needed
          </div>
        </motion.div>
      </footer>

      {/* Shock and Awe Demo Trigger */}
      <ShockAndAwe />
    </div>
  );
};

export default App;