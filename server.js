// server.js - Express server for Apple Sign-In callback (v2)
// - Serves /.well-known/apple-app-site-association (iOS)
// - Serves /.well-known/assetlinks.json (Android)
// - POST /auth/apple  (body: { code, return_url? }) - logs code and redirects to return_url or DEFAULT_APP_LINK
// - GET /auth/apple/callback (for browser-based redirects) supports query params
//
// By default this version only logs the authorization code and redirects it.
// Provide real Apple credentials and token-exchange logic later if needed.
//
const express = require('express');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 8080;
const DEFAULT_APP_LINK = process.env.DEFAULT_APP_LINK || 'https://apple-signin-demo.onrender.com/apple_callback';
const DEFAULT_DEEP_LINK = process.env.DEFAULT_DEEP_LINK || 'myapp://callback';

app.use(bodyParser.json());
// serve static .well-known files
app.use('/.well-known', express.static(path.join(process.cwd(), 'public', '.well-known')));

app.get('/health', (req, res) => res.json({ ok: true }));

// Accept both POST (from server exchanges) and GET (browser redirect) for convenience
app.post('/auth/apple', (req, res) => {
  const { code, return_url } = req.body || {};
  const ret = return_url || DEFAULT_DEEP_LINK || DEFAULT_APP_LINK;
  console.log('[POST] /auth/apple received code:', code, ' return_url:', ret);
  if (!code) return res.status(400).json({ error: 'missing code' });
  // redirect with code in query
  return res.redirect(302, `${ret}?code=${encodeURIComponent(code)}`);
});

app.get('/auth/apple/callback', (req, res) => {
  const { code, state, return_url } = req.query || {};
  const ret = return_url || DEFAULT_DEEP_LINK || DEFAULT_APP_LINK;
  console.log('[GET] /auth/apple/callback received code:', code, ' state:', state, ' return_url:', ret);
  if (!code) return res.redirect(`${ret}?error=missing_code`);
  return res.redirect(302, `${ret}?code=${encodeURIComponent(code)}${state ? '&state=' + encodeURIComponent(state) : ''}`);
});

app.get('/', (req, res) => {
  res.send('Apple Sign-In Server v2 - Express. See /.well-known for AASA/AssetLinks.');
});

app.listen(PORT, () => {
  console.log('Server started on port', PORT);
  console.log('Serve .well-known at /.well-known/apple-app-site-association and /.well-known/assetlinks.json');
});
