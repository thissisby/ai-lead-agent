import { useState } from 'react';
import type { LeadRecord } from '../types';
import { generateId } from '../utils/helpers';
import { User, Phone, Mail, ArrowRight, Sparkles } from 'lucide-react';

interface LeadFormProps {
  onSubmit: (lead: LeadRecord) => void;
}

export default function LeadForm({ onSubmit }: LeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!name.trim()) errs.name = 'Name is required';
    else if (name.trim().length < 2) errs.name = 'Name must be at least 2 characters';

    if (!phone.trim()) errs.phone = 'Phone is required';
    else if (!/^\+?[\d\s-]{7,15}$/.test(phone.trim())) errs.phone = 'Enter a valid phone number';

    if (!email.trim()) errs.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) errs.email = 'Enter a valid email';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const lead: LeadRecord = {
      id: generateId(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim(),
      createdAt: new Date().toISOString(),
    };
    onSubmit(lead);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-lg relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/25 mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">RealtyAssistant</h1>
          <p className="text-blue-200/70 text-sm">AI-Powered Property Lead Qualification Agent</p>
        </div>

        {/* Form Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-white">Submit Your Enquiry</h2>
            <p className="text-sm text-blue-200/50 mt-1">
              Enter your details to start the AI qualification chat
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-300/40" />
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="John Doe"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition ${
                    errors.name ? 'border-red-400/60' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Phone */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-300/40" />
                <input
                  type="tel"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition ${
                    errors.phone ? 'border-red-400/60' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-blue-200/80 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-blue-300/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className={`w-full pl-10 pr-4 py-3 bg-white/5 border rounded-xl text-white placeholder-blue-200/30 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-transparent transition ${
                    errors.email ? 'border-red-400/60' : 'border-white/10'
                  }`}
                />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-cyan-400 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-cyan-500 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 flex items-center justify-center gap-2 group"
            >
              Start AI Chat
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </form>

          <p className="text-xs text-blue-200/30 text-center mt-4">
            Your data is processed securely and used only for property matching
          </p>
        </div>

        {/* Integration badges */}
        <div className="flex items-center justify-center gap-4 mt-6 flex-wrap">
          {['Groq AI', 'Twilio Voice', 'VAPI.ai', 'realtyassistant.in'].map(badge => (
            <span key={badge} className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/10 text-blue-200/50">
              {badge}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
