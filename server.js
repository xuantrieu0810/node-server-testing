const express = require("express");
const path = require("path");
const axios = require("axios");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const DEFAULT_APP_LINK =
  process.env.DEFAULT_APP_LINK || `${req.protocol}://${req.get("host")}`;
const DEFAULT_DEEP_LINK = process.env.DEFAULT_DEEP_LINK || "myapp://callback";

// OAuth info from Google Cloud Console
const GG_CLIENT_ID = process.env.GG_CLIENT_ID;
const GG_CLIENT_SECRET = process.env.GG_CLIENT_SECRET;
const GG_REDIRECT_URI = process.env.GG_REDIRECT_URI;

app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(bodyParser.json());
// serve static .well-known files
app.use(
  "/.well-known",
  express.static(path.join(process.cwd(), "public", ".well-known"))
);

app.get("/version", (req, res) => res.json({ version: "1.1" }));

app.post("/google-login", async (req, res) => {
  try {
    const { code, redirect_uri } = req.body;
    if (!authorization_code) {
      return res.status(400).json({ error: "Missing authorization_code" });
    }

    // Exchange code to get tokens
    const tokenResponse = await axios.post(
      "https://oauth2.googleapis.com/token",
      null,
      {
        params: {
          client_id: GG_CLIENT_ID,
          client_secret: GG_CLIENT_SECRET,
          code: code,
          grant_type: "authorization_code",
          redirect_uri: redirect_uri || GG_REDIRECT_URI,
        },
      }
    );

    const tokenData = tokenResponse.data;

    if (!tokenData.access_token) {
      return res
        .status(400)
        .json({ error: "Token exchange failed", details: tokenData });
    }
    // Query database to validate user
    // If valid, generate new access token and
    // save refresh token to database associated with the user
    const userAccessToken = "GENERATED_USER_ACCESS_TOKEN"; // Replace with actual token generation logic
    res.token = userAccessToken;
    res
      .status(200)
      .json({ access_token: userAccessToken, google_tokens: tokenData });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({
      error: "Internal Server Error",
      details: err.response?.data || err.message,
    });
  }
});

app.post("/callbacks/auth/apple_dev", (req, res) => {
  console.log("[POST] /callbacks/auth/apple_dev received:", req.body);
  const { code, state, id_token: idToken, user } = req.body || {};
  if (!code) return res.status(400).json({ error: "missing code" });

  const url = `${req.protocol}://${req.get(
    "host"
  )}/app/callback?code=${encodeURIComponent(code)}${
    idToken ? "&id_token=" + encodeURIComponent(idToken) : ""
  }${state ? "&state=" + encodeURIComponent(state) : ""}${
    user ? "&user=" + encodeURIComponent(user) : ""
  }`;
  console.log("[POST] /callbacks/auth/apple_dev redirect:", url);
  return res.redirect(302, url);
});

app.post("/callbacks/auth/apple_alpha", (req, res) => {
  console.log("[POST] /callbacks/auth/apple_alpha received:", req.body);
  const { code, state, id_token: idToken, user } = req.body || {};
  const ret = DEFAULT_APP_LINK || DEFAULT_DEEP_LINK;
  if (!code) return res.status(400).json({ error: "missing code" });

  return res.redirect(
    302,
    `${ret}/app/callback?code=${encodeURIComponent(code)}${
      idToken ? "&id_token=" + encodeURIComponent(idToken) : ""
    }${state ? "&state=" + encodeURIComponent(state) : ""}${
      user ? "&user=" + encodeURIComponent(user) : ""
    }`
  );
});

app.post("/callbacks/auth/apple", (req, res) => {
  console.log("[POST] /callbacks/auth/apple_alpha received:", req.body);
  const { code, state, id_token: idToken, user } = req.body || {};
  const ret = DEFAULT_APP_LINK || DEFAULT_DEEP_LINK;
  if (!code) return res.status(400).json({ error: "missing code" });

  return res.redirect(
    302,
    `${ret}?code=${encodeURIComponent(code)}${
      idToken ? "&id_token=" + encodeURIComponent(idToken) : ""
    }${state ? "&state=" + encodeURIComponent(state) : ""}${
      user ? "&user=" + encodeURIComponent(user) : ""
    }`
  );
});

app.get("/", (_, res) => {
  res.send(
    "Apple Sign-In Server v2 - Express. See /.well-known/apple-app-site-association and /.well-known/assetlinks.json"
  );
});

app.listen(PORT, () => {
  console.log("Server started on port", PORT);
  console.log(
    "Serve .well-known at /.well-known/apple-app-site-association and /.well-known/assetlinks.json"
  );
});
