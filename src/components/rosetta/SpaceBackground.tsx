"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

type Star = { x: number; y: number; r: number; p: number; s: number; c: string };

/** Fixed deep-space starfield + drifting parallax. Sits behind everything. */
export function SpaceBackground({ accent }: { accent: string }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    let w = 0;
    let h = 0;
    let raf = 0;
    let t = 0;
    let stars: Star[] = [];

    const build = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.floor((w * h) / 5200);
      stars = Array.from({ length: n }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        r: Math.random() * 1.25 + 0.2,
        p: Math.random() * Math.PI * 2,
        s: Math.random() * 0.7 + 0.2,
        c: Math.random() < 0.08 ? accent : Math.random() < 0.5 ? "#cdd9ec" : "#9fb2cc",
      }));
    };
    build();
    const onResize = () => build();
    window.addEventListener("resize", onResize);

    const draw = () => {
      ctx.clearRect(0, 0, w, h);
      for (const st of stars) {
        const tw = reduced ? 0.7 : 0.45 + 0.55 * Math.sin(t * st.s + st.p);
        ctx.globalAlpha = 0.15 + tw * 0.7;
        ctx.fillStyle = st.c;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    };
    const loop = () => {
      t += 0.02;
      draw();
      raf = requestAnimationFrame(loop);
    };
    if (reduced) draw();
    else loop();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
    };
  }, [accent, reduced]);

  return (
    <div className="r-space" aria-hidden>
      <canvas ref={ref} className="r-space-stars" />
      <div className="r-space-nebula" />
      <div className="r-space-glow" />
    </div>
  );
}
