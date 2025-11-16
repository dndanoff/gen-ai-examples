// Main application entry point
import { WebSocketManager } from './js/websocket.js';
import { DiagramModal } from './js/modal.js';
import { DiagramExporter } from './js/export.js';
import { EventStack } from './js/event-stack.js';
import { GraphVisualizer } from './js/graph-visualizer.js';

// DOM elements
const projectInput = document.getElementById('projectInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const eventStackContainer = document.getElementById('eventStackContainer');
const graphContainer = document.getElementById('graphContainer');
const graphMermaid = document.getElementById('graphMermaid');
const viewToggle = document.getElementById('viewToggle');
const resultsPanel = document.getElementById('resultsPanel');
const resultsContent = document.getElementById('resultsContent');

// Modal elements
const viewDiagramBtn = document.getElementById('viewDiagramBtn');
const diagramModalElement = document.getElementById('diagramModal');
const closeModalBtn = document.getElementById('closeModal');
const mermaidContainer = document.getElementById('mermaidContainer');
const exportImageBtn = document.getElementById('exportImageBtn');
const exportTextBtn = document.getElementById('exportTextBtn');
const copyTextBtn = document.getElementById('copyTextBtn');

// Initialize managers
const wsManager = new WebSocketManager();
const diagramModal = new DiagramModal(diagramModalElement, mermaidContainer);
const eventStack = new EventStack(eventStackContainer);
const graphVisualizer = new GraphVisualizer();

// State
let graphRendered = false;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupWebSocketHandlers();
    loadGraphStructure();
});

function setupEventListeners() {
    // Main actions
    generateBtn.addEventListener('click', handleGenerate);
    clearBtn.addEventListener('click', handleClear);

    // View toggle
    viewToggle.addEventListener('change', handleViewToggle);

    // Modal actions
    viewDiagramBtn.addEventListener('click', () => diagramModal.open());
    closeModalBtn.addEventListener('click', () => diagramModal.close());

    // Export actions
    exportImageBtn.addEventListener('click', handleExportImage);
    exportTextBtn.addEventListener('click', handleExportText);
    copyTextBtn.addEventListener('click', handleCopyText);

    // Close modal when clicking outside
    diagramModalElement.addEventListener('click', (e) => {
        if (e.target === diagramModalElement) {
            diagramModal.close();
        }
    });

    // Close modal with Escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && diagramModalElement.classList.contains('show')) {
            diagramModal.close();
        }
    });
}

function setupWebSocketHandlers() {
    wsManager.on('status', ({ message, type }) => {
        showStatus(message, type);
    });

    wsManager.on('loading', (isLoading) => {
        setButtonLoading(isLoading);
    });

    wsManager.on('node_start', ({ nodeId, timestamp, ...details }) => {
        showStatus(`Running: ${nodeId}`, 'info');

        // Create stack item for this node
        eventStack.createItem(nodeId, {
            name: nodeId,
            status: 'running',
            statusText: `Processing... ts:${new Date(timestamp)}`,
            details
        });

        // Update graph visualizer
        graphVisualizer.handleEvent({ type: 'node_start', nodeId, timestamp });
        // Only render if graph view is visible
        if (viewToggle.checked) {
            renderGraph();
        }
    });

    wsManager.on('node_end', ({ nodeId, status, timestamp, duration, ...details }) => {
        if (status === 'success') {
            showStatus(`Completed: ${nodeId} (${duration}ms)`, 'info');

            // Update stack item to completed
            eventStack.updateItem(nodeId, {
                status: 'completed',
                statusText: `Completed in ${duration}ms ts:${new Date(timestamp)}`,
                details
            });

            // Update graph visualizer
            graphVisualizer.handleEvent({ type: 'node_end', nodeId, status, duration, timestamp });
            // Only render if graph view is visible
            if (viewToggle.checked) {
                renderGraph();
            }
        } else {
            showStatus(`Error in: ${nodeId}`, 'error');

            // Update stack item to error
            eventStack.updateItem(nodeId, {
                status: 'error',
                statusText: `ts:${new Date(timestamp)}`,
                details
            });

            // Update graph visualizer
            graphVisualizer.handleEvent({ type: 'node_end', nodeId, status: 'error', duration, timestamp });
            // Only render if graph view is visible
            if (viewToggle.checked) {
                renderGraph();
            }
        }
    });

    wsManager.on('completion', (data) => {
        showStatus('Workflow completed successfully!', 'success');
        setButtonLoading(false);

        // Display results
        resultsPanel.style.display = 'block';
        resultsContent.innerHTML = `<pre>${JSON.stringify(data, null, 2)}</pre>`;

        // Scroll to results
        resultsPanel.scrollIntoView({ behavior: 'smooth' });

        // Close WebSocket
        wsManager.close();
    });

    wsManager.on('error', ({ message }) => {
        showStatus(`Error: ${message}`, 'error');
        setButtonLoading(false);
        wsManager.close();
    });
}


