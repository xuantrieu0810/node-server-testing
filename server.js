// server.js - Express server for Apple Sign-In callback (v2)
// - Serves /.well-known/apple-app-site-association (iOS)
// - Serves /.well-known/assetlinks.json (Android)
// - POST /auth/apple  (body: { code, return_url? }) - logs code and redirects to return_url or DEFAULT_APP_LINK
// - GET /auth/apple/callback (for browser-based redirects) supports query params
//
// By default this version only logs the authorization code and redirects it.
// Provide real Apple credentials and token-exchange logic later if needed.
//
const express = require("express");
const path = require("path");
const fs = require("fs");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 8080;
const DEFAULT_APP_LINK =
  process.env.DEFAULT_APP_LINK || `${req.protocol}://${req.get("host")}`;
const DEFAULT_DEEP_LINK = process.env.DEFAULT_DEEP_LINK || "myapp://callback";

app.use(bodyParser.json());
// serve static .well-known files
app.use(
  "/.well-known",
  express.static(path.join(process.cwd(), "public", ".well-known"))
);

app.get("/health", (req, res) => res.json({ ok: true }));

app.get("/mock-apple/auth", (req, res) => {
  const { code, state, id_token: idToken, user, return_url } = req.query || {};
  const ret =
    return_url || `${req.protocol}://${req.get("host")}/callbacks/auth/apple`;
  console.log(
    "[GET] /auth/mock-apple received code:",
    code,
    " state:",
    state,
    " idToken:",
    idToken,
    " user:",
    user
  );
  if (!code || !idToken)
    return res.status(400).json({ error: "missing code or idToken" });

  return res.redirect(
    302,
    `${ret}?code=${encodeURIComponent(code)}&id_token=${encodeURIComponent(
      idToken
    )}${state ? "&state=" + encodeURIComponent(state) : ""}${
      user ? "&user=" + encodeURIComponent(user) : ""
    }`
  );
});

app.get("/callbacks/auth/apple", (req, res) => {
  const { code, state, id_token: idToken, user, return_url } = req.query || {};
  const ret = DEFAULT_APP_LINK || DEFAULT_DEEP_LINK;
  console.log(
    "[GET] /callbacks/auth/apple received:",
    code,
    " state:",
    state,
    " idToken:",
    idToken,
    " user:",
    user
  );
  if (!code || !idToken)
    return res.status(400).json({ error: "missing code or idToken" });

  return res.redirect(
    302,
    `${ret}?code=${encodeURIComponent(code)}&id_token=${encodeURIComponent(
      idToken
    )}${state ? "&state=" + encodeURIComponent(state) : ""}${
      user ? "&user=" + encodeURIComponent(user) : ""
    }`
  );
});

app.get("/", (req, res) => {
  res.send(
    "Apple Sign-In Server v2 - Express. See /.well-known for AASA/AssetLinks."
  );
});

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
  console.log(
    "Serve .well-known at /.well-known/apple-app-site-association and /.well-known/assetlinks.json"
  );
});
