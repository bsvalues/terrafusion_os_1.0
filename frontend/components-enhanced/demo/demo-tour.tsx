"use client"

import {useEffect} from "react"
import {Card, CardContent} from "@/components/ui/card"
import {Button} from "@/components/ui/button"
import {Badge} from "@/components/ui/badge"
import {ChevronLeft, ChevronRight, X} from '@mui/icons-material'

interface DemoTourStep {title: string
  description: string
  target: string}

interface DemoTourProps {steps: DemoTourStep[]
  currentStep: number
  onStepChange: (step: number) =>void
  isActive: boolean}

export function DemoTour({steps, currentStep, onStepChange, isActive}: DemoTourProps) {useEffect(() => {
    if (isActive && currentStep< steps.length - 1) {
      const timer = setTimeout(() =>{
        onStepChange(currentStep + 1)}, 4000)
      return () => clearTimeout(timer)
    }
  }, [currentStep, isActive, steps.length, onStepChange])

  if (!isActive || currentStep >= steps.length) return null

  const currentStepData = steps[currentStep]

  return (<div className="fixed bottom-6 left-6 right-6 z-40 flex justify-center"><Card className="max-w-md bg-tf-dark text-tf-light border-tf-primary/20 shadow-2xl"><CardContent className="p-6"><div className="flex items-start justify-between mb-4"><div className="flex items-center gap-2"><Badge variant="secondary" className="bg-tf-transcend/20 text-tf-transcend border-tf-transcend/30">Step {currentStep + 1} of {steps.length}</Badge></div><Button
              variant="ghost"
              size="sm"
              onClick={() => onStepChange(steps.length)}
              className="text-tf-light/60 hover:text-tf-light hover:bg-tf-light/10"
            ><X className="w-4 h-4" /></Button></div><div className="space-y-3"><><h3 className="font-heading font-semibold text-lg text-tf-transcend">{currentStepData.title}</h3><p
</>
className="text-sm text-tf-light/80">{currentStepData.description}</p></div><div className="flex items-center justify-between mt-6"><Button
              variant="ghost"
              size="sm"
              onClick={() => onStepChange(Math.max(0, currentStep - 1))}
              disabled={currentStep === 0}
              className="text-tf-light/60 hover:text-tf-light hover:bg-tf-light/10"
            ><><ChevronLeft className="w-4 h-4 mr-2" />Previous</Button><div
</>className="flex gap-1">
              {steps.map((_ /* , index */) => (<><div
                  key={index}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? "bg-tf-transcend" : "bg-tf-light/20"}`} />))}</div><Button
</>variant="ghost"
              size="sm"
              onClick={() => onStepChange(Math.min(steps.length - 1, currentStep + 1))}
              disabled={currentStep === steps.length - 1}
              className="text-tf-light/60 hover:text-tf-light hover:bg-tf-light/10"
            >
              Next<ChevronRight className="w-4 h-4 ml-2" /></Button></div></CardContent></Card></div>
  )
}
