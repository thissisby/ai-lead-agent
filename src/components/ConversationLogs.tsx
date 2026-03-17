import type { ConversationSession } from '../types';
import { ArrowLeft, Bot, User, Info, Download, Clock } from 'lucide-react';

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
      messages: session.messages.map(m => ({
        role: m.role,
        content: m.content,
        timestamp: m.timestamp,
        stage: m.stage,
      })),
      collectedData: session.collectedData,
      qualification: session.qualification,
    };

    const blob = new Blob([JSON.stringify(transcript, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transcript-${session.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Summary
          </button>
          <button
            onClick={downloadTranscript}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition bg-blue-500/10 px-3 py-1.5 rounded-lg"
          >
            <Download className="w-4 h-4" />
            Download JSON
          </button>
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
            <span>{session.lead.name}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span>{session.lead.email}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>{new Date(session.startedAt).toLocaleString()}</span>
          </div>
          {session.qualification && (
            <div className={`flex items-center gap-1.5 ml-auto font-medium ${
              session.qualification.decision === 'Qualified' ? 'text-emerald-400' : 'text-red-400'
            }`}>
              {session.qualification.decision}
            </div>
          )}
        </div>

        {/* Messages */}
        <div className="space-y-4">
          {session.messages.map((msg, idx) => {
            const isAgent = msg.role === 'agent';
            const isSystem = msg.role === 'system';

            return (
              <div
                key={msg.id || idx}
                className={`flex gap-3 ${isSystem ? 'justify-center' : ''}`}
              >
                {!isSystem && (
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    isAgent
                      ? 'bg-gradient-to-br from-blue-500 to-cyan-400'
                      : 'bg-gradient-to-br from-indigo-500 to-purple-500'
                  }`}>
                    {isAgent ? (
                      <Bot className="w-4 h-4 text-white" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>
                )}

                <div className={`flex-1 ${isSystem ? 'max-w-md' : ''}`}>
                  {!isSystem && (
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium text-white">
                        {isAgent ? 'RealtyAssistant AI' : session.lead.name}
                      </span>
                      <span className="text-[10px] text-slate-600">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                      {msg.stage && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-slate-500">
                          {msg.stage}
                        </span>
                      )}
                    </div>
                  )}
                  <div className={`rounded-xl px-4 py-3 text-sm leading-relaxed ${
                    isSystem
                      ? 'bg-slate-800/50 border border-slate-700/50 text-slate-400 text-center text-xs'
                      : isAgent
                        ? 'bg-white/5 border border-white/10 text-slate-300'
                        : 'bg-blue-500/10 border border-blue-500/20 text-blue-200'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center">
          <p className="text-xs text-slate-600">
            Session ID: {session.id} • Total messages: {session.messages.length} •
            Stored in localStorage (production: PostgreSQL/MongoDB)
          </p>
        </div>
      </div>
    </div>
  );
}
