// Main application entry point
import { WebSocketManager } from './js/websocket.js';
import { GraphVisualizer } from './js/graph.js';
import { DiagramModal } from './js/modal.js';
import { DiagramExporter } from './js/export.js';

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
const diagramModalElement = document.getElementById('diagramModal');
const closeModalBtn = document.getElementById('closeModal');
const mermaidContainer = document.getElementById('mermaidContainer');
const exportImageBtn = document.getElementById('exportImageBtn');
const exportTextBtn = document.getElementById('exportTextBtn');
const copyTextBtn = document.getElementById('copyTextBtn');

// Initialize managers
const wsManager = new WebSocketManager();
const graphVisualizer = new GraphVisualizer(graphContainer);
const diagramModal = new DiagramModal(diagramModalElement, mermaidContainer);

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    setupEventListeners();
    setupWebSocketHandlers();
});

function setupEventListeners() {
    // Main actions
    generateBtn.addEventListener('click', handleGenerate);
    clearBtn.addEventListener('click', handleClear);
    
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

    wsManager.on('node_start', ({ nodeId }) => {
        // Mark __start__ as completed when first real node starts
        graphVisualizer.updateNodeState('__start__', 'completed');
        
        graphVisualizer.updateNodeState(nodeId, 'running');
        showStatus(`Running: ${nodeId}`, 'info');
    });

    wsManager.on('node_end', ({ nodeId, status, duration }) => {
        const state = status === 'success' ? 'completed' : 'error';
        graphVisualizer.updateNodeState(nodeId, state);
        
        if (status === 'success') {
            showStatus(`Completed: ${nodeId} (${duration}ms)`, 'info');
        } else {
            showStatus(`Error in: ${nodeId}`, 'error');
        }
    });

    wsManager.on('result', (data) => {
        // Mark __end__ as completed
        graphVisualizer.updateNodeState('__end__', 'completed');
        
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
    graphVisualizer.clear();
    resultsPanel.style.display = 'none';

    // Disable button
    setButtonLoading(true);
    showStatus('Loading workflow graph...', 'info');

    try {
        // Fetch graph via REST API
        const response = await fetch('/api/graph');
        if (!response.ok) {
            throw new Error('Failed to fetch workflow graph');
        }
        const graphData = await response.json();
        
        // Initialize graph visualization
        graphVisualizer.initialize(graphData);
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
    graphVisualizer.clear();
    resultsPanel.style.display = 'none';
    statusMessage.style.display = 'none';
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
    const btnSpinner = generateBtn.querySelector('.btn-spinner');

    if (loading) {
        btnText.style.display = 'none';
        btnSpinner.style.display = 'inline-block';
    } else {
        btnText.style.display = 'inline';
        btnSpinner.style.display = 'none';
    }
}
