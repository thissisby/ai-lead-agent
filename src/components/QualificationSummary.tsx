import type { ConversationSession } from '../types';
import {
  CheckCircle2, XCircle, Award, FileJson, MessageSquare,
  ArrowLeft, User, MapPin, Home, Building2, Wallet,
  PhoneCall, Search, Clock, Copy, Check, Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatBudgetDisplay } from '../utils/helpers';

interface QualificationSummaryProps {
  session: ConversationSession;
  onBack: () => void;
  onViewLogs: () => void;
}

export default function QualificationSummary({ session, onBack, onViewLogs }: QualificationSummaryProps) {
  const [copied, setCopied] = useState(false);
  const [copiedFinal, setCopiedFinal] = useState(false);
  const [visible, setVisible] = useState(false);

  const qual = session.qualification;
  const finalOut = session.finalOutput;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 50);
    return () => clearTimeout(t);
  }, []);

  if (!qual || !finalOut) return null;

  const isQualified = qual.decision === 'Qualified';
  const data = session.collectedData;

  const copyJSON = (text: string, setCopiedFn: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setCopiedFn(true);
    setTimeout(() => setCopiedFn(false), 2000);
  };

  const downloadReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      lead: session.lead,
      finalSummary: finalOut,
      detailedQualification: qual,
      sessionId: session.id,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `qualification-${session.lead.name.replace(/\s+/g, '-')}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const duration = session.completedAt
    ? Math.round((new Date(session.completedAt).getTime() - new Date(session.startedAt).getTime()) / 1000)
    : null;

  const infoCards = [
    { icon: <User className="w-4 h-4" />, label: 'Contact Name', value: data.confirmedName || 'N/A', color: 'text-blue-400', delay: 'delay-1' },
    { icon: <MapPin className="w-4 h-4" />, label: 'Location', value: data.location || 'N/A', color: 'text-green-400', delay: 'delay-2' },
    { icon: <Home className="w-4 h-4" />, label: 'Property Type', value: data.propertyType ? data.propertyType.charAt(0).toUpperCase() + data.propertyType.slice(1) : 'N/A', color: 'text-purple-400', delay: 'delay-3' },
    { icon: <Building2 className="w-4 h-4" />, label: 'Configuration', value: data.residentialTopology || data.commercialSubtype || 'N/A', color: 'text-orange-400', delay: 'delay-4' },
    { icon: <Wallet className="w-4 h-4" />, label: 'Budget', value: data.budgetRaw || formatBudgetDisplay(data.budgetMin, data.budgetMax), color: 'text-yellow-400', delay: 'delay-5' },
    { icon: <PhoneCall className="w-4 h-4" />, label: 'Sales Consent', value: data.consent === true ? '✅ Yes' : data.consent === false ? '❌ No' : 'N/A', color: 'text-pink-400', delay: 'delay-6' },
    { icon: <Search className="w-4 h-4" />, label: 'Properties Found', value: `${data.propertyCount ?? 0} on realtyassistant.in`, color: 'text-cyan-400', delay: 'delay-7' },
    { icon: <Clock className="w-4 h-4" />, label: 'Duration', value: duration ? `${duration}s` : 'N/A', color: 'text-slate-400', delay: 'delay-8' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-start justify-center p-4 pt-8">
      <div className={`w-full max-w-3xl transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>

        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button onClick={onBack}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition group">
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            New Lead
          </button>
          <div className="flex items-center gap-3">
            <button onClick={downloadReport}
              className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
              <Download className="w-3.5 h-3.5" />
              Download Report
            </button>
            <button onClick={onViewLogs}
              className="flex items-center gap-2 text-sm text-blue-400 hover:text-blue-300 transition">
              <MessageSquare className="w-4 h-4" />
              View Transcript
            </button>
          </div>
        </div>

        {/* Decision Banner */}
        <div className={`rounded-2xl p-6 mb-6 border animate-fade-in-up ${
          isQualified
            ? 'bg-emerald-500/10 border-emerald-500/30 shadow-lg shadow-emerald-500/5'
            : 'bg-red-500/10 border-red-500/30 shadow-lg shadow-red-500/5'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
              isQualified ? 'bg-emerald-500/20' : 'bg-red-500/20'
            }`}>
              {isQualified
                ? <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                : <XCircle className="w-8 h-8 text-red-400" />}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className={`text-2xl font-bold ${isQualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {qual.decision}
              </h1>
              <p className="text-sm text-slate-400 mt-0.5">
                {isQualified
                  ? `${data.propertyCount} matching properties found — ready for sales follow-up`
                  : finalOut.reason}
              </p>
            </div>
            <div className="flex-shrink-0 flex items-center gap-2">
              <Award className={`w-5 h-5 ${isQualified ? 'text-emerald-400' : 'text-red-400'}`} />
              <span className={`text-xl font-bold ${isQualified ? 'text-emerald-400' : 'text-red-400'}`}>
                {qual.score}/{qual.maxScore}
              </span>
            </div>
          </div>
          {/* Score bar */}
          <div className="mt-4 h-2 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ease-out ${
                isQualified
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400'
                  : 'bg-gradient-to-r from-red-500 to-orange-400'
              }`}
              style={{ width: visible ? `${(qual.score / qual.maxScore) * 100}%` : '0%' }}
            />
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {infoCards.map((card) => (
            <div key={card.label}
              className={`animate-fade-in-up ${card.delay} bg-white/5 backdrop-blur border border-white/10 rounded-xl p-3 hover:border-white/20 transition`}>
              <div className={`flex items-center gap-1.5 text-xs ${card.color} mb-1.5`}>
                {card.icon}
                <span className="font-medium">{card.label}</span>
              </div>
              <div className="text-sm font-semibold text-white truncate" title={card.value}>
                {card.value}
              </div>
            </div>
          ))}
        </div>

        {/* ── FINAL JSON OUTPUT (Assignment Required Format) ── */}
        <div className="bg-white/5 backdrop-blur border border-blue-400/20 rounded-2xl p-6 mb-6 animate-fade-in-up delay-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-blue-400" />
              Qualification Summary
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/20">Required Format</span>
            </h3>
            <button
              onClick={() => copyJSON(JSON.stringify(finalOut, null, 2), setCopiedFinal)}
              className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition">
              {copiedFinal ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copiedFinal ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-slate-950/60 rounded-xl p-4 text-xs overflow-x-auto font-mono leading-relaxed border border-slate-800/80 text-slate-200">
{JSON.stringify(finalOut, null, 2)}
          </pre>
        </div>

        {/* Qualification Criteria */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 mb-6 animate-fade-in-up delay-4">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <Award className="w-4 h-4 text-blue-400" />
            Qualification Criteria Breakdown
          </h3>
          <div className="space-y-3">
            {qual.reasons.map((reason, idx) => (
              <div key={idx} className="flex items-start gap-3">
                <div className={`mt-0.5 flex-shrink-0 ${reason.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {reason.passed
                    ? <CheckCircle2 className="w-4 h-4" />
                    : <XCircle className="w-4 h-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-white font-medium">{reason.criterion}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{reason.detail}</div>
                </div>
                {reason.passed && (
                  <span className="flex-shrink-0 text-xs text-emerald-400 font-mono">+pts</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Full Internal JSON */}
        <div className="bg-white/5 backdrop-blur border border-white/10 rounded-2xl p-6 animate-fade-in-up delay-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-white flex items-center gap-2">
              <FileJson className="w-4 h-4 text-slate-400" />
              Full Qualification Record
            </h3>
            <button
              onClick={() => copyJSON(JSON.stringify(qual, null, 2), setCopied)}
              className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <pre className="bg-slate-950/50 rounded-xl p-4 text-xs text-slate-400 overflow-x-auto max-h-60 overflow-y-auto font-mono leading-relaxed border border-slate-800 scrollbar-thin">
{JSON.stringify(qual, null, 2)}
          </pre>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center">
          <p className="text-xs text-slate-600">
            Lead ID: {session.lead.id} • Session: {session.id} • {new Date(qual.timestamp).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
}
