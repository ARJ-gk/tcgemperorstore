import { cn } from "@/lib/utils";

/**
 * Empty holo-card silhouette (5:7 glass plane with a gradient art window).
 * Decorative only — used by the hero scene, category-tile hover ghosts, and
 * empty states. `static` skips the float animation for fixed compositions.
 */
export function CardSilhouette({
  className,
  style,
  static: isStatic = false,
}: {
  className?: string;
  style?: React.CSSProperties;
  static?: boolean;
}) {
  return (
    <div
      aria-hidden
      style={style}
      className={cn(
        "absolute aspect-[5/7] rounded-[4.5%/3.2%] border border-[var(--glass-border)] bg-[var(--glass)] shadow-[0_25px_60px_-15px_var(--scene-glow)]",
        !isStatic && "fx-motion [animation:float-card_9s_ease-in-out_infinite]",
        className,
      )}
    >
      <div
        className="absolute inset-x-[7%] top-[7%] h-[55%] rounded-[inherit] opacity-20"
        style={{
          background:
            "linear-gradient(135deg, var(--holo-cyan), var(--holo-violet), var(--holo-magenta))",
        }}
      />
    </div>
  );
}
