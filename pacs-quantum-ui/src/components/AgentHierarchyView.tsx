import { useEffect, useRef } from 'react'
import * as d3 from 'd3'

const hierarchyData = [
  { tier: 'AI Council', count: 20, color: '#FF1744' },
  { tier: 'Quantum Commanders', count: 200, color: '#FFD600' },
  { tier: 'Domain Generals', count: 1000, color: '#00C853' },
  { tier: 'Process Coordinators', count: 3000, color: '#00E5FF' },
  { tier: 'Expert Specialists', count: 10000, color: '#00B8D4' },
  { tier: 'Adaptive Executors', count: 20000, color: '#0091EA' },
  { tier: 'Micro Optimizers', count: 15780, color: '#7C4DFF' },
]

export function AgentHierarchyView() {
  const svgRef = useRef<SVGSVGElement>(null)

  useEffect(() => {
    if (!svgRef.current) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const width = 400
    const height = 300
    const barHeight = 35
    const barSpacing = 5

    svg.attr('width', width).attr('height', height)

    const maxCount = d3.max(hierarchyData, d => d.count) || 1

    const x = d3.scaleLinear()
      .domain([0, maxCount])
      .range([0, width - 100])

    const bars = svg.selectAll('g.bar')
      .data(hierarchyData)
      .enter()
      .append('g')
      .attr('class', 'bar')
      .attr('transform', (d, i) => `translate(0, ${i * (barHeight + barSpacing)})`)

    // Background bars
    bars.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', width - 100)
      .attr('height', barHeight)
      .attr('fill', 'rgba(255, 255, 255, 0.05)')
      .attr('rx', 4)

    // Value bars
    bars.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 0)
      .attr('height', barHeight)
      .attr('fill', d => d.color)
      .attr('opacity', 0.6)
      .attr('rx', 4)
      .transition()
      .duration(1000)
      .delay((d, i) => i * 100)
      .attr('width', d => x(d.count))

    // Labels
    bars.append('text')
      .attr('x', 8)
      .attr('y', barHeight / 2)
      .attr('dy', '0.35em')
      .style('font-size', '11px')
      .style('font-weight', '600')
      .style('fill', 'white')
      .text(d => d.tier)

    // Count labels
    bars.append('text')
      .attr('x', width - 95)
      .attr('y', barHeight / 2)
      .attr('dy', '0.35em')
      .style('font-size', '12px')
      .style('font-weight', 'bold')
      .style('fill', 'rgba(255, 255, 255, 0.9)')
      .text(d => d.count.toLocaleString())

  }, [])

  return (
    <div className="flex items-center justify-center">
      <svg ref={svgRef} />
    </div>
  )
}
