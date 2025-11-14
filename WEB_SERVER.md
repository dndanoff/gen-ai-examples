# Web Server Mode

This project now supports both CLI and Web Server modes.

## Running the Application

### CLI Mode (Original)
```bash
npm run start:dev
```

### Web Server Mode (New)
```bash
npm run start:web:dev
```

For production:
```bash
npm run build
npm run start:web
```

## Web Server Features

The web server provides a visual interface for the Project Description Generator workflow with:

- **REST API endpoints** for health checks and graph structure
- **WebSocket support** for real-time workflow progress updates
- **Interactive D3.js visualization** showing workflow execution in real-time
- **Responsive UI** with project description input and results display

## Configuration

The web server port can be configured via environment variable:

```bash
WEB_PORT=3000  # Default is 3000
```

Add this to your `.env` file if you want to change the default port.

## API Endpoints

### REST API

- `GET /api/health` - Health check endpoint
- `GET /api/graph` - Get workflow graph structure (JSON)
- `GET /api/mermaid` - Get workflow graph in Mermaid format

### WebSocket

- `ws://localhost:3000/ws` - WebSocket endpoint for workflow execution

#### WebSocket Message Format

**Client to Server:**
```json
{
  "type": "start_workflow",
  "userDraft": "Your project description here..."
}
```

**Server to Client:**
```json
{
  "type": "graph|node_start|node_end|result|error",
  "data": { ... }
}
```

## Architecture

### Backend Components

1. **`src/server.ts`** - Express server with WebSocket support
2. **`src/web/workflowRunner.ts`** - Workflow execution handler with event streaming
3. **`src/core/workflows/eventEnhancedFlow.ts`** - Event-emitting state graph wrapper
4. **`src/core/workflows/projectExperienceForCV.ts`** - Modified to use EventEmittingStateGraph

### Frontend Components

1. **`public/index.html`** - Main web interface
2. **`public/styles.css`** - Styling with animations
3. **`public/app.js`** - WebSocket client and D3.js visualization

## Workflow Visualization

The D3.js visualization shows:

- **Nodes** representing workflow steps
- **Edges** showing the flow between steps (solid for regular, dashed for conditional)
- **Real-time status updates** with color coding:
  - Green: Completed
  - Red: Error

## Usage

1. Start the web server: `npm run start:web:dev`
2. Open browser to `http://localhost:3000`
3. Enter a project description in the left panel
4. Click "Generate" button
5. Watch the workflow execute in real-time on the right panel
6. View the final result at the bottom

## Example Project Description

```
Developed a web application for managing customer orders using React and Node.js.
The system includes authentication, real-time notifications, and reporting features.
Implemented RESTful APIs and integrated with PostgreSQL database.
```

## Technical Stack

- **Backend**: Express.js, WebSocket (ws)
- **Frontend**: Vanilla JavaScript, D3.js v7
- **Styling**: CSS3 with animations
- **Real-time**: WebSocket for bidirectional communication
