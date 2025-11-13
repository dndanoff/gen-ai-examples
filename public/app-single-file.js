// WebSocket connection
let ws = null;
let graphData = null;
let nodeStates = new Map();

// DOM elements
const projectInput = document.getElementById('projectInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const graphContainer = document.getElementById('graphContainer');
const resultsPanel = document.getElementById('resultsPanel');
const resultsContent = document.getElementById('resultsContent');

// Modal elements
const viewDiagramBtn = document.getElementById('viewDiagramBtn');
const diagramModal = document.getElementById('diagramModal');
const closeModal = document.getElementById('closeModal');
const mermaidContainer = document.getElementById('mermaidContainer');
const exportImageBtn = document.getElementById('exportImageBtn');
const exportTextBtn = document.getElementById('exportTextBtn');
const copyTextBtn = document.getElementById('copyTextBtn');

// Store mermaid text
let currentMermaidText = '';

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    generateBtn.addEventListener('click', handleGenerate);
    clearBtn.addEventListener('click', handleClear);
    viewDiagramBtn.addEventListener('click', handleViewDiagram);
    closeModal.addEventListener('click', handleCloseModal);
    exportImageBtn.addEventListener('click', handleExportImage);
    exportTextBtn.addEventListener('click', handleExportText);
    copyTextBtn.addEventListener('click', handleCopyText);

    // Close modal when clicking outside
    diagramModal.addEventListener('click', (e) => {
        if (e.target === diagramModal) {
            handleCloseModal();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && diagramModal.classList.contains('show')) {
            handleCloseModal();
        }
    });
});


function handleGenerate() {
    const userDraft = projectInput.value.trim();

    if (!userDraft) {
        showStatus('Please enter a project description', 'error');
        return;
    }

    // Reset state
    nodeStates.clear();
    resultsPanel.style.display = 'none';

    // Disable button
    setButtonLoading(true);
    showStatus('Connecting to workflow...', 'info');

    // Connect WebSocket
    connectWebSocket(userDraft);
}

function handleClear() {
    projectInput.value = '';
    nodeStates.clear();
    resultsPanel.style.display = 'none';
    statusMessage.style.display = 'none';

    // Clear graph
    graphContainer.innerHTML = '<div class="graph-placeholder">Click "Generate" to start the workflow</div>';
}

function connectWebSocket(userDraft) {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    ws = new WebSocket(wsUrl);

    ws.onopen = () => {
        console.log('WebSocket connected');
        showStatus('Starting workflow...', 'info');

        // Send start workflow message
        ws.send(JSON.stringify({
            type: 'start_workflow',
            userDraft: userDraft
        }));
    };

    ws.onmessage = (event) => {
        const message = JSON.parse(event.data);
        handleWebSocketMessage(message);
    };

    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        showStatus('Connection error occurred', 'error');
        setButtonLoading(false);
    };

    ws.onclose = () => {
        console.log('WebSocket closed');
        setButtonLoading(false);
    };
}

function handleWebSocketMessage(message) {
    console.log('Received message:', message);

    switch (message.type) {
        case 'graph':
            graphData = message.data;
            initializeGraph(graphData);
            showStatus('Workflow started', 'info');
            break;

        case 'node_start':
            handleNodeStart(message.data);
            break;

        case 'node_end':
            handleNodeEnd(message.data);
            break;

        case 'result':
            handleResult(message.data);
            break;

        case 'error':
            handleError(message.data);
            break;
    }
}

function handleNodeStart(data) {
    const { nodeId } = data;
    nodeStates.set(nodeId, 'running');
    updateNodeVisual(nodeId, 'running');
    showStatus(`Running: ${nodeId}`, 'info');
}

function handleNodeEnd(data) {
    const { nodeId, status, duration } = data;

    if (status === 'success') {
        nodeStates.set(nodeId, 'completed');
        updateNodeVisual(nodeId, 'completed');
        showStatus(`Completed: ${nodeId} (${duration}ms)`, 'info');
    } else {
        nodeStates.set(nodeId, 'error');
        updateNodeVisual(nodeId, 'error');
        showStatus(`Error in: ${nodeId}`, 'error');
    }
}

