// ─── Lead & Contact ───
export interface LeadRecord {
  id: string;
  name: string;
  phone: string;
  email: string;
  createdAt: string;
}

// ─── Conversation State Machine ───
export type ConversationStage =
  | 'greeting'
  | 'confirm_name'
  | 'ask_location'
  | 'ask_property_type'
  | 'ask_topology'
  | 'ask_budget'
  | 'ask_consent'
  | 'property_search'
  | 'final_response'
  | 'completed';

export type PropertyType = 'residential' | 'commercial' | null;
export type ResidentialTopology = '1BHK' | '2BHK' | '3BHK' | '4BHK' | null;
export type CommercialSubtype = 'Shop' | 'Office' | 'Plot' | null;

export interface CollectedData {
  confirmedName: string | null;
  location: string | null;
  propertyType: PropertyType;
  residentialTopology: ResidentialTopology;
  commercialSubtype: CommercialSubtype;
  budgetRaw: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  consent: boolean | null;
  propertyCount: number | null;
}

// ─── Chat Messages ───
export interface ChatMessage {
  id: string;
  role: 'agent' | 'user' | 'system';
  content: string;
  timestamp: string;
  stage?: ConversationStage;
}

// ─── Qualification ───
export type QualificationDecision = 'Qualified' | 'Not Qualified';

export interface QualificationReason {
  criterion: string;
  passed: boolean;
  detail: string;
}

export interface QualificationSummary {
  leadId: string;
  decision: QualificationDecision;
  reasons: QualificationReason[];
  collectedData: CollectedData;
  propertyCount: number;
  score: number;
  maxScore: number;
  timestamp: string;
}

// ─── Session ───
export interface ConversationSession {
  id: string;
  lead: LeadRecord;
  stage: ConversationStage;
  collectedData: CollectedData;
  messages: ChatMessage[];
  qualification: QualificationSummary | null;
  startedAt: string;
  completedAt: string | null;
}

// ─── Property Search ───
export interface PropertySearchParams {
  location: string;
  propertyType: PropertyType;
  topology: ResidentialTopology | CommercialSubtype;
  budgetMin: number | null;
  budgetMax: number | null;
}

export interface PropertySearchResult {
  count: number;
  source: string;
  query: PropertySearchParams;
  timestamp: string;
}

// ─── App State ───
export type AppView = 'form' | 'chat' | 'summary' | 'logs';
