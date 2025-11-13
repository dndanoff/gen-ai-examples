import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from '@src/config';
import { WorkflowRunner } from '@src/web/workflowRunner';
import { workflowGraph } from '@src/core/workflows/projectExperienceForCV';
import { sessionManager } from '@src/web/sessionManager';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server, path: '/ws' });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// REST API endpoints
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/graph', (_req, res) => {
  try {
    const graphDto = workflowGraph.toGraphDto();
    res.json(graphDto);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to get graph',
    });
  }
});

app.get('/api/mermaid', (_req, res) => {
  try {
    const mermaid = workflowGraph.generateMermaidGraph();
    res.json({ mermaid });
  } catch (error) {
    res.status(500).json({
      error:
        error instanceof Error ? error.message : 'Failed to generate mermaid',
    });
  }
});

// Serve index.html for root
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// WebSocket connection handler
wss.on('connection', (ws) => {
  console.log('[WebSocket] Client connected');
  console.log(`[WebSocket] Active sessions: ${sessionManager.getSessionCount()}`);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());

      if (data.type === 'start_workflow') {
        const { userDraft } = data;

        if (!userDraft || typeof userDraft !== 'string') {
          ws.send(
            JSON.stringify({
              type: 'error',
              data: { message: 'Invalid userDraft provided' },
            }),
          );
          return;
        }

        // Create a new session for this workflow execution
        const sessionId = sessionManager.createSession(ws, userDraft);
        await new WorkflowRunner(ws).run(userDraft);
        sessionManager.deactivateSession(sessionId);
      }
    } catch (error) {
      console.error('[WebSocket] Error:', error);
      ws.send(
        JSON.stringify({
          type: 'error',
          data: {
            message: error instanceof Error ? error.message : 'Unknown error',
          },
        }),
      );
    }
  });

  ws.on('close', () => {
    console.log('[WebSocket] Client disconnected');
    sessionManager.removeSessionByWebSocket(ws);
    console.log(`[WebSocket] Active sessions: ${sessionManager.getSessionCount()}`);
  });

  ws.on('error', (error) => {
    console.error('[WebSocket] Error:', error);
  });
});

// Periodic cleanup of old sessions (every 10 minutes)
setInterval(() => {
  sessionManager.cleanupOldSessions(60); // Clean sessions older than 60 minutes
}, 10 * 60 * 1000);

// Start server
const PORT = config.web.port;
server.listen(PORT, () => {
  console.log(`=== Gen-AI Web Server ===`);
  console.log(`Server running at http://localhost:${PORT}`);
  console.log(`WebSocket available at ws://localhost:${PORT}/ws`);
  console.log(`Multi-user support enabled with session isolation`);
  console.log(`\nPress Ctrl+C to stop the server`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('\nSIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nSIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
