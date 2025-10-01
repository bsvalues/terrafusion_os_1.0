"use client"

import {useState, useEffect} from "react"
import {Button} from "@/components/ui/button"
import {terraFusionBrand} from "@/lib/brand"
import {ChevronDown, Play, Shield, Zap} from '@mui/icons-material'

export function HeroSection() {const [currentMessage, setCurrentMessage] = useState(0)
  const [particleCount, setParticleCount] = useState(0)

  const heroMessages = ["Government. Transcended.", "Turn Complexity into Clarity.", "We do it right the first time."]

  useEffect(() =>{
    const interval = setInterval(() => {
      setCurrentMessage((prev) => (prev + 1) % heroMessages.length)}, 3000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {const timer = setInterval(() => {
      setParticleCount((prev) => (prev + 1) % 100)}, 50)
    return () => clearInterval(timer)
  }, [])

  return (<section className="relative min-h-screen flex items-center justify-center overflow-hidden">{/* Animated Background */}<div className="absolute inset-0 bg-gradient-to-br from-tf-dark via-tf-dark-lighter to-tf-dark">{/* Particle Grid */}<div className="absolute inset-0 opacity-20">{Array.from({length: 50}).map((_, i) => (<div
              key={i}
              className="absolute w-1 h-1 bg-tf-transcend rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }} />))}</div>{/* Clarity Wave Effect */}<div className="absolute inset-0 opacity-30"><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full border border-tf-primary/30 animate-ping animation-duration-[4s]" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full border border-tf-transcend/40 animate-ping animation-duration-[3s] animation-delay-1000" /><div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 rounded-full border border-tf-accent/50 animate-ping animation-duration-[2s] animation-delay-2000" /></div></div>{/* Hero Content */}<div className="relative z-10 text-center space-y-8 max-w-6xl mx-auto px-4">{/* Logo */}<div className="space-y-4"><h1 className="text-7xl md:text-9xl font-heading font-bold tracking-tight"><><span className="clarity-gradient bg-clip-text text-transparent transcend-animation">Terrafusion</span><span
</>
className="block text-3xl md:text-4xl text-tf-gray mt-2">OS</span></h1>{/* Rotating Messages */}<div className="h-16 flex items-center justify-center"><p className="text-2xl md:text-4xl font-heading font-semibold text-tf-primary transition-all duration-500">{heroMessages[currentMessage]}</p></div></div>{/* Value Proposition */}<div className="max-w-3xl mx-auto space-y-6"><p className="text-xl md:text-2xl text-tf-light/90 leading-relaxed">{terraFusionBrand.promise}</p>{/* Key Benefits */}<div className="flex flex-wrap justify-center gap-6 text-sm md:text-base"><div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-primary/20"><Zap className="w-4 h-4 text-tf-accent" /><span className="text-tf-light">379,000,000× Faster</span></div><div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-primary/20"><Shield className="w-4 h-4 text-tf-transcend" /><span className="text-tf-light">SOC 2 Type II</span></div><div className="flex items-center gap-2 bg-tf-dark-lighter/50 px-4 py-2 rounded-full border border-tf-primary/20"><><span className="text-tf-success">98%</span><span
</>
className="text-tf-light">User Adoption</span></div></div></div>{/* CTA Buttons */}<div className="flex flex-col sm:flex-row gap-4 justify-center items-center"><Button
            size="lg"
            className="transcend-glow bg-tf-primary hover:bg-tf-primary-dark text-white px-8 py-4 text-lg font-semibold"
          ><><Play className="w-5 h-5 mr-2" />Begin Transcendence</Button><Button
</>variant="outline"
            size="lg"
            className="border-tf-transcend text-tf-transcend hover:bg-tf-transcend hover:text-tf-dark px-8 py-4 text-lg bg-transparent"
          >
            Discover Clarity</Button></div>{/* Scroll Indicator */}<div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce"><ChevronDown className="w-6 h-6 text-tf-accent" /></div></div></section>
  )
}
