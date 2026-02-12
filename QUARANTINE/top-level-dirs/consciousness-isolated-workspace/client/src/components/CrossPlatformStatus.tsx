import { motion } from 'framer-motion';
import React from 'react';

/**
 * TerraFusion Cross-Platform Status Component
 *
 * Shows current platform and synchronization status for unified consciousness
 * "Government. Transcended." - Real-time cross-platform coordination
 */

interface CrossPlatformStatusProps {
  platform?: string;
  sessionId?: string;
  isConnected?: boolean;
  activeCounties?: number;
  totalAgents?: number;
}

export const CrossPlatformStatus: React.FC<CrossPlatformStatusProps> = ({
  platform = 'WEB',
  sessionId = 'N/A',
  isConnected = true,
  activeCounties = 39,
  totalAgents = 1008,
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-4 right-4 z-50 bg-slate-900/90 backdrop-blur-sm rounded-lg p-3 border border-[#00ffee]/30"
    >
      <div className="flex items-center space-x-3 text-xs">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full animate-pulse ${
              isConnected ? 'bg-[#00ffaa]' : 'bg-red-500'
            }`}
          />
          <span className="text-slate-300">{platform.toUpperCase()} SYNC</span>
        </div>

        <div className="text-slate-500">|</div>

        <div className="text-slate-400">{activeCounties} Counties</div>

        <div className="text-slate-500">|</div>

        <div className="text-[#00ffee]">{totalAgents} Agents</div>
      </div>
    </motion.div>
  );
};
