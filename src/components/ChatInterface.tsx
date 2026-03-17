import { useState, useRef, useEffect } from 'react';
import type { ConversationSession, ChatMessage, LeadRecord } from '../types';
import { createSession, getGreetingMessage, processUserMessage } from '../agent/conversationAgent';
import { generateId } from '../utils/helpers';
import {
  Send, Bot, User, Loader2, CheckCircle2,
  MapPin, Home, Building2, Wallet, PhoneCall, Search, UserCheck
} from 'lucide-react';

interface ChatInterfaceProps {
  lead: LeadRecord;
  onComplete: (session: ConversationSession) => void;
}

const STAGES = [
  { key: 'greeting',         label: 'Identity',   icon: UserCheck,  shortLabel: '1' },
  { key: 'ask_location',     label: 'Location',   icon: MapPin,     shortLabel: '2' },
  { key: 'ask_property_type',label: 'Type',       icon: Home,       shortLabel: '3' },
  { key: 'ask_topology',     label: 'Config',     icon: Building2,  shortLabel: '4' },
  { key: 'ask_budget',       label: 'Budget',     icon: Wallet,     shortLabel: '5' },
  { key: 'ask_consent',      label: 'Consent',    icon: PhoneCall,  shortLabel: '6' },
  { key: 'property_search',  label: 'Searching',  icon: Search,     shortLabel: '7' },
  { key: 'completed',        label: 'Done',       icon: CheckCircle2, shortLabel: '✓' },
];

const STAGE_COLORS: Record<string, string> = {
  greeting: 'text-blue-400',
  confirm_name: 'text-blue-400',
  ask_location: 'text-green-400',
  ask_property_type: 'text-purple-400',
  ask_topology: 'text-orange-400',
  ask_budget: 'text-yellow-400',
  ask_consent: 'text-pink-400',
  property_search: 'text-cyan-400',
  final_response: 'text-emerald-400',
  completed: 'text-emerald-400',
};

