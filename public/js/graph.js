// D3 Graph Visualization
export class GraphVisualizer {
    constructor(container) {
        this.container = container;
        this.nodeStates = new Map();
        this.nodeGroups = null;
        this.edgeGroups = null;
        this.activeEdges = new Set();
    }

    initialize(data) {
        // Clear container
        this.container.innerHTML = '';

        const { nodes, edges } = data;

        // Set up SVG with minimum dimensions for scrolling
        const containerWidth = this.container.clientWidth;
        const containerHeight = this.container.clientHeight || 400;

        // Calculate required dimensions based on graph structure
        const graphLayers = this.calculateLayers(nodes, edges);
        const maxNodesInLayer = Math.max(...graphLayers.map(layer => layer.length));

        // Ensure enough space for all nodes (horizontal layout)
        const minWidth = Math.max(containerWidth, graphLayers.length * 250);
        const minHeight = Math.max(containerHeight, maxNodesInLayer * 200);

        const width = minWidth;
        const height = minHeight;

        const svg = d3.select(this.container)
            .append('svg')
            .attr('id', 'graphSvg')
            .attr('width', width)
            .attr('height', height);

        // Create arrow markers for edges
        const defs = svg.append('defs');

        // Regular arrow
        defs.append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 35)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#999');

        // Active arrow (for completed paths)
        defs.append('marker')
            .attr('id', 'arrowhead-active')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 35)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#667eea');

        // Conditional arrow
        defs.append('marker')
            .attr('id', 'arrowhead-conditional')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 35)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 8)
            .attr('markerHeight', 8)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('fill', '#ff9800');

        // Create hierarchical layout
        const nodeMap = new Map();
        const nodeRadius = 35; // Increased for better visibility

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

        // Draw edges with curved paths
        this.edgeGroups = svg.append('g')
            .attr('class', 'edges')
            .selectAll('path')
            .data(edgeData)
            .enter()
            .append('path')
            .attr('class', d => `link ${d.isConditional ? 'conditional' : ''}`)
            .attr('d', d => this.createCurvedPath(d.source, d.target))
            .attr('marker-end', d => d.isConditional ? 'url(#arrowhead-conditional)' : 'url(#arrowhead)')
            .attr('data-from', d => d.source.id)
            .attr('data-to', d => d.target.id);

        // Draw nodes
        this.nodeGroups = svg.append('g')
            .selectAll('g')
            .data(nodeData)
            .enter()
            .append('g')
            .attr('class', d => `node ${d.state}`)
            .attr('transform', d => `translate(${d.x},${d.y})`);

        // Add different shapes for start/end nodes
        this.nodeGroups.each(function(d) {
            const group = d3.select(this);

            if (d.id === '__start__') {
                // Start node: rounded rectangle
                group.append('rect')
                    .attr('x', -nodeRadius)
                    .attr('y', -nodeRadius * 0.6)
                    .attr('width', nodeRadius * 2)
                    .attr('height', nodeRadius * 1.2)
                    .attr('rx', 8)
                    .attr('ry', 8);
            } else if (d.id === '__end__') {
                // End node: rounded rectangle
                group.append('rect')
                    .attr('x', -nodeRadius)
                    .attr('y', -nodeRadius * 0.6)
                    .attr('width', nodeRadius * 2)
                    .attr('height', nodeRadius * 1.2)
                    .attr('rx', 8)
                    .attr('ry', 8);
            } else {
                // Regular nodes: circles
                group.append('circle')
                    .attr('r', nodeRadius);
            }
        });

        this.nodeGroups.append('text')
            .attr('dy', 5)
            .text(d => this.formatNodeLabel(d.id))
            .style('font-size', d => d.id.startsWith('__') ? '11px' : '12px')
            .style('font-weight', d => d.id.startsWith('__') ? '700' : '600')
            .each(function (d) {
                // Wrap text if too long
                const text = d3.select(this);
                const label = d.id;

                // Don't wrap start/end nodes
                if (label.startsWith('__')) {
                    return;
                }

                const words = label.split(/(?=[A-Z])/);
                if (words.length > 1 && label.length > 10) {
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
        const padding = nodeRadius;
        const minLayerWidth = nodeRadius * 6; // Minimum horizontal spacing between layers
        const layerWidth = Math.max(
            minLayerWidth,
            (width - padding * 2) / Math.max(layers.length - 1, 1)
        );

        layers.forEach((layer, layerIndex) => {
            const minNodeSpacing = nodeRadius * 5; // Minimum vertical spacing
            const layerHeight = Math.max(
                minNodeSpacing,
                (height - padding * 2) / Math.max(layer.length - 1, 1)
            );

            layer.forEach((nodeId, nodeIndex) => {
                let x, y;

                // Horizontal layout: x increases with layer, y varies within layer
                x = padding + layerIndex * layerWidth;

                if (layer.length === 1) {
                    y = height / 2;
                } else {
                    // Center the layer if it has fewer nodes
                    const totalHeight = (layer.length - 1) * layerHeight;
                    const startY = (height - totalHeight) / 2;
                    y = startY + nodeIndex * layerHeight;
                }

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

        // Update edges leading to this node if completed
        if (state === 'completed' && this.edgeGroups) {
            this.edgeGroups
                .filter(function() {
                    return d3.select(this).attr('data-to') === nodeId;
                })
                .attr('class', 'link active')
                .attr('marker-end', 'url(#arrowhead-active)');
        }
    }

    createCurvedPath(source, target) {
        const dx = target.x - source.x;
        const dy = target.y - source.y;
        const dr = Math.sqrt(dx * dx + dy * dy);

        // Use curved path for better visualization (horizontal layout)
        if (Math.abs(dy) < 50) {
            // Horizontal or near-horizontal: use straight line
            return `M ${source.x},${source.y} L ${target.x},${target.y}`;
        } else {
            // Vertical: use quadratic curve
            const curvature = 0.3;
            const controlX = source.x + (target.x - source.x) * curvature;
            return `M ${source.x},${source.y} Q ${controlX},${source.y + dy / 2} ${target.x},${target.y}`;
        }
    }

    formatNodeLabel(id) {
        if (id === '__start__') return 'START';
        if (id === '__end__') return 'END';
        return id;
    }

    clear() {
        this.nodeStates.clear();
        this.container.innerHTML = '<div class="graph-placeholder">Click "Generate" to start the workflow</div>';
    }
}
