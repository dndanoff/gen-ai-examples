// WebSocket connection management
export class WebSocketManager {
    constructor() {
        this.ws = null;
        this.handlers = {};
    }

    connect(userDraft) {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        const wsUrl = `${protocol}//${window.location.host}/ws`;

        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.emit('status', { message: 'Starting workflow...', type: 'info' });

            // Send start workflow message
            this.ws.send(JSON.stringify({
                type: 'start_workflow',
                userDraft: userDraft
            }));
        };

        this.ws.onmessage = (event) => {
            const message = JSON.parse(event.data);
            this.handleMessage(message);
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
            this.emit('status', { message: 'Connection error occurred', type: 'error' });
            this.emit('loading', false);
        };

        this.ws.onclose = () => {
            console.log('WebSocket closed');
            this.emit('loading', false);
        };
    }

    handleMessage(message) {
        console.log('Received message:', message);

        switch (message.type) {
            case 'graph':
                this.emit('graph', message.data);
                this.emit('status', { message: 'Workflow started', type: 'info' });
                break;

            case 'node_start':
                this.emit('node_start', message.data);
                break;

            case 'node_end':
                this.emit('node_end', message.data);
                break;

            case 'result':
                this.emit('result', message.data);
                break;

            case 'error':
                this.emit('error', message.data);
                break;
        }
    }

    on(event, handler) {
        if (!this.handlers[event]) {
            this.handlers[event] = [];
        }
        this.handlers[event].push(handler);
    }

    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(handler => handler(data));
        }
    }

    close() {
        if (this.ws) {
            this.ws.close();
        }
    }
}
