import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Building, FileText, Users, TrendingUp, MapPin, Clock, DollarSign  } from '@mui/icons-material';
import { BentonCountyData } from '../data/bentonCounty';

interface PulseData {
  permits: number;
  meetings: number;
  contracts: number;
  citizens: number;
  revenue: string;
  efficiency: number;
  activeNow: number;
  trending: string;
}

export const CountyPulse: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [pulseData, setPulseData] = useState<PulseData>({
    permits: Math.floor(BentonCountyData.statistics.annualPermits / 365), // Daily average
    meetings: 3,
    contracts: 12,
    citizens: BentonCountyData.county.population,
    revenue: BentonCountyData.statistics.annualTaxCollected,
    efficiency: 94.2,
    activeNow: 1247,
    trending: 'Building Permits ↑ 23%'
  });
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    // Real-time activity simulation
    const interval = setInterval(() => {
      const newActivity = {
        id: Date.now(),
        type: ['permit', 'meeting', 'contract', 'payment'][Math.floor(Math.random() * 4)],
        description: [
          'Building permit approved',
          'Public meeting scheduled',
          'Contract awarded',
          'Payment processed',
          'License renewed',
          'Inspection completed'
        ][Math.floor(Math.random() * 6)],
        amount: Math.random() > 0.5 ? `$${Math.floor(Math.random() * 100000).toLocaleString()}` : null,
        timestamp: new Date()
      };

      setActivities(prev => [newActivity, ...prev].slice(0, 5));
      
      // Update pulse data
      setPulseData(prev => ({
        ...prev,
        activeNow: prev.activeNow + Math.floor(Math.random() * 10 - 5),
        permits: prev.permits + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    let animationId: number;
    const particles: any[] = [];
    const particleCount = 50;

    // Create particles representing county activity
    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.offsetWidth,
        y: Math.random() * canvas.offsetHeight,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
        size: Math.random() * 3 + 1,
        pulse: Math.random() * Math.PI * 2,
        color: ['64, 147, 255', '147, 51, 234', '34, 197, 94'][Math.floor(Math.random() * 3)]
      });
    }

    const animate = () => {
      ctx.fillStyle = 'rgba(15, 23, 42, 0.1)';
      ctx.fillRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);

      particles.forEach(particle => {
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.pulse += 0.05;

        // Wrap around edges
        if (particle.x < 0) particle.x = canvas.offsetWidth;
        if (particle.x > canvas.offsetWidth) particle.x = 0;
        if (particle.y < 0) particle.y = canvas.offsetHeight;
        if (particle.y > canvas.offsetHeight) particle.y = 0;

        // Draw particle with pulsing effect
        const pulseSize = particle.size + Math.sin(particle.pulse) * 1;
        const opacity = 0.6 + Math.sin(particle.pulse) * 0.4;

        ctx.beginPath();
        ctx.arc(particle.x, particle.y, pulseSize, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${particle.color}, ${opacity})`;
        ctx.fill();

        // Draw connections between nearby particles
        particles.forEach(other => {
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < 100 && distance > 0) {
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.strokeStyle = `rgba(${particle.color}, ${0.2 * (1 - distance / 100)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <div className="relative">
      {/* Beautiful Canvas Background */}
      <div className="relative h-96 rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 to-purple-900">
        <canvas
          ref={canvasRef}
          className="absolute inset-0 w-full h-full"
        />
        
        {/* Overlay Stats */}
        <div className="absolute inset-0 p-8">
          <div className="h-full flex flex-col justify-between">
            {/* Header */}
            <div><>

              <h3 className="text-3xl font-bold text-white mb-2">Benton County Pulse</h3>
              <p
</> className="text-purple-200">Real-time activity across {BentonCountyData.county.area}</p>
            </div>

            {/* Center Metrics */}
            <div className="flex justify-center">
              <motion.div
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-center"
              ><>

                <div className="text-6xl font-bold text-white mb-2">
                  {pulseData.activeNow.toLocaleString()}
                </div>
                <div
</> className="text-purple-200">Active Processes Now</div>
              </motion.div>
            </div>

            {/* Bottom Stats */}
            <div className="flex justify-between">
              <div className="text-white/80">
                <Activity className="w-5 h-5 mb-1 text-green-400" />
                <span className="text-sm">{pulseData.efficiency}% Efficiency</span>
              </div>
              <div className="text-white/80">
                <TrendingUp className="w-5 h-5 mb-1 text-blue-400" />
                <span className="text-sm">{pulseData.trending}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Activity Feed */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Live Feed */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><>

            <Clock className="w-5 h-5 text-purple-400" />
            Live Activity Feed
          </h4>
          <div
</> className="space-y-3">
            {activities.map((activity /* , index */) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
              >
                <div><>

                  <p className="text-white text-sm font-medium">{activity.description}</p>
                  <p
</> className="text-white/50 text-xs">
                    {activity.timestamp.toLocaleTimeString()}
                  </p>
                </div>
                {activity.amount && (
                  <span className="text-green-400 font-semibold">{activity.amount}</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Key Metrics */}
        <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6">
          <h4 className="text-xl font-bold text-white mb-4 flex items-center gap-2"><>

            <TrendingUp className="w-5 h-5 text-blue-400" />
            Today's Metrics
          </h4>
          <div
</> className="grid grid-cols-2 gap-4">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 rounded-lg p-4"
            >
              <FileText className="w-6 h-6 text-blue-400 mb-2" /><>

              <div className="text-2xl font-bold text-white">{pulseData.permits}</div>
              <div
</> className="text-sm text-white/60">Permits Today</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 rounded-lg p-4"
            >
              <Building className="w-6 h-6 text-green-400 mb-2" /><>

              <div className="text-2xl font-bold text-white">{pulseData.contracts}</div>
              <div
</> className="text-sm text-white/60">Contracts</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 rounded-lg p-4"
            >
              <Users className="w-6 h-6 text-purple-400 mb-2" /><>

              <div className="text-2xl font-bold text-white">{pulseData.meetings}</div>
              <div
</> className="text-sm text-white/60">Meetings</div>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-white/5 rounded-lg p-4"
            >
              <DollarSign className="w-6 h-6 text-yellow-400 mb-2" /><>

              <div className="text-2xl font-bold text-white">{pulseData.revenue}</div>
              <div
</> className="text-sm text-white/60">Revenue YTD</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status Bar */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-6 bg-gradient-to-r from-green-900/50 to-blue-900/50 rounded-xl p-4 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse" />
            <span className="text-white font-medium">All Systems Operational</span>
          </div>
          <div className="text-white/60 text-sm">
            Processing {pulseData.citizens.toLocaleString()} citizen records • 
            379,000,000× faster than legacy systems
          </div>
        </div>
      </motion.div>
    </div>
  );
};