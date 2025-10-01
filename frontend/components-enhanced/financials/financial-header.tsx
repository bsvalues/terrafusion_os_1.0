import {TrendingUp, Target} from '@mui/icons-material'

export function FinancialHeader() {return (
    <div className="border-b border-primary/20 bg-dark-900/50 backdrop-blur-sm"><div className="container mx-auto px-4 py-6"><div className="flex items-center justify-between"><div><><h1 className="text-3xl font-bold text-white mb-2">Financial Projections</h1><p
</>
className="text-gray-300">Path to $1B ARR across 1000+ counties</p></div><div className="flex items-center gap-4"><div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg border border-primary/20"><Target className="w-5 h-5 text-primary" /><span className="text-white font-semibold">$1B ARR Target</span></div><div className="flex items-center gap-2 px-4 py-2 bg-accent/10 rounded-lg border border-accent/20"><TrendingUp className="w-5 h-5 text-accent" /><span className="text-white font-semibold">5-Year Plan</span></div></div></div></div></div>
  )}
