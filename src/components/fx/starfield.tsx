"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

type Star = { x: number; y: number; r: number; phase: number };

/**
 * Twinkling starfield canvas for the hero scene. Draws one static frame under
 * prefers-reduced-motion, pauses while the tab is hidden, and caps DPR at 2.
 */
export function Starfield({ className }: { className?: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const stars: Star[] = Array.from({ length: 110 }, () => ({
      x: Math.random(),
      y: Math.random(),
      r: 0.4 + Math.random() * 0.9,
      phase: Math.random() * Math.PI * 2,
    }));

    let raf = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    function draw(t: number) {
      if (!canvas || !ctx) return;
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = "oklch(0.9 0.02 290)";
      for (const s of stars) {
        ctx.globalAlpha = reduced
          ? 0.45
          : 0.25 + 0.35 * Math.sin(t / 1400 + s.phase);
        ctx.beginPath();
        ctx.arc(s.x * width, s.y * height, s.r * dpr, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    function loop(t: number) {
      draw(t);
      raf = requestAnimationFrame(loop);
    }

    const ro = new ResizeObserver(() => {
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      if (reduced) draw(0);
    });
    ro.observe(canvas);

    function onVisibility() {
      if (reduced) return;
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(loop);
    }

    if (!reduced) raf = requestAnimationFrame(loop);
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    />
  );
}
