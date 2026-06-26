// ─────────────────────────────────────────────────────────────────
// server.js — KoroAI Express backend
// This file is the entry point for the Node.js server.
// It serves the frontend files and connects the API routes.
// ─────────────────────────────────────────────────────────────────

// Load environment variables from the .env file FIRST
// This makes process.env.AI_API_KEY available everywhere below
require('dotenv').config();

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Middleware ────────────────────────────────────────────────────
// Parse incoming JSON request bodies (needed for POST /api/generate)
app.use(express.json());

// Serve everything in the /public folder as static files
// (index.html, style.css, script.js)
app.use(express.static(path.join(__dirname, 'public')));

// ── API Routes ────────────────────────────────────────────────────
// Mount the generate route — all requests to /api/* are handled here
const generateRoute = require('./routes/generate');
app.use('/api', generateRoute);

// ── Catch-all ─────────────────────────────────────────────────────
// For any URL that isn't a static file or an API call,
// send back index.html so the frontend handles it
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start listening ───────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`✅  KoroAI server running at http://localhost:${PORT}`);
  console.log(`    Environment: ${process.env.NODE_ENV || 'development'}`);
});
