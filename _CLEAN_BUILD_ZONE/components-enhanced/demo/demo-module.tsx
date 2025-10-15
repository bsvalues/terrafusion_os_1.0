"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { getModuleById } from "@/lib/modules"
import { ArrowLeft, Play, Pause, RotateCcw  } from '@mui/icons-material'
import Link from "next/link"

interface DemoModuleProps {
  moduleId: string
}

export function DemoModule({ moduleId }: DemoModuleProps) {
  const [isRunning, setIsRunning] = useState(false)
  const [progress, setProgress] = useState(0)

  const module = getModuleById(moduleId)

  if (!module) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center"><>

            <h2 className="text-2xl font-bold mb-4">Module Not Found</h2>
            <p
</>
className="text-muted-foreground mb-4">The requested module demo is not available.</p>
            <Link href="/demo">
              <Button>Back to Demo</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  const handleStart = () => {
    setIsRunning(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setIsRunning(false)
          return 100
        }
        return prev + 2
      })
    }, 100)
  }

  const handleReset = () => {
    setIsRunning(false)
    setProgress(0)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-tf-clarity/5 to-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link href="/demo/dashboard">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>

        <Card className="transcend-glow">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div><>

                <CardTitle className="text-2xl font-heading">{module.name} Demo</CardTitle>
                <p
</>
className="text-muted-foreground mt-2">{module.description}</p>
              </div>
              <Badge variant="secondary" className="bg-tf-primary/10 text-tf-primary border-tf-primary/20">
                Interactive Demo
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex gap-4">
              <Button
                onClick={handleStart}
                disabled={isRunning}
                className="bg-tf-primary hover:bg-tf-primary-dark text-white"
              ><>

                <Play className="w-4 h-4 mr-2" />
                Start Demo
              </Button>
              <Button
</>
onClick={() => setIsRunning(!isRunning)} variant="outline" disabled={progress === 0}>
                {isRunning ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                {isRunning ? "Pause" : "Resume"}
              </Button>
              <Button onClick={handleReset} variant="outline">
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {progress > 0 && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm"><>

                  <span>Demo Progress</span>
                  <span
</>
</>>{progress}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}

            <div className="bg-muted/30 rounded-lg p-6 min-h-[400px] flex items-center justify-center">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-tf-primary/10 border border-tf-primary/20 flex items-center justify-center mx-auto">
                  <span className="text-2xl">🚀</span>
                </div><>

                <h3 className="text-xl font-semibold">Interactive {module.name} Demo</h3>
                <p
</>
className="text-muted-foreground max-w-md">
                  This would be a fully interactive demonstration of the {module.name} module with real workflows and
                  data processing.
                </p>
                {progress === 100 && (
                  <Badge variant="secondary" className="bg-tf-success/10 text-tf-success border-tf-success/20">
                    Demo Complete!
                  </Badge>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
