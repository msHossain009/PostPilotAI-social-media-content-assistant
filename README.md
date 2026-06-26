# PostPilot AI

**AI-Powered Social Media Content Assistant**

---

## Problem Statement

Small business owners and independent creators spend hours crafting social media content. They struggle with:

- Writing platform-specific captions that actually engage audiences
- Finding the right hashtags to maximize reach
- Creating compelling headlines, slogans, and calls-to-action
- Producing video scripts without a copywriting background
- Maintaining consistent brand voice across platforms

Most cannot afford professional copywriters, and generic AI tools produce bland, templated content that fails to resonate.

---

## Solution

PostPilot AI is a web application that generates professional, platform-specific social media content in seconds. Users describe their product or business, select their platform, tone, language, and campaign goal — and the AI generates ready-to-use content including:

1. **Captions** — Platform-native, scroll-stopping copy
2. **Hashtags** — 10-15 relevant, trending hashtags
3. **Poster Headlines** — Punchy, benefit-focused headlines
4. **Slogans** — Memorable brand taglines
5. **Calls-to-Action** — Conversion-focused CTAs
6. **Video Scripts** — 30-60 second scripts with hook, body, and CTA

---

## Selected Challenge Theme

**Reimagine Creative Industries with AI**

PostPilot AI reimagines how creators and small businesses approach content creation by making professional copywriting accessible to everyone through AI.

---

## Key Features

| Feature | Description |
|---------|-------------|
| Platform-Specific Content | Tailored for Instagram, LinkedIn, X/Twitter, TikTok, Facebook |
| Multi-Language Support | Generate content in English, Spanish, French, Portuguese, Arabic, Swahili |
| Tone Selection | Casual, Professional, Witty, Inspirational, Urgent |
| Campaign Goals | Engagement, Brand Awareness, Sales, Website Traffic, Community Building |
| Copy to Clipboard | One-click copy for every generated result |
| Clear Form | Reset all inputs with a single click |
| Loading Animation | Visual feedback while content is generating |
| Character Counter | Real-time count for product description |
| Responsive Design | Works seamlessly on desktop and mobile |
| Error Handling | Clear, actionable error messages |

---

## AI Approach and Architecture

### How It Works

```
User Input → Express Server → AI Prompt Builder → AI API → Response Parser → Result Cards
```

1. **User fills form** — Product name, description, platform, tone, language, goal
2. **Frontend sends POST** — `/api/generate` with form data as JSON
3. **Backend builds prompt** — Structured system + user messages
4. **AI generates content** — OpenAI-compatible Chat Completions API
5. **Backend parses response** — Extracts 6 labeled sections
6. **Frontend renders cards** — Each section displayed in its own card

### Prompt Engineering

The AI is instructed to act as a **world-class social media strategist** with 10+ years of experience. The system prompt includes:

- Platform-specific best practices (e.g., TikTok = Gen-Z language, LinkedIn = thought leadership)
- Anti-generic instructions (must reference actual product name and details)
- Strict output format (6 labeled sections with `##` headers)
- Tone and language constraints
- Campaign goal alignment

### Security

- API key stored **only in `.env`** on the server
- `.env` is in `.gitignore` — never committed to version control
- Frontend calls `/api/generate` on same server — no key exposed to browser

---

## Technologies Used

| Layer | Technology |
|-------|------------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (ES2020+) |
| Backend | Node.js, Express 4 |
| AI | OpenAI-compatible Chat Completions API |
| Config | dotenv |
| HTTP Client | node-fetch |

### Supported AI Providers

Any provider that supports the OpenAI Chat Completions format works:

- **OpenAI** — `gpt-4o-mini`, `gpt-4o`
- **Google Gemini** — `gemini-1.5-flash`
- **Groq** — `llama3-8b-8192`
- **IBM watsonx** — OpenAI-compatible endpoint
- **Anthropic** — Via OpenAI-compatible proxy

---

## How IBM watsonx Was Used

PostPilot AI is designed to work with IBM watsonx through its OpenAI-compatible API endpoint. The application:

1. Uses watsonx's OpenAI-compatible Chat Completions endpoint
2. Authenticates with watsonx API key via Bearer token
3. Sends structured prompts for content generation
4. Parses the response in standard OpenAI format

To use with watsonx:
```env
AI_API_KEY=your-watsonx-api-key
AI_BASE_URL=your-watsonx-openai-compat-url
AI_MODEL=ibm/granite-13b-chat-v2
```

---

## How to Run Locally

### Prerequisites

- Node.js 18+ installed
- An API key from a supported AI provider

### Steps

1. **Clone the repository**
   ```bash
   git clone https://github.com/msHossain009/PostPilotAI-social-media-content-assistant.git
   cd PostPilotAI-social-media-content-assistant
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` with your API credentials**
   ```env
   AI_API_KEY=your-api-key-here
   AI_BASE_URL=https://api.openai.com/v1
   AI_MODEL=gpt-4o-mini
   PORT=3000
   ```

5. **Start the server**
   ```bash
   # Production
   npm start

   # Development (auto-reload)
   npm run dev
   ```

6. **Open in browser**
   ```
   http://localhost:3000
   ```

---

## Deploy to Vercel (Free)

### Steps

1. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Ready for deployment"
   git push origin main
   ```

2. **Go to [vercel.com](https://vercel.com)** and sign in with GitHub

3. **Import your repository**
   - Click "New Project"
   - Select `PostPilotAI-social-media-content-assistant`
   - Click "Import"

4. **Add Environment Variables**
   - `AI_API_KEY` — Your API key
   - `AI_BASE_URL` — `https://api.openai.com/v1`
   - `AI_MODEL` — `gpt-4o-mini`

5. **Click "Deploy"**

6. **Done!** Your app will be live at `https://your-project.vercel.app`

### Environment Variables (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `AI_API_KEY` | Yes | API key from your AI provider |
| `AI_BASE_URL` | Yes | Base URL of the AI API endpoint |
| `AI_MODEL` | Yes | Model name to use for generation |

---

## Demo Video

[Link to demo video](#) — *Coming soon*

---

## Team Members

| Name | Role |
|------|------|
| [Team Member 1] | Full Stack Developer |
| [Team Member 2] | AI/ML Engineer |
| [Team Member 3] | UI/UX Designer |

---

## File Structure

```
postpilot-ai/
├── public/
│   ├── index.html        — UI: form + result cards
│   ├── style.css         — All styles
│   └── script.js         — Frontend logic (no API key)
├── routes/
│   └── generate.js       — POST /api/generate handler
├── prompts/
│   └── templates.js      — AI prompt builders
├── server.js             — Express entry point
├── .env                  — Your API key (never commit)
├── .env.example          — Template for .env
├── .gitignore
├── package.json
└── README.md
```

---

## Future Improvements

- [ ] Save generated content history
- [ ] User accounts and authentication
- [ ] Image generation for social media posts
- [ ] Batch content generation for multiple platforms
- [ ] Content calendar integration
- [ ] A/B testing for captions
- [ ] Analytics dashboard for content performance
- [ ] Custom brand voice profiles
- [ ] Export to scheduling tools (Buffer, Hootsuite)
- [ ] Multi-language auto-detection

---

## License

MIT License

---

**Built with AI for the July Challenge: Reimagine Creative Industries with AI**
