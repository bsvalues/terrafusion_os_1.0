import * as d3 from 'd3';
import { motion } from 'framer-motion';
import React, { useEffect, useRef } from 'react';

/**
 * TerraFusion Government Operations Real-time Chart
 *
 * Elite D3.js visualization component for government data with quantum aesthetics
 * "Government. Transcended." - Championship-level data visualization
 */

interface DataPoint {
  timestamp: Date;
  value: number;
  category: string;
}

interface GovernmentRealtimeChartProps {
  data: DataPoint[];
  title: string;
  color?: string;
  height?: number;
  showGrid?: boolean;
  animate?: boolean;
}

export const GovernmentRealtimeChart: React.FC<GovernmentRealtimeChartProps> = ({
  data,
  title,
  color = '#00ffee',
  height = 300,
  showGrid = true,
  animate = true,
}) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current || !data.length) return;

    const svg = d3.select(svgRef.current);
    const container = containerRef.current;
    const width = container.clientWidth;

    // Clear previous chart
    svg.selectAll('*').remove();

    // Set up dimensions and margins
    const margin = { top: 20, right: 30, bottom: 40, left: 50 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3
      .scaleTime()
      .domain(d3.extent(data, d => d.timestamp) as [Date, Date])
      .range([0, innerWidth]);

    const yScale = d3
      .scaleLinear()
      .domain(d3.extent(data, d => d.value) as [number, number])
      .nice()
      .range([innerHeight, 0]);

    // Create main group
    const g = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add quantum grid if enabled
    if (showGrid) {
      // Vertical grid lines
      g.selectAll('.grid-line-vertical')
        .data(xScale.ticks(8))
        .enter()
        .append('line')
        .attr('class', 'grid-line-vertical')
        .attr('x1', d => xScale(d))
        .attr('x2', d => xScale(d))
        .attr('y1', 0)
        .attr('y2', innerHeight)
        .attr('stroke', color)
        .attr('stroke-opacity', 0.1)
        .attr('stroke-width', 1);

      // Horizontal grid lines
      g.selectAll('.grid-line-horizontal')
        .data(yScale.ticks(6))
        .enter()
        .append('line')
        .attr('class', 'grid-line-horizontal')
        .attr('x1', 0)
        .attr('x2', innerWidth)
        .attr('y1', d => yScale(d))
        .attr('y2', d => yScale(d))
        .attr('stroke', color)
        .attr('stroke-opacity', 0.1)
        .attr('stroke-width', 1);
    }

    // Create line generator
    const line = d3
      .line<DataPoint>()
      .x(d => xScale(d.timestamp))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add gradient for area fill
    const gradient = svg
      .append('defs')
      .append('linearGradient')
      .attr('id', `area-gradient-${title.replace(/\s+/g, '-')}`)
      .attr('gradientUnits', 'userSpaceOnUse')
      .attr('x1', 0)
      .attr('y1', innerHeight)
      .attr('x2', 0)
      .attr('y2', 0);

    gradient.append('stop').attr('offset', '0%').attr('stop-color', color).attr('stop-opacity', 0);

    gradient
      .append('stop')
      .attr('offset', '100%')
      .attr('stop-color', color)
      .attr('stop-opacity', 0.3);

    // Create area generator
    const area = d3
      .area<DataPoint>()
      .x(d => xScale(d.timestamp))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // Add area
    const areaPath = g
      .append('path')
      .datum(data)
      .attr('fill', `url(#area-gradient-${title.replace(/\s+/g, '-')})`)
      .attr('d', area);

    // Add line
    const linePath = g
      .append('path')
      .datum(data)
      .attr('fill', 'none')
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .attr('stroke-linejoin', 'round')
      .attr('stroke-linecap', 'round')
      .attr('d', line);

    // Animate if enabled
    if (animate) {
      const totalLength = (linePath.node() as SVGPathElement).getTotalLength();

      linePath
        .attr('stroke-dasharray', `${totalLength} ${totalLength}`)
        .attr('stroke-dashoffset', totalLength)
        .transition()
        .duration(2000)
        .ease(d3.easeLinear)
        .attr('stroke-dashoffset', 0);
    }

    // Add data points with quantum glow
    g.selectAll('.data-point')
      .data(data)
      .enter()
      .append('circle')
      .attr('class', 'data-point')
      .attr('cx', d => xScale(d.timestamp))
      .attr('cy', d => yScale(d.value))
      .attr('r', 4)
      .attr('fill', color)
      .attr('stroke', color)
      .attr('stroke-width', 2)
      .style('filter', `drop-shadow(0 0 6px ${color})`)
      .style('opacity', animate ? 0 : 1);

    if (animate) {
      g.selectAll('.data-point')
        .transition()
        .delay((d, i) => i * 50)
        .duration(500)
        .style('opacity', 1);
    }

    // Add axes
    g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d3.timeFormat('%H:%M')))
      .selectAll('text')
      .style('fill', color)
      .style('font-size', '12px');

    g.append('g')
      .call(d3.axisLeft(yScale))
      .selectAll('text')
      .style('fill', color)
      .style('font-size', '12px');

    // Style axis lines
    g.selectAll('.domain').style('stroke', color).style('stroke-opacity', 0.3);

    g.selectAll('.tick line').style('stroke', color).style('stroke-opacity', 0.3);

    // Add tooltips on hover
    const tooltip = d3
      .select('body')
      .append('div')
      .attr('class', 'tooltip')
      .style('opacity', 0)
      .style('position', 'absolute')
      .style('background-color', 'rgba(11, 16, 32, 0.95)')
      .style('color', color)
      .style('padding', '10px')
      .style('border-radius', '8px')
      .style('border', `1px solid ${color}`)
      .style('font-size', '12px')
      .style('pointer-events', 'none')
      .style('backdrop-filter', 'blur(10px)')
      .style('z-index', '1000');

    g.selectAll('.data-point')
      .on('mouseover', function (event, d) {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 6)
          .style('filter', `drop-shadow(0 0 12px ${color})`);

        tooltip.transition().duration(200).style('opacity', 0.9);

        tooltip
          .html(
            `
          <div><strong>${title}</strong></div>
          <div>Time: ${d3.timeFormat('%H:%M:%S')(d.timestamp)}</div>
          <div>Value: ${d.value.toLocaleString()}</div>
          <div>Category: ${d.category}</div>
        `
          )
          .style('left', event.pageX + 10 + 'px')
          .style('top', event.pageY - 28 + 'px');
      })
      .on('mouseout', function () {
        d3.select(this)
          .transition()
          .duration(200)
          .attr('r', 4)
          .style('filter', `drop-shadow(0 0 6px ${color})`);

        tooltip.transition().duration(500).style('opacity', 0);
      });

    // Cleanup function
    return () => {
      tooltip.remove();
    };
  }, [data, title, color, height, showGrid, animate]);

  return (
    <motion.div
      ref={containerRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full bg-slate-900/50 rounded-xl p-6 border border-[#00ffee]/20 backdrop-blur-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">{title}</h3>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color }} />
          <span className="text-sm text-slate-400">Live Data</span>
        </div>
      </div>

      <div className="relative">
        <svg ref={svgRef} className="w-full" />
      </div>
    </motion.div>
  );
};
