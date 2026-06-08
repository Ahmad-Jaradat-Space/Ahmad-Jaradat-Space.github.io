/** Shared helpers for the chapter figures (Canvas 2D). */

export interface FigureProps {
  accent: string;
  accent2: string;
  /** animate when true (in view); draw a single static frame when false */
  active: boolean;
}

export const fill = {
  position: "absolute" as const,
  inset: 0,
  width: "100%",
  height: "100%",
};

export interface Canvas2DEnv {
  ctx: CanvasRenderingContext2D;
  w: number;
  h: number;
}

/**
 * Mounts a DPR-aware, resize-observing 2D canvas loop. `frame` is called every
 * tick with the live dimensions and an accumulating time `t`. When inactive or
 * the user prefers reduced motion, a single frozen frame is drawn at `staticT`.
 * Returns a cleanup function for the effect.
 */
export function mountCanvas2D(
  canvas: HTMLCanvasElement,
  opts: { active: boolean; reduced: boolean; staticT: number; speed?: number },
  frame: (env: Canvas2DEnv, t: number) => void,
): () => void {
  const ctx = canvas.getContext("2d");
  if (!ctx) return () => {};
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  let w = 0;
  let h = 0;
  let raf = 0;
  let t = 0;

  const build = () => {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    canvas.width = Math.max(1, Math.floor(w * dpr));
    canvas.height = Math.max(1, Math.floor(h * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  build();
  const ro = new ResizeObserver(build);
  ro.observe(canvas);

  const render = () => {
    if (w <= 0 || h <= 0) return;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.shadowBlur = 0;
    frame({ ctx, w, h }, t);
    ctx.globalAlpha = 1;
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;
  };

  const loop = () => {
    t += opts.speed ?? 0.016;
    render();
    raf = requestAnimationFrame(loop);
  };

  if (opts.reduced || !opts.active) {
    t = opts.staticT;
    render();
  } else {
    loop();
  }

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
  };
}

/** A soft radial glow blob — the workhorse for luminous points and halos. */
export function glow(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  color: string,
  alpha: number,
): void {
  if (
    radius <= 0 ||
    !Number.isFinite(x) ||
    !Number.isFinite(y) ||
    !Number.isFinite(radius)
  ) {
    return;
  }
  const g = ctx.createRadialGradient(x, y, 0, x, y, radius);
  g.addColorStop(0, color);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.globalAlpha = alpha;
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 1;
}

/** Deterministic 0..1 hash for stable per-element randomness (no Math.random). */
export function rnd(seed: number): number {
  return Math.abs(Math.sin(seed * 12.9898 + 4.1357) * 43758.5453) % 1;
}
