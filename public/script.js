// ─────────────────────────────────────────────────────────────────
// script.js — PostPilot AI frontend logic
//
// Handles: character counter, form submission, loading state,
// result rendering, copy-to-clipboard, clear form, regenerate.
//
// NO API key here — it lives in .env on the server only.
// ─────────────────────────────────────────────────────────────────

const form               = document.getElementById('generate-form');
const productNameInput   = document.getElementById('productName');
const textarea           = document.getElementById('businessDescription');
const charCounter        = document.getElementById('char-counter');
const btnGenerate        = document.getElementById('btn-generate');
const btnSpinner         = document.getElementById('btn-spinner');
const btnLabel           = document.getElementById('btn-label');
const btnClear           = document.getElementById('btn-clear');
const formError          = document.getElementById('form-error');
const emptyState         = document.getElementById('empty-state');
const resultsGrid        = document.getElementById('results-grid');
const btnRegenerate      = document.getElementById('btn-regenerate');

// ── 1. Character counter ─────────────────────────────────────────
textarea.addEventListener('input', () => {
  const len = textarea.value.length;
  const max = parseInt(textarea.getAttribute('maxlength'), 10);
  charCounter.textContent = `${len} / ${max}`;
  charCounter.classList.toggle('near-limit', len >= max * 0.8 && len < max);
  charCounter.classList.toggle('at-limit', len >= max);
});

// ── 2. Form submission ───────────────────────────────────────────
form.addEventListener('submit', async (event) => {
  event.preventDefault();
  hideError();

  const description = textarea.value.trim();
  if (description.length < 5) {
    showError('Please enter at least a short description of your business or product.');
    textarea.focus();
    return;
  }

  const payload = {
    productName:        productNameInput.value.trim(),
    businessDescription: description,
    platform:           document.getElementById('platform').value,
    tone:               document.getElementById('tone').value,
    language:           document.getElementById('language').value,
    campaignGoal:       document.getElementById('campaignGoal').value,
  };

  await generateContent(payload);
});

// ── 3. Clear form ────────────────────────────────────────────────
btnClear.addEventListener('click', () => {
  form.reset();
  charCounter.textContent = '0 / 500';
  charCounter.classList.remove('near-limit', 'at-limit');
  hideError();
});

// ── 4. Regenerate ────────────────────────────────────────────────
btnRegenerate.addEventListener('click', () => {
  form.dispatchEvent(new Event('submit', { cancelable: true }));
});

// ── 5. Generate content ──────────────────────────────────────────
async function generateContent(payload) {
  setLoading(true);

  try {
    const response = await fetch('/api/generate', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      showError(data.error || 'Something went wrong. Please try again.');
      return;
    }

    renderResults(data.result);

  } catch (networkError) {
    showError('Could not reach the server. Make sure it is running (npm start).');
    console.error('Network error:', networkError);
  } finally {
    setLoading(false);
  }
}

// ── 6. Render results ────────────────────────────────────────────
function renderResults(sections) {
  const sectionMap = {
    caption:     'text-caption',
    hashtags:    'text-hashtags',
    headline:    'text-headline',
    slogan:      'text-slogan',
    cta:         'text-cta',
    videoScript: 'text-video',
  };

  for (const [key, elementId] of Object.entries(sectionMap)) {
    const el = document.getElementById(elementId);
    if (el) {
      el.textContent = sections[key] || 'Not generated';
    }
  }

  emptyState.hidden    = true;
  emptyState.style.display = 'none';
  resultsGrid.hidden   = false;
  btnRegenerate.hidden = false;

  resultsGrid.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ── 7. Loading state ─────────────────────────────────────────────
function setLoading(isLoading) {
  btnGenerate.disabled = isLoading;

  if (isLoading) {
    btnSpinner.classList.add('visible');
    btnLabel.textContent = 'Generating...';
  } else {
    btnSpinner.classList.remove('visible');
    btnLabel.textContent = 'Generate Content';
  }
}

// ── 8. Error helpers ─────────────────────────────────────────────
function showError(message) {
  formError.textContent = message;
  formError.classList.add('visible');
}

function hideError() {
  formError.textContent = '';
  formError.classList.remove('visible');
}

// ── 9. Copy to clipboard ────────────────────────────────────────
document.addEventListener('click', async (event) => {
  const button = event.target.closest('.btn-copy');
  if (!button) return;

  const targetId = button.getAttribute('data-target');
  const sourceEl = document.getElementById(targetId);
  if (!sourceEl) return;

  const textToCopy = sourceEl.textContent.trim();

  try {
    await navigator.clipboard.writeText(textToCopy);
    showCopiedFeedback(button);
  } catch (err) {
    legacyCopy(textToCopy);
    showCopiedFeedback(button);
  }
});

function showCopiedFeedback(button) {
  button.textContent = 'Copied!';
  button.classList.add('copied');
  setTimeout(() => {
    button.textContent = 'Copy';
    button.classList.remove('copied');
  }, 2000);
}

function legacyCopy(text) {
  const tmp = document.createElement('textarea');
  tmp.value = text;
  tmp.style.position = 'fixed';
  tmp.style.opacity  = '0';
  document.body.appendChild(tmp);
  tmp.select();
  document.execCommand('copy');
  document.body.removeChild(tmp);
}
