const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 3000;
const DEFAULT_APP_LINK =
  process.env.DEFAULT_APP_LINK || `${req.protocol}://${req.get("host")}`;
const DEFAULT_DEEP_LINK = process.env.DEFAULT_DEEP_LINK || "myapp://callback";

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

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
    "[GET] /mock-apple/auth received code:",
    code,
    " state:",
    state,
    " idToken:",
    idToken,
    " user:",
    user
  );
  if (!code || !idToken)
    return res.status(400).json({ error: "[Mock] missing code or idToken" });

  // Create HTML form to auto-submit POST request
  const formHTML = `
    <html>
      <body>
        <form id="appleForm" method="POST" action="${ret}">
          <input type="hidden" name="code" value="${code}" />
          <input type="hidden" name="id_token" value="${idToken}" />
          ${
            state ? `<input type="hidden" name="state" value="${state}" />` : ""
          }
          ${user ? `<input type="hidden" name="user" value="${user}" />` : ""}
        </form>
        <script>
          document.getElementById('appleForm').submit();
        </script>
      </body>
    </html>
  `;

  return res.send(formHTML);
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
