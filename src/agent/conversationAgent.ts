/**
 * RealtyAssistant Conversation Agent
 *
 * Implements a strict 6-step conversation flow:
 *   1. Greeting → confirm identity
 *   2. Location
 *   3. Property Type (Residential / Commercial)
 *   4. Topology (BHK or Shop/Office/Plot)
 *   5. Budget
 *   6. Consent
 *   → Property search → Qualification → Final response
 *
 * Features:
 *   - Per-stage retry counter (max 3 unclear answers before gentle auto-skip)
 *   - Groq LLM integration with scripted fallback
 *   - Structured logging via console.group
 *   - Full session persistence via storage.ts
 */

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
import { parseBudget, buildFinalOutput } from '../utils/helpers';
import { searchProperties } from './propertySearch';
import { qualifyLead } from './qualification';
import { saveSession } from './storage';
import { askGroq } from './groqClient';
import {
  SYSTEM_PROMPT,
  LOCATION_PROMPT,
  PROPERTY_TYPE_PROMPT,
  TOPOLOGY_RESIDENTIAL_PROMPT,
  TOPOLOGY_COMMERCIAL_PROMPT,
  BUDGET_PROMPT,
  CONSENT_PROMPT,
  CLOSING_QUALIFIED_PROMPT,
  CLOSING_NOT_QUALIFIED_PROMPT,
} from './prompts';

const MAX_STAGE_RETRIES = 3;

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

function createMessage(
  role: 'agent' | 'user' | 'system',
  content: string,
  stage?: ConversationStage,
  isLLM = false
): ChatMessage {
  return {
    id: generateId(),
    role,
    content,
    timestamp: new Date().toISOString(),
    stage,
    isLLM,
  };
}

function incrementAttempt(session: ConversationSession): number {
  const key = session.stage;
  session.stageAttempts[key] = (session.stageAttempts[key] ?? 0) + 1;
  return session.stageAttempts[key];
}

function resetAttempts(session: ConversationSession): void {
  delete session.stageAttempts[session.stage];
}

// ─── Parsers ──────────────────────────────────────────────────────────────────

function parseYesNo(input: string): boolean | null {
  const lower = input.toLowerCase().trim();
  const yes = ['yes', 'yeah', 'yep', 'yup', 'sure', 'ok', 'okay', 'definitely',
    'absolutely', 'of course', 'please', ' y ', 'ha', 'haan', 'ji', 'bilkul',
    'correct', 'right', 'that\'s me', 'thats me', 'speaking'];
  const no = ['no', 'nah', 'nope', 'not', 'never', 'nahi', 'na ', ' n ', 'wrong',
    'different', 'someone else', 'not me', 'nobody', 'decline', 'don\'t'];

  for (const p of yes) if (lower.includes(p)) return true;
  for (const p of no) if (lower.includes(p)) return false;
  return null;
}

function parsePropertyType(input: string): PropertyType {
  const lower = input.toLowerCase().trim();
  if (lower.includes('resident') || lower.includes('home') || lower.includes('flat')
    || lower.includes('apartment') || lower.includes('house') || lower.includes('bhk')
    || lower.includes('villa') || lower.includes('builder floor')) return 'residential';
  if (lower.includes('commerc') || lower.includes('shop') || lower.includes('office')
    || lower.includes('plot') || lower.includes('business') || lower.includes('retail')
    || lower.includes('showroom') || lower.includes('warehouse')) return 'commercial';
  return null;
}

function parseResidentialTopology(input: string): ResidentialTopology {
  const lower = input.toLowerCase().replace(/\s/g, '');
  if (lower.includes('4') || lower.includes('four')) return '4BHK';
  if (lower.includes('3') || lower.includes('three')) return '3BHK';
  if (lower.includes('2') || lower.includes('two')) return '2BHK';
  if (lower.includes('1') || lower.includes('one')) return '1BHK';
  return null;
}

function parseCommercialSubtype(input: string): CommercialSubtype {
  const lower = input.toLowerCase().trim();
  if (lower.includes('shop') || lower.includes('retail') || lower.includes('store')
    || lower.includes('showroom')) return 'Shop';
  if (lower.includes('office') || lower.includes('workspace') || lower.includes('co-work')
    || lower.includes('cowork')) return 'Office';
  if (lower.includes('plot') || lower.includes('land') || lower.includes('ground')
    || lower.includes('open')) return 'Plot';
  return null;
}

