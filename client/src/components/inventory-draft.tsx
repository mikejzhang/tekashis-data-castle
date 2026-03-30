import type { InventoryItem } from "../types/game-types";

interface InventoryDraftProps {
  items: InventoryItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  disabled?: boolean;
}

export function InventoryDraft({
  items,
  selectedId,
  onSelect,
  disabled,
}: InventoryDraftProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h2 className="font-display text-3xl tracking-wide text-castle-gold md:text-4xl">
          Gear Draft
        </h2>
        <span className="rounded-full bg-slate-800 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-amber-200">
          Pick one weird tool
        </span>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item) => {
          const active = item.id === selectedId;
          return (
            <button
              key={item.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelect(item.id)}
              className={`group text-left rounded-2xl border-4 p-4 transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-castle-gold/60 ${
                active
                  ? "border-castle-gold bg-gradient-to-br from-castle-navy to-slate-900 shadow-card scale-[1.02]"
                  : "border-slate-600/80 bg-slate-900/80 hover:border-castle-red/80 hover:shadow-lg"
              } ${disabled ? "opacity-60" : ""}`}
            >
              <p className="font-display text-xl text-white group-hover:text-castle-gold">
                {item.name}
              </p>
              <p className="mt-2 text-sm text-slate-300">{item.description}</p>
              <p className="mt-3 inline-block rounded-full bg-castle-red/30 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-rose-100">
                Weirdness Lv {item.weirdness_level}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
}
