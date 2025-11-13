// Modal and Diagram functionality
export class DiagramModal {
    constructor(modalElement, mermaidContainer) {
        this.modal = modalElement;
        this.mermaidContainer = mermaidContainer;
        this.currentMermaidText = '';
    }

    async open() {
        try {
            // Show loading state
            this.mermaidContainer.innerHTML = '<div class="mermaid-loading">Loading diagram...</div>';
            this.modal.classList.add('show');

            // Fetch mermaid diagram from API
            const response = await fetch('/api/mermaid');
            if (!response.ok) {
                throw new Error('Failed to fetch diagram');
            }

            const data = await response.json();
            this.currentMermaidText = data.mermaid;

            // Render mermaid diagram
            await this.renderDiagram(this.currentMermaidText);
        } catch (error) {
            console.error('Error loading diagram:', error);
            this.mermaidContainer.innerHTML = `<div style="color: #d32f2f; text-align: center;">
                <p>Error loading diagram</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>`;
        }
    }

    async renderDiagram(mermaidText) {
        try {
            // Clear container
            this.mermaidContainer.innerHTML = '';

            // Create a div for mermaid to render into
            const diagramDiv = document.createElement('div');
            diagramDiv.className = 'mermaid';
            diagramDiv.textContent = mermaidText;
            this.mermaidContainer.appendChild(diagramDiv);

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
            this.mermaidContainer.innerHTML = `<div style="color: #d32f2f; text-align: center;">
                <p>Error rendering diagram</p>
                <p style="font-size: 0.9rem;">${error.message}</p>
            </div>`;
        }
    }

    close() {
        this.modal.classList.remove('show');
    }

    getMermaidText() {
        return this.currentMermaidText;
    }

    getSvgElement() {
        return this.mermaidContainer.querySelector('svg');
    }
}
