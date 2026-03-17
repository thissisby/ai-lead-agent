import type {
  LeadRecord,
  ConversationSession,
  ConversationStage,
  CollectedData,
  ChatMessage,
  PropertyType,
  ResidentialTopology,
  CommercialSubtype,
} from '../types';
import { generateId } from '../utils/helpers';
import { parseBudget } from '../utils/helpers';
import { searchProperties } from './propertySearch';
import { qualifyLead } from './qualification';
import { saveSession } from './storage';

function createEmptyCollectedData(): CollectedData {
  return {
    confirmedName: null,
    location: null,
    propertyType: null,
    residentialTopology: null,
    commercialSubtype: null,
    budgetRaw: null,
    budgetMin: null,
    budgetMax: null,
    consent: null,
    propertyCount: null,
  };
}

function createMessage(role: 'agent' | 'user' | 'system', content: string, stage?: ConversationStage): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    stage,
  };
}

export function createSession(lead: LeadRecord): ConversationSession {
  return {
    id: generateId(),
    lead,
    stage: 'greeting',
    collectedData: createEmptyCollectedData(),
    messages: [],
    qualification: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
  };
}

export function getGreetingMessage(lead: LeadRecord): string {
  return `Hello — this is RealtyAssistant calling about the enquiry you submitted. Am I speaking with ${lead.name}?`;
}

