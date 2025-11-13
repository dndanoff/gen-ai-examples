import { randomUUID } from 'crypto';
import { WebSocket } from 'ws';

export interface Session {
  id: string;
  ws: WebSocket;
  createdAt: Date;
  userDraft: string;
  isActive: boolean;
}

export class SessionManager {
  private sessions: Map<string, Session> = new Map();
  private wsToSessionId: Map<WebSocket, string> = new Map();

  /**
   * Create a new session for a WebSocket connection
   */
  createSession(ws: WebSocket, userDraft: string): string {
    const sessionId = randomUUID();
    
    const session: Session = {
      id: sessionId,
      ws,
      createdAt: new Date(),
      userDraft,
      isActive: true,
    };

    this.sessions.set(sessionId, session);
    this.wsToSessionId.set(ws, sessionId);

    console.log(`[SessionManager] Created session ${sessionId}`);
    return sessionId;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get session ID by WebSocket
   */
  getSessionIdByWebSocket(ws: WebSocket): string | undefined {
    return this.wsToSessionId.get(ws);
  }

  /**
   * Remove a session
   */
  removeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.wsToSessionId.delete(session.ws);
      this.sessions.delete(sessionId);
      console.log(`[SessionManager] Removed session ${sessionId}`);
    }
  }

  /**
   * Remove session by WebSocket
   */
  removeSessionByWebSocket(ws: WebSocket): void {
    const sessionId = this.wsToSessionId.get(ws);
    if (sessionId) {
      this.removeSession(sessionId);
    }
  }

  /**
   * Mark session as inactive
   */
  deactivateSession(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.isActive = false;
      console.log(`[SessionManager] Deactivated session ${sessionId}`);
    }
  }

  /**
   * Get all active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter(s => s.isActive);
  }

  /**
   * Get session count
   */
  getSessionCount(): number {
    return this.sessions.size;
  }

  /**
   * Clean up old inactive sessions (older than specified minutes)
   */
  cleanupOldSessions(maxAgeMinutes: number = 60): number {
    const now = new Date();
    let cleaned = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const ageMinutes = (now.getTime() - session.createdAt.getTime()) / (1000 * 60);
      
      if (!session.isActive && ageMinutes > maxAgeMinutes) {
        this.removeSession(sessionId);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      console.log(`[SessionManager] Cleaned up ${cleaned} old sessions`);
    }

    return cleaned;
  }
}

// Singleton instance
export const sessionManager = new SessionManager();
