// D3 Graph Visualization
export class GraphVisualizer {
    constructor(container) {
        this.container = container;
        this.nodeStates = new Map();
        this.nodeGroups = null;
    }

    initialize(data) {
        // Clear container
        this.container.innerHTML = '';

        const { nodes, edges } = data;

        // Set up SVG
        const width = this.container.clientWidth;
        const height = this.container.clientHeight || 400;

        const svg = d3.select(this.container)
            .append('svg')
            .attr('id', 'graphSvg')
            .attr('width', width)
            .attr('height', height);

        // Create arrow marker for edges
        svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 25)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#999');

        // Create hierarchical layout
        const nodeMap = new Map();
        const nodeRadius = 30;

        // Calculate positions using a simple hierarchical layout
        const layers = this.calculateLayers(nodes, edges);
        const positions = this.calculatePositions(layers, width, height, nodeRadius);

        // Create node data with positions
        const nodeData = nodes.map(nodeId => {
            const pos = positions.get(nodeId);
            const node = {
                id: nodeId,
                x: pos.x,
                y: pos.y,
                state: this.nodeStates.get(nodeId) || 'pending'
            };
            nodeMap.set(nodeId, node);
            return node;
        });

        // Create edge data
        const edgeData = edges.map(edge => ({
            source: nodeMap.get(edge.from),
            target: nodeMap.get(edge.to),
            isConditional: edge.isConditional
        }));

        // Draw edges
        svg.append('g')
            .selectAll('path')
            .data(edgeData)
            .enter()
            .append('path')
            .attr('class', d => `link ${d.isConditional ? 'conditional' : ''}`)
            .attr('d', d => `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`)
            .attr('marker-end', 'url(#arrowhead)');

        // Draw nodes
        this.nodeGroups = svg.append('g')
            .selectAll('g')
            .data(nodeData)
            .enter()
            .append('g')
            .attr('class', d => `node ${d.state}`)
            .attr('transform', d => `translate(${d.x},${d.y})`);

        this.nodeGroups.append('circle')
            .attr('r', nodeRadius);

        this.nodeGroups.append('text')
            .attr('dy', 5)
            .text(d => d.id)
            .style('font-size', '12px')
            .each(function (d) {
                // Wrap text if too long
                const text = d3.select(this);
                const words = d.id.split(/(?=[A-Z])/);
                if (words.length > 1) {
                    text.text('');
                    text.append('tspan')
                        .attr('x', 0)
                        .attr('dy', -5)
                        .text(words[0]);
                    text.append('tspan')
                        .attr('x', 0)
                        .attr('dy', 15)
                        .text(words.slice(1).join(''));
                }
            });
    }

    calculateLayers(nodes, edges) {
        const layers = [];
        const visited = new Set();
        const nodeToLayer = new Map();

        // Find start node
        const startNode = '__start__';

        // BFS to assign layers
        const queue = [{ node: startNode, layer: 0 }];
        visited.add(startNode);
        nodeToLayer.set(startNode, 0);

        while (queue.length > 0) {
            const { node, layer } = queue.shift();

            if (!layers[layer]) {
                layers[layer] = [];
            }
            layers[layer].push(node);

            // Find outgoing edges
            edges.forEach(edge => {
                if (edge.from === node && !visited.has(edge.to)) {
                    visited.add(edge.to);
                    nodeToLayer.set(edge.to, layer + 1);
                    queue.push({ node: edge.to, layer: layer + 1 });
                }
            });
        }

        return layers;
    }

    calculatePositions(layers, width, height, nodeRadius) {
        const positions = new Map();
        const padding = nodeRadius * 3;
        const layerHeight = (height - padding * 2) / Math.max(layers.length - 1, 1);

        layers.forEach((layer, layerIndex) => {
            const layerWidth = (width - padding * 2) / Math.max(layer.length - 1, 1);

            layer.forEach((nodeId, nodeIndex) => {
                const x = layer.length === 1
                    ? width / 2
                    : padding + nodeIndex * layerWidth;
                const y = padding + layerIndex * layerHeight;

                positions.set(nodeId, { x, y });
            });
        });

        return positions;
    }

    updateNodeState(nodeId, state) {
        this.nodeStates.set(nodeId, state);
        if (this.nodeGroups) {
            this.nodeGroups
                .filter(d => d.id === nodeId)
                .attr('class', `node ${state}`);
        }
    }

    clear() {
        this.nodeStates.clear();
        this.container.innerHTML = '<div class="graph-placeholder">Click "Generate" to start the workflow</div>';
    }
}
