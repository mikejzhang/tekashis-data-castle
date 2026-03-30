import { useState } from "react";
import type { InventoryItem, JudgeVerdict } from "./types/game-types";

type AppPhase = "drafting" | "planning" | "judging" | "results";

interface StartRoundResponse {
  obstacle: string;
  items: InventoryItem[];
}

interface JudgeResponse {
  judges: JudgeVerdict[];
}

export default function App() {
  const [phase, setPhase] = useState<AppPhase>("drafting");
  const [obstacle, setObstacle] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState("");
  const [judges, setJudges] = useState<JudgeVerdict[]>([]);
  const [loadingRound, setLoadingRound] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const selectedItem = items.find((item) => item.id === selectedItemId) ?? null;

  async function startRound() {
    setLoadingRound(true);
    setErrorMessage("");
    setJudges([]);
    setStrategy("");
    setSelectedItemId(null);
    setPhase("drafting");

    try {
      const response = await fetch("/api/start-round");
      if (!response.ok) {
        throw new Error("Failed to fetch round data.");
      }

      const data = (await response.json()) as StartRoundResponse;
      setObstacle(data.obstacle);
      setItems(data.items);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
      setErrorMessage(message);
    } finally {
      setLoadingRound(false);
    }
  }

  async function submitStrategy() {
    if (!selectedItemId || !strategy.trim() || !obstacle) {
      return;
    }

    setPhase("judging");
    setErrorMessage("");

    try {
      const response = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedItemId,
          userStrategy: strategy,
          obstacle,
        }),
      });

      if (!response.ok) {
        throw new Error("Judging request failed.");
      }

      const data = (await response.json()) as JudgeResponse;
      setJudges(data.judges);
      setPhase("results");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unexpected error occurred.";
      setErrorMessage(message);
      setPhase("planning");
    }
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-6xl px-4 py-10 text-white md:px-8">
      <header className="mb-8 text-center">
        <h1 className="font-display text-5xl text-castle-gold drop-shadow md:text-7xl">
          Takeshi&apos;s Data Castle
        </h1>
        <p className="mt-3 text-sm uppercase tracking-[0.3em] text-amber-200">
          AI-Powered Survival Showdown
        </p>
        <button
          type="button"
          onClick={startRound}
          disabled={loadingRound}
          className="mt-6 flex items-center justify-center gap-2 mx-auto rounded-2xl bg-castle-red px-8 py-3 font-display text-2xl text-white shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingRound ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              AI Generating Obstacle...
            </>
          ) : (
            "Start New Round"
          )}
        </button>
      </header>

      {errorMessage ? (
        <div className="mb-6 rounded-2xl border-2 border-red-400 bg-red-900/50 px-4 py-3 text-center text-red-100">
          {errorMessage}
        </div>
      ) : null}

      {obstacle ? (
        <section className="mb-8 rounded-3xl border-4 border-castle-gold bg-gradient-to-r from-castle-red to-castle-crimson p-6 shadow-show">
          <p className="text-center text-xs uppercase tracking-[0.3em] text-amber-100">
            Current Obstacle
          </p>
          <p className="mt-3 text-center text-xl font-semibold leading-relaxed md:text-2xl">
            {obstacle}
          </p>
        </section>
      ) : null}

      {phase === "drafting" && items.length > 0 ? (
        <section>
          <h2 className="mb-4 font-display text-4xl text-castle-gold">Phase 1: Pick Your Item</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => {
              const isSelected = item.id === selectedItemId;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedItemId(item.id)}
                  className={`rounded-2xl border-4 p-4 text-left transition ${
                    isSelected
                      ? "border-castle-gold bg-castle-navy shadow-show"
                      : "border-slate-600 bg-slate-900/80 hover:border-castle-red"
                  }`}
                >
                  <p className="font-display text-2xl">{item.name}</p>
                  <p className="mt-2 text-sm text-slate-200">{item.description}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setPhase("planning")}
              disabled={!selectedItemId}
              className="rounded-2xl bg-gradient-to-r from-castle-navy to-blue-700 px-8 py-3 font-display text-2xl text-castle-gold shadow-card disabled:cursor-not-allowed disabled:opacity-50"
            >
              Continue to Strategy
            </button>
          </div>
        </section>
      ) : null}

      {phase === "planning" ? (
        <section className="rounded-3xl border-4 border-blue-500/50 bg-slate-900/90 p-6">
          <h2 className="font-display text-4xl text-castle-gold">Phase 2: Write Your Survival Strategy</h2>
          {selectedItem ? (
            <p className="mt-2 text-amber-200">
              Selected item: <span className="font-semibold">{selectedItem.name}</span>
            </p>
          ) : null}
          <textarea
            value={strategy}
            onChange={(event) => setStrategy(event.target.value)}
            rows={6}
            placeholder="Describe your glorious, ridiculous plan..."
            className="mt-4 w-full rounded-2xl border-2 border-slate-600 bg-slate-950/80 px-4 py-3 text-base text-white placeholder:text-slate-400 focus:border-castle-gold focus:outline-none"
          />
          <button
            type="button"
            onClick={submitStrategy}
            disabled={!strategy.trim()}
            className="mt-4 rounded-2xl bg-gradient-to-r from-castle-red to-rose-500 px-8 py-3 font-display text-2xl text-white shadow-card disabled:cursor-not-allowed disabled:opacity-50"
          >
            Submit to Judges
          </button>
        </section>
      ) : null}

      {phase === "judging" ? (
        <section className="rounded-3xl border-4 border-castle-gold bg-slate-900/90 p-12 text-center shadow-show animate-pulse">
          <div className="mx-auto mb-6 h-16 w-16 animate-spin rounded-full border-4 border-castle-gold border-t-transparent border-b-transparent" />
          <p className="font-display text-4xl text-castle-gold">AI Judges are evaluating your fate...</p>
          <p className="mt-4 text-amber-200/80 uppercase tracking-widest text-sm">Please wait while the panel reviews your strategy</p>
        </section>
      ) : null}

      {phase === "results" ? (
        <section>
          <h2 className="mb-4 text-center font-display text-5xl text-castle-gold">Phase 3: Judge Verdict</h2>
          <div className="grid gap-5 md:grid-cols-3">
            {judges.map((judge, index) => (
              <article
                key={`${judge.name}-${index}`}
                className="rounded-3xl border-4 border-castle-gold/40 bg-gradient-to-br from-castle-navy to-blue-900 p-5 shadow-card transition hover:-translate-y-1"
              >
                <p className="font-display text-3xl">{judge.name}</p>
                <p className="text-xs uppercase tracking-widest text-amber-200">{judge.persona}</p>
                <p className="mt-3 min-h-24 text-sm leading-relaxed text-slate-100">{judge.comment}</p>
                <p className="mt-4 font-display text-4xl text-castle-gold">
                  {judge.score}
                  <span className="text-xl text-amber-200">/10</span>
                </p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}