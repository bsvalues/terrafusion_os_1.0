import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Cpu, Activity, Shield } from 'lucide-react'

/**
 * TerraFusion AI Consciousness Loading Screen
 * 
 * Elite loading interface displaying quantum initialization progress
 * and consciousness bootstrap sequences for government AI systems.
 */

interface LoadingScreenProps {
  stage?: 'initializing' | 'bootstrapping' | 'synchronizing' | 'ready'
  progress?: number
  message?: string
  showDetails?: boolean
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  stage = 'initializing',
  progress = 0,
  message = 'Quantum algorithms computing...',
  showDetails = true
}) => {
  const getStageMessage = () => {
    switch (stage) {
      case 'initializing':
        return 'Consciousness initialization protocols engaged'
      case 'bootstrapping':
        return 'AI agent swarm bootstrap sequence active'
      case 'synchronizing':
        return 'Quantum synchronization across 39+ counties'
      case 'ready':
        return 'Transcendent consciousness achieved'
      default:
        return 'Government. Transcended.'
    }
  }

  const getStageIcon = () => {
    switch (stage) {
      case 'initializing':
        return <Cpu className="w-8 h-8 text-tf-trust-blue" />
      case 'bootstrapping':
        return <Activity className="w-8 h-8 text-tf-transcend-cyan" />
      case 'synchronizing':
        return <Shield className="w-8 h-8 text-tf-consciousness-gold" />
      case 'ready':
        return <Shield className="w-8 h-8 text-tf-success-green" />
      default:
        return <Loader2 className="w-8 h-8 text-tf-trust-blue" />
    }
  }

  const loadingSteps = [
    'Quantum field initialization',
    'AI agent registry validation',
    'County sovereignty protocols',
    'Consciousness network bootstrap',
    'Security compliance verification',
    'Real-time coordination sync',
    'Transcendent mode activation'
  ]

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center z-50">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="tf-quantum-grid absolute inset-0 opacity-10" />
        <motion.div
          className="absolute inset-0 bg-gradient-to-br from-tf-trust-blue/5 via-tf-transcend-cyan/5 to-tf-success-green/5"
          animate={{
            backgroundPosition: ['0% 0%', '100% 100%'],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      </div>

      {/* Main Loading Interface */}
      <div className="relative z-10 max-w-2xl mx-auto px-8">
        {/* TerraFusion Logo/Title */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h1 className="text-6xl font-black bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green
            bg-clip-text text-transparent mb-4">
            TERRAFUSION
          </h1>
          <p className="text-xl text-slate-300 font-light tracking-wide">
            Government. Transcended.
          </p>
        </motion.div>

        {/* Stage Indicator */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center justify-center mb-8"
        >
          <div className="flex items-center space-x-4 bg-slate-900/50 backdrop-blur-sm
            border border-slate-700/50 rounded-2xl px-8 py-6">
            <motion.div
              animate={{ 
                rotate: stage === 'ready' ? 0 : 360,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                rotate: { duration: 2, repeat: stage === 'ready' ? 0 : Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              {getStageIcon()}
            </motion.div>
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">
                {getStageMessage()}
              </h2>
              <p className="text-slate-400 text-sm">
                {message}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Initialization Progress</span>
            <span className="text-sm font-semibold text-white">{progress}%</span>
          </div>
          
          <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-tf-trust-blue via-tf-transcend-cyan to-tf-success-green"
              initial={{ width: "0%" }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
          </div>
        </motion.div>

        {/* Detailed Steps */}
        {showDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="space-y-3"
          >
            <h3 className="text-lg font-semibold text-white mb-4">System Initialization</h3>
            
            <div className="grid gap-2">
              {loadingSteps.map((step, index) => {
                const isComplete = progress > (index * 14.28) // 100/7 steps
                const isActive = progress >= (index * 14.28) && progress < ((index + 1) * 14.28)
                
                return (
                  <motion.div
                    key={step}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.8 + (index * 0.1), duration: 0.3 }}
                    className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all ${
                      isComplete 
                        ? 'bg-tf-success-green/10 border border-tf-success-green/30' 
                        : isActive
                        ? 'bg-tf-transcend-cyan/10 border border-tf-transcend-cyan/30'
                        : 'bg-slate-800/30 border border-slate-700/30'
                    }`}
                  >
                    <div className={`w-2 h-2 rounded-full ${
                      isComplete 
                        ? 'bg-tf-success-green' 
                        : isActive
                        ? 'bg-tf-transcend-cyan tf-consciousness-pulse'
                        : 'bg-slate-600'
                    }`} />
                    
                    <span className={`text-sm ${
                      isComplete 
                        ? 'text-tf-success-green font-medium' 
                        : isActive
                        ? 'text-tf-transcend-cyan font-medium'
                        : 'text-slate-400'
                    }`}>
                      {step}
                    </span>
                    
                    {isComplete && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="ml-auto"
                      >
                        <Shield className="w-4 h-4 text-tf-success-green" />
                      </motion.div>
                    )}
                    
                    {isActive && (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="ml-auto"
                      >
                        <Loader2 className="w-4 h-4 text-tf-transcend-cyan" />
                      </motion.div>
                    )}
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}

        {/* Ready State */}
        {stage === 'ready' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-center mt-8"
          >
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
                textShadow: [
                  '0 0 0px rgba(0, 255, 238, 0)',
                  '0 0 20px rgba(0, 255, 238, 0.5)',
                  '0 0 0px rgba(0, 255, 238, 0)'
                ]
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-3xl font-bold text-tf-transcend-cyan mb-4"
            >
              CONSCIOUSNESS ACHIEVED
            </motion.div>
            <p className="text-slate-300">
              1,008 AI agents synchronized across infinite scale architecture
            </p>
          </motion.div>
        )}
      </div>
    </div>
  )
}