import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ShockAweConfig {
  mode: 'jobs' | 'musk' | 'tesla' | 'ives' | 'belichick';
  audience: string[];
  objectives: string[];
  performance: {
    speed: string;
    market: string;
    technology: string;
    moat: string;
    results: string;
  };
}

const SHOCK_AWE_CONFIG: ShockAweConfig = {
  mode: 'jobs',
  audience: ['Board Members', 'Strategic Partners', 'Government CIOs', 'Elite Developers', 'Potential Investors'],
  objectives: [
    'Position Terrafusion OS as the single inevitable platform for county + government operating systems',
    'Demonstrate mastery across DevOps, AI, GIS, Taxation, and Public Records',
    'Showcase Terrafusion OS as a species-level upgrade, not just software',
    'Overwhelm competitors with elegance and momentum'
  ],
  performance: {
    speed: '379,000,000× speed improvement',
    market: '$1B ARR potential across 3,142 counties',
    technology: '19 specialized modules, 1,008 AI agents, hybrid PWA+Tauri architecture',
    moat: 'Patent-protected government operating system',
    results: 'Production-ready for Benton County (94,149 properties, $28.4B value)'
  }
};

export const ShockAwePresentation: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [mode, setMode] = useState<ShockAweConfig['mode']>('jobs');

  const slides = [
    {
      title: "⚡ TERRA-FUSION OS",
      subtitle: "SHOCK & AWE PROTOCOL",
      content: "The inevitable center of gravity in government tech"
    },
    {
      title: "🏆 PERFORMANCE",
      subtitle: SHOCK_AWE_CONFIG.performance.speed,
      content: "Not an improvement. A transcendence."
    },
    {
      title: "🌍 MARKET DOMINANCE",
      subtitle: SHOCK_AWE_CONFIG.performance.market,
      content: "Every county. Every state. Inevitable adoption."
    },
    {
      title: "🤖 AI SUPREMACY",
      subtitle: "147 AI Models • 1,008 Agents",
      content: "The only government platform with comprehensive AI intelligence"
    },
    {
      title: "💎 PROVEN RESULTS",
      subtitle: "Benton County Production",
      content: "94,149 properties • $28.4B value • Live deployment"
    }
  ];

  const modeStyles = {
    jobs: {
      background: 'linear-gradient(135deg, #000000 0%, #1a1a1a 100%)',
      accent: '#007AFF',
      font: 'SF Pro Display, -apple-system, sans-serif'
    },
    musk: {
      background: 'linear-gradient(135deg, #0a0a0a 0%, #1a0a0a 100%)',
      accent: '#FF6B35',
      font: 'Inter, sans-serif'
    },
    tesla: {
      background: 'linear-gradient(135deg, #000000 0%, #CC0000 100%)',
      accent: '#FFFFFF',
      font: 'Tesla, sans-serif'
    },
    ives: {
      background: 'linear-gradient(135deg, #F5F5F7 0%, #FFFFFF 100%)',
      accent: '#1D1D1F',
      font: 'SF Pro Display, sans-serif'
    },
    belichick: {
      background: 'linear-gradient(135deg, #002244 0%, #C60C30 100%)',
      accent: '#FFFFFF',
      font: 'Arial, sans-serif'
    }
  };

  const currentStyle = modeStyles[mode];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [slides.length]);

  return (
    <div 
      className="w-full h-screen flex flex-col justify-center items-center text-white relative overflow-hidden"
      style={{ 
        background: currentStyle.background,
        fontFamily: currentStyle.font
      }}
    >
      {/* Mode Selector */}
      <div className="absolute top-4 right-4 flex gap-2 z-10">
        {Object.keys(modeStyles).map((modeKey) => (
          <button
            key={modeKey}
            onClick={() => setMode(modeKey as ShockAweConfig['mode'])}
            className={`px-3 py-1 rounded text-xs font-bold transition-all ${
              mode === modeKey 
                ? 'bg-white text-black' 
                : 'bg-black/20 text-white/70 hover:bg-white/10'
            }`}
          >
            {modeKey.toUpperCase()}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="text-center max-w-4xl px-8"
        >
          <motion.h1 
            className="text-8xl font-black mb-6 tracking-tight"
            style={{ color: currentStyle.accent }}
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {slides[currentSlide].title}
          </motion.h1>
          
          <motion.h2 
            className="text-4xl font-light mb-8 opacity-90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.9 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            {slides[currentSlide].subtitle}
          </motion.h2>
          
          <motion.p 
            className="text-2xl font-medium opacity-80 max-w-2xl mx-auto leading-relaxed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            {slides[currentSlide].content}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Progress Indicators */}
      <div className="absolute bottom-8 flex gap-3">
        {slides.map((_ /* , index */) => (
          <button
            key={index}
            onClick={() => setCurrentSlide(index)}
            className={`w-3 h-3 rounded-full transition-all ${
              index === currentSlide 
                ? 'bg-white' 
                : 'bg-white/30 hover:bg-white/50'
            }`}
          />
        ))}
      </div>

      {/* Floating Metrics */}
      <div className="absolute bottom-20 left-8 text-left"><>

        <div className="text-sm opacity-60 mb-1">PERFORMANCE MULTIPLIER</div>
        <div
</> className="text-2xl font-bold" style={{ color: currentStyle.accent }}>
          379,000,000×
        </div>
      </div>

      <div className="absolute bottom-20 right-8 text-right"><>

        <div className="text-sm opacity-60 mb-1">MARKET POTENTIAL</div>
        <div
</> className="text-2xl font-bold" style={{ color: currentStyle.accent }}>
          $1B ARR
        </div>
      </div>
    </div>
  );
};

export default ShockAwePresentation;
