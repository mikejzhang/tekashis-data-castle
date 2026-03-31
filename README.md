# Takeshi's Data Castle 🏰

An AI-powered, full-stack survival gauntlet where players must use randomized inventory items to navigate dynamic, generative obstacles based on real-world news. Built using React, Express, PostgreSQL, and the Google Gemini Ecosystem.

## ✨ Features

* **Headline-Driven Chaos:** Real-world global news headlines are instantly transformed into ridiculous, unpredictable game show obstacles. No two games are exactly alike.
* **Custom Visuals on the Fly:** Every new challenge generates a unique, photorealistic image in real-time, bringing the absurd situations to life right on your screen.
* **The AI Judging Panel:** After you submit your survival strategy, a panel of three distinct AI personalities, Master Takeshi (the boss), Chaos-Chan (the wildcard), and The Logic Bot (the analyst) will grade your creativity and logic. 
* **Unbreakable Gameplay:** The show must go on. Built-in offline fallbacks ensure the game remains fully playable even if live APIs or networks experience downtime.
* **The 5-Round Gauntlet:** Battle your way through five continuous rounds of escalating difficulty. Pick your items wisely, adapt to the news, and try to survive to the end.

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
