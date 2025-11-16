import { Calendar, CheckCircle  } from '@mui/icons-material'

export function MigrationPlanningHeader() {
  return (
    <div className="border-b border-primary/20 bg-dark-900/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-6">
        <div className="flex items-center justify-between">
          <div><>

            <h1 className="text-3xl font-bold text-white mb-2">Migration Planning Tools</h1>
            <p
</>
className="text-gray-300">Comprehensive county migration planning and execution</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20">
              <Calendar className="w-5 h-5 text-accent" />
              <span className="text-white font-semibold">24-72 Hour Migrations</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-transcend/10 rounded-lg border border-transcend/20">
              <CheckCircle className="w-5 h-5 text-transcend" />
              <span className="text-white font-semibold">100% Success Rate</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
