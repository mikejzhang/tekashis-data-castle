# Takeshi's Data Castle 🏰

An AI-powered, full-stack survival gauntlet where players must use randomized inventory items to navigate dynamic, generative obstacles based on real-world news. Built using React, Express, PostgreSQL, and the Google Gemini Ecosystem.

## ✨ Features

* **Dynamic World-Building:** Fetches live global headlines via NewsAPI and synthesizes them into absurd, context-aware game show obstacles using Gemini 2.5 Flash.
* **Imagen Visual Synthesis:** Dynamically generates 1:1 photorealistic, high-fidelity UI assets for every obstacle on the fly, streamed directly to the frontend via a transient Base64 data pipeline.
* **Multi-Persona AI Evaluation:** Player strategies are graded by a prompt-engineered panel of three distinct AI personas (Master Takeshi, Chaos-Chan, and The Logic Bot) to simulate subjective game show judging while mathematically smoothing variance.
* **Hybrid Mock-Live Architecture:** Features a dual-layer orchestration strategy. If API quotas are exceeded or network outages occur, the backend seamlessly hot-swaps to a local mock dataset, ensuring zero downtime and a flawless review experience.
* **5-Round Gauntlet:** A strict React state machine orchestrates the game loop, tracking progression, rendering immersive fallback states during AI latency, and preventing race conditions.

---

## 🏗️ Software Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React (Vite), TypeScript | State machine orchestration, Glassmorphic UI |
| **Styling** | Tailwind CSS | Dark-glass aesthetics, loading skeletons, responsive layout |
| **Backend** | Node.js, Express.js | API middleware, retry logic, prompt chaining |
| **Database** | PostgreSQL (Neon) | Immutable inventory corpus, randomized querying |
| **AI Integration** | `@google/generative-ai` | Text generation, prompt engineering, Imagen REST API |

---

## 🚀 Getting Started

Follow these instructions to run the application locally. 

### Prerequisites
* [Node.js](https://nodejs.org/) (v18+ recommended)
* A PostgreSQL database URI (or use the provided mock data layer)
* API Keys for [Google Gemini](https://aistudio.google.com/) and [NewsAPI](https://newsapi.org/)

### 1. Clone the Repository
```bash
git clone [https://github.com/your-username/takeshis-data-castle.git](https://github.com/your-username/takeshis-data-castle.git)
cd takeshis-data-castle
```

### 2. Environment Setup
Navigate to the `server` directory and create a `.env` file:
```bash
cd server
touch .env
```
Add the following variables to your `.env` file:
```env
PORT=5000
GEMINI_API_KEY=your_gemini_api_key_here
NEWS_API_KEY=your_news_api_key_here
DATABASE_URL=your_postgres_connection_string
```
*(Note: If API keys are omitted, the server will automatically default to the local Mock Architecture so the app remains fully interactive).*

### 3. Install Dependencies
You will need to install dependencies for both the frontend and backend. Open two terminal windows.

**Terminal 1 (Backend):**
```bash
cd server
npm install
npm start
```

**Terminal 2 (Frontend):**
```bash
cd client
npm install
npm run dev
```

### 4. Play the Game
Open your browser and navigate to `http://localhost:5173`.

---

## 🛠 Testing & QA Override
To rapidly test the 5-round progression loop without consuming LLM tokens or waiting on Image generation latency, a deterministic QA override has been built into the evaluation pipeline. 

When asked for a strategy, submit the following exact phrase:
> `CASTLE QA OVERRIDE: CLEAR THIS ROUND`

This will instantly bypass the Gemini evaluation, return perfect scores from the judges, and advance you to the next phase.

---

## 📐 Architecture
For a deep dive into the engineering trade-offs, multi-persona prompt strategies, and state-machine design patterns used in this application, please review the [DESIGN.md](./DESIGN.md) document.
