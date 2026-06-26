// api/generate.js — Vercel Serverless Function
// This runs on Vercel's server, NOT in the browser.
// The API key is safe here — it's stored in Vercel's environment variables.

const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
  // CORS headers for cross-origin requests
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow POST requests
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

  // Build the prompt
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
        error: 'AI API key is not configured. Please add AI_API_KEY in Vercel environment variables.',
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
        errorMessage = 'Invalid API key. Please check your AI_API_KEY in Vercel settings.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait and try again.';
      } else if (response.status === 503) {
        errorMessage = 'AI service temporarily unavailable. Please try again later.';
      }

      return res.status(502).json({ error: errorMessage });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      return res.status(502).json({
        error: 'The AI returned an empty response. Please try again.',
      });
    }

    const parsed = parseSections(rawText);
    return res.json({ result: parsed, raw: rawText });

  } catch (err) {
    console.error('Server error:', err.message);

    if (err.code === 'ENOTFOUND') {
      return res.status(502).json({
        error: 'Could not connect to AI service. Please check your AI_BASE_URL.',
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
    });
  }
};

// Prompt builder (same as prompts/templates.js but inlined for Vercel)
function buildPrompt({ productName, businessDescription, platform, tone, language, campaignGoal }) {
  const systemMessage = {
    role: 'system',
    content: `You are a world-class social media strategist and creative copywriter with 10+ years of experience helping brands grow online. You specialize in crafting high-converting, platform-native content that feels authentic and drives real engagement.

YOUR EXPERTISE:
- You understand the nuances of each social media platform (Instagram, LinkedIn, X/Twitter, TikTok, Facebook)
- You know how to adapt tone, length, and style for different audiences
- You create content that stops the scroll and sparks conversation
- You avoid generic, templated content — every piece you write is unique to the brand

RULES YOU MUST FOLLOW:
1. Write ALL content in ${language || 'English'}.
2. Tailor EVERY piece of content specifically for ${platform || 'Instagram'}.
3. Use a ${tone || 'Casual'} tone consistently throughout.
4. Align all content with the campaign goal: ${campaignGoal || 'Engagement'}.
5. NEVER use generic phrases like "Check out our..." or "Don't miss..." without tying them to the specific product.
6. Reference the actual product name and specific details from the description.
7. Make content feel human, relatable, and authentic — not robotic or salesy.
8. Use platform-specific best practices:
   - Instagram: Visual language, emoji usage, line breaks for readability
   - LinkedIn: Professional insights, thought leadership, value-driven
   - X/Twitter: Concise, punchy, conversation-starting
   - TikTok: Trendy, hook-first, Gen-Z friendly language
   - Facebook: Community-focused, storytelling, conversational

OUTPUT FORMAT — Return EXACTLY these six sections with "## " headers:

## Caption
Write a platform-native caption (2-4 short paragraphs). Include emojis where natural. Make it scroll-stopping. Reference the specific product/business by name.

## Hashtags
Provide 10-15 relevant hashtags as a single line, space-separated. Mix popular and niche hashtags. Include branded hashtags if applicable.

## Headline
Write ONE punchy poster/ad headline (max 10 words). Make it memorable and benefit-focused.

## Slogan
Create ONE memorable brand tagline (max 8 words). It should capture the essence of the product.

## CTA
Provide 2-3 call-to-action variants (numbered list). Each should be specific to the product and campaign goal.

## Video Script
Write a 30-60 second video script with these sections labeled:
[HOOK] — First 3 seconds to grab attention
[BODY] — Main message (15-40 seconds)
[CTA] — Closing call-to-action (5-10 seconds)

IMPORTANT: Do NOT include any meta-commentary, explanations, or text outside these six sections. Return ONLY the content under each header.`,
  };

  const userMessage = {
    role: 'user',
    content: `Create professional social media content for:

Product/Business Name: "${productName ? productName.trim() : 'Not specified'}"
Description: "${businessDescription.trim()}"

Platform: ${platform || 'Instagram'}
Tone: ${tone || 'Casual'}
Language: ${language || 'English'}
Campaign Goal: ${campaignGoal || 'Engagement'}

Generate all six sections (Caption, Hashtags, Headline, Slogan, CTA, Video Script) following the exact format specified. Make the content specific to this product — avoid generic copy.`,
  };

  return [systemMessage, userMessage];
}

// Parse sections from AI output
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
