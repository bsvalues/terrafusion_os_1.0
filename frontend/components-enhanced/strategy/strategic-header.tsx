import { Target, TrendingUp  } from '@mui/icons-material'

export function StrategicHeader() {
  return (
    <div className="border-b border-primary/20 bg-dark-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div><>

            <h1 className="text-3xl font-bold text-white mb-2">Strategic Command Center</h1>
            <p
</>
className="text-gray-300">Data-driven county conquest and messaging optimization</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20">
              <Target className="w-5 h-5 text-primary" />
              <span className="text-white font-semibold">98% Target Adoption</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <TrendingUp className="w-5 h-5 text-accent" />
              <span className="text-white font-semibold">4 Segments Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
