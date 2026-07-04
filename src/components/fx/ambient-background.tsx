const GRAIN = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='120' height='120'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")",
};

/**
 * Per-page ambient scenery. Render as the first child of a page root that has
 * `relative isolate` — the -z-10 layer then stays inside that page's stacking
 * context and can never fight the sticky header or portal layers.
 * Static divs only: no JS, no animation, no backdrop-filter.
 */
export function AmbientBackground({
  variant = "glow",
}: {
  variant?: "glow" | "dots" | "aurora";
}) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"
    >
      {(variant === "glow" || variant === "aurora") && (
        <div
          className="absolute -top-40 left-1/2 h-[26rem] w-[42rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: "radial-gradient(closest-side, var(--scene-glow), transparent)",
          }}
        />
      )}
      {variant === "dots" && (
        <div className="bg-arena-dots absolute inset-0 opacity-40 [mask-image:linear-gradient(to_bottom,black,transparent_320px)]" />
      )}
      {variant === "aurora" && (
        <div
          className="absolute inset-0 opacity-60"
          style={{
            background:
              "linear-gradient(30deg, color-mix(in oklab, var(--holo-cyan) 6%, transparent), color-mix(in oklab, var(--holo-violet) 6%, transparent) 40%, transparent 65%)",
          }}
        />
      )}
      <div
        className="absolute inset-0 opacity-[0.035] dark:opacity-[0.05]"
        style={GRAIN}
      />
    </div>
  );
}