// ─── Session Factory ──────────────────────────────────────────────────────────

export function createSession(lead: LeadRecord): ConversationSession {
  return {
    id: generateId(),
    lead,
    stage: 'greeting',
    collectedData: createEmptyCollectedData(),
    messages: [],
    qualification: null,
    finalOutput: null,
    startedAt: new Date().toISOString(),
    completedAt: null,
    stageAttempts: {},
  };
}

export function getGreetingMessage(lead: LeadRecord): string {
  return `Hello — this is RealtyAssistant reaching out about the property enquiry you submitted. Am I speaking with ${lead.name}?`;
}

// ─── Agent Response ───────────────────────────────────────────────────────────

export interface AgentResponse {
  session: ConversationSession;
  agentMessage: string;
  isComplete: boolean;
}

// ─── Main Processing Function─────────────────────────────────────────────────

export async function processUserMessage(
  session: ConversationSession,
  userInput: string
): Promise<AgentResponse> {
  console.groupCollapsed(`[Agent] Stage: ${session.stage} | Input: "${userInput}"`);

  // Add user message to transcript
  const userMsg = createMessage('user', userInput, session.stage);
  session.messages.push(userMsg);

  let agentReply = '';
  let isComplete = false;

  switch (session.stage) {

    // ── Step 1a: Greeting ────────────────────────────────────────────────────
    case 'greeting': {
      const confirmed = parseYesNo(userInput);
      if (confirmed === true) {
        session.collectedData.confirmedName = session.lead.name;
        resetAttempts(session);
        session.stage = 'ask_location';
        const fallback = `Great, ${session.lead.name}! Thank you for confirming. Which city or area are you currently searching for properties in?`;
        agentReply = await askGroq(
          `User confirmed they are ${session.lead.name}. Ask for their location.`,
          SYSTEM_PROMPT,
          fallback
        );
      } else if (confirmed === false) {
        resetAttempts(session);
        session.stage = 'confirm_name';
        agentReply = `No problem at all! May I know your good name, please?`;
      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          // Auto-accept and move on
          session.collectedData.confirmedName = session.lead.name;
          session.stage = 'ask_location';
          agentReply = `I'll take that as a yes — it's great to connect with you, ${session.lead.name}! Which city or locality are you looking for properties in?`;
        } else {
          agentReply = `I'm sorry, I didn't quite catch that. Am I speaking with ${session.lead.name}? Please say Yes or No.`;
        }
      }
      break;
    }

    // ── Step 1b: Confirm Name ────────────────────────────────────────────────
    case 'confirm_name': {
      const name = userInput.trim();
      if (name.length >= 2 && name.length < 100 && /[a-zA-Z]/.test(name)) {
        session.collectedData.confirmedName = name;
        resetAttempts(session);
        session.stage = 'ask_location';
        const fallback = `Thank you, ${name}! Which city or area are you searching for a property in?`;
        agentReply = await askGroq(
          LOCATION_PROMPT(name),
          SYSTEM_PROMPT,
          fallback
        );
      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          // Use lead name as fallback
          session.collectedData.confirmedName = session.lead.name;
          session.stage = 'ask_location';
          agentReply = `No worries! Which city or locality are you searching for properties in?`;
        } else {
          agentReply = `Could you please share your name so I can assist you better?`;
        }
      }
      break;
    }

    // ── Step 2: Location ─────────────────────────────────────────────────────
    case 'ask_location': {
      const location = userInput.trim();
      if (location.length > 1 && /[a-zA-Z]/.test(location)) {
        session.collectedData.location = location;
        resetAttempts(session);
        session.stage = 'ask_property_type';
        const fallback = `${location} — excellent! Are you looking for a Residential property (like a flat or house) or a Commercial property (like a shop, office, or plot)?`;
        agentReply = await askGroq(
          PROPERTY_TYPE_PROMPT(location),
          SYSTEM_PROMPT,
          fallback
        );
      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          session.collectedData.location = userInput.trim() || 'Not specified';
          session.stage = 'ask_property_type';
          agentReply = `Thank you! Are you looking for a Residential or Commercial property?`;
        } else {
          agentReply = `Could you please share the city or locality where you're looking for a property? For example, "Mumbai" or "Pune Wakad".`;
        }
      }
      break;
    }

    // ── Step 3: Property Type ────────────────────────────────────────────────
    case 'ask_property_type': {
      const propertyType = parsePropertyType(userInput);
      if (propertyType) {
        session.collectedData.propertyType = propertyType;
        resetAttempts(session);
        session.stage = 'ask_topology';
        if (propertyType === 'residential') {
          const fallback = `Residential — perfect! Which configuration are you looking for: 1 BHK, 2 BHK, 3 BHK, or 4 BHK?`;
          agentReply = await askGroq(TOPOLOGY_RESIDENTIAL_PROMPT, SYSTEM_PROMPT, fallback);
        } else {
          const fallback = `Commercial — understood! What type of commercial property interests you: a Shop, Office space, or Commercial Plot?`;
          agentReply = await askGroq(TOPOLOGY_COMMERCIAL_PROMPT, SYSTEM_PROMPT, fallback);
        }
      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          // Default to residential
          session.collectedData.propertyType = 'residential';
          session.stage = 'ask_topology';
          agentReply = `I'll note Residential for now. Which BHK configuration are you looking for — 1, 2, 3, or 4 BHK?`;
        } else {
          agentReply = `Could you clarify — are you looking for a Residential property (flat, house, apartment) or a Commercial property (shop, office, plot)?`;
        }
      }
      break;
    }

    // ── Step 4: Topology ─────────────────────────────────────────────────────
    case 'ask_topology': {
      if (session.collectedData.propertyType === 'residential') {
        const topology = parseResidentialTopology(userInput);
        if (topology) {
          session.collectedData.residentialTopology = topology;
          resetAttempts(session);
          session.stage = 'ask_budget';
          const fallback = `${topology} — great choice! What is your approximate budget? You can share a number like "50 lakhs" or a range like "30 to 60 lakhs".`;
          agentReply = await askGroq(BUDGET_PROMPT(topology), SYSTEM_PROMPT, fallback);
        } else {
          const attempts = incrementAttempt(session);
          if (attempts >= MAX_STAGE_RETRIES) {
            session.collectedData.residentialTopology = '2BHK';
            session.stage = 'ask_budget';
            agentReply = `I'll note 2 BHK for now. What is your approximate budget for this property?`;
          } else {
            agentReply = `Which BHK configuration are you looking for — 1 BHK, 2 BHK, 3 BHK, or 4 BHK?`;
          }
        }
      } else {
        const subtype = parseCommercialSubtype(userInput);
        if (subtype) {
          session.collectedData.commercialSubtype = subtype;
          resetAttempts(session);
          session.stage = 'ask_budget';
          const fallback = `${subtype} — noted! What is your approximate budget? You can share a number or range.`;
          agentReply = await askGroq(BUDGET_PROMPT(subtype), SYSTEM_PROMPT, fallback);
        } else {
          const attempts = incrementAttempt(session);
          if (attempts >= MAX_STAGE_RETRIES) {
            session.collectedData.commercialSubtype = 'Shop';
            session.stage = 'ask_budget';
            agentReply = `I'll note Shop for now. What is your approximate budget for this property?`;
          } else {
            agentReply = `Could you specify the type — are you looking for a Shop, Office space, or Commercial Plot?`;
          }
        }
      }
      break;
    }

    // ── Step 5: Budget ───────────────────────────────────────────────────────
    case 'ask_budget': {
      const budget = parseBudget(userInput);
      if (budget.min !== null || budget.max !== null) {
        session.collectedData.budgetRaw = userInput.trim();
        session.collectedData.budgetMin = budget.min;
        session.collectedData.budgetMax = budget.max;
        resetAttempts(session);
        session.stage = 'ask_consent';
        const fallback = `Perfect, got it! Would you like one of our senior sales representatives to call you to discuss available options in your budget? Please say Yes or No.`;
        agentReply = await askGroq(CONSENT_PROMPT, SYSTEM_PROMPT, fallback);
      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          // Accept raw text as budget
          session.collectedData.budgetRaw = userInput.trim() || 'Not specified';
          session.stage = 'ask_consent';
          agentReply = `Noted — I've recorded your budget. Would you like a sales representative to call you? Yes or No?`;
        } else {
          agentReply = `Could you please share your budget? For example: "50 lakhs", "1.5 crore", or "30 to 60 lakhs".`;
        }
      }
      break;
    }

    // ── Step 6: Consent ──────────────────────────────────────────────────────
    case 'ask_consent': {
      const consent = parseYesNo(userInput);
      if (consent !== null) {
        session.collectedData.consent = consent;
        session.stage = 'property_search';

        // Searching message
        const searchingMsg = `Thank you! Let me check available properties matching your requirements on realtyassistant.in...`;
        const searchChatMsg = createMessage('agent', searchingMsg, 'property_search');
        session.messages.push(searchChatMsg);

        // ── Property Search ──
        let searchResult;
        try {
          searchResult = await searchProperties({
            location: session.collectedData.location!,
            propertyType: session.collectedData.propertyType,
            topology: session.collectedData.residentialTopology || session.collectedData.commercialSubtype,
            budgetMin: session.collectedData.budgetMin,
            budgetMax: session.collectedData.budgetMax,
          });
        } catch (err) {
          console.error('[Agent] Property search failed:', err);
          searchResult = { count: 0, source: 'https://realtyassistant.in', query: {} as any, timestamp: new Date().toISOString() };
        }

        session.collectedData.propertyCount = searchResult.count;

        // System log message
        const systemMsg = createMessage(
          'system',
          `🔍 Search completed on ${searchResult.source}: Found ${searchResult.count} matching propert${searchResult.count === 1 ? 'y' : 'ies'}`,
          'property_search'
        );
        session.messages.push(systemMsg);

        // ── Qualify ──
        const qualification = qualifyLead(session.lead.id, session.collectedData);
        session.qualification = qualification;

        // ── Build final output ──
        session.finalOutput = buildFinalOutput(
          session.collectedData,
          qualification.decision,
          qualification.reasons
        );

        // ── Final Response ──
        session.stage = 'completed';
        session.completedAt = new Date().toISOString();
        isComplete = true;

        const name = session.collectedData.confirmedName || session.lead.name;
        if (qualification.decision === 'Qualified') {
          const fallback = CLOSING_QUALIFIED_PROMPT(name, searchResult.count, session.lead.phone)
            .split('\n').find(l => l.startsWith('Say:'))?.replace('Say: "', '').replace(/"$/, '')
            ?? `We found ${searchResult.count} properties on realtyassistant.in matching your requirements! Our team will call you at ${session.lead.phone} shortly. Thank you, ${name}!`;
          agentReply = await askGroq(
            CLOSING_QUALIFIED_PROMPT(name, searchResult.count, session.lead.phone),
            SYSTEM_PROMPT,
            fallback
          );
        } else {
          const fallback = `Thank you for your time, ${name}. We've noted all your requirements. We'll keep you updated whenever matching properties become available on realtyassistant.in. Have a wonderful day!`;
          agentReply = await askGroq(
            CLOSING_NOT_QUALIFIED_PROMPT(name, searchResult.count, session.finalOutput.reason),
            SYSTEM_PROMPT,
            fallback
          );
        }

        const finalMsg = createMessage('agent', agentReply, 'completed');
        session.messages.push(finalMsg);
        saveSession(session);

        console.log('[Agent] Session complete:', session.finalOutput);
        console.groupEnd();
        return { session, agentMessage: agentReply, isComplete };

      } else {
        const attempts = incrementAttempt(session);
        if (attempts >= MAX_STAGE_RETRIES) {
          // Assume no consent
          session.collectedData.consent = false;
          session.stage = 'ask_consent';
          // Re-process with "no"
          console.groupEnd();
          return processUserMessage(session, 'no');
        }
        agentReply = `I'm sorry, I didn't catch that. Would you like a sales representative to call you? Please reply Yes or No.`;
      }
      break;
    }

    default: {
      agentReply = `Thank you for your time! If you have any more questions, feel free to reach out.`;
      isComplete = true;
    }
  }

  const agentMsg = createMessage('agent', agentReply, session.stage);
  session.messages.push(agentMsg);

  saveSession(session);
  console.log(`[Agent] → Stage now: ${session.stage}`);
  console.groupEnd();

  return { session, agentMessage: agentReply, isComplete };
}
