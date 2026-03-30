interface StrategyInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
  selectedItemName?: string | null;
}

export function StrategyInput({
  value,
  onChange,
  onSubmit,
  disabled,
  selectedItemName,
}: StrategyInputProps) {
  return (
    <div className="rounded-3xl border-4 border-blue-500/50 bg-slate-900/90 p-6 shadow-show md:p-8">
      <h2 className="font-display text-3xl text-castle-gold md:text-4xl">
        Battle Plan
      </h2>
      {selectedItemName ? (
        <p className="mt-2 text-sm text-slate-300">
          Using:{" "}
          <span className="font-semibold text-amber-200">{selectedItemName}</span>
        </p>
      ) : null}
      <label className="mt-4 block">
        <span className="sr-only">Your strategy</span>
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          rows={5}
          placeholder="How will you use your item to beat the obstacle? Go absurd. Go loud."
          className="mt-2 w-full resize-y rounded-2xl border-2 border-slate-600 bg-slate-950/80 px-4 py-3 font-body text-base text-slate-100 placeholder:text-slate-500 focus:border-castle-gold focus:outline-none focus:ring-2 focus:ring-castle-gold/40 disabled:opacity-60"
        />
      </label>
      <button
        type="button"
        onClick={onSubmit}
        disabled={disabled || !value.trim()}
        className="mt-5 w-full rounded-2xl bg-gradient-to-r from-castle-red to-rose-500 px-6 py-4 font-display text-2xl tracking-wide text-white shadow-card transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Face the Judges!
      </button>
    </div>
  );
}
