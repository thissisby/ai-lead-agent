import type { ConversationSession } from '../types';

const STORAGE_KEY = 'realty_assistant_sessions';

/**
 * Backend Storage Simulation
 * Uses localStorage to persist conversation sessions.
 * In production, replace with PostgreSQL/MongoDB via REST API.
 */

export function saveSessions(sessions: ConversationSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch {
    console.error('Failed to save sessions to storage');
  }
}

export function loadSessions(): ConversationSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    console.error('Failed to load sessions from storage');
  }
  return [];
}

export function saveSession(session: ConversationSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.push(session);
  }
  saveSessions(sessions);
}

export function getSession(id: string): ConversationSession | null {
  const sessions = loadSessions();
  return sessions.find(s => s.id === id) || null;
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}
