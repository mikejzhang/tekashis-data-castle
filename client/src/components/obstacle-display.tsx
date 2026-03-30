interface ObstacleDisplayProps {
  obstacle: string;
  headline?: string;
}

export function ObstacleDisplay({ obstacle, headline }: ObstacleDisplayProps) {
  return (
    <section className="relative overflow-hidden rounded-3xl border-4 border-castle-gold bg-gradient-to-br from-castle-red via-rose-600 to-castle-crimson p-1 shadow-show">
      <div className="rounded-[1.35rem] bg-slate-950/40 px-6 py-8 backdrop-blur-sm md:px-10 md:py-10">
        <p className="mb-3 text-center font-display text-4xl tracking-[0.2em] text-castle-gold drop-shadow-md md:text-5xl">
          障害
        </p>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.35em] text-amber-100/90">
          Current Obstacle
        </p>
        {headline ? (
          <p className="mt-4 text-center text-sm italic text-amber-50/80">
            News spark: {headline}
          </p>
        ) : null}
        <p className="mt-6 text-center font-body text-lg font-semibold leading-relaxed text-white md:text-xl">
          {obstacle}
        </p>
        <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-yellow-300/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-blue-500/20 blur-3xl" />
      </div>
    </section>
  );
}
