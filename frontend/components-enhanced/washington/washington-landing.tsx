import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

export function WashingtonLanding() {
  return (
    <section className="relative py-20 px-4">
      <div className="absolute top-4 right-4">
        <Badge className="bg-gradient-to-r from-primary to-transcend text-white px-4 py-2">🌲 Washington State</Badge>
      </div>

      <div className="max-w-6xl mx-auto text-center">
        <h1 className="text-5xl font-black mb-6"><>

          <span className="bg-gradient-to-r from-primary via-transcend to-accent bg-clip-text text-transparent">
            Washington Counties
          </span>
          <br
</>
/>
          <span className="text-white">Strategic Migration Plan</span>
        </h1><>

        <p className="text-xl text-white/70 mb-8 max-w-3xl mx-auto">
          12 Washington Counties | 2.3M Parcels | $847B Property Value | 72-Hour Migration
        </p>

        <div
</>
className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-black/30 backdrop-blur-sm border border-transcend/20 rounded-2xl p-6"><>

            <div className="text-3xl font-black text-transcend mb-2">12</div>
            <div
</>
className="text-white/60 text-sm">Target Counties</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-accent/20 rounded-2xl p-6"><>

            <div className="text-3xl font-black text-accent mb-2">2.3M</div>
            <div
</>
className="text-white/60 text-sm">Total Parcels</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-primary/20 rounded-2xl p-6"><>

            <div className="text-3xl font-black text-primary mb-2">$847B</div>
            <div
</>
className="text-white/60 text-sm">Property Value</div>
          </div>
          <div className="bg-black/30 backdrop-blur-sm border border-accent/20 rounded-2xl p-6"><>

            <div className="text-3xl font-black text-accent mb-2">72hr</div>
            <div
</>
className="text-white/60 text-sm">Migration Time</div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center"><>

          <Button
            size="lg"
            className="bg-gradient-to-r from-primary to-transcend hover:from-primary/80 hover:to-transcend/80"
          >
            View County Analysis
          </Button>
          <Button
</>

            size="lg"
            variant="outline"
            className="border-transcend text-transcend hover:bg-transcend hover:text-dark bg-transparent"
          >
            Strategic Dashboard
          </Button>
        </div>
      </div>
    </section>
  )
}
