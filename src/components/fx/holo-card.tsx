"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { rarityIsFoil } from "@/lib/format";

/**
 * Pointer-tracked 3D tilt with a cursor-following glare, plus a rainbow foil
 * layer for foil-tier rarities. No React state — rAF-batched CSS custom
 * property writes only, and fully inert on touch / reduced-motion devices.
 * Children pass through as server-rendered content.
 */
export function HoloCard({
  rarity,
  className,
  maxTilt = 10,
  children,
}: {
  rarity?: string | null;
  className?: string;
  maxTilt?: number;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const off = useRef(false);
  const raf = useRef(0);

  useEffect(() => {
    off.current =
      matchMedia("(prefers-reduced-motion: reduce)").matches ||
      matchMedia("(hover: none)").matches;
    return () => cancelAnimationFrame(raf.current);
  }, []);

  function onPointerMove(e: React.PointerEvent) {
    if (off.current) return;
    cancelAnimationFrame(raf.current);
    const { clientX, clientY } = e;
    raf.current = requestAnimationFrame(() => {
      const el = ref.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const px = (clientX - r.left) / r.width;
      const py = (clientY - r.top) / r.height;
      el.style.setProperty("--rx", `${((0.5 - py) * maxTilt).toFixed(2)}deg`);
      el.style.setProperty(
        "--ry",
        `${((px - 0.5) * maxTilt * 1.2).toFixed(2)}deg`,
      );
      el.style.setProperty("--mx", `${(px * 100).toFixed(1)}%`);
      el.style.setProperty("--my", `${(py * 100).toFixed(1)}%`);
    });
  }

  function onPointerLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty("--rx", "0deg");
    el.style.setProperty("--ry", "0deg");
  }

  return (
    <div
      ref={ref}
      onPointerMove={onPointerMove}
      onPointerLeave={onPointerLeave}
      className={cn(
        "group/holo relative transition-transform duration-200 ease-out will-change-transform [transform:perspective(900px)_rotateX(var(--rx,0deg))_rotateY(var(--ry,0deg))]",
        className,
      )}
    >
      {children}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 mix-blend-soft-light transition-opacity duration-300 group-hover/holo:opacity-100 dark:mix-blend-plus-lighter"
        style={{
          background:
            "radial-gradient(28rem circle at var(--mx,50%) var(--my,50%), oklch(1 0 0 / 30%), transparent 45%)",
        }}
      />
      {rarityIsFoil(rarity) && (
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-0 mix-blend-overlay transition-opacity duration-300 group-hover/holo:opacity-60 dark:mix-blend-color-dodge dark:group-hover/holo:opacity-45"
          style={{
            background:
              "linear-gradient(115deg, var(--holo-cyan) 0%, var(--holo-violet) 25%, var(--holo-magenta) 50%, var(--holo-gold) 75%, var(--holo-cyan) 100%)",
            backgroundSize: "220% 220%",
            backgroundPosition: "var(--mx,50%) var(--my,50%)",
          }}
        />
      )}
    </div>
  );
}