// Event Handlers
async function handleGenerate() {
    const userDraft = projectInput.value.trim();

    if (!userDraft) {
        showStatus('Please enter a project description', 'error');
        return;
    }

    // Reset state
    resultsPanel.style.display = 'none';

    // Disable button
    setButtonLoading(true);
    showStatus('Loading workflow graph...', 'info');

    try {
        showStatus('Connecting to workflow...', 'info');
        // Connect WebSocket
        wsManager.connect(userDraft);
    } catch (error) {
        showStatus(`Error: ${error.message}`, 'error');
        setButtonLoading(false);
    }
}

function handleClear() {
    projectInput.value = '';
    resultsPanel.style.display = 'none';
    statusMessage.style.display = 'none';

    // Stop websocket communication
    wsManager.close();
    setButtonLoading(false);

    // Clear stack items and reset graph
    eventStack.clear();
    graphVisualizer.reset();
    // Only render if graph view is visible
    if (viewToggle.checked) {
        renderGraph();
    }
    graphRendered = false;
}

async function handleExportImage() {
    const svg = diagramModal.getSvgElement();
    const success = await DiagramExporter.exportAsImage(svg);
    if (success) {
        DiagramExporter.showSuccess(exportImageBtn);
    }
}

function handleExportText() {
    const mermaidText = diagramModal.getMermaidText();
    const success = DiagramExporter.exportAsText(mermaidText);
    if (success) {
        DiagramExporter.showSuccess(exportTextBtn);
    }
}

async function handleCopyText() {
    const mermaidText = diagramModal.getMermaidText();
    const success = await DiagramExporter.copyToClipboard(mermaidText);
    if (success) {
        DiagramExporter.showSuccess(copyTextBtn);
    }
}

// UI Helpers
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = `status-message ${type}`;
}

function setButtonLoading(loading) {
    generateBtn.disabled = loading;
    const btnText = generateBtn.querySelector('.btn-text');
    const btnThinking = generateBtn.querySelector('.btn-thinking');

    if (loading) {
        btnText.style.display = 'none';
        btnThinking.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline';
        btnThinking.style.display = 'none';
    }
}

// Graph Visualization
async function loadGraphStructure() {
    try {
        const response = await fetch('/api/graph');
        if (!response.ok) {
            throw new Error('Failed to load graph structure');
        }
        const graphDto = await response.json();
        graphVisualizer.setGraphStructure(graphDto);
        // Don't render immediately - wait until graph view is visible
    } catch (error) {
        console.error('Error loading graph structure:', error);
    }
}

async function renderGraph() {
    const mermaidText = graphVisualizer.getDiagram();
    console.log(mermaidText);
    // Clear container
    graphMermaid.innerHTML = '';

    // Create mermaid div
    const diagramDiv = document.createElement('div');
    diagramDiv.className = 'mermaid';
    diagramDiv.textContent = mermaidText;
    graphMermaid.appendChild(diagramDiv);

    // Render with mermaid
    if (window.mermaid) {
        try {
            await window.mermaid.run({ nodes: [diagramDiv] });
        } catch (error) {
            console.error('Error rendering mermaid:', error);
        }
    }
}

function handleViewToggle() {
    if (viewToggle.checked) {
        // Show graph view
        eventStackContainer.style.display = 'none';
        graphContainer.style.display = 'block';

        // Render graph on first view or if it needs update
        if (!graphRendered) {
            renderGraph();
            graphRendered = true;
        }
    } else {
        // Show event stack view
        eventStackContainer.style.display = 'block';
        graphContainer.style.display = 'none';
    }
}