export default function ChatInterface({ lead, onComplete }: ChatInterfaceProps) {
  const [session, setSession] = useState<ConversationSession>(() => {
    const s = createSession(lead);
    s.messages.push({
      id: generateId(),
      role: 'agent',
      content: getGreetingMessage(lead),
      timestamp: new Date().toISOString(),
      stage: 'greeting',
    });
    return s;
  });

  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isTyping]);

  useEffect(() => {
    if (!isProcessing) inputRef.current?.focus();
  }, [isProcessing]);

  const currentStageIdx = (() => {
    const map: Record<string, number> = {
      greeting: 0, confirm_name: 0,
      ask_location: 1,
      ask_property_type: 2,
      ask_topology: 3,
      ask_budget: 4,
      ask_consent: 5,
      property_search: 6,
      final_response: 7,
      completed: 7,
    };
    return map[session.stage] ?? 0;
  })();

  const handleSendDirect = async (text: string) => {
    if (!text.trim() || isProcessing || session.stage === 'completed') return;
    setInput('');
    setIsProcessing(true);
    setIsTyping(true);

    const currentSession = JSON.parse(JSON.stringify(session)) as ConversationSession;

    try {
      await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 500));
      const result = await processUserMessage(currentSession, text);
      setIsTyping(false);
      setSession({ ...result.session });
      if (result.isComplete) onComplete(result.session);
    } catch (err) {
      console.error('[Chat] Error processing message:', err);
      setIsTyping(false);
      currentSession.messages.push({
        id: generateId(),
        role: 'system',
        content: '⚠️ Something went wrong. Please try again.',
        timestamp: new Date().toISOString(),
      });
      setSession({ ...currentSession });
    }

    setIsProcessing(false);
  };

  const handleSend = () => {
    if (input.trim()) handleSendDirect(input.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickReplies = (() => {
    switch (session.stage) {
      case 'greeting':     return ["Yes, that's me", "No, wrong person"];
      case 'ask_property_type': return ['Residential', 'Commercial'];
      case 'ask_topology':
        return session.collectedData.propertyType === 'residential'
          ? ['1 BHK', '2 BHK', '3 BHK', '4 BHK']
          : ['Shop', 'Office', 'Commercial Plot'];
      case 'ask_budget': return ['30 lakhs', '50 lakhs', '1 crore', '1.5 crore'];
      case 'ask_consent': return ['Yes, please call', 'No, thanks'];
      default: return [];
    }
  })();

  const renderMessage = (msg: ChatMessage) => {
    const isAgent = msg.role === 'agent';
    const isSystem = msg.role === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2 animate-fade-in">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-xs text-slate-400 max-w-sm text-center">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'} mb-3 animate-fade-in`}>
        {isAgent && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <div className={`max-w-[78%]`}>
          <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
            isAgent
              ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-md'
              : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-md shadow-md shadow-blue-500/20'
          }`}>
            {msg.content}
          </div>
          <div className={`text-[10px] text-slate-600 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
            {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            {msg.isLLM && <span className="ml-1.5 text-purple-500">· AI</span>}
          </div>
        </div>
        {!isAgent && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md shadow-indigo-500/20">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  const stageColor = STAGE_COLORS[session.stage] || 'text-slate-400';
  const currentStageMeta = STAGES[Math.min(currentStageIdx, STAGES.length - 1)];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[92vh] flex flex-col bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">

        {/* ── Header ─────────────────────────────────────────────── */}
        <div className="px-5 py-4 border-b border-white/10 bg-slate-900/60">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-md shadow-blue-500/20 animate-pulse-glow">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">RealtyAssistant AI</h2>
                <div className={`flex items-center gap-1.5 text-xs ${stageColor}`}>
                  {currentStageMeta && <currentStageMeta.icon className="w-3.5 h-3.5" />}
                  <span>{currentStageMeta?.label ?? 'Processing'}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-400 font-medium">{lead.name}</div>
              <div className="text-[10px] text-slate-600">{lead.phone}</div>
            </div>
          </div>

          {/* ── Step Progress Bar ─────────────────────────────────── */}
          <div className="mt-4">
            {/* Numbered steps */}
            <div className="flex items-center gap-1 mb-2">
              {STAGES.map((s, idx) => {
                const isDone = idx < currentStageIdx;
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={s.key} className="flex items-center gap-1 flex-1">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 transition-all duration-300 ${
                      isDone    ? 'bg-emerald-500 text-white' :
                      isCurrent ? 'bg-blue-500 text-white ring-2 ring-blue-400/40' :
                                  'bg-slate-800 text-slate-600'
                    }`}>
                      {isDone ? '✓' : s.shortLabel}
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div className={`flex-1 h-0.5 rounded-full transition-all duration-500 ${
                        isDone ? 'bg-emerald-500' : 'bg-slate-800'
                      }`} />
                    )}
                  </div>
                );
              })}
            </div>
            {/* Label row */}
            <div className="flex items-center">
              {STAGES.map((s, idx) => {
                const isCurrent = idx === currentStageIdx;
                return (
                  <div key={s.key} className={`flex-1 text-[9px] text-center transition-colors ${
                    isCurrent ? 'text-blue-400 font-semibold' : 'text-slate-700'
                  }`}>
                    {s.label}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── Messages ───────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4 scrollbar-thin">
          {session.messages.map(renderMessage)}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start mb-3 animate-fade-in">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '160ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '320ms' }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* ── Quick Replies ──────────────────────────────────────── */}
        {quickReplies.length > 0 && !isProcessing && session.stage !== 'completed' && (
          <div className="flex flex-wrap gap-2 px-4 pb-2">
            {quickReplies.map(opt => (
              <button
                key={opt}
                onClick={() => handleSendDirect(opt)}
                className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/30 hover:text-blue-200 transition-all"
              >
                {opt}
              </button>
            ))}
          </div>
        )}

        {/* ── Input ─────────────────────────────────────────────── */}
        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/60">
          {session.stage === 'completed' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conversation complete — view your qualification summary</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isProcessing ? 'Agent is responding...' : 'Type your message… (Enter to send)'}
                disabled={isProcessing}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent disabled:opacity-50 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:from-blue-600 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-500/20 hover:shadow-blue-500/40"
              >
                {isProcessing
                  ? <Loader2 className="w-4.5 h-4.5 animate-spin" />
                  : <Send className="w-4.5 h-4.5" />}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
