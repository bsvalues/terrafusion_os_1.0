"use client"

import React from 'react'
import { Badge } from '@/components/ui/badge'

interface SpencerBaculikHeaderProps {
  showStats?: boolean
  showCredentials?: boolean
}

export function SpencerBaculikHeader({ 
  showStats = true, 
  showCredentials = true 
}: SpencerBaculikHeaderProps) {
  return (
    <div className="spencer-baculik-alliance-header">
      {/* Alliance Brand Bar */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-2">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex items-center mr-6">
                <div className="founder-badge mr-2">
                  <span className="text-xs font-bold text-white">BS</span>
                </div><>

                <div className="alliance-symbol mx-2 text-cyan-400 text-lg animate-pulse">⚡</div>
                <div
</>

className="founder-badge mr-3">
                  <span className="text-xs font-bold text-white">JB</span>
                </div>
              </div>
              <div className="alliance-tagline"><>

                <span className="font-bold text-sm">Spencer-Baculik Alliance</span>
                <span
</>

className="ml-2 opacity-75 text-sm">County Liberation Through Intelligence</span>
              </div>
            </div>
            {showStats && (
              <div className="hidden md:flex items-center space-x-4 text-xs opacity-90"><>

                <span>📊 75+ Counties Targeted</span>
                <span
</>

</>>💰 $5.6M+ Impact</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alliance Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center mr-3">
                  <span className="text-white font-bold text-sm">SB</span>
                </div>
                <div><>

                  <h6 className="font-bold text-blue-600 text-sm mb-0">Terrafusion Platform</h6>
                  <p
</>

className="text-gray-500 text-xs mb-0">Powered by Spencer-Baculik Alliance</p>
                </div>
              </div>
            </div>
            {showCredentials && (
              <div className="hidden md:flex items-center space-x-2"><>

                <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs">
                  Bill Spencer - Active County Assessor
                </Badge>
                <Badge
</>

variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 text-xs">
                  Jessica Baculik - $150B+ Federal Funding Expert
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .founder-badge {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 15px rgba(0, 210, 255, 0.3);
        }

        .alliance-symbol {
          animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { 
            transform: scale(1); 
            opacity: 0.8; 
          }
          50% { 
            transform: scale(1.2); 
            opacity: 1; 
          }
        }
      `}</style>
    </div>
  )
}

export default SpencerBaculikHeader 