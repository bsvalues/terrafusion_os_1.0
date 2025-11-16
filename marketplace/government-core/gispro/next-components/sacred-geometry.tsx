"use client"

import { useEffect, useRef, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { Compass, Zap, Triangle, Circle  } from '@mui/icons-material'

export function SacredGeometry() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [pattern, setPattern] = useState<"fibonacci" | "voronoi" | "golden">("fibonacci")
  const [complexity, setComplexity] = useState([8])
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    drawPattern()
  }, [pattern, complexity])

  const drawPattern = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext("2d")
    if (!ctx) return

    // Set canvas size
    canvas.width = 400
    canvas.height = 400

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = "#f8fafc"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2

    switch (pattern) {
      case "fibonacci":
        drawFibonacciSpiral(ctx, centerX, centerY, complexity[0])
        break
      case "voronoi":
        drawVoronoiPattern(ctx, canvas.width, canvas.height, complexity[0])
        break
      case "golden":
        drawGoldenRatio(ctx, centerX, centerY, complexity[0])
        break
    }
  }

  const drawFibonacciSpiral = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, iterations: number) => {
    const phi = (1 + Math.sqrt(5)) / 2 // Golden ratio
    let a = 1,
      b = 1

    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2

    for (let i = 0; i < iterations; i++) {
      const radius = a * 10
      const angle = (i * 2 * Math.PI) / phi

      const x = centerX + Math.cos(angle) * radius
      const y = centerY + Math.sin(angle) * radius

      // Draw circle
      ctx.beginPath()
      ctx.arc(x, y, 3, 0, 2 * Math.PI)
      ctx.fillStyle = `hsl(${220 + i * 20}, 70%, 60%)`
      ctx.fill()

      // Draw connecting line
      if (i > 0) {
        const prevRadius = b * 10
        const prevAngle = ((i - 1) * 2 * Math.PI) / phi
        const prevX = centerX + Math.cos(prevAngle) * prevRadius
        const prevY = centerY + Math.sin(prevAngle) * prevRadius

        ctx.beginPath()
        ctx.moveTo(prevX, prevY)
        ctx.lineTo(x, y)
        ctx.strokeStyle = `hsl(${220 + i * 20}, 50%, 50%)`
        ctx.stroke()
      }

      // Update Fibonacci sequence
      const temp = a + b
      a = b
      b = temp
    }
  }

  const drawVoronoiPattern = (ctx: CanvasRenderingContext2D, width: number, height: number, points: number) => {
    // Generate random seed points
    const seeds = []
    for (let i = 0; i < points; i++) {
      seeds.push({
        x: Math.random() * width,
        y: Math.random() * height,
        color: `hsl(${Math.random() * 360}, 60%, 70%)`,
      })
    }

    // Simple Voronoi approximation using pixel-by-pixel coloring
    const imageData = ctx.createImageData(width, height)
    const data = imageData.data

    for (let x = 0; x < width; x += 2) {
      // Skip pixels for performance
      for (let y = 0; y < height; y += 2) {
        let minDist = Number.POSITIVE_INFINITY
        let closestSeed = seeds[0]

        // Find closest seed point
        for (const seed of seeds) {
          const dist = Math.sqrt((x - seed.x) ** 2 + (y - seed.y) ** 2)
          if (dist < minDist) {
            minDist = dist
            closestSeed = seed
          }
        }

        // Color the pixel
        const index = (y * width + x) * 4
        const hsl = closestSeed.color.match(/\d+/g)
        if (hsl) {
          const [h, s, l] = hsl.map(Number)
          const rgb = hslToRgb(h / 360, s / 100, l / 100)
          data[index] = rgb[0] // R
          data[index + 1] = rgb[1] // G
          data[index + 2] = rgb[2] // B
          data[index + 3] = 255 // A
        }
      }
    }

    ctx.putImageData(imageData, 0, 0)

    // Draw seed points
    seeds.forEach((seed) => {
      ctx.beginPath()
      ctx.arc(seed.x, seed.y, 4, 0, 2 * Math.PI)
      ctx.fillStyle = "#1f2937"
      ctx.fill()
    })
  }

  const drawGoldenRatio = (ctx: CanvasRenderingContext2D, centerX: number, centerY: number, iterations: number) => {
    const phi = (1 + Math.sqrt(5)) / 2
    let size = 100

    ctx.strokeStyle = "#f59e0b"
    ctx.lineWidth = 2

    for (let i = 0; i < iterations; i++) {
      const angle = (i * 2 * Math.PI) / phi
      const x = centerX + Math.cos(angle) * (size / phi)
      const y = centerY + Math.sin(angle) * (size / phi)

      // Draw golden rectangle
      ctx.strokeRect(x - size / 2, y - size / 2, size, size / phi)

      // Draw golden spiral arc
      ctx.beginPath()
      ctx.arc(x, y, size / 2, angle, angle + Math.PI / 2)
      ctx.stroke()

      size /= phi
    }
  }

  // Helper function to convert HSL to RGB
  const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
    let r, g, b

    if (s === 0) {
      r = g = b = l // achromatic
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1 / 6) return p + (q - p) * 6 * t
        if (t < 1 / 2) return q
        if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6
        return p
      }

      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1 / 3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1 / 3)
    }

    return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)]
  }

  const toggleAnimation = () => {
    setIsAnimating(!isAnimating)
    if (!isAnimating) {
      const interval = setInterval(() => {
        setComplexity((prev) => [Math.max(3, Math.min(15, prev[0] + (Math.random() > 0.5 ? 1 : -1)))])
      }, 500)

      setTimeout(() => {
        clearInterval(interval)
        setIsAnimating(false)
      }, 5000)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><>

            <Compass className="h-5 w-5 text-purple-600" />
            Sacred Geometry Visualization
          </CardTitle>
          <CardDescription
</>
</>>
            Advanced property analysis using geometric patterns and mathematical principles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Controls */}
            <div className="space-y-4">
              <div><>

                <h3 className="font-medium mb-3">Pattern Type</h3>
                <div
</>
className="grid grid-cols-3 gap-2">
                  <Button
                    variant={pattern === "fibonacci" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPattern("fibonacci")}
                    className="flex items-center gap-1"
                  ><>

                    <Zap className="h-3 w-3" />
                    Fibonacci
                  </Button>
                  <Button
</>

                    variant={pattern === "voronoi" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPattern("voronoi")}
                    className="flex items-center gap-1"
                  ><>

                    <Triangle className="h-3 w-3" />
                    Voronoi
                  </Button>
                  <Button
</>

                    variant={pattern === "golden" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPattern("golden")}
                    className="flex items-center gap-1"
                  >
                    <Circle className="h-3 w-3" />
                    Golden
                  </Button>
                </div>
              </div>

              <div><>

                <h3 className="font-medium mb-3">Complexity: {complexity[0]}</h3>
                <Slider
</>
value={complexity} onValueChange={setComplexity} max={15} min={3} step={1} className="w-full" />
              </div><>

              <Button onClick={toggleAnimation} disabled={isAnimating} className="w-full">
                {isAnimating ? "Animating..." : "Animate Pattern"}
              </Button>

              <div
</>
className="space-y-2"><>

                <h4 className="font-medium text-sm">Pattern Properties</h4>
                <div
</>
className="space-y-1">
                  {pattern === "fibonacci" && (<>

                      <Badge variant="secondary">Golden Ratio: φ = 1.618...</Badge>
                      <Badge
</>
variant="secondary">Natural Growth Patterns</Badge>
                      <Badge variant="secondary">Market Trend Analysis</Badge>
                  )}
                  {pattern === "voronoi" && (<>

                      <Badge variant="secondary">Spatial Tessellation</Badge>
                      <Badge
</>
variant="secondary">Territory Mapping</Badge>
                      <Badge variant="secondary">Market Boundaries</Badge>
                  )}
                  {pattern === "golden" && (<>

                      <Badge variant="secondary">Divine Proportion</Badge>
                      <Badge
</>
variant="secondary">Aesthetic Harmony</Badge>
                      <Badge variant="secondary">Value Optimization</Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Visualization */}
            <div className="space-y-4">
              <div className="border rounded-lg p-4 bg-white"><>

                <canvas
                  ref={canvasRef}
                  className="w-full h-auto border rounded"
                  style={{ maxWidth: "400px", maxHeight: "400px" }}
                />
              </div>

              <div
</>
className="text-sm text-gray-600"><>

                <h4 className="font-medium mb-2">Geometric Analysis Applications</h4>
                <ul
</>
className="space-y-1"><>

                  <li>• Property value optimization using golden ratio principles</li>
                            <li
</>
</>>• Market territory analysis with Voronoi diagrams</li><>

                  <li>• Growth pattern prediction using Fibonacci sequences</li>
                            <li
</>
</>>• Spatial relationship modeling for comparable properties</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
