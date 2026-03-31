<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/29be90f8-f3f2-4c3e-841f-a9e651de2f23

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Set the required keys in `.env.local`
3. Run the app:
   `npm run dev`

## Deploy on Render

1. Push this repo to GitHub.
2. In Render, create a **Web Service** from the repo.
3. Use these settings:
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm start`
4. Add these environment variables in Render:
   - `GEMINI_API_KEY`
   - `VITE_FIREBASE_API_KEY`
   - `VITE_FIREBASE_AUTH_DOMAIN`
   - `VITE_FIREBASE_PROJECT_ID`
   - `VITE_FIREBASE_STORAGE_BUCKET`
   - `VITE_FIREBASE_MESSAGING_SENDER_ID`
   - `VITE_FIREBASE_APP_ID`
   - `VITE_FIREBASE_MEASUREMENT_ID`
   - `NODE_ENV=production`
5. In Firebase Console, add your Render domain to **Authentication > Authorized domains**.

The server now uses `process.env.PORT`, so it is ready for Render/Railway-style deployment.