function handleResult(data) {
    showStatus('Workflow completed successfully!', 'success');
    setButtonLoading(false);

    // Display results
    resultsPanel.style.display = 'block';
    resultsContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

    // Scroll to results
    resultsPanel.scrollIntoView({ behavior: 'smooth' });

    // Close WebSocket
    if (ws) {
        ws.close();
    }
}

function handleError(data) {
    showStatus(`Error: ${data.message}`, 'error');
    setButtonLoading(false);

    if (ws) {
        ws.close();
    }
}

function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function setButtonLoading(loading) {
    generateBtn.disabled = loading;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnSpinner = generateBtn.querySelector('.btn-spinner');

    if (loading) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}

// D3 Graph Visualization
function initializeGraph(data) {
    // Clear container
    graphContainer.innerHTML = '';

    const { nodes, edges } = data;

    // Set up SVG
    const width = graphContainer.clientWidth;
    const height = graphContainer.clientHeight || 400;

    const svg = d3.select(graphContainer)
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
    const layers = calculateLayers(nodes, edges);
    const positions = calculatePositions(layers, width, height, nodeRadius);

    // Create node data with positions
    const nodeData = nodes.map(nodeId => {
        const pos = positions.get(nodeId);
        const node = {
            id: nodeId,
            x: pos.x,
            y: pos.y,
            state: nodeStates.get(nodeId) || 'pending'
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
    const links = svg.append('g')
        .selectAll('path')
        .data(edgeData)
        .enter()
        .append('path')
        .attr('class', d => `link ${d.isConditional ? 'conditional' : ''}`)
        .attr('d', d => {
            const dx = d.target.x - d.source.x;
            const dy = d.target.y - d.source.y;
            const dr = Math.sqrt(dx * dx + dy * dy);
            return `M ${d.source.x},${d.source.y} L ${d.target.x},${d.target.y}`;
        })
        .attr('marker-end', 'url(#arrowhead)');

    // Draw nodes
    const nodeGroups = svg.append('g')
        .selectAll('g')
        .data(nodeData)
        .enter()
        .append('g')
        .attr('class', d => `node ${d.state}`)
        .attr('transform', d => `translate(${d.x},${d.y})`);

    nodeGroups.append('circle')
        .attr('r', nodeRadius);

    nodeGroups.append('text')
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

    // Store references for updates
    graphContainer._nodeGroups = nodeGroups;
}

function calculateLayers(nodes, edges) {
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

function calculatePositions(layers, width, height, nodeRadius) {
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

function updateNodeVisual(nodeId, state) {
    const container = graphContainer;
    if (!container._nodeGroups) return;

    container._nodeGroups
        .filter(d => d.id === nodeId)
        .attr('class', `node ${state}`);
}

// Modal Functions
async function handleViewDiagram() {
    try {
        // Show loading state
        mermaidContainer.innerHTML = '<div class="mermaid-loading">Loading diagram...</div>';
        diagramModal.classList.add('show');

        // Fetch mermaid diagram from API
        const response = await fetch('/api/mermaid');
        if (!response.ok) {
            throw new Error('Failed to fetch diagram');
        }

        const data = await response.json();
        currentMermaidText = data.mermaid;

        // Render mermaid diagram
        await renderMermaidDiagram(currentMermaidText);
    } catch (error) {
        console.error('Error loading diagram:', error);
        mermaidContainer.innerHTML = `<div style="color: #d32f2f; text-align: center;">
            <p>Error loading diagram</p>
            <p style="font-size: 0.9rem;">${error.message}</p>
        </div>`;
    }
}

async function renderMermaidDiagram(mermaidText) {
    try {
        // Clear container
        mermaidContainer.innerHTML = '';
        // Create a div for mermaid to render into
        const diagramDiv = document.createElement('div');
        diagramDiv.className = 'mermaid';
        diagramDiv.textContent = mermaidText;
        mermaidContainer.appendChild(diagramDiv);

        // Render the diagram
        if (window.mermaid) {
            await window.mermaid.run({
                nodes: [diagramDiv]
            });
        } else {
            throw new Error('Mermaid library not loaded');
        }
    } catch (error) {
        console.error('Error rendering mermaid:', error);
        mermaidContainer.innerHTML = `<div style="color: #d32f2f; text-align: center;">
            <p>Error rendering diagram</p>
            <p style="font-size: 0.9rem;">${error.message}</p>
        </div>`;
    }
}

function handleCloseModal() {
    diagramModal.classList.remove('show');
}

async function handleExportImage() {
    try {
        const svg = mermaidContainer.querySelector('svg');
        if (!svg) {
            alert('No diagram to export');
            return;
        }

        // Clone the SVG to avoid modifying the original
        const svgClone = svg.cloneNode(true);
        
        // Get SVG dimensions
        const bbox = svg.getBBox();
        const width = bbox.width + 40;
        const height = bbox.height + 40;
        
        svgClone.setAttribute('width', width);
        svgClone.setAttribute('height', height);
        svgClone.setAttribute('viewBox', `${bbox.x - 20} ${bbox.y - 20} ${width} ${height}`);
        
        // Add XML namespace if not present
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');

        // Convert SVG to string
        const svgData = new XMLSerializer().serializeToString(svgClone);
        
        // Create canvas to convert to PNG
        const canvas = document.createElement('canvas');
        const scale = 2; // 2x for better quality
        canvas.width = width * scale;
        canvas.height = height * scale;
        const ctx = canvas.getContext('2d');
        
        // Set white background
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Create image from SVG data URL instead of blob
        const img = new Image();
        
        img.onload = () => {
            try {
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                
                // Download as PNG
                canvas.toBlob((blob) => {
                    if (blob) {
                        const link = document.createElement('a');
                        link.download = 'workflow-diagram.png';
                        link.href = URL.createObjectURL(blob);
                        link.click();
                        URL.revokeObjectURL(link.href);
                        
                        // Show success feedback
                        showExportSuccess(exportImageBtn);
                    } else {
                        throw new Error('Failed to create image blob');
                    }
                });
            } catch (err) {
                console.error('Error in image processing:', err);
                alert('Failed to export image: ' + err.message);
            }
        };
        
        img.onerror = (err) => {
            console.error('Error loading image:', err);
            alert('Failed to load image for export');
        };
        
        // Use data URL instead of blob URL to avoid CORS issues
        const svgDataUrl = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
        img.src = svgDataUrl;
        
    } catch (error) {
        console.error('Error exporting image:', error);
        alert('Failed to export image: ' + error.message);
    }
}

function handleExportText() {
    try {
        if (!currentMermaidText) {
            alert('No diagram text available');
            return;
        }

        // Create a blob with the mermaid text
        const blob = new Blob([currentMermaidText], { type: 'text/plain' });
        const link = document.createElement('a');
        link.download = 'workflow-diagram.mmd';
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(link.href);

        // Show success feedback
        showExportSuccess(exportTextBtn);
    } catch (error) {
        console.error('Error exporting text:', error);
        alert('Failed to export text: ' + error.message);
    }
}

async function handleCopyText() {
    try {
        if (!currentMermaidText) {
            alert('No diagram text available');
            return;
        }

        // Copy to clipboard
        await navigator.clipboard.writeText(currentMermaidText);

        // Show success feedback
        showExportSuccess(copyTextBtn);
    } catch (error) {
        console.error('Error copying text:', error);
        alert('Failed to copy to clipboard: ' + error.message);
    }
}

function showExportSuccess(button) {
    const originalText = button.innerHTML;
    button.classList.add('success');
    button.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg> Success!';

    setTimeout(() => {
        button.classList.remove('success');
        button.innerHTML = originalText;
    }, 2000);
}
