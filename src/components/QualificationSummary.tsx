import type { ConversationSession } from '../types';
import {
  CheckCircle2, XCircle, Award, FileJson, MessageSquare,
  ArrowLeft, User, MapPin, Home, Building2, Wallet,
  PhoneCall, Search, Clock, Copy, Check
} from 'lucide-react';
import { useState } from 'react';
import { formatBudgetDisplay } from '../utils/helpers';

interface QualificationSummaryProps {
  session: ConversationSession;
  onBack: () => void;
  onViewLogs: () => void;
}

export default function QualificationSummary({ session, onBack, onViewLogs }: QualificationSummaryProps) {
  const [copied, setCopied] = useState(false);
  const qual = session.qualification;

  if (!qual) return null;

  const isQualified = qual.decision === 'Qualified';
  const data = session.collectedData;

  const copyJSON = () => {
    navigator.clipboard.writeText(JSON.stringify(qual, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const infoCards = [
    { icon: <User className="w-4 h-4" />, label: 'Contact Name', value: data.confirmedName || 'N/A', color: 'text-blue-400' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: data.location || 'N/A', color: 'text-green-400' },
    { icon: <Home className="w-4 h-4" />, label: 'Property Type', value: data.propertyType ? data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1) : 'N/A', color: 'text-purple-400' },
    { icon: <Building2 className="w-4 h-4" />, label: 'Configuration', value: data.residentialTopology || data.commercialSubtype || 'N/A', color: 'text-orange-400' },
    { icon: <Wallet className="w-4 h-4" />, label: 'Budget', value: formatBudgetDisplay(data.budgetMin, data.budgetMax), color: 'text-yellow-400' },
    { icon: <PhoneCall className="w-4 h-4" />, label: 'Sales Consent', value: data.consent === true ? 'Yes' : data.consent === false ? 'No' : 'N/A', color: 'text-pink-400' },
    { icon: <Search className="w-4 h-4" />, label: 'Properties Found', value: `${data.propertyCount || 0} on realtyassistant.in`, color: 'text-cyan-400' },
    { icon: <Clock className="w-4 h-4" />, label: 'Duration', value: session.completedAt ? `${Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)}s` : 'N/A', color: 'text-slate-400' },
  ];

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
            New Lead
          </button>
          <button
            onClick={onViewLogs}
            className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition"
          >
            <MessageSquare className="w-4 h-4" />
            View Transcript
          </button>
        </div>

        {/* Decision Banner */}
        <div className={`rounded-2xl p-6 mb-6 border ${
          isQualified
            ? 'bg-emerald-500/10 border-emerald-500/20'
            : 'bg-red-500/10 border-red-500/20'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${
              isQualified
                ? 'bg-emerald-500/20'
                : 'bg-red-500/20'
            }`}>
              {isQualified ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <XCircle className="w-8 h-8 text-red-400" />
              )}
            </div>
            <div>
              <h1 className={`text-2xl font-bold ${isQualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {qual.decision}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {isQualified
                  ? 'This lead is ready for human sales follow-up'
                  : 'This lead does not meet qualification criteria'
                }
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <Award className={`w-5 h-5 ${isQualified ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-xl font-bold ${isQualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {qual.score}/{qual.maxScore}
              </span>
            </div>
          </div>

          {/* Score bar */}
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${
                isQualified
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : 'bg-gradient-to-r from-red-500 to-orange-400'
              }`}
              style={{ width: `${(qual.score / qual.maxScore) * 100}%` }}
            />
          </div>
        </div>

        {/* Collected Data Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {infoCards.map(card => (
            <div
              key={card.label}
              className="bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3"
            >
              <div className={`flex items-center gap-1.5 text-xs ${card.color} mb-1`}>
                {card.icon}
                <span>{card.label}</span>
              </div>
              <div className="text-sm font-medium text-white truncate" title={card.value}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* Qualification Criteria */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-6">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            Qualification Criteria
          </h3>
          <div className="space-y-3">
            {qual.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 ${reason.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reason.passed ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm text-white font-medium">{reason.criterion}</div>
                  <div className="text-xs text-slate-400">{reason.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* JSON Output */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-400" />
              JSON Qualification Summary
            </h3>
            <button
              onClick={copyJSON}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-slate-950/50 rounded-xl p-4 text-xs text-slate-300 overflow-x-auto max-h-80 overflow-y-auto font-mono leading-relaxed border border-slate-800">
            {JSON.stringify(qual, null, 2)}
          </pre>
        </div>

        {/* Lead Info */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-500">
            Lead ID: {session.lead.id} • Session: {session.id} • {new Date(qual.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
