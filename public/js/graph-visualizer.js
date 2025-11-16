export class GraphVisualizer {
    constructor() {
        this.graphDto = null;
        this.nodeStates = new Map(); // nodeId -> { status, duration }
        this.mermaidText = '';
    }

    setGraphStructure(graphDto) {
        this.graphDto = graphDto;
        this.reset();
    }

    handleEvent(event) {
        const { type, nodeId, duration, status } = event;

        if (!this.nodeStates.has(nodeId)) {
            console.warn(`Node ${nodeId} not found in graph structure`);
            return;
        }

        switch (type) {
            case 'node_start':
                this.nodeStates.set(nodeId, { status: 'running', duration: null });
                break;

            case 'node_end':
                if (status === 'success') {
                    this.nodeStates.set(nodeId, { status: 'completed', duration });
                } else if (status === 'error') {
                    this.nodeStates.set(nodeId, { status: 'error', duration });
                }
                break;

            default:
                console.warn(`Unknown event type: ${type}`);
                return;
        }

        // Update diagram after state change
        this.updateDiagram();
    }

    generateDiagram() {
        if (!this.graphDto) {
            return 'graph TD\n  A[No graph loaded]';
        }

        let diagram = 'graph TD\n';

        // Add nodes with labels (including duration for completed nodes)
        this.graphDto.nodes.forEach(nodeId => {
            const state = this.nodeStates.get(nodeId);
            let label = nodeId;

            // Add duration to label for completed nodes
            if (state.status === 'completed' && state.duration !== null) {
                label = `${nodeId}<br/>${state.duration}ms`;
            }

            // Format node based on special nodes
            if (nodeId === '__start__') {
                diagram += `  ${nodeId}([${label}])\n`;
            } else if (nodeId === '__end__') {
                diagram += `  ${nodeId}([${label}])\n`;
            } else {
                diagram += `  ${nodeId}[${label}]\n`;
            }
        });

        // Add edges
        this.graphDto.edges.forEach(edge => {
            if (edge.isConditional) {
                diagram += `  ${edge.from} -.->|conditional| ${edge.to}\n`;
            } else {
                diagram += `  ${edge.from} --> ${edge.to}\n`;
            }
        });

        // Add styles
        diagram += '\n';
        diagram += '  %% Styles\n';
        diagram += '  classDef error fill:#ffebee,stroke:#c62828,stroke-width:2px\n';
        diagram += '  classDef completed fill:#e8f5e8,stroke:#1b5e20,stroke-width:2px\n';
        diagram += '  classDef running fill:#fff3e0,stroke:#e65100,stroke-width:3px\n';
        diagram += '  classDef idle fill:#fafafa,stroke:#9e9e9e,stroke-width:1px\n';

        // Apply state classes to nodes
        diagram += '\n';
        diagram += '  %% State\n';
        this.nodeStates.forEach((state, nodeId) => {
            diagram += `  class ${nodeId} ${state.status}\n`;
        });

        return diagram;
    }

    updateDiagram() {
        this.mermaidText = this.generateDiagram();
    }

    getDiagram() {
        return this.mermaidText;
    }

    reset() {
        if (this.graphDto) {
            this.nodeStates.clear();
            this.graphDto.nodes.forEach(nodeId => {
                this.nodeStates.set(nodeId, { status: 'idle', duration: null });
            });
            this.updateDiagram();
        }
    }
}
