import { useState } from 'react';
import type { LeadRecord, ConversationSession, AppView } from './types';
import LeadForm from './components/LeadForm';
import ChatInterface from './components/ChatInterface';
import QualificationSummary from './components/QualificationSummary';
import ConversationLogs from './components/ConversationLogs';

export default function App() {
  const [view, setView] = useState<AppView>('form');
  const [currentLead, setCurrentLead] = useState<LeadRecord | null>(null);
  const [completedSession, setCompletedSession] = useState<ConversationSession | null>(null);

  const handleLeadSubmit = (lead: LeadRecord) => {
    setCurrentLead(lead);
    setCompletedSession(null);
    setView('chat');
  };

  const handleChatComplete = (session: ConversationSession) => {
    setCompletedSession(session);
    // Auto-navigate to summary after a short delay
    setTimeout(() => {
      setView('summary');
    }, 2000);
  };

  const handleBackToForm = () => {
    setCurrentLead(null);
    setCompletedSession(null);
    setView('form');
  };

  const handleViewLogs = () => {
    setView('logs');
  };

  const handleBackToSummary = () => {
    setView('summary');
  };

  switch (view) {
    case 'form':
      return <LeadForm onSubmit={handleLeadSubmit} />;

    case 'chat':
      return currentLead ? (
        <ChatInterface
          lead={currentLead}
          onComplete={handleChatComplete}
        />
      ) : (
        <LeadForm onSubmit={handleLeadSubmit} />
      );

    case 'summary':
      return completedSession ? (
        <QualificationSummary
          session={completedSession}
          onBack={handleBackToForm}
          onViewLogs={handleViewLogs}
        />
      ) : (
        <LeadForm onSubmit={handleLeadSubmit} />
      );

    case 'logs':
      return completedSession ? (
        <ConversationLogs
          session={completedSession}
          onBack={handleBackToSummary}
        />
      ) : (
        <LeadForm onSubmit={handleLeadSubmit} />
      );

    default:
      return <LeadForm onSubmit={handleLeadSubmit} />;
  }
}
