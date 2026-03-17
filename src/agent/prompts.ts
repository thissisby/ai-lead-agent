/**
 * LLM Prompt Templates for RealtyAssistant AI Agent
 *
 * Provider: Groq (https://api.groq.com/openai/v1/chat/completions)
 * Model:    llama3-70b-8192
 * Temp:     0.3 (low for deterministic script adherence)
 * Max tok:  200 (concise for chat/voice)
 *
 * Twilio/VAPI.ai Integration Notes:
 *   - Voice webhook: POST /api/voice/incoming
 *   - Audio-to-text: Groq Whisper API (whisper-large-v3)
 *   - TTS: ElevenLabs or Twilio <Say> verb
 *   - Retry: 3 attempts, exponential backoff (1s/2s/4s)
 *   - Timeout: 30s per turn, 5 min total
 */

// ─── System Prompt ────────────────────────────────────────────────────────────
export const SYSTEM_PROMPT = `You are RealtyAssistant, a professional, warm, and concise real estate AI assistant.
You are conducting a lead qualification chat with a potential property buyer in India.

STRICT RULES:
1. Follow the conversation script EXACTLY in order — never skip a step
2. Ask ONE question at a time only
3. Keep responses under 2 short sentences
4. Be warm and professional — acknowledge the user's answer before the next question
5. If the user gives an unclear answer: politely rephrase and ask again (max 3 attempts)
6. Never fabricate property data — only reference realtyassistant.in
7. Use Indian currency conventions: lakhs, crores (e.g. "50 lakhs", "1.5 crore")
8. For voice compatibility: avoid bullet points and markdown; use plain natural language

CONVERSATION ORDER (strictly follow):
Step 1 → GREETING: Confirm lead identity
Step 2 → LOCATION: Ask city/area
Step 3 → PROPERTY TYPE: Ask Residential or Commercial
Step 4 → TOPOLOGY: If Residential ask 1/2/3/4 BHK; if Commercial ask Shop/Office/Plot
Step 5 → BUDGET: Ask budget (numeric or text like "50 lakhs")
Step 6 → CONSENT: Ask if they want a sales rep to call
Step 7 → CLOSING: Thank them and confirm next steps`;

// ─── Stage Prompts ────────────────────────────────────────────────────────────
export const GREETING_PROMPT = (leadName: string) =>
  `Generate a warm, natural greeting for a lead named "${leadName}". 
Say: "Hello — this is RealtyAssistant. I'm calling about the property enquiry you submitted. Am I speaking with ${leadName}?"
Be brief, natural, and professional.`;

export const CONFIRM_NAME_PROMPT = `The lead said they are NOT the person we expected.
Ask politely: "No problem! May I know your good name please?"
Keep it very brief.`;

export const LOCATION_PROMPT = (confirmedName: string) =>
  `The user confirmed their name as "${confirmedName}". 
Now ask: "Great, ${confirmedName}! Which city or locality are you searching for properties in?"
Acknowledge their name warmly first.`;

export const PROPERTY_TYPE_PROMPT = (location: string) =>
  `The user wants to search in "${location}". Briefly acknowledge that then ask:
"Are you looking for a Residential property (flat/house/apartment) or a Commercial property (shop/office/plot)?"`;

export const TOPOLOGY_RESIDENTIAL_PROMPT = `The user wants a Residential property.
Ask: "Which configuration are you looking for — 1 BHK, 2 BHK, 3 BHK, or 4 BHK?"`;

export const TOPOLOGY_COMMERCIAL_PROMPT = `The user wants a Commercial property.
Ask: "What type of commercial space are you interested in — a Shop, Office, or Commercial Plot?"`;

export const BUDGET_PROMPT = (topology: string) =>
  `The user selected "${topology}". Briefly acknowledge, then ask:
"What is your approximate budget? You can mention a number like '50 lakhs' or a range like '30 to 60 lakhs'."`;

export const CONSENT_PROMPT = `The user has provided their budget. 
Now ask: "Would you like one of our senior sales representatives to call you to discuss available options? (Yes or No)"
Keep it natural and non-pressuring.`;

export const CLOSING_QUALIFIED_PROMPT = (name: string, count: number, phone: string) =>
  `The user consented to a sales call and we found ${count} matching properties on realtyassistant.in.
Say: "Wonderful, ${name}! I found ${count} matching properties for your requirements on realtyassistant.in. 
Our team will call you shortly at ${phone} to discuss the best options. Thank you for your time!"`;

export const CLOSING_NOT_QUALIFIED_PROMPT = (name: string, count: number, reason: string) =>
  `Reason not qualified: "${reason}". Properties found: ${count}.
Say: "Thank you for your time, ${name}. We've noted your requirements and will keep you updated whenever matching properties become available on realtyassistant.in. Have a great day!"`;

// ─── Extraction Prompts (for parsing user input into structured JSON) ──────────
export const EXTRACT_BUDGET_PROMPT = (userInput: string) =>
  `The user said: "${userInput}"
Extract the budget as JSON. Return ONLY valid JSON, no explanation:
{
  "budgetRaw": "<original text>",
  "budgetMin": <number in rupees or null>,
  "budgetMax": <number in rupees or null>
}
Examples:
- "50 lakhs" → {"budgetRaw":"50 lakhs","budgetMin":4000000,"budgetMax":6000000}
- "1 crore" → {"budgetRaw":"1 crore","budgetMin":8000000,"budgetMax":12000000}
- "30 to 50 lakhs" → {"budgetRaw":"30 to 50 lakhs","budgetMin":3000000,"budgetMax":5000000}`;

export const EXTRACT_PROPERTY_TYPE_PROMPT = (userInput: string) =>
  `The user said: "${userInput}"
Classify as "residential" or "commercial". Return ONLY valid JSON:
{"propertyType": "residential" | "commercial" | null}`;

export const EXTRACT_TOPOLOGY_PROMPT = (userInput: string, propertyType: string) =>
  `The user said: "${userInput}"
Property type: "${propertyType}"
If residential, extract BHK (1BHK/2BHK/3BHK/4BHK). If commercial, extract subtype (Shop/Office/Plot).
Return ONLY valid JSON:
{"topology": "1BHK" | "2BHK" | "3BHK" | "4BHK" | "Shop" | "Office" | "Plot" | null}`;

// ─── API Configs ──────────────────────────────────────────────────────────────
export const GROQ_CONFIG = {
  apiUrl: 'https://api.groq.com/openai/v1/chat/completions',
  model: 'llama3-70b-8192',
  temperature: 0.3,
  maxTokens: 200,
  retryAttempts: 3,
  retryDelays: [1000, 2000, 4000],
};

export const TWILIO_CONFIG = {
  voiceWebhook: '/api/voice/incoming',
  statusCallback: '/api/voice/status',
  recordingCallback: '/api/voice/recording',
  speechTimeout: 'auto',
  language: 'en-IN',
};

export const VAPI_CONFIG = {
  assistantId: 'realty-assistant-v1',
  firstMessage: 'Hello — this is RealtyAssistant calling about your property enquiry.',
  model: {
    provider: 'groq',
    model: 'llama3-70b-8192',
    temperature: 0.3,
  },
  voice: {
    provider: 'elevenlabs',
    voiceId: 'professional-female-1',
  },
  transcriber: {
    provider: 'groq',
    model: 'whisper-large-v3',
    language: 'en',
  },
};
