import { useEffect, useRef, useState } from 'react'
import * as d3 from 'd3'

export function PerformanceTimeline() {
  const svgRef = useRef<SVGSVGElement>(null)
  const [data] = useState(() => {
    // Generate sample performance data
    const now = Date.now()
    return Array.from({ length: 60 }, (_, i) => ({
      timestamp: new Date(now - (59 - i) * 60000), // Last 60 minutes
      accuracy: 0.85 + Math.random() * 0.1,
      responseTime: 10 + Math.random() * 20,
      throughput: 40000 + Math.random() * 10000,
    }))
  })

  useEffect(() => {
    if (!svgRef.current || !data.length) return

    const svg = d3.select(svgRef.current)
    svg.selectAll('*').remove()

    const margin = { top: 20, right: 120, bottom: 30, left: 50 }
    const width = 800 - margin.left - margin.right
    const height = 250 - margin.top - margin.bottom

    const g = svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`)

    // X scale (time)
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
      .range([0, width])

    // Y scales
    const yAccuracy = d3.scaleLinear()
      .domain([0.8, 1])
      .range([height, 0])

    const yResponseTime = d3.scaleLinear()
      .domain([0, 40])
      .range([height, 0])

    // Line generators
    const lineAccuracy = d3.line<typeof data[0]>()
      .x(d => x(d.timestamp))
      .y(d => yAccuracy(d.accuracy))
      .curve(d3.curveMonotoneX)

    const lineResponseTime = d3.line<typeof data[0]>()
      .x(d => x(d.timestamp))
      .y(d => yResponseTime(d.responseTime))
      .curve(d3.curveMonotoneX)

    // X axis
    g.append('g')
      .attr('transform', `translate(0,${height})`)
      .call(d3.axisBottom(x).ticks(6).tickFormat(d3.timeFormat('%H:%M') as any))
      .attr('class', 'statistical-axis')

    // Y axis (Accuracy)
    g.append('g')
      .call(d3.axisLeft(yAccuracy).ticks(5).tickFormat(d => `${(d as number * 100).toFixed(0)}%`))
      .attr('class', 'statistical-axis')

    // Grid lines
    g.append('g')
      .attr('class', 'statistical-grid')
      .call(d3.axisLeft(yAccuracy).ticks(5).tickSize(-width).tickFormat(() => ''))

    // Accuracy line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#00E5FF')
      .attr('stroke-width', 2)
      .attr('d', lineAccuracy)
      .attr('filter', 'drop-shadow(0 0 5px rgba(0, 229, 255, 0.5))')

    // Response time line
    g.append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', '#FFD600')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')
      .attr('d', lineResponseTime)
      .attr('opacity', 0.7)

    // Legend
    const legend = g.append('g')
      .attr('transform', `translate(${width + 10}, 20)`)

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#00E5FF')
      .attr('stroke-width', 2)

    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .style('font-size', '12px')
      .style('fill', 'rgba(255, 255, 255, 0.8)')
      .text('Accuracy')

    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 20)
      .attr('y2', 20)
      .attr('stroke', '#FFD600')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '5,5')

    legend.append('text')
      .attr('x', 25)
      .attr('y', 24)
      .style('font-size', '12px')
      .style('fill', 'rgba(255, 255, 255, 0.8)')
      .text('Response Time')

  }, [data])

  return (
    <div className="w-full overflow-x-auto">
      <svg ref={svgRef} />
    </div>
  )
}
