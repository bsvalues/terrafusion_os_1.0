import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Download, CheckCircle, Warning, Zap, Clock, DollarSign, X  } from '@mui/icons-material';

interface MigrationStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'complete' | 'error';
  duration: number;
  records?: number;
}

interface CompetitorMigrationProps {
  onClose: () => void;
}

export const CompetitorMigration: React.FC<CompetitorMigrationProps> = ({ onClose }) => {
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>('');
  const [migrationStarted, setMigrationStarted] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);
  const [steps, setSteps] = useState<MigrationStep[]>([
    { id: '1', name: 'Detecting system type', status: 'pending', duration: 0.5 },
    { id: '2', name: 'Extracting database schema', status: 'pending', duration: 2 },
    { id: '3', name: 'Migrating records', status: 'pending', duration: 5, records: 0 },
    { id: '4', name: 'Validating data integrity', status: 'pending', duration: 1 },
    { id: '5', name: 'Optimizing for Terrafusion', status: 'pending', duration: 0.5 },
    { id: '6', name: 'Activating AI analysis', status: 'pending', duration: 1 }
  ]);
  const [totalTime, setTotalTime] = useState(0);
  const [recordsMigrated, setRecordsMigrated] = useState(0);

  const competitors = [
    { 
      name: 'Legacy CAMA System',
      time: '6-12 months typical',
      cost: '$500,000+',
      pain: 'Still using technology from 1998'
    },
    { 
      name: 'Laserfiche',
      time: '3-6 months typical',
      cost: '$250,000+',
      pain: 'Requires army of consultants'
    },
    { 
      name: 'OnBase by Hyland',
      time: '4-8 months typical',
      cost: '$350,000+',
      pain: 'Windows-only, server required'
    },
    { 
      name: 'OpenGov',
      time: '2-4 months typical',
      cost: '$150,000+',
      pain: 'Pretty UI, no substance'
    }
  ];

  const startMigration = () => {
    if (!selectedCompetitor) return;
    
    setMigrationStarted(true);
    let currentStep = 0;
    const startTime = Date.now();

    const runStep = () => {
      if (currentStep >= steps.length) {
        setMigrationComplete(true);
        setTotalTime((Date.now() - startTime) / 1000);
        return;
      }

      setSteps(prev => prev.map((step /* , index */) => {
        if (index === currentStep) {
          return { ...step, status: 'running' };
        }
        if (index < currentStep) {
          return { ...step, status: 'complete' };
        }
        return step;
      }));

      // Simulate record migration for step 3
      if (currentStep === 2) {
        let records = 0;
        const recordInterval = setInterval(() => {
          records += Math.floor(Math.random() * 10000 + 5000);
          setRecordsMigrated(records);
          setSteps(prev => prev.map((step /* , index */) => {
            if (index === 2) {
              return { ...step, records };
            }
            return step;
          }));
          
          if (records > 250000) {
            clearInterval(recordInterval);
          }
        }, 100);
      }

      setTimeout(() => {
        setSteps(prev => prev.map((step /* , index */) => {
          if (index === currentStep) {
            return { ...step, status: 'complete' };
          }
          return step;
        }));
        currentStep++;
        runStep();
      }, steps[currentStep].duration * 1000);
    };

    runStep();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-slate-900 to-purple-900 rounded-2xl p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div><>

            <h2 className="text-3xl font-bold text-white mb-2">
              Legacy System Migration Wizard
            </h2>
            <p
</>
className="text-purple-200">
              Complete migration in 60 seconds. While legacy vendors are still loading.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white/60 hover:text-white p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {!migrationStarted ? (
            {/* Competitor Selection */}
            <div className="mb-8"><>

              <h3 className="text-xl font-bold text-white mb-4">
                Which inferior system are you escaping from?
              </h3>
              <div
</>
className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {competitors.map((competitor) => (
                  <motion.div
                    key={competitor.name}
                    whileHover={{ scale: 1.02 }}
                    onClick={() => setSelectedCompetitor(competitor.name)}
                    className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                      selectedCompetitor === competitor.name
                        ? 'border-purple-500 bg-purple-900/30'
                        : 'border-white/20 bg-white/5 hover:bg-white/10'
                    }`}
                  ><>

                    <h4 className="text-lg font-bold text-white mb-2">
                      {competitor.name}
                    </h4>
                    <div
</>
className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-red-400">
                        <Clock className="w-4 h-4" />
                        <span>Their timeline: {competitor.time}</span>
                      </div>
                      <div className="flex items-center gap-2 text-red-400">
                        <DollarSign className="w-4 h-4" />
                        <span>Their cost: {competitor.cost}</span>
                      </div>
                      <div className="flex items-center gap-2 text-yellow-400">
                        <Warning className="w-4 h-4" />
                        <span>{competitor.pain}</span>
                      </div>
                    </div>
                    {selectedCompetitor === competitor.name && (
                      <div className="mt-4 p-3 bg-green-900/30 rounded-lg border border-green-500/30">
                        <div className="flex items-center gap-2 text-green-400">
                          <Zap className="w-4 h-4" />
                          <span className="text-sm font-semibold">
                            We'll migrate this in 60 seconds
                          </span>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Migration Benefits */}
            <div className="mb-8 p-6 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-xl"><>

              <h3 className="text-xl font-bold text-white mb-4">
                What happens when you press the button:
              </h3>
              <div
</>
className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center"><>

                  <div className="text-4xl font-bold text-green-400 mb-2">60s</div>
                  <div
</>
className="text-white/80">Complete Migration</div>
                </div>
                <div className="text-center"><>

                  <div className="text-4xl font-bold text-blue-400 mb-2">$0</div>
                  <div
</>
className="text-white/80">Migration Cost</div>
                </div>
                <div className="text-center"><>

                  <div className="text-4xl font-bold text-purple-400 mb-2">100%</div>
                  <div
</>
className="text-white/80">Data Integrity</div>
                </div>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startMigration}
              disabled={!selectedCompetitor}
              className={`w-full py-4 rounded-xl text-xl font-bold transition-all ${
                selectedCompetitor
                  ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white hover:scale-105'
                  : 'bg-white/10 text-white/50 cursor-not-allowed'
              }`}
            >
              {selectedCompetitor 
                ? `Destroy ${selectedCompetitor} → Activate Terrafusion`
                : 'Select a competitor to migrate from'
              }
            </button>
        ) : (
            {/* Migration Progress */}
            <div className="mb-8">
              <h3 className="text-xl font-bold text-white mb-4">
                Migrating from {selectedCompetitor}
              </h3>
              
              {/* Progress Steps */}
              <div className="space-y-3">
                {steps.map((step /* , index */) => (
                  <motion.div
                    key={step.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border ${
                      step.status === 'complete' 
                        ? 'bg-green-900/30 border-green-500/50'
                        : step.status === 'running'
                        ? 'bg-blue-900/30 border-blue-500/50'
                        : 'bg-white/5 border-white/20'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {step.status === 'complete' ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : step.status === 'running' ? (
                          <motion.div
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          >
                            <Database className="w-5 h-5 text-blue-400" />
                          </motion.div>
                        ) : (
                          <Database className="w-5 h-5 text-white/40" />
                        )}
                        <span className={`font-medium ${
                          step.status === 'pending' ? 'text-white/50' : 'text-white'
                        }`}>
                          {step.name}
                        </span>
                      </div>
                      <div className="text-sm text-white/60">
                        {step.records !== undefined && step.status === 'running' && (
                          <span className="text-blue-400 font-bold">
                            {step.records.toLocaleString()} records
                          </span>
                        )}
                        {step.status === 'complete' && (
                          <span className="text-green-400">✓ {step.duration}s</span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Live Stats */}
              {recordsMigrated > 0 && !migrationComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 bg-purple-900/30 rounded-lg border border-purple-500/30"
                >
                  <div className="text-center"><>

                    <div className="text-4xl font-bold text-white mb-2">
                      {recordsMigrated.toLocaleString()}
                    </div>
                    <div
</>
className="text-purple-200">Records migrated</div>
                    <div className="text-sm text-purple-300 mt-2">
                      Speed: 379,000,000× faster than legacy systems
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Completion Message */}
            {migrationComplete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-8"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5 }}
                >
                  <CheckCircle className="w-20 h-20 text-green-400 mx-auto mb-4" />
                </motion.div><>

                <h3 className="text-3xl font-bold text-white mb-4">
                  Migration Complete!
                </h3>
                <p
</>
className="text-xl text-purple-200 mb-6">
                  Migrated {recordsMigrated.toLocaleString()} records in {totalTime.toFixed(1)} seconds
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                  <div className="bg-green-900/30 rounded-lg p-4 border border-green-500/30"><>

                    <div className="text-2xl font-bold text-white">$2.3M</div>
                    <div
</>
className="text-sm text-green-400">Savings identified by AI</div>
                  </div>
                  <div className="bg-blue-900/30 rounded-lg p-4 border border-blue-500/30"><>

                    <div className="text-2xl font-bold text-white">147</div>
                    <div
</>
className="text-sm text-blue-400">Compliance issues found</div>
                  </div>
                  <div className="bg-purple-900/30 rounded-lg p-4 border border-purple-500/30"><>

                    <div className="text-2xl font-bold text-white">94%</div>
                    <div
</>
className="text-sm text-purple-400">Efficiency improvement</div>
                  </div>
                </div><>

                <button
                  onClick={onClose}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-8 py-3 rounded-lg text-lg font-bold hover:scale-105 transition-transform"
                >
                  Start Using Terrafusion Now
                </button>
                <p
</>
className="text-sm text-white/40 mt-4">
                  {selectedCompetitor} is still loading their login screen
                </p>
              </motion.div>
            )}
        )}
      </motion.div>
    </motion.div>
  );
};