/**
 * ─── EV360 Server ───
 * Express entry point.
 * Serves the static frontend and mounts the API routes.
 */

const express = require('express');
const path = require('path');
const config = require('./config');
const apiRoutes = require('./routes/api');

const app = express();

// ── Middleware ──
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static frontend ──
app.use(express.static(path.join(__dirname, 'public')));

// ── API routes ──
app.use('/api', apiRoutes);

// ── Fallback: serve index.html for SPA routing ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ── Start ──
app.listen(config.port, () => {
  console.log(`
  ╔══════════════════════════════════════════════╗
  ║   🏠 EV360 - Gayrimenkul Değerleme          ║
  ║   Server running on port ${config.port}              ║
  ║   http://localhost:${config.port}                    ║
  ╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
