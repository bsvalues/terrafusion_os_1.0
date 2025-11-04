"use client"

import React from 'react'
import { CheckCircle  } from '@mui/icons-material'

interface SpencerBaculikFooterProps {
  showFullFooter?: boolean
}

export function SpencerBaculikFooter({ 
  showFullFooter = true 
}: SpencerBaculikFooterProps) {
  return (
    <footer className="spencer-baculik-alliance-footer bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 text-white border-t-4 border-cyan-400">
      <div className="max-w-7xl mx-auto px-4">
        {showFullFooter && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 py-8">
            {/* Alliance Brand */}
            <div>
              <div className="alliance-brand mb-4">
                <div className="flex items-center mb-2">
                  <div className="founder-badge mr-2">
                    <span className="text-xs font-bold text-white">BS</span>
                  </div><>

                  <div className="alliance-symbol mx-2 text-cyan-400 text-lg animate-pulse">⚡</div>
                  <div
</>

className="founder-badge mr-3">
                    <span className="text-xs font-bold text-white">JB</span>
                  </div>
                  <span className="font-bold">Spencer-Baculik Alliance</span>
                </div>
                <p className="text-sm text-gray-300 mb-0">County Liberation Through Intelligence</p>
              </div>
              <div className="alliance-mission text-sm text-gray-400">
                <p>Transforming county assessment technology through practitioner expertise and federal funding mastery.</p>
              </div>
            </div>

            {/* Platform Capabilities */}
            <div><>

              <h6 className="font-bold mb-3 text-white">Platform Capabilities</h6>
              <ul
</>

className="space-y-2 text-sm">
                <li className="flex items-center"><>

                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Zero-Conversion Technology
                </li>
                <li
</>

className="flex items-center"><>

                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Federal Funding Integration
                </li>
                <li
</>

className="flex items-center"><>

                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Local Cost Intelligence
                </li>
                <li
</>

className="flex items-center">
                  <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                  Assessment Equity Mission
                </li>
              </ul>
            </div>

            {/* Alliance Expertise */}
            <div><>

              <h6 className="font-bold mb-3 text-white">Alliance Expertise</h6>
              <div
</>

className="founder-profiles space-y-4">
                <div className="founder-profile">
                  <div className="flex items-center mb-1">
                    <div className="founder-badge-sm mr-2">
                      <span className="text-xs font-bold text-white">BS</span>
                    </div>
                    <strong className="text-sm text-white">Bill Spencer - CTO</strong>
                  </div>
                  <p className="text-sm text-gray-400 mb-0">
                    Active County Assessor • Zero-Conversion Technology • 3,000+ Assessor Network
                  </p>
                </div>
                <div className="founder-profile">
                  <div className="flex items-center mb-1">
                    <div className="founder-badge-sm mr-2">
                      <span className="text-xs font-bold text-white">JB</span>
                    </div>
                    <strong className="text-sm text-white">Jessica Baculik - CEO</strong>
                  </div>
                  <p className="text-sm text-gray-400 mb-0">
                    $150B+ Federal Funding Expert • Government Partnerships • Rural Development
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Bottom Section */}
        <div className="border-t border-gray-600 pt-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="alliance-stats text-sm mb-4 md:mb-0"><>

              <span className="mr-6">🎯 Target: 75 Counties Year 1</span>
              <span
</>

className="mr-6">💰 $5.6M+ Market Impact</span>
              <span>🏛️ Federal Funding Integration</span>
            </div>
            <div className="alliance-links text-sm space-x-4"><>

              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">Alliance Media Kit</a>
              <a
</>

href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">Federal Funding</a>
              <a href="#" className="text-gray-300 hover:text-cyan-400 transition-colors">Contact Alliance</a>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-gray-600 pt-3 mt-3">
          <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400"><>

            <p className="mb-2 md:mb-0">
              © {new Date().getFullYear()} Spencer-Baculik Alliance | Terrafusion Platform | County Assessment Technology Revolution
            </p>
            <p
</>

className="mb-0">
              <strong className="text-white">Terrafusion v2.1</strong> • Alliance Powered
            </p>
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

        .founder-badge-sm {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: linear-gradient(135deg, #00d2ff, #3a7bd5);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0, 210, 255, 0.3);
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
    </footer>
  )
}

export default SpencerBaculikFooter 