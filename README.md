apple-signin-server-v2
======================

Simple Express-based server to handle Apple Sign-In callback and serve App Links files.

Files:
- server.js: Express server (start with `npm start`)
- public/.well-known/apple-app-site-association: iOS AASA file
- public/.well-known/assetlinks.json: Android Digital Asset Links
- .env.example: example env vars (DEFAULT_APP_LINK, DEFAULT_DEEP_LINK)
- Dockerfile: optional container build

Quick start (local):
1. Copy .env.example -> .env (edit if needed)
2. npm install
3. npm start
4. Test:
   curl "http://localhost:8080/auth/apple/callback?code=TEST123&return_url=myapp://callback" -v
   You should get a 302 redirect to myapp://callback?code=TEST123

Deploy to Render:
1. Create a new Web Service on Render, connect your repo or upload this project.
2. Start command: npm start
3. Render provides HTTPS domain; verify:
   https://<your-render-domain>/.well-known/apple-app-site-association
   https://<your-render-domain>/.well-known/assetlinks.json

Notes:
- Replace the placeholder SHA256 fingerprint and TEAMID with your real values before production.
- This project currently only logs the authorization code and redirects it. Implement token exchange with Apple when you have credentials.
