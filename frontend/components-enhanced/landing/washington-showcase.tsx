import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import Link from "next/link"

export function WashingtonShowcase() {return (
    <section className="py-20 px-4 bg-gradient-to-r from-dark/50 to-primary/5"><div className="max-w-6xl mx-auto text-center"><><Badge className="bg-gradient-to-r from-primary to-transcend text-white px-6 py-2 mb-6">🌲 Featured Initiative</Badge><h2
</>
className="text-4xl font-black mb-6"><><span className="bg-gradient-to-r from-primary via-transcend to-accent bg-clip-text text-transparent">Washington State Counties</span><br
</>
/><span className="text-white">Leading the Nation</span></h2><><p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">12 counties, 2.3M parcels, $847B in property value. See how Washington is becoming the first fully-transcended
          state with Terrafusion OS.</p><div
</>
className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12"><div className="bg-black/30 backdrop-blur-sm border border-transcend/20 rounded-2xl p-6"><><div className="text-3xl font-black text-transcend mb-2">12</div><div
</>
className="text-white/60 text-sm">Target Counties</div></div><div className="bg-black/30 backdrop-blur-sm border border-accent/20 rounded-2xl p-6"><><div className="text-3xl font-black text-accent mb-2">72hr</div><div
</>
className="text-white/60 text-sm">Migration Time</div></div><div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-2xl p-6"><><div className="text-3xl font-black text-primary mb-2">$28M</div><div
</>
className="text-white/60 text-sm">Annual Savings</div></div><div className="bg-black/30 backdrop-blur-sm border border-accent/20 rounded-2xl p-6"><><div className="text-3xl font-black text-accent mb-2">98%</div><div
</>
className="text-white/60 text-sm">Integration Ready</div></div></div><div className="flex flex-col sm:flex-row gap-4 justify-center"><Link href="/washington"><Button
              size="lg"
              className="bg-gradient-to-r from-primary to-transcend hover:from-primary/80 hover:to-transcend/80"
            >View Washington Strategy</Button></Link><Link href="/washington/dashboard"><Button
              size="lg"
              variant="outline"
              className="border-transcend text-transcend hover:bg-transcend hover:text-dark bg-transparent"
            >Strategic Dashboard</Button></Link></div></div></section>
  )}
