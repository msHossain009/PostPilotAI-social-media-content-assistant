// ─────────────────────────────────────────────────────────────────
// routes/generate.js — POST /api/generate
// Handles the AI API call on the server side.
// The API key lives ONLY here — never exposed to the browser.
// ─────────────────────────────────────────────────────────────────

const express = require('express');
const router  = express.Router();
const fetch   = require('node-fetch');

const { buildPrompt } = require('../prompts/templates');

// ── POST /api/generate ────────────────────────────────────────────
router.post('/generate', async (req, res) => {
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
      error: 'Please enter at least a short description of your business or product (minimum 5 characters).',
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
    const response = await fetch(`${process.env.AI_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${process.env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model:       process.env.AI_MODEL || 'gpt-4o-mini',
        messages,
        temperature: 0.8,
        max_tokens:  1500,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error('AI API error:', response.status, errorBody);

      let errorMessage = `AI service error (${response.status}).`;
      if (response.status === 401) {
        errorMessage = 'Invalid API key. Please check your AI_API_KEY in .env.';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please wait a moment and try again.';
      } else if (response.status === 503) {
        errorMessage = 'AI service is temporarily unavailable. Please try again later.';
      }

      return res.status(502).json({ error: errorMessage });
    }

    const data = await response.json();
    const rawText = data?.choices?.[0]?.message?.content ?? '';

    if (!rawText) {
      return res.status(502).json({
        error: 'The AI returned an empty response. Please try again with a different description.',
      });
    }

    const parsed = parseSections(rawText);
    return res.json({ result: parsed, raw: rawText });

  } catch (err) {
    console.error('Server error in /api/generate:', err.message);

    if (err.code === 'ENOTFOUND') {
      return res.status(502).json({
        error: 'Could not connect to the AI service. Please check your AI_BASE_URL in .env.',
      });
    }

    return res.status(500).json({
      error: 'An unexpected error occurred. Please try again.',
    });
  }
});

// ── Helper: parse labelled sections from AI output ───────────────
function parseSections(text) {
  const sections = {
    caption:     '',
    hashtags:    '',
    headline:    '',
    slogan:      '',
    cta:         '',
    videoScript: '',
  };

  const labelMap = {
    'caption':        'caption',
    'hashtags':       'hashtags',
    'headline':       'headline',
    'slogan':         'slogan',
    'tagline':        'slogan',
    'cta':            'cta',
    'call-to-action': 'cta',
    'video script':   'videoScript',
    'short video':    'videoScript',
  };

  const chunks = text.split(/^##\s*/im);

  for (const chunk of chunks) {
    const lines     = chunk.trim().split('\n');
    const labelLine = (lines[0] || '').toLowerCase().trim();
    const body      = lines.slice(1).join('\n').trim();

    for (const [keyword, key] of Object.entries(labelMap)) {
      if (labelLine.includes(keyword)) {
        sections[key] = body;
        break;
      }
    }
  }

  return sections;
}

module.exports = router;
