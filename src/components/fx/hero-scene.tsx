import { CardSilhouette } from "@/components/fx/card-silhouette";
import { Starfield } from "@/components/fx/starfield";

/**
 * The hero's 3D backdrop: nebula gradients, twinkling starfield, a gliding
 * perspective grid floor, five floating card silhouettes, and a god-ray.
 * Purely decorative — the host section needs `relative isolate`.
 */
export function HeroScene() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 -z-10 overflow-hidden [perspective:1100px]"
    >
      {/* Nebula */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(52rem 30rem at 50% -12%, var(--scene-glow), transparent 70%), radial-gradient(38rem 24rem at 82% 8%, color-mix(in oklab, var(--holo-magenta) 7%, transparent), transparent 65%), radial-gradient(34rem 22rem at 12% 20%, color-mix(in oklab, var(--holo-cyan) 7%, transparent), transparent 65%)",
        }}
      />

      {/* Starfield */}
      <Starfield className="absolute inset-0 opacity-25 dark:opacity-100" />

      {/* Grid floor — the inner layer glides exactly one 72px cell per loop */}
      <div
        className="absolute -inset-x-40 bottom-[-38%] h-[75%] origin-bottom overflow-hidden [transform:rotateX(62deg)]"
        style={{
          maskImage: "linear-gradient(to top, black 30%, transparent 92%)",
        }}
      >
        <div
          className="fx-motion absolute inset-x-0 -top-[72px] bottom-0 [animation:grid-glide_26s_linear_infinite]"
          style={{
            backgroundImage:
              "linear-gradient(var(--grid-line) 1px, transparent 1px), linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)",
            backgroundSize: "72px 72px",
          }}
        />
      </div>

      {/* Floating card silhouettes */}
      <div className="absolute inset-0 [transform-style:preserve-3d]">
        <CardSilhouette
          style={{
            left: "8%",
            top: "18%",
            width: "8.5rem",
            transform: "rotateX(10deg) rotateY(-18deg)",
          }}
        />
        <CardSilhouette
          style={{
            right: "10%",
            top: "12%",
            width: "10rem",
            transform: "rotateX(6deg) rotateY(16deg)",
            animationDelay: "-3s",
          }}
        />
        <CardSilhouette
          className="hidden lg:block"
          style={{
            left: "24%",
            top: "6%",
            width: "5.5rem",
            opacity: 0.5,
            animationDelay: "-6s",
          }}
        />
        <CardSilhouette
          className="hidden lg:block"
          style={{
            left: "16%",
            bottom: "14%",
            width: "7rem",
            opacity: 0.7,
            transform: "rotateX(12deg) rotateY(-10deg)",
            animationDelay: "-2s",
          }}
        />
        <CardSilhouette
          className="hidden lg:block"
          style={{
            right: "20%",
            bottom: "10%",
            width: "7rem",
            opacity: 0.7,
            transform: "rotateX(8deg) rotateY(14deg)",
            animationDelay: "-7s",
          }}
        />
      </div>

      {/* God-ray */}
      <div
        className="absolute -top-1/3 left-1/2 h-[120%] w-[55rem] -translate-x-1/2 opacity-50 blur-[40px] dark:opacity-100 dark:mix-blend-plus-lighter"
        style={{
          background:
            "conic-gradient(from 190deg at 50% 0%, transparent 42%, color-mix(in oklab, var(--holo-violet) 12%, transparent) 48%, color-mix(in oklab, var(--holo-cyan) 10%, transparent) 52%, transparent 58%)",
        }}
      />
    </div>
  );
}
