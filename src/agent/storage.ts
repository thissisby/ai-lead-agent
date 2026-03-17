import type { ConversationSession } from '../types';

const STORAGE_KEY = 'realty_assistant_sessions_v2';

/**
 * Persistent Storage
 *
 * Uses localStorage for browser-side persistence.
 * In production: replace with Supabase / Firebase / MongoDB REST API calls.
 *
 * Recommended production options:
 *   A) Supabase (Postgres + REST) — free tier, great for structured data
 *   B) Firebase Firestore — realtime, good for chat applications
 *   C) MongoDB Atlas + Vercel serverless function
 */

export function saveSessions(sessions: ConversationSession[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (err) {
    console.warn('[Storage] Failed to save sessions:', err);
  }
}

export function loadSessions(): ConversationSession[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as ConversationSession[];
  } catch (err) {
    console.warn('[Storage] Failed to load sessions:', err);
  }
  return [];
}

export function saveSession(session: ConversationSession): void {
  const sessions = loadSessions();
  const idx = sessions.findIndex(s => s.id === session.id);
  if (idx >= 0) {
    sessions[idx] = session;
  } else {
    sessions.unshift(session); // newest first
  }
  // Keep max 100 sessions to avoid localStorage bloat
  saveSessions(sessions.slice(0, 100));
}

export function getSession(id: string): ConversationSession | null {
  const sessions = loadSessions();
  return sessions.find(s => s.id === id) ?? null;
}

export function clearSessions(): void {
  localStorage.removeItem(STORAGE_KEY);
}

/**
 * Export all sessions as a downloadable JSON file.
 * Includes transcripts + qualification summaries.
 */
export function exportAllSessions(): void {
  const sessions = loadSessions();
  if (sessions.length === 0) {
    alert('No sessions found to export.');
    return;
  }

  const exportData = {
    exportedAt: new Date().toISOString(),
    totalSessions: sessions.length,
    sessions: sessions.map(s => ({
      sessionId: s.id,
      lead: s.lead,
      startedAt: s.startedAt,
      completedAt: s.completedAt,
      finalOutput: s.finalOutput,
      qualification: s.qualification,
      transcript: s.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        stage: m.stage,
      })),
    })),
  };

  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `realty-sessions-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
