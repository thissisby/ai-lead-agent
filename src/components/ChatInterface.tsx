import { useState, useRef, useEffect } from 'react';
import type { ConversationSession, ChatMessage, LeadRecord } from '../types';
import { createSession, getGreetingMessage, processUserMessage } from '../agent/conversationAgent';
import { generateId } from '../utils/helpers';
import {
  Send, Bot, User, Loader2, CheckCircle2,
  MapPin, Home, Building2, Wallet, PhoneCall, Search
} from 'lucide-react';

interface ChatInterfaceProps {
  lead: LeadRecord;
  onComplete: (session: ConversationSession) => void;
}

const STAGE_INFO: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  greeting: { icon: <User className="w-3.5 h-3.5" />, label: 'Identity Confirmation', color: 'text-blue-400' },
  confirm_name: { icon: <User className="w-3.5 h-3.5" />, label: 'Name Confirmation', color: 'text-blue-400' },
  ask_location: { icon: <MapPin className="w-3.5 h-3.5" />, label: 'Location', color: 'text-green-400' },
  ask_property_type: { icon: <Home className="w-3.5 h-3.5" />, label: 'Property Type', color: 'text-purple-400' },
  ask_topology: { icon: <Building2 className="w-3.5 h-3.5" />, label: 'Configuration', color: 'text-orange-400' },
  ask_budget: { icon: <Wallet className="w-3.5 h-3.5" />, label: 'Budget', color: 'text-yellow-400' },
  ask_consent: { icon: <PhoneCall className="w-3.5 h-3.5" />, label: 'Sales Consent', color: 'text-pink-400' },
  property_search: { icon: <Search className="w-3.5 h-3.5" />, label: 'Searching Properties', color: 'text-cyan-400' },
  final_response: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Complete', color: 'text-emerald-400' },
  completed: { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: 'Conversation Complete', color: 'text-emerald-400' },
};

