// api/generate.js — Vercel Serverless Function
// Uses built-in fetch (Node 18+) — no external dependencies needed.

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  const {
    productName,
    businessDescription,
    platform,
    tone,
    language,
    campaignGoal,
  } = req.body;

  if (!businessDescription || businessDescription.trim().length < 5) {
    return res.status(400).json({
      error: 'Please enter at least a short description of your business or product.',
    });
  }

  const messages = buildPrompt({
    productName,
    businessDescription,
    platform,
    tone,
    language,
    campaignGoal,
  });

  try {
    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    if (!apiKey) {
      return res.status(500).json({
        error: 'AI API key not configured. Add AI_API_KEY in Vercel environment variables.',
      });
    }

    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature: 0.8,
        max_tokens: 1500,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('AI API error:', response.status, errorBody);

      let errorMessage = `AI service error (${response.status}).`;
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Check AI_API_KEY in Vercel settings.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait and try again.';
      } else if (response.status === 503) {
        errorMessage = 'AI service temporarily unavailable.';
      }

      return res.status(502).json({ error: errorMessage });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      return res.status(502).json({
        error: 'AI returned an empty response. Please try again.',
      });
    }

    const parsed = parseSections(rawText);
    return res.json({ result: parsed, raw: rawText });

  } catch (err) {
    console.error('Server error:', err.message);

    if (err.code === 'ENOTFOUND') {
      return res.status(502).json({
        error: 'Could not connect to AI service. Check AI_BASE_URL.',
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
    });
  }
};

function buildPrompt({ productName, businessDescription, platform, tone, language, campaignGoal }) {
  const systemMessage = {
    role: 'system',
    content: `You are a world-class social media strategist and creative copywriter with 10+ years of experience helping brands grow online.

RULES:
1. Write ALL content in ${language || 'English'}.
2. Tailor EVERY piece for ${platform || 'Instagram'}.
3. Use a ${tone || 'Casual'} tone throughout.
4. Align with campaign goal: ${campaignGoal || 'Engagement'}.
5. Reference the actual product name from the description.
6. Make content feel human, not robotic.

OUTPUT FORMAT — Return EXACTLY these six sections with "## " headers:

## Caption
Platform-native caption (2-4 short paragraphs) with emojis where natural. Reference the product by name.

## Hashtags
10-15 relevant hashtags, space-separated.

## Headline
ONE punchy poster/ad headline (max 10 words).

## Slogan
ONE memorable tagline (max 8 words).

## CTA
2-3 call-to-action variants (numbered list).

## Video Script
30-60 second script with [HOOK], [BODY], [CTA] labels.

IMPORTANT: Return ONLY content under each header, no extra text.`,
  };

  const userMessage = {
    role: 'user',
    content: `Create social media content for:

Product/Business Name: "${productName ? productName.trim() : 'Not specified'}"
Description: "${businessDescription.trim()}"

Platform: ${platform || 'Instagram'}
Tone: ${tone || 'Casual'}
Language: ${language || 'English'}
Campaign Goal: ${campaignGoal || 'Engagement'}

Generate all six sections.`,
  };

  return [systemMessage, userMessage];
}

function parseSections(text) {
  const sections = {
    caption: '',
    hashtags: '',
    headline: '',
    slogan: '',
    cta: '',
    videoScript: '',
  };

  const labelMap = {
    'caption': 'caption',
    'hashtags': 'hashtags',
    'headline': 'headline',
    'slogan': 'slogan',
    'tagline': 'slogan',
    'cta': 'cta',
    'call-to-action': 'cta',
    'video script': 'videoScript',
    'short video': 'videoScript',
  };

  const chunks = text.split(/^##\s*/im);

  for (const chunk of chunks) {
    const lines = chunk.trim().split('\n');
    const labelLine = (lines[0] || '').toLowerCase().trim();
    const body = lines.slice(1).join('\n').trim();

    for (const [keyword, key] of Object.entries(labelMap)) {
      if (labelLine.includes(keyword)) {
        sections[key] = body;
        break;
      }
    }
  }

  return sections;
}