function parseYesNo(input: string): boolean | null {
  const lower = input.toLowerCase().trim();
  const yesPatterns = ['yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'definitely', 'absolutely', 'of course', 'please', 'y', 'ha', 'haan', 'ji'];
  const noPatterns = ['no', 'nah', 'nope', 'not', 'never', 'n', 'nahi', 'na'];

  for (const p of yesPatterns) {
    if (lower.includes(p)) return true;
  }
  for (const p of noPatterns) {
    if (lower.includes(p)) return false;
  }
  return null;
}

function parsePropertyType(input: string): PropertyType {
  const lower = input.toLowerCase().trim();
  if (lower.includes('resident') || lower.includes('home') || lower.includes('flat') || lower.includes('apartment') || lower.includes('house')) {
    return 'residential';
  }
  if (lower.includes('commerc') || lower.includes('shop') || lower.includes('office') || lower.includes('plot') || lower.includes('business')) {
    return 'commercial';
  }
  return null;
}

function parseResidentialTopology(input: string): ResidentialTopology {
  const lower = input.toLowerCase().replace(/\s/g, '');
  if (lower.includes('1') || lower.includes('one')) return '1BHK';
  if (lower.includes('2') || lower.includes('two')) return '2BHK';
  if (lower.includes('3') || lower.includes('three')) return '3BHK';
  if (lower.includes('4') || lower.includes('four')) return '4BHK';
  return null;
}

function parseCommercialSubtype(input: string): CommercialSubtype {
  const lower = input.toLowerCase().trim();
  if (lower.includes('shop') || lower.includes('retail') || lower.includes('store')) return 'Shop';
  if (lower.includes('office') || lower.includes('workspace') || lower.includes('co-work')) return 'Office';
  if (lower.includes('plot') || lower.includes('land') || lower.includes('ground')) return 'Plot';
  return null;
}

export interface AgentResponse {
  session: ConversationSession;
  agentMessage: string;
  isComplete: boolean;
}

export async function processUserMessage(
  session: ConversationSession,
  userInput: string
): Promise<AgentResponse> {
  // Add user message
  const userMsg = createMessage('user', userInput, session.stage);
  session.messages.push(userMsg);

  let agentReply = '';
  let isComplete = false;

  switch (session.stage) {
    case 'greeting': {
      const confirmed = parseYesNo(userInput);
      if (confirmed === true) {
        session.collectedData.confirmedName = session.lead.name;
        session.stage = 'ask_location';
        agentReply = `Great, ${session.lead.name}! Thank you for confirming. Which location or city are you searching for properties in?`;
      } else if (confirmed === false) {
        session.stage = 'confirm_name';
        agentReply = `No problem! May I know your name, please?`;
      } else {
        agentReply = `I'm sorry, I didn't catch that. Am I speaking with ${session.lead.name}? Please say yes or no.`;
      }
      break;
    }

    case 'confirm_name': {
      const name = userInput.trim();
      if (name.length > 0 && name.length < 100) {
        session.collectedData.confirmedName = name;
        session.stage = 'ask_location';
        agentReply = `Thank you, ${name}! Which location or city are you searching for properties in?`;
      } else {
        agentReply = `Could you please share your name so I can assist you better?`;
      }
      break;
    }

    case 'ask_location': {
      const location = userInput.trim();
      if (location.length > 1) {
        session.collectedData.location = location;
        session.stage = 'ask_property_type';
        agentReply = `${location} — excellent choice! Are you looking for a Residential or Commercial property?`;
      } else {
        agentReply = `Could you please specify the city or area where you're looking for a property?`;
      }
      break;
    }

    case 'ask_property_type': {
      const propertyType = parsePropertyType(userInput);
      if (propertyType) {
        session.collectedData.propertyType = propertyType;
        session.stage = 'ask_topology';
        if (propertyType === 'residential') {
          agentReply = `Residential, perfect! Which configuration are you looking for — 1 BHK, 2 BHK, 3 BHK, or 4 BHK?`;
        } else {
          agentReply = `Commercial, noted! What type of commercial property are you interested in — Shop, Office, or Commercial Plot?`;
        }
      } else {
        agentReply = `Could you please clarify — are you looking for a Residential property (flat, house, apartment) or a Commercial property (shop, office, plot)?`;
      }
      break;
    }

    case 'ask_topology': {
      if (session.collectedData.propertyType === 'residential') {
        const topology = parseResidentialTopology(userInput);
        if (topology) {
          session.collectedData.residentialTopology = topology;
          session.stage = 'ask_budget';
          agentReply = `${topology} — great choice! What is your budget for this property? You can share an approximate amount or range.`;
        } else {
          agentReply = `I'm sorry, I didn't catch that. Which BHK are you looking for — 1, 2, 3, or 4 BHK?`;
        }
      } else {
        const subtype = parseCommercialSubtype(userInput);
        if (subtype) {
          session.collectedData.commercialSubtype = subtype;
          session.stage = 'ask_budget';
          agentReply = `${subtype} — noted! What is your budget for this property? You can share an approximate amount or range.`;
        } else {
          agentReply = `Could you clarify which type of commercial property — Shop, Office, or Commercial Plot?`;
        }
      }
      break;
    }

    case 'ask_budget': {
      const budget = parseBudget(userInput);
      if (budget.min !== null || budget.max !== null) {
        session.collectedData.budgetRaw = userInput.trim();
        session.collectedData.budgetMin = budget.min;
        session.collectedData.budgetMax = budget.max;
        session.stage = 'ask_consent';
        agentReply = `Got it! Would you like one of our sales representatives to call you to discuss available options? (Yes/No)`;
      } else {
        agentReply = `Could you please share your budget? For example, "50 lakhs", "1 crore", or a range like "30-50 lakhs".`;
      }
      break;
    }

    case 'ask_consent': {
      const consent = parseYesNo(userInput);
      if (consent !== null) {
        session.collectedData.consent = consent;
        session.stage = 'property_search';

        // Add searching message
        agentReply = `Thank you! Let me quickly check available properties matching your requirements on realtyassistant.in...`;

        // Add agent message before search
        const searchMsg = createMessage('agent', agentReply, 'property_search');
        session.messages.push(searchMsg);

        // Perform property search
        const searchResult = await searchProperties({
          location: session.collectedData.location!,
          propertyType: session.collectedData.propertyType,
          topology: session.collectedData.residentialTopology || session.collectedData.commercialSubtype,
          budgetMin: session.collectedData.budgetMin,
          budgetMax: session.collectedData.budgetMax,
        });

        session.collectedData.propertyCount = searchResult.count;

        // Add system message about search
        const systemMsg = createMessage(
          'system',
          `🔍 Property search completed on ${searchResult.source}: Found ${searchResult.count} matching properties`,
          'property_search'
        );
        session.messages.push(systemMsg);

        // Qualify the lead
        const qualification = qualifyLead(session.lead.id, session.collectedData);
        session.qualification = qualification;

        // Generate final response
        session.stage = 'final_response';
        if (qualification.decision === 'Qualified') {
          agentReply = `Great news! We found ${searchResult.count} properties matching your requirements on realtyassistant.in. A sales representative will reach out to you shortly at ${session.lead.phone} to discuss the best options. Thank you for your time, ${session.collectedData.confirmedName}!`;
        } else {
          agentReply = `Thank you for sharing your requirements, ${session.collectedData.confirmedName}. We found ${searchResult.count} properties in our database. We'll keep you posted on any listings that match your criteria. Have a great day!`;
        }

        session.stage = 'completed';
        session.completedAt = new Date().toISOString();
        isComplete = true;

        // Save to storage
        const finalMsg = createMessage('agent', agentReply, 'completed');
        session.messages.push(finalMsg);
        saveSession(session);

        return { session, agentMessage: agentReply, isComplete };
      } else {
        agentReply = `I'm sorry, I didn't catch that. Would you like a sales representative to call you? Please say Yes or No.`;
      }
      break;
    }

    default: {
      agentReply = `Thank you for your time. If you have any more questions, feel free to reach out!`;
      isComplete = true;
    }
  }

  // Add agent message
  const agentMsg = createMessage('agent', agentReply, session.stage);
  session.messages.push(agentMsg);

  // Save session after each turn
  saveSession(session);

  return { session, agentMessage: agentReply, isComplete };
}
