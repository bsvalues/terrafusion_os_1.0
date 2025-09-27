"use client"

import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {Card, CardContent} from "@/components/ui/card"
import {Badge} from "@/components/ui/badge"
import {ChevronRight, Zap, Target, Rocket} from '@mui/icons-material'

const presentationSlides = [
  {id: "recognition",
    title: "THE MOMENT OF RECOGNITION",
    content: (
      <div className="text-center space-y-8"><><div className="text-sm text-tf-accent mb-8">*[SILENCE. 10 SECONDS OF ABSOLUTE SILENCE.]*</div><h2
</>className="text-4xl md:text-6xl font-bold text-tf-light leading-tight">
          Today, we don't discuss software.</h2><h2 className="text-4xl md:text-6xl font-bold clarity-gradient bg-clip-text text-transparent">Today, we discuss<strong>species-level evolution</strong>.
        </h2></div>),
    bgClass: "bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-dark"},
  {id: "problem",
    title: "THE PROBLEM: GOVERNMENT IS BROKEN",
    content: (<div className="text-center space-y-8"><div className="space-y-6"><><div className="text-6xl font-black text-tf-error">379,000,000×</div><div
</>
className="text-xl text-tf-light">slower than it should be</div></div><div className="space-y-6"><><div className="text-6xl font-black text-tf-error">$2.8 trillion</div><div
</>
className="text-xl text-tf-light">wasted annually on bureaucratic friction</div></div><div className="space-y-6"><><div className="text-6xl font-black text-tf-error">350 million</div><div
</>
className="text-xl text-tf-light">citizens trapped in 1970s technology</div></div><div className="mt-12 space-y-4"><><p className="text-2xl text-tf-accent italic">This is not acceptable.</p><p
</>
className="text-2xl text-tf-transcend font-bold">This ends now.</p></div></div>),
    bgClass: "bg-gradient-to-br from-red-900/20 via-tf-dark to-tf-dark-lighter"},
  {id: "solution",
    title: "THE SOLUTION: TERRAFUSION OS",
    content: (<div className="text-center space-y-12"><><h1 className="text-8xl md:text-9xl font-black clarity-gradient bg-clip-text text-transparent transcend-animation">Terrafusion OS</h1><h2
</>
className="text-4xl font-bold text-tf-primary">Government. Transcended.</h2><div className="space-y-6 max-w-4xl mx-auto"><><p className="text-2xl text-tf-light">Not an upgrade. Not an improvement.</p><p
</>className="text-3xl font-bold text-tf-transcend">
            Complete replacement of the operating system that runs America.</p></div></div>),
    bgClass: "bg-gradient-to-br from-tf-primary/10 via-tf-transcend/10 to-tf-accent/10"},
  {id: "physics",
    title: "THE PHYSICS OF INEVITABILITY",
    content: (<div className="grid md:grid-cols-3 gap-8"><Card className="bg-tf-dark-lighter/50 border-tf-primary/30"><CardContent className="p-8 text-center"><><h3 className="text-2xl font-bold text-tf-primary mb-6">Performance</h3><div
</>
className="space-y-4"><div><><div className="text-3xl font-black text-tf-transcend">379,000,000×</div><div
</>
className="text-sm text-tf-light">speed improvement</div></div><div><><div className="text-3xl font-black text-tf-transcend">0.47ms</div><div
</>
className="text-sm text-tf-light">property valuation</div></div><div><><div className="text-3xl font-black text-tf-transcend">&lt;2s</div><div
</>
className="text-sm text-tf-light">response time</div></div></div></CardContent></Card><Card className="bg-tf-dark-lighter/50 border-tf-accent/30"><CardContent className="p-8 text-center"><><h3 className="text-2xl font-bold text-tf-accent mb-6">Scale</h3><div
</>
className="space-y-4"><div><><div className="text-3xl font-black text-tf-transcend">3,142</div><div
</>
className="text-sm text-tf-light">counties nationwide</div></div><div><><div className="text-3xl font-black text-tf-transcend">$1B</div><div
</>
className="text-sm text-tf-light">ARR potential</div></div><div><><div className="text-3xl font-black text-tf-transcend">1,008</div><div
</>
className="text-sm text-tf-light">AI agents</div></div></div></CardContent></Card><Card className="bg-tf-dark-lighter/50 border-tf-transcend/30"><CardContent className="p-8 text-center"><><h3 className="text-2xl font-bold text-tf-transcend mb-6">Inevitability</h3><div
</>
className="space-y-4"><div><Badge className="bg-tf-success/20 text-tf-success border-tf-success/30">Patent Protection</Badge></div><div><Badge className="bg-tf-success/20 text-tf-success border-tf-success/30">Hybrid Architecture</Badge></div><div><Badge className="bg-tf-success/20 text-tf-success border-tf-success/30">Production Proven</Badge></div></div></CardContent></Card></div>),
    bgClass: "bg-gradient-to-br from-tf-dark to-tf-dark-lighter"},
  {id: "execution",
    title: "THE BELICHICK-BRADY EXECUTION",
    content: (<div className="space-y-8"><div className="grid md:grid-cols-3 gap-6"><Card className="bg-tf-success/10 border-tf-success/30"><CardContent className="p-6"><><h3 className="text-xl font-bold text-tf-success mb-4">Phase 1: Foundation</h3><Badge
</>
className="mb-4 bg-tf-success/20 text-tf-success">COMPLETE</Badge><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-tf-success rounded-full"></div><span
</></>>19 modules production-ready</span></div><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-tf-success rounded-full"></div><span
</></>>1,008 AI agents deployed</span></div><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-tf-success rounded-full"></div><span
</></>>Patent portfolio secured</span></div><div className="flex items-center gap-2"><><div className="w-2 h-2 bg-tf-success rounded-full"></div><span
</></>>Benton County live production</span></div></div></CardContent></Card><Card className="bg-tf-primary/10 border-tf-primary/30"><CardContent className="p-6"><><h3 className="text-xl font-bold text-tf-primary mb-4">Phase 2: Shock & Awe</h3><Badge
</>
className="mb-4 bg-tf-primary/20 text-tf-primary">Q1 2025</Badge><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><Target className="w-4 h-4 text-tf-primary" /><span>Florida conquest: 67 counties</span></div><div className="flex items-center gap-2"><Target className="w-4 h-4 text-tf-primary" /><span>Washington domination: 39 counties</span></div><div className="flex items-center gap-2"><Target className="w-4 h-4 text-tf-primary" /><span>Hurricane resilience demo</span></div><div className="flex items-center gap-2"><Target className="w-4 h-4 text-tf-primary" /><span>$50M ARR achieved</span></div></div></CardContent></Card><Card className="bg-tf-transcend/10 border-tf-transcend/30"><CardContent className="p-6"><><h3 className="text-xl font-bold text-tf-transcend mb-4">Phase 3: Total Domination</h3><Badge
</>
className="mb-4 bg-tf-transcend/20 text-tf-transcend">2025-2027</Badge><div className="space-y-2 text-sm"><div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-tf-transcend" /><span>50-state expansion</span></div><div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-tf-transcend" /><span>$1B ARR milestone</span></div><div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-tf-transcend" /><span>350M citizens transformed</span></div><div className="flex items-center gap-2"><Rocket className="w-4 h-4 text-tf-transcend" /><span>Government redefined</span></div></div></CardContent></Card></div></div>),
    bgClass: "bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-primary/10"},
  {id: "jobs-moment",
    title: "THE JOBS MOMENT",
    content: (<div className="min-h-[60vh] flex items-center justify-center"><div className="text-center max-w-5xl mx-auto space-y-12"><><div className="text-sm text-tf-accent mb-8">*[SINGLE SLIDE. WHITE BACKGROUND. ONE SENTENCE.]*</div><blockquote
</>className="text-3xl md:text-4xl font-bold text-tf-light leading-relaxed">
            "Terrafusion OS is not what government technology needs.<br /><span className="clarity-gradient bg-clip-text text-transparent">It's what government technology always should have been."</span></blockquote></div></div>),
    bgClass: "bg-white"},
  {id: "call-to-action",
    title: "THE CALL TO ACTION",
    content: (<div className="text-center space-y-12"><div className="space-y-8"><><h2 className="text-4xl font-bold text-tf-error">This is not a request for permission.</h2><h2
</>
className="text-4xl font-bold text-tf-transcend">This is notification of inevitability.</h2></div><div className="space-y-6 max-w-4xl mx-auto"><><p className="text-2xl text-tf-light">Terrafusion OS will transform American government.</p><p
</>className="text-2xl text-tf-primary">
            The only question is whether you are part of the transformation<br />or replaced by it.</p></div><div className="p-8 bg-gradient-to-r from-tf-primary/20 to-tf-transcend/20 rounded-2xl border border-tf-transcend/30 max-w-4xl mx-auto"><><p className="text-3xl font-bold text-tf-transcend mb-4">"Every county we transform is millions of citizens whose lives get better."</p><p
</>
className="text-xl text-tf-accent italic">The transcendence begins now.</p></div></div>),
    bgClass: "bg-gradient-to-br from-tf-dark to-tf-dark-lighter"}
]

export function ShockAweeBoardPresentation() {const [currentSlide, setCurrentSlide] = useState(0)
  const [isAutoPlay, setIsAutoPlay] = useState(false)

  useEffect(() => {
    if (!isAutoPlay) return
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % presentationSlides.length)}, 15000) // 15 seconds per slide
    
    return () => clearInterval(interval)
  }, [isAutoPlay])

  const nextSlide = () => {setCurrentSlide((prev) => (prev + 1) % presentationSlides.length)}

  const prevSlide = () => {setCurrentSlide((prev) => (prev - 1 + presentationSlides.length) % presentationSlides.length)}

  const currentSlideData = presentationSlides[currentSlide]

  return (<div className="min-h-screen relative overflow-hidden">{/* Dynamic Background */}<div className={`absolute inset-0 ${currentSlideData.bgClass} transition-all duration-1000`}>{/* Particle Effects */}<div className="absolute inset-0 opacity-20">{Array.from({length: 30}).map((_, i) => (<div
              key={i}
              className="absolute w-1 h-1 bg-tf-transcend rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }} />))}</div></div>{/* Slide Content */}<div className="relative z-10 min-h-screen flex flex-col">{/* Header */}<div className="p-6 flex justify-between items-center"><div className="flex items-center gap-4"><Zap className="w-8 h-8 text-tf-transcend" /><h1 className="text-2xl font-bold text-tf-light">SHOCK & AWE PROTOCOL</h1></div><div className="flex items-center gap-4"><><Badge className="bg-tf-primary/20 text-tf-primary border-tf-primary/30">{currentSlide + 1} / {presentationSlides.length}</Badge><Button
</>variant="outline"
              size="sm"
              onClick={() => setIsAutoPlay(!isAutoPlay)}
              className="border-tf-accent text-tf-accent hover:bg-tf-accent/10"
            >
              {isAutoPlay ? "Pause" : "Auto"}</Button></div></div>{/* Main Content */}<div className="flex-1 flex flex-col justify-center px-12 py-16"><div className="mb-8"><h1 className="text-5xl md:text-6xl font-black text-tf-transcend mb-4 transcend-glow">{currentSlideData.title}</h1></div><div className="flex-1 flex items-center justify-center">{currentSlideData.content}</div></div>{/* Navigation */}<div className="p-6 flex justify-between items-center"><><Button
            variant="outline"
            onClick={prevSlide}
            disabled={currentSlide === 0}
            className="border-tf-primary text-tf-primary hover:bg-tf-primary/10"
          >Previous</Button><div
</>className="flex gap-2">
            {presentationSlides.map((_ /* , index */) => (<><button
                key={index}
                onClick={() =>setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all duration-300 ${
                  index === currentSlide
                    ? "bg-tf-transcend scale-125"
                    : "bg-tf-gray hover:bg-tf-primary"}`}
              />
            ))}</div><Button
</>onClick={nextSlide}
            disabled={currentSlide === presentationSlides.length - 1}
            className="bg-tf-primary hover:bg-tf-primary-dark text-white transcend-glow"
          >
            Next<ChevronRight className="w-4 h-4 ml-2" /></Button></div></div></div>
  )
}