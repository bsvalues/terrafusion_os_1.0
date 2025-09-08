class VisualizationManager {
    constructor() {
        this.charts = new Map();
        this.visualizations = new Map();
        this.currentView = null;
        this.data = null;
        this.options = {
            theme: 'light',
            animations: true,
            responsive: true
        };
    }

    initialize() {
        this.setupEventListeners();
        this.loadSettings();
    }

    setupEventListeners() {
        document.addEventListener('themeChange', (event) => {
            this.options.theme = event.detail.theme;
            this.updateAllCharts();
        });
    }

    loadSettings() {
        try {
            const savedSettings = localStorage.getItem('visualizationSettings');
            if (savedSettings) {
                this.options = { ...this.options, ...JSON.parse(savedSettings) };
            }
        } catch (error) {
            console.error('Failed to load visualization settings:', error);
        }
    }

    saveSettings() {
        try {
            localStorage.setItem('visualizationSettings', JSON.stringify(this.options));
        } catch (error) {
            console.error('Failed to save visualization settings:', error);
        }
    }

    createChart(containerId, type, data, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }

        const chartOptions = {
            ...this.getDefaultOptions(type),
            ...options,
            theme: this.options.theme
        };

        const chart = new Chart(container, {
            type,
            data,
            options: chartOptions
        });

        this.charts.set(containerId, chart);
        return chart;
    }

    getDefaultOptions(type) {
        const baseOptions = {
            responsive: this.options.responsive,
            maintainAspectRatio: false,
            animation: this.options.animations,
            plugins: {
                legend: {
                    position: 'top'
                },
                tooltip: {
                    enabled: true
                }
            }
        };

        switch (type) {
            case 'line':
                return {
                    ...baseOptions,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear',
                            position: 'left'
                        }
                    }
                };
            case 'bar':
                return {
                    ...baseOptions,
                    scales: {
                        x: {
                            type: 'category',
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear',
                            position: 'left'
                        }
                    }
                };
            case 'pie':
            case 'doughnut':
                return {
                    ...baseOptions,
                    cutout: type === 'doughnut' ? '50%' : 0
                };
            case 'scatter':
                return {
                    ...baseOptions,
                    scales: {
                        x: {
                            type: 'linear',
                            position: 'bottom'
                        },
                        y: {
                            type: 'linear',
                            position: 'left'
                        }
                    }
                };
            default:
                return baseOptions;
        }
    }

    updateChart(containerId, data) {
        const chart = this.charts.get(containerId);
        if (!chart) {
            console.error(`Chart ${containerId} not found`);
            return;
        }

        chart.data = data;
        chart.update();
    }

    updateAllCharts() {
        this.charts.forEach(chart => {
            chart.options.theme = this.options.theme;
            chart.update();
        });
    }

    destroyChart(containerId) {
        const chart = this.charts.get(containerId);
        if (chart) {
            chart.destroy();
            this.charts.delete(containerId);
        }
    }

    createVisualization(type, data, options = {}) {
        const visualization = {
            type,
            data,
            options: {
                ...this.getDefaultVisualizationOptions(type),
                ...options
            }
        };

        switch (type) {
            case 'tree':
                return this.createTreeVisualization(visualization);
            case 'network':
                return this.createNetworkVisualization(visualization);
            case 'heatmap':
                return this.createHeatmapVisualization(visualization);
            case 'timeline':
                return this.createTimelineVisualization(visualization);
            default:
                console.error(`Unsupported visualization type: ${type}`);
                return null;
        }
    }

    getDefaultVisualizationOptions(type) {
        switch (type) {
            case 'tree':
                return {
                    nodeSpacing: 50,
                    levelHeight: 100,
                    nodeRadius: 20,
                    linkColor: '#999',
                    nodeColor: '#4ECDC4'
                };
            case 'network':
                return {
                    nodeSize: 20,
                    linkDistance: 100,
                    charge: -100,
                    linkColor: '#999',
                    nodeColor: '#4ECDC4'
                };
            case 'heatmap':
                return {
                    colorScale: ['#fff7ec', '#fee6ce', '#fdd0a2', '#fdae6b', '#fd8d3c', '#f16913', '#d94801', '#a63603', '#7f2704'],
                    cellSize: 20,
                    margin: 10
                };
            case 'timeline':
                return {
                    height: 100,
                    margin: 20,
                    timeFormat: '%Y-%m-%d',
                    colorScale: ['#4ECDC4', '#45B7D1', '#96CEB4', '#FFEEAD']
                };
            default:
                return {};
        }
    }

    createTreeVisualization(visualization) {
        const container = document.createElement('div');
        container.className = 'visualization-container tree-visualization';
        
        const width = visualization.options.width || 800;
        const height = visualization.options.height || 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const treeLayout = d3.tree()
            .size([width - 100, height - 100]);

        const root = d3.hierarchy(visualization.data);
        const nodes = treeLayout(root);

        const link = svg.append('g')
            .selectAll('path')
            .data(nodes.links())
            .enter()
            .append('path')
            .attr('d', d3.linkVertical()
                .x(d => d.x)
                .y(d => d.y))
            .attr('stroke', visualization.options.linkColor)
            .attr('fill', 'none');

        const node = svg.append('g')
            .selectAll('circle')
            .data(nodes.descendants())
            .enter()
            .append('circle')
            .attr('cx', d => d.x)
            .attr('cy', d => d.y)
            .attr('r', visualization.options.nodeRadius)
            .attr('fill', visualization.options.nodeColor);

        return container;
    }

    createNetworkVisualization(visualization) {
        const container = document.createElement('div');
        container.className = 'visualization-container network-visualization';
        
        const width = visualization.options.width || 800;
        const height = visualization.options.height || 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const simulation = d3.forceSimulation(visualization.data.nodes)
            .force('link', d3.forceLink(visualization.data.links).id(d => d.id).distance(visualization.options.linkDistance))
            .force('charge', d3.forceManyBody().strength(visualization.options.charge))
            .force('center', d3.forceCenter(width / 2, height / 2));

        const link = svg.append('g')
            .selectAll('line')
            .data(visualization.data.links)
            .enter()
            .append('line')
            .attr('stroke', visualization.options.linkColor)
            .attr('stroke-width', 1);

        const node = svg.append('g')
            .selectAll('circle')
            .data(visualization.data.nodes)
            .enter()
            .append('circle')
            .attr('r', visualization.options.nodeSize)
            .attr('fill', visualization.options.nodeColor)
            .call(d3.drag()
                .on('start', dragstarted)
                .on('drag', dragged)
                .on('end', dragended));

        simulation.on('tick', () => {
            link
                .attr('x1', d => d.source.x)
                .attr('y1', d => d.source.y)
                .attr('x2', d => d.target.x)
                .attr('y2', d => d.target.y);

            node
                .attr('cx', d => d.x)
                .attr('cy', d => d.y);
        });

        function dragstarted(event, d) {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
        }

        function dragged(event, d) {
            d.fx = event.x;
            d.fy = event.y;
        }

        function dragended(event, d) {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
        }

        return container;
    }

    createHeatmapVisualization(visualization) {
        const container = document.createElement('div');
        container.className = 'visualization-container heatmap-visualization';
        
        const width = visualization.options.width || 800;
        const height = visualization.options.height || 600;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const colorScale = d3.scaleQuantile()
            .domain(visualization.data.map(d => d.value))
            .range(visualization.options.colorScale);

        const xScale = d3.scaleBand()
            .domain(visualization.data.map(d => d.x))
            .range([0, width - visualization.options.margin * 2])
            .padding(0.1);

        const yScale = d3.scaleBand()
            .domain(visualization.data.map(d => d.y))
            .range([0, height - visualization.options.margin * 2])
            .padding(0.1);

        const g = svg.append('g')
            .attr('transform', `translate(${visualization.options.margin},${visualization.options.margin})`);

        g.selectAll('rect')
            .data(visualization.data)
            .enter()
            .append('rect')
            .attr('x', d => xScale(d.x))
            .attr('y', d => yScale(d.y))
            .attr('width', xScale.bandwidth())
            .attr('height', yScale.bandwidth())
            .attr('fill', d => colorScale(d.value));

        return container;
    }

    createTimelineVisualization(visualization) {
        const container = document.createElement('div');
        container.className = 'visualization-container timeline-visualization';
        
        const width = visualization.options.width || 800;
        const height = visualization.options.height || 200;

        const svg = d3.select(container)
            .append('svg')
            .attr('width', width)
            .attr('height', height);

        const xScale = d3.scaleTime()
            .domain(d3.extent(visualization.data, d => new Date(d.date)))
            .range([visualization.options.margin, width - visualization.options.margin]);

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(visualization.data, d => d.value)])
            .range([height - visualization.options.margin, visualization.options.margin]);

        const line = d3.line()
            .x(d => xScale(new Date(d.date)))
            .y(d => yScale(d.value))
            .curve(d3.curveMonotoneX);

        svg.append('path')
            .datum(visualization.data)
            .attr('fill', 'none')
            .attr('stroke', visualization.options.colorScale[0])
            .attr('stroke-width', 2)
            .attr('d', line);

        const xAxis = d3.axisBottom(xScale)
            .ticks(5)
            .tickFormat(d3.timeFormat(visualization.options.timeFormat));

        const yAxis = d3.axisLeft(yScale)
            .ticks(5);

        svg.append('g')
            .attr('transform', `translate(0,${height - visualization.options.margin})`)
            .call(xAxis);

        svg.append('g')
            .attr('transform', `translate(${visualization.options.margin},0)`)
            .call(yAxis);

        return container;
    }

    updateVisualization(visualizationId, data) {
        const visualization = this.visualizations.get(visualizationId);
        if (!visualization) {
            console.error(`Visualization ${visualizationId} not found`);
            return;
        }

        visualization.data = data;
        this.createVisualization(visualization.type, data, visualization.options);
    }

    destroyVisualization(visualizationId) {
        const visualization = this.visualizations.get(visualizationId);
        if (visualization) {
            visualization.container.remove();
            this.visualizations.delete(visualizationId);
        }
    }

    setTheme(theme) {
        this.options.theme = theme;
        this.updateAllCharts();
        this.saveSettings();
    }

    toggleAnimations() {
        this.options.animations = !this.options.animations;
        this.updateAllCharts();
        this.saveSettings();
    }

    toggleResponsive() {
        this.options.responsive = !this.options.responsive;
        this.updateAllCharts();
        this.saveSettings();
    }
}

// Export the visualization manager
window.VisualizationManager = VisualizationManager; 