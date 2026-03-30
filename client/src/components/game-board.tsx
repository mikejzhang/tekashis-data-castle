import { useCallback, useMemo, useState } from "react";
import type { GamePhase, InventoryItem, JudgeVerdict } from "../types/game-types";
import { InventoryDraft } from "./inventory-draft";
import { JudgePanel } from "./judge-panel";
import { ObstacleDisplay } from "./obstacle-display";
import { StrategyInput } from "./strategy-input";

export function GameBoard() {
  const [phase, setPhase] = useState<GamePhase>("drafting");
  const [loadingRound, setLoadingRound] = useState(false);
  const [loadingJudge, setLoadingJudge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [headline, setHeadline] = useState("");
  const [obstacle, setObstacle] = useState("");
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [strategy, setStrategy] = useState("");
  const [judges, setJudges] = useState<JudgeVerdict[]>([]);

  const selectedItem = useMemo(
    () => items.find((i) => i.id === selectedId) ?? null,
    [items, selectedId]
  );

  const startRound = useCallback(async () => {
    setLoadingRound(true);
    setError(null);
    setJudges([]);
    setStrategy("");
    setSelectedId(null);
    setHeadline("");
    setPhase("drafting");
    try {
      const res = await fetch("/api/start-round");
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as {
        headline?: string;
        obstacle: string;
        items: InventoryItem[];
      };
      setHeadline(data.headline ?? "");
      setObstacle(data.obstacle);
      setItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load round");
    } finally {
      setLoadingRound(false);
    }
  }, []);

  const goToPlanning = () => {
    if (!selectedId) return;
    setPhase("planning");
  };

  const submitToJudges = async () => {
    if (!selectedId || !strategy.trim()) return;
    setLoadingJudge(true);
    setError(null);
    try {
      const res = await fetch("/api/judge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId: selectedId,
          userStrategy: strategy,
          obstacle,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { judges: JudgeVerdict[] };
      setJudges(data.judges);
      setPhase("judging");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Judging failed");
    } finally {
      setLoadingJudge(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <header className="mb-10 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.5em] text-castle-gold">
          AI-Powered Game Show
        </p>
        <h1 className="mt-2 font-display text-5xl text-white drop-shadow-lg md:text-7xl">
          Takeshi&apos;s Data Castle
        </h1>
        <p className="mx-auto mt-4 max-w-2xl text-base text-slate-300 md:text-lg">
          Absurd obstacles. Weirder inventory. Three judges who definitely have
          opinions. Survive the castle!
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={startRound}
            disabled={loadingRound}
            className="rounded-2xl bg-castle-gold px-8 py-3 font-display text-2xl tracking-wide text-castle-midnight shadow-card transition hover:brightness-110 disabled:opacity-60"
          >
            {loadingRound ? "Loading…" : "New Round"}
          </button>
        </div>
      </header>

      {error ? (
        <div
          role="alert"
          className="mb-8 rounded-2xl border-2 border-red-400 bg-red-950/80 px-4 py-3 text-center text-red-100"
        >
          {error}
        </div>
      ) : null}

      {obstacle ? (
        <div className="space-y-10">
          <ObstacleDisplay obstacle={obstacle} headline={headline || undefined} />

          {phase === "drafting" ? (
            <>
              <InventoryDraft
                items={items}
                selectedId={selectedId}
                onSelect={setSelectedId}
                disabled={loadingRound}
              />
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={goToPlanning}
                  disabled={!selectedId}
                  className="rounded-2xl bg-gradient-to-r from-castle-navy to-blue-800 px-10 py-4 font-display text-2xl text-castle-gold shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Lock in item → Plan
                </button>
              </div>
            </>
          ) : null}

          {phase === "planning" ? (
            <StrategyInput
              value={strategy}
              onChange={setStrategy}
              onSubmit={submitToJudges}
              disabled={loadingJudge}
              selectedItemName={selectedItem?.name ?? null}
            />
          ) : null}

          {phase === "judging" && judges.length > 0 ? (
            <JudgePanel judges={judges} />
          ) : null}
        </div>
      ) : (
        <p className="text-center text-slate-400">
          Press <strong className="text-castle-gold">New Round</strong> to fetch an
          obstacle and five random items from the database.
        </p>
      )}
    </div>
  );
}
