import type { JudgeVerdict } from "../types/game-types";

interface JudgePanelProps {
  judges: JudgeVerdict[];
}

const ACCENTS = [
  "from-castle-red/90 to-castle-crimson",
  "from-castle-navy to-blue-900",
  "from-amber-500/90 to-orange-700",
];

export function JudgePanel({ judges }: JudgePanelProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-center font-display text-4xl text-castle-gold md:text-5xl">
        審判の結果
      </h2>
      <p className="text-center text-sm uppercase tracking-[0.3em] text-amber-200/90">
        The verdict is in
      </p>
      <div className="grid gap-6 md:grid-cols-3">
        {judges.map((judge, i) => (
          <article
            key={judge.name}
            className={`flex flex-col rounded-3xl border-4 border-castle-gold/40 bg-gradient-to-br p-6 shadow-card ${ACCENTS[i % ACCENTS.length]}`}
          >
            <p className="font-display text-2xl text-white drop-shadow-sm">
              {judge.name}
            </p>
            <p className="mt-1 text-xs font-bold uppercase tracking-widest text-amber-100/90">
              {judge.persona}
            </p>
            <p className="mt-4 flex-1 font-body text-sm leading-relaxed text-white/95">
              {judge.comment}
            </p>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-black/25 px-4 py-3">
              <span className="text-xs font-semibold uppercase text-amber-100">
                Score
              </span>
              <span className="font-display text-4xl text-castle-gold">
                {judge.score}
                <span className="text-lg text-amber-200/80">/10</span>
              </span>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
