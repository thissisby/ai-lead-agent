import type { ConversationSession, ChatMessage } from '../types';
import { ArrowLeft, Bot, User, Info, Download, Clock, Database } from 'lucide-react';
import { exportAllSessions } from '../agent/storage';

interface ConversationLogsProps {
  session: ConversationSession;
  onBack: () => void;
}

export default function ConversationLogs({ session, onBack }: ConversationLogsProps) {
  const downloadTranscript = () => {
    const transcript = {
      sessionId: session.id,
      lead: session.lead,
      startedAt: session.startedAt,
      completedAt: session.completedAt,
      finalOutput: session.finalOutput,
      qualification: session.qualification,
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        stage: m.stage,
        isLLM: m.isLLM ?? false,
      })),
      collectedData: session.collectedData,
    };

    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${session.lead.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const roleLabel = (msg: ChatMessage) => {
    if (msg.role === 'agent') return 'RealtyAssistant AI';
    if (msg.role === 'user') return session.lead.name;
    return 'System';
  };

  const decision = session.qualification?.decision;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-start justify-center p-4 pt-8">
      <div className="w-full max-w-3xl animate-fade-in">

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            Back to Summary
          </button>
          <div className="flex items-center gap-3">
            <button onClick={exportAllSessions}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition bg-white/5 px-3 py-1.5 rounded-lg border border-white/10">
              <Database className="w-3.5 h-3.5" />
              Export All
            </button>
            <button onClick={downloadTranscript}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/20">
              <Download className="w-4 h-4" />
              Download JSON
            </button>
          </div>
        </div>

        {/* Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Conversation Transcript</h1>
          <p className="text-sm text-slate-400 mt-1">
            Full chat log with {session.lead.name} • {session.messages.length} messages
          </p>
        </div>

        {/* Session Info */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-4 mb-6 flex flex-wrap gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-blue-400" />
            <span className="text-white font-medium">{session.lead.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>{session.lead.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{new Date(session.startedAt).toLocaleString()}</span>
          </div>
          {decision && (
            <div className={`flex items-center gap-1.5 ml-auto font-semibold ${
              decision === 'Qualified' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {decision === 'Qualified' ? '✅' : '❌'} {decision}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-3">
          {session.messages.map((msg, idx) => {
            const isAgent = msg.role === 'agent';
            const isSystem = msg.role === 'system';

            if (isSystem) {
              return (
                <div key={msg.id || idx} className="flex justify-center">
                  <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-xs text-slate-400 max-w-lg text-center">
                    {msg.content}
                  </div>
                </div>
              );
            }

            return (
              <div key={msg.id || idx} className={`flex gap-3 ${isAgent ? '' : 'flex-row-reverse'}`}>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  isAgent
                    ? 'bg-gradient-to-br from-blue-500 to-cyan-400 shadow-md shadow-blue-500/20'
                    : 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md shadow-indigo-500/20'
                }`}>
                  {isAgent ? <Bot className="w-4 h-4 text-white" /> : <User className="w-4 h-4 text-white" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className={`flex items-center gap-2 mb-1 ${isAgent ? '' : 'flex-row-reverse'}`}>
                    <span className="text-xs font-semibold text-white">{roleLabel(msg)}</span>
                    <span className="text-[10px] text-slate-600">
                      {new Date(msg.timestamp).toLocaleTimeString()}
                    </span>
                    {msg.stage && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">
                        {msg.stage.replace(/_/g, ' ')}
                      </span>
                    )}
                    {msg.isLLM && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400">
                        AI
                      </span>
                    )}
                  </div>
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isAgent
                      ? 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-sm'
                      : 'bg-blue-500/10 border border-blue-500/20 text-blue-100 rounded-tr-sm'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center pb-8">
          <p className="text-xs text-slate-600">
            Session ID: {session.id} • {session.messages.length} messages •{' '}
            Stored in localStorage (production: Supabase / Firebase / MongoDB)
          </p>
        </div>
      </div>
    </div>
  );
}