export default function ChatInterface({ lead, onComplete }: ChatInterfaceProps) {
  const [session, setSession] = useState<ConversationSession>(() => {
    const s = createSession(lead);
    // Add initial greeting
    const greeting = getGreetingMessage(lead);
    s.messages.push({
      id: generateId(),
      role: 'agent',
      content: greeting,
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
    if (!isProcessing) {
      inputRef.current?.focus();
    }
  }, [isProcessing]);

  const handleSend = async () => {
    if (!input.trim() || isProcessing || session.stage === 'completed') return;

    const userInput = input.trim();
    setInput('');
    setIsProcessing(true);
    setIsTyping(true);

    // Clone session
    const currentSession = JSON.parse(JSON.stringify(session)) as ConversationSession;

    try {
      // Simulate agent "thinking" delay
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));

      const result = await processUserMessage(currentSession, userInput);

      setIsTyping(false);
      setSession({ ...result.session });

      if (result.isComplete) {
        onComplete(result.session);
      }
    } catch {
      setIsTyping(false);
      // Add error message
      currentSession.messages.push({
        id: generateId(),
        role: 'system',
        content: '⚠️ An error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      });
      setSession({ ...currentSession });
    }

    setIsProcessing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stageInfo = STAGE_INFO[session.stage] || STAGE_INFO.greeting;
  const progress = (() => {
    const stages: string[] = ['greeting', 'ask_location', 'ask_property_type', 'ask_topology', 'ask_budget', 'ask_consent', 'property_search', 'completed'];
    const idx = stages.indexOf(session.stage);
    return Math.max(0, ((idx + 1) / stages.length) * 100);
  })();

  const renderMessage = (msg: ChatMessage) => {
    const isAgent = msg.role === 'agent';
    const isSystem = msg.role === 'system';

    if (isSystem) {
      return (
        <div key={msg.id} className="flex justify-center my-2">
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-lg px-4 py-2 text-xs text-slate-400 max-w-md text-center">
            {msg.content}
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex gap-3 ${isAgent ? 'justify-start' : 'justify-end'} mb-4`}>
        {isAgent && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Bot className="w-4 h-4 text-white" />
          </div>
        )}
        <div className={`max-w-[75%] ${isAgent ? '' : 'order-first'}`}>
          <div
            className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
              isAgent
                ? 'bg-slate-800/80 border border-slate-700/50 text-slate-200 rounded-tl-md'
                : 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-tr-md shadow-lg shadow-blue-500/20'
            }`}
          >
            {msg.content}
          </div>
          <div className={`text-[10px] text-slate-500 mt-1 ${isAgent ? 'text-left' : 'text-right'}`}>
            {new Date(msg.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
        {!isAgent && (
          <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <User className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  const renderQuickReplies = () => {
    let options: string[] = [];

    switch (session.stage) {
      case 'greeting':
        options = ['Yes, that\'s me', 'No, wrong person'];
        break;
      case 'ask_property_type':
        options = ['Residential', 'Commercial'];
        break;
      case 'ask_topology':
        if (session.collectedData.propertyType === 'residential') {
          options = ['1 BHK', '2 BHK', '3 BHK', '4 BHK'];
        } else {
          options = ['Shop', 'Office', 'Commercial Plot'];
        }
        break;
      case 'ask_consent':
        options = ['Yes, please', 'No, thanks'];
        break;
    }

    if (options.length === 0 || isProcessing) return null;

    return (
      <div className="flex flex-wrap gap-2 px-4 pb-2">
        {options.map(opt => (
          <button
            key={opt}
            onClick={() => {
              setInput(opt);
              setTimeout(() => {
                setInput(opt);
                handleSendDirect(opt);
              }, 100);
            }}
            className="px-3 py-1.5 text-xs font-medium rounded-full bg-white/5 border border-white/10 text-blue-300 hover:bg-blue-500/20 hover:border-blue-400/30 transition-all"
          >
            {opt}
          </button>
        ))}
      </div>
    );
  };

  const handleSendDirect = async (text: string) => {
    if (!text.trim() || isProcessing || session.stage === 'completed') return;

    setInput('');
    setIsProcessing(true);
    setIsTyping(true);

    const currentSession = JSON.parse(JSON.stringify(session)) as ConversationSession;

    try {
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 600));
      const result = await processUserMessage(currentSession, text);
      setIsTyping(false);
      setSession({ ...result.session });
      if (result.isComplete) {
        onComplete(result.session);
      }
    } catch {
      setIsTyping(false);
      currentSession.messages.push({
        id: generateId(),
        role: 'system',
        content: '⚠️ An error occurred. Please try again.',
        timestamp: new Date().toISOString(),
      });
      setSession({ ...currentSession });
    }

    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl h-[90vh] flex flex-col bg-slate-900/80 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-slate-900/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-white">RealtyAssistant AI</h2>
                <div className={`flex items-center gap-1.5 text-xs ${stageInfo.color}`}>
                  {stageInfo.icon}
                  <span>{stageInfo.label}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-slate-500 mb-1">Lead: {lead.name}</div>
              <div className="text-[10px] text-slate-600">{lead.phone}</div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-3 h-1 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full transition-all duration-700 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-1 scrollbar-thin">
          {session.messages.map(renderMessage)}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex gap-3 justify-start mb-4">
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-tl-md px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick replies */}
        {renderQuickReplies()}

        {/* Input */}
        <div className="px-4 py-3 border-t border-white/10 bg-slate-900/50">
          {session.stage === 'completed' ? (
            <div className="flex items-center justify-center gap-2 py-2 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              <span>Conversation completed — view your qualification summary</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={isProcessing ? 'Agent is responding...' : 'Type your message...'}
                disabled={isProcessing}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent disabled:opacity-50 transition"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isProcessing}
                className="p-3 bg-gradient-to-r from-blue-500 to-cyan-400 text-white rounded-xl hover:from-blue-600 hover:to-cyan-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-blue-500/20"
              >
                {isProcessing ? (
                  <Loader2 className="w-4.5 h-4.5 animate-spin" />
                ) : (
                  <Send className="w-4.5 h-4.5" />
                )}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
