import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

interface SwarmCoherenceGaugeProps {
  value: number // 0 to 1
}

export function SwarmCoherenceGauge({ value }: SwarmCoherenceGaugeProps) {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 300
    const height = 200
    const radius = Math.min(width, height) / 2

    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${height * 0.7})`)

    // Create arc generator
    const arc = d3
      .arc<any>()
      .innerRadius(radius * 0.6)
      .outerRadius(radius * 0.9)
      .startAngle(-Math.PI / 2)

    // Background arc
    g.append('path')
      .datum({ endAngle: Math.PI / 2 })
      .style('fill', 'rgba(255, 255, 255, 0.1)')
      .attr('d', arc as any)

    // Value arc with gradient
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', 'coherence-gradient')
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', '0%')
      .attr('x2', '100%')

    gradient.append('stop')
      .attr('offset', '0%')
      .attr('stop-color', '#00E5FF')

    gradient.append('stop')
      .attr('offset', '100%')
      .attr('stop-color', '#0091EA')

    const foregroundArc = g.append('path')
      .datum({ endAngle: -Math.PI / 2 })
      .style('fill', 'url(#coherence-gradient)')
      .attr('d', arc as any)
      .attr('filter', 'drop-shadow(0 0 10px rgba(0, 229, 255, 0.5))')

    // Animate to value
    foregroundArc
      .transition()
      .duration(1500)
      .ease(d3.easeElasticOut)
      .attrTween('d', () => {
        const interpolate = d3.interpolate(
          -Math.PI / 2,
          -Math.PI / 2 + value * Math.PI
        )
        return (t: number) => {
          return arc({ endAngle: interpolate(t) }) as string
        }
      })

    // Value text
    const valueText = g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '-0.5em')
      .style('font-size', '36px')
      .style('font-weight', 'bold')
      .style('fill', '#00E5FF')
      .text('0%')

    valueText
      .transition()
      .duration(1500)
      .textTween(() => {
        const interpolate = d3.interpolate(0, value * 100)
        return (t: number) => `${interpolate(t).toFixed(1)}%`
      })

    // Label
    g.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '1.2em')
      .style('font-size', '14px')
      .style('fill', 'rgba(255, 255, 255, 0.6)')
      .text('Swarm Coherence')

  }, [value])

  return (
    <div className="flex items-center justify-center">
      <svg ref={svgRef} />
    </div>
  )
}
