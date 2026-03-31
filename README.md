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
🌱 The-Diome

""Live Demo" (https://img.shields.io/badge/Live-Demo-green?style=for-the-badge&logo=google-chrome)" (https://the-biome-313680272624.asia-south1.run.app/)
""GitHub Repo" (https://img.shields.io/badge/Repository-View-blue?style=for-the-badge&logo=github)" (https://github.com/alanjoyes7/sustainable-future)
""Built with Google AI" (https://img.shields.io/badge/Powered%20by-Google%20AI-orange?style=for-the-badge&logo=google)"
""Deployed on Cloud Run" (https://img.shields.io/badge/Deploy-Google%20Cloud%20Run-4285F4?style=for-the-badge&logo=google-cloud)"

---

📌 Problem Statement

The world is facing increasing environmental challenges such as climate change, unsustainable resource usage, and lack of awareness about eco-friendly practices. Many individuals and organizations struggle to understand their environmental impact and take actionable steps toward sustainability.

---

💡 Project Description

The-Diome is an AI-powered web platform that promotes sustainable living by providing intelligent, personalized insights and recommendations.

🔧 How it works

- Users input lifestyle or environmental data
- The system processes the data using AI
- Generates smart, personalized sustainability recommendations
- Provides actionable insights for better decision-making

🚀 Why it’s useful

- 🌍 Encourages eco-friendly habits
- 🤖 Uses AI for personalized suggestions
- ⚡ Simple and intuitive interface
- 📊 Helps users understand their environmental impact

---

🧠 Google AI Usage

🛠️ Tools / Models Used

- Google AI Studio
- Gemini API (if used, else remove)
- Google Cloud Run

⚙️ How Google AI Was Used

- Integrated Google AI to analyze user input in real-time
- Generates intelligent sustainability recommendations
- Provides contextual insights using AI models
- Enhances user interaction with smart responses

---

📸 Proof of Google AI Usage

📂 Add screenshots inside "/proof" folder:

- AI Proof Screenshot

---

🖼️ Screenshots

Add your screenshots here

- Screenshot1
- Screenshot2

---

🎥 Demo Video

📺 Watch Demo (max 3 min):
Add your Google Drive link here

---

⚙️ Installation Steps

# Clone the repository
git clone https://github.com/alanjoyes7/sustainable-future.git

# Navigate into the project
cd sustainable-future

# Install dependencies
npm install

# Start the development server
npm start

---

🏗️ Tech Stack

- Frontend: HTML / CSS / JavaScript (or React if used)
- Backend: Node.js
- AI: Google AI Studio / Gemini
- Deployment: Google Cloud Run

---

🌍 Future Scope

- 📱 Mobile application
- 🌐 Real-time environmental data integration
- 👥 Community-driven sustainability tracking
- 📊 Advanced analytics dashboard

---

👨‍💻 Contributors

- "Alan Joyes" (https://github.com/alanjoyes7)
- (Add your name)

---

⭐ Support

If you like this project, give it a ⭐ on GitHub!
