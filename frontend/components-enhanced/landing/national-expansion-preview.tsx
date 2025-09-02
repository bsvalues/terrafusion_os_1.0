"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export function NationalExpansionPreview() {
  return (
    <section className="py-20 px-4 bg-gradient-to-br from-dark via-dark-blue to-dark relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-accent/5 to-transcend/5" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-transcend/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />

      <div className="relative z-10 max-w-6xl mx-auto text-center"><>

        <Badge className="mb-6 bg-transcend/20 text-transcend border-transcend/30 px-6 py-2 text-lg">
          🚀 NATIONAL EXPANSION ACTIVE
        </Badge>

        <h2
</> className="text-5xl md:text-7xl font-black mb-6 bg-gradient-to-r from-primary via-accent to-transcend bg-clip-text text-transparent">
          TOTAL DOMINATION
        </h2><>


        <p className="text-2xl text-white/80 mb-4 font-bold">The Path to $1 Billion ARR</p>

        <p
</> className="text-xl text-white/60 mb-12 max-w-4xl mx-auto leading-relaxed">
          From 27 counties to 3,142 counties. From 2 states to all 50 states. The systematic transformation of American
          government technology is underway.
        </p>

        {/* Key Expansion Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12 max-w-4xl mx-auto">
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-primary/20"><>

            <div className="text-4xl font-black text-primary mb-2">3,142</div>
            <div
</> className="text-sm text-white/60 uppercase tracking-wide">Target Counties</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-accent/20"><>

            <div className="text-4xl font-black text-accent mb-2">50</div>
            <div
</> className="text-sm text-white/60 uppercase tracking-wide">States</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-transcend/20"><>

            <div className="text-4xl font-black text-transcend mb-2">350M</div>
            <div
</> className="text-sm text-white/60 uppercase tracking-wide">Citizens</div>
          </div>
          <div className="p-6 bg-black/30 backdrop-blur-xl rounded-xl border border-primary/20"><>

            <div className="text-4xl font-black text-primary mb-2">$1B</div>
            <div
</> className="text-sm text-white/60 uppercase tracking-wide">ARR Target</div>
          </div>
        </div>

        {/* Next Target States */}
        <div className="mb-12 p-8 bg-black/40 backdrop-blur-xl rounded-2xl border border-transcend/20 max-w-4xl mx-auto"><>

          <h3 className="text-2xl font-bold text-transcend mb-6">🎯 Next Battlegrounds</h3>
          <div
</> className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-lg border border-yellow-500/30"><>

              <div className="text-2xl mb-2">🌴</div>
              <div
</> className="text-lg font-bold text-yellow-400">California</div>
              <div className="text-sm text-white/60">Q2 2025</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-red-500/20 to-orange-500/20 rounded-lg border border-red-500/30"><>

              <div className="text-2xl mb-2">🤠</div>
              <div
</> className="text-lg font-bold text-red-400">Texas</div>
              <div className="text-sm text-white/60">Q3 2025</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-lg border border-blue-500/30"><>

              <div className="text-2xl mb-2">🗽</div>
              <div
</> className="text-lg font-bold text-blue-400">New York</div>
              <div className="text-sm text-white/60">Q4 2025</div>
            </div>
            <div className="p-4 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg border border-purple-500/30"><>

              <div className="text-2xl mb-2">🏙️</div>
              <div
</> className="text-lg font-bold text-purple-400">Illinois</div>
              <div className="text-sm text-white/60">Q1 2026</div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link href="/national">
            <Button
              size="lg"
              className="bg-gradient-to-r from-primary to-accent hover:from-primary/80 hover:to-accent/80 text-white font-bold px-8 py-4 text-lg transcend-glow"
            >
              🗺️ View Full Roadmap
            </Button>
          </Link>
          <Link href="/national/command-center">
            <Button
              size="lg"
              variant="outline"
              className="border-transcend text-transcend hover:bg-transcend/10 font-bold px-8 py-4 text-lg bg-transparent"
            >
              🎮 Command Center
            </Button>
          </Link>
        </div>

        {/* Vision Statement */}
        <div className="mt-16 p-8 bg-gradient-to-r from-primary/20 via-accent/20 to-transcend/20 rounded-2xl border border-transcend/30"><>

          <p className="text-2xl font-bold text-white mb-4">
            "By 2030, every American will interact with their local government through Terrafusion technology."
          </p>
          <p
</> className="text-lg text-white/80">
            We're not just modernizing government; we're redefining what citizens expect from it.
          </p>
          <div className="mt-4 text-transcend font-bold text-xl">#GovernmentTranscended</div>
        </div>
      </div>
    </section>
  )
}
