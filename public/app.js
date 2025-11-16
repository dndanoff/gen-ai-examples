// Main application entry point
import { WebSocketManager } from './js/websocket.js';
import { DiagramModal } from './js/modal.js';
import { DiagramExporter } from './js/export.js';
import { EventStack } from './js/event-stack.js';

// DOM elements
const projectInput = document.getElementById('projectInput');
const generateBtn = document.getElementById('generateBtn');
const clearBtn = document.getElementById('clearBtn');
const statusMessage = document.getElementById('statusMessage');
const executionContainer = document.getElementById('executionContainer');
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
const eventStack = new EventStack(executionContainer);

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

    wsManager.on('node_start', ({ nodeId, timestamp, ...details }) => {
        showStatus(`Running: ${nodeId}`, 'info');

        // Create stack item for this node
        eventStack.createItem(nodeId, {
            name: nodeId,
            status: 'running',
            statusText: `Processing... ts:${new Date(timestamp)}`,
            details
        });
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
        } else {
            showStatus(`Error in: ${nodeId}`, 'error');

            // Update stack item to error
            eventStack.updateItem(nodeId, {
                status: 'error',
                statusText: `ts:${new Date(timestamp)}`,
                details
            });
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

    // Clear stack items
    eventStack.clear();
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
