import { Badge } from "@/components/ui/badge"

interface SpencerBaculikBannerProps {
  showStats?: boolean
  variant?: 'full' | 'compact'
}

export function SpencerBaculikBanner({ 
  showStats = true, 
  variant = 'full' 
}: SpencerBaculikBannerProps) {
  if (variant === 'compact') {
    return (
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-2 px-4 rounded-lg mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-4">
              <div className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mr-1">
                <span className="text-xs font-bold">BS</span>
              </div><>

              <span className="text-cyan-400 mx-1">⚡</span>
              <div
</>

className="w-6 h-6 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mr-2">
                <span className="text-xs font-bold">JB</span>
              </div>
            </div>
            <span className="font-bold text-sm">Spencer-Baculik Alliance</span>
          </div>
          {showStats && (
            <div className="text-xs opacity-90">
              <span>75+ Counties • $5.6M+ Impact</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="spencer-baculik-alliance-banner border border-gray-200 rounded-lg overflow-hidden shadow-sm mb-6">
      {/* Alliance Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 text-white py-3 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center mr-6">
              <div className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mr-2 shadow-lg">
                <span className="text-xs font-bold text-white">BS</span>
              </div><>

              <div className="text-cyan-400 text-lg mx-2 animate-pulse">⚡</div>
              <div
</>

className="w-8 h-8 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mr-3 shadow-lg">
                <span className="text-xs font-bold text-white">JB</span>
              </div>
            </div>
            <div><>

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

      {/* Platform Info */}
      <div className="bg-white p-4 border-t border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg flex items-center justify-center mr-4 shadow-md">
              <span className="text-white font-bold text-sm">SB</span>
            </div>
            <div><>

              <h6 className="font-bold text-blue-600 mb-1">Terrafusion Platform</h6>
              <p
</>

className="text-gray-500 text-sm mb-0">Powered by Spencer-Baculik Alliance</p>
            </div>
          </div>
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
        </div>
      </div>

      {/* Value Proposition */}
      <div className="bg-blue-50 p-4 border-t border-blue-100">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><>

            <div className="font-bold text-blue-600">Zero-Conversion</div>
            <div
</>

className="text-xs text-gray-600">Technology</div>
          </div>
          <div><>

            <div className="font-bold text-green-600">Federal Funding</div>
            <div
</>

className="text-xs text-gray-600">Integration</div>
          </div>
          <div><>

            <div className="font-bold text-purple-600">Local Intelligence</div>
            <div
</>

className="text-xs text-gray-600">Cost Data</div>
          </div>
          <div><>

            <div className="font-bold text-orange-600">Assessment Equity</div>
            <div
</>

className="text-xs text-gray-600">Mission</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SpencerBaculikBanner 