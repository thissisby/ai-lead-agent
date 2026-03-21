# 🏠 AI Real Estate Lead Qualification Agent

[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Google Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](./LICENSE)

A production-ready AI Chat Agent that qualifies real estate leads end-to-end — automatically. No manual calls. No missed leads.

🔗 **Live Demo:**  https://ai-lead-agents.vercel.app/

---

## What Does It Do?

Instead of a sales rep manually calling every lead, this AI agent:

1. Chats with the incoming lead via a React frontend
2. Collects all required property details through a structured conversation
3. Searches live property listings using an AI-powered search engine
4. Decides automatically — **Qualified ✅ or Not Qualified ❌**
5. Stores the full conversation transcript + a JSON summary in the backend

---

## Conversation Flow

```
Lead Enters
    │
    ▼
👋 Greeting & Identity Confirmation
    │
    ▼
📍 Location
    │
    ▼
🏠 Property Type → Residential or Commercial?
    │                        │
    ▼                        ▼
1 / 2 / 3 / 4 BHK     Shop / Office / Plot
    │                        │
    └──────────┬─────────────┘
               ▼
        💰 Budget
               │
               ▼
  🤝 Consent to Sales Rep Call?
               │
               ▼
     🔍 Live Property Search
               │
               ▼
   ✅ QUALIFIED / ❌ NOT QUALIFIED
               │
               ▼
    💾 Store Transcript + JSON
```

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React.js |
| Backend | Node.js, Express.js |
| AI Engine | Google Gemini |
| Styling | Tailwind CSS |
| Storage | JSON / Database |
| API | REST |

---

## API Reference

### Start Chat Flow

```http
POST /api/agent/start
Content-Type: application/json

{
  "name": "Bhanu Yadav",
  "phone": "9876543210",
  "email": "bhanu@example.com"
}
```

### Get Qualification Summary

```http
GET /api/agent/summary/:sessionId
```

Response:

```json
{
  "contact_name": "Bhanu Yadav",
  "location": "Noida",
  "property_type": "Residential",
  "topology": "2BHK",
  "budget": "50 Lakhs",
  "consent": true,
  "matching_properties": 12,
  "qualification": "QUALIFIED",
  "reason": "Budget matches, 12 properties found, consent given"
}
```

---

## Qualification Logic

| Condition | Result |
|-----------|--------|
| Properties found > 0 AND consent = Yes | ✅ QUALIFIED |
| No matching properties found | ❌ NOT QUALIFIED |
| Consent = No | ❌ NOT QUALIFIED |
| Incomplete / invalid data | ❌ NOT QUALIFIED |

---

## Getting Started

```bash
# Clone the repo
git clone https://github.com/your-username/ai-lead-qualifier.git
cd ai-lead-qualifier

# Install dependencies
cd server && npm install
cd ../client && npm install

# Add your Gemini API key in .env
GEMINI_API_KEY=your_key_here

# Run
cd server && npm run dev
cd client && npm start
```

---
# you can also download your response at the end report 
## Future Improvements

- [ ] Voice support via Twilio / VAPI.ai
- [ ] WhatsApp integration
- [ ] CRM export (Salesforce / HubSpot)
- [ ] Admin dashboard for leads
- [ ] Hindi + English multilingual support

---

## License

This project is licensed under the MIT License — see the [LICENSE](./LICENSE) file for details.

---

Built with ❤️ by [Bhanu Yadav] https://www.linkedin.com/in/thisisby/
