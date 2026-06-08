"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = {
  x: number;
  y: number;
};

const TAU = Math.PI * 2;
const SUN_CORE = "rgb(255, 224, 116)";
const SUN_EDGE = "rgb(255, 135, 62)";

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function wrap(value: number, period: number): number {
  const r = value % period;
  return r < 0 ? r + period : r;
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function strokePath(
  ctx: CanvasRenderingContext2D,
  color: string,
  alpha: number,
  width: number,
): void {
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function bezierPoint(a: Point, b: Point, c: Point, d: Point, p: number): Point {
  const q = 1 - p;
  return {
    x: q * q * q * a.x + 3 * q * q * p * b.x + 3 * q * p * p * c.x + p * p * p * d.x,
    y: q * q * q * a.y + 3 * q * q * p * b.y + 3 * q * p * p * c.y + p * p * p * d.y,
  };
}

function drawSun(
  ctx: CanvasRenderingContext2D,
  sun: Point,
  radius: number,
  t: number,
): void {
  glow(ctx, sun.x, sun.y, radius * 2.5, SUN_EDGE, 0.18);
  glow(ctx, sun.x, sun.y, radius * 1.45, SUN_CORE, 0.22);

  ctx.save();
  ctx.translate(sun.x, sun.y);
  ctx.strokeStyle = SUN_EDGE;
  ctx.lineWidth = Math.max(1, radius * 0.025);
  for (let i = 0; i < 18; i += 1) {
    const a = (i / 18) * TAU + t * 0.16;
    const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i * 0.9);
    const r0 = radius * (1.04 + pulse * 0.04);
    const r1 = radius * (1.22 + pulse * 0.16);
    ctx.globalAlpha = 0.16 + pulse * 0.2;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * r0, Math.sin(a) * r0);
    ctx.lineTo(Math.cos(a) * r1, Math.sin(a) * r1);
    ctx.stroke();
  }
  ctx.restore();

  const g = ctx.createRadialGradient(sun.x, sun.y, 0, sun.x, sun.y, radius);
  g.addColorStop(0, "rgb(255, 248, 188)");
  g.addColorStop(0.58, SUN_CORE);
  g.addColorStop(1, SUN_EDGE);
  ctx.fillStyle = g;
  ctx.globalAlpha = 0.94;
  ctx.beginPath();
  ctx.arc(sun.x, sun.y, radius, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = "rgba(255, 246, 194, 0.55)";
  ctx.lineWidth = Math.max(1, radius * 0.028);
  ctx.beginPath();
  ctx.arc(sun.x - radius * 0.12, sun.y - radius * 0.08, radius * 0.42, 0.15, 2.85);
  ctx.stroke();
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  earth: Point,
  radius: number,
  accent: string,
  accent2: string,
  aurora: number,
): void {
  glow(ctx, earth.x, earth.y, radius * 2.2, accent, 0.12);
  const g = ctx.createRadialGradient(
    earth.x - radius * 0.35,
    earth.y - radius * 0.35,
    0,
    earth.x,
    earth.y,
    radius * 1.2,
  );
  g.addColorStop(0, "rgba(225, 246, 255, 0.96)");
  g.addColorStop(0.45, accent);
  g.addColorStop(1, "rgba(4, 24, 58, 0.9)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(earth.x, earth.y, radius, 0, TAU);
  ctx.fill();

  ctx.beginPath();
  ctx.arc(earth.x - radius * 0.18, earth.y + radius * 0.12, radius * 0.55, -0.25, 1.8);
  strokePath(ctx, accent2, 0.22, Math.max(1, radius * 0.04));

  ctx.save();
  ctx.translate(earth.x, earth.y - radius * 0.63);
  ctx.rotate(-0.22);
  ctx.shadowColor = accent2;
  ctx.shadowBlur = radius * 0.9 * aurora;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.7, radius * 0.24, 0, 0, TAU);
  strokePath(ctx, accent2, 0.22 + aurora * 0.48, Math.max(1, radius * 0.065));
  ctx.shadowBlur = 0;
  ctx.beginPath();
  ctx.ellipse(0, 0, radius * 0.48, radius * 0.15, 0, 0, TAU);
  strokePath(ctx, "white", aurora * 0.34, Math.max(0.8, radius * 0.026));
  ctx.restore();
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 3.1, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const sun: Point = { x: w * 0.16, y: h * 0.52 };
        const earth: Point = { x: w * 0.8, y: h * 0.52 };
        const sunR = Math.max(34, minSide * 0.12);
        const earthR = Math.max(15, minSide * 0.046);
        const cmePhase = wrap(t * 0.18, 1);
        const cme = smooth01(cmePhase / 0.18) * (1 - smooth01((cmePhase - 0.46) / 0.26));
        const aurora = 0.5 + 0.5 * Math.sin(t * 2.1) + cme * 0.45;

        ctx.fillStyle = "rgba(1, 7, 18, 0.18)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 36; i += 1) {
          glow(
            ctx,
            rnd(i + 3.8) * w,
            rnd(i + 88.1) * h,
            1.8 + rnd(i + 192.6) * 3.2,
            i % 6 === 0 ? accent : accent2,
            0.018,
          );
        }

        drawSun(ctx, sun, sunR, t);

        const lineCount = 7;
        for (let i = 0; i < lineCount; i += 1) {
          const k = i - (lineCount - 1) / 2;
          const offset = k * minSide * 0.037;
          const start: Point = { x: sun.x + sunR * 0.86, y: sun.y + offset * 0.42 };
          const end: Point = { x: earth.x - earthR * 1.65, y: earth.y + offset * 0.32 };
          const c1: Point = {
            x: lerp(start.x, end.x, 0.3),
            y: start.y + offset * 1.1 + Math.sin(t * 0.32 + i) * minSide * 0.015,
          };
          const c2: Point = {
            x: lerp(start.x, end.x, 0.72),
            y: end.y - offset * 0.8 + Math.cos(t * 0.28 + i) * minSide * 0.013,
          };

          ctx.beginPath();
          ctx.moveTo(start.x, start.y);
          ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, end.x, end.y);
          strokePath(ctx, i % 2 === 0 ? accent : accent2, 0.12 + cme * 0.07, 0.9);

          const headP = wrap(t * (0.06 + i * 0.004) + rnd(i + 22.2), 1);
          const tail = bezierPoint(start, c1, c2, end, clamp01(headP - 0.045));
          const head = bezierPoint(start, c1, c2, end, headP);
          glow(ctx, head.x, head.y, 13, accent, 0.06 + cme * 0.04);
          ctx.beginPath();
          ctx.moveTo(tail.x, tail.y);
          ctx.lineTo(head.x, head.y);
          strokePath(ctx, "white", 0.24 + cme * 0.18, 1.1);
        }

        for (let i = 0; i < 58; i += 1) {
          const progress = wrap(rnd(i + 41.5) + t * (0.045 + rnd(i + 8.8) * 0.035), 1);
          const sway = (rnd(i + 55.4) - 0.5) * minSide * 0.18;
          const x = lerp(sun.x + sunR * 1.05, earth.x - earthR * 1.9, progress);
          const curve = Math.sin(progress * Math.PI * 1.2 + rnd(i + 4.2) * TAU) * minSide * 0.035;
          const y = sun.y + sway * (0.25 + progress * 0.45) + curve;
          const fade = smooth01(progress / 0.1) * (1 - smooth01((progress - 0.96) / 0.04));
          const r = 1.2 + rnd(i + 12.4) * 1.9 + cme * 0.7;
          glow(ctx, x, y, r * 4.8, i % 5 === 0 ? accent2 : accent, 0.04 * fade);
          ctx.beginPath();
          ctx.arc(x, y, r, 0, TAU);
          ctx.fillStyle = i % 7 === 0 ? "white" : accent;
          ctx.globalAlpha = (0.24 + rnd(i + 7.1) * 0.34) * fade;
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        if (cme > 0.02) {
          const burstR = sunR * (1.2 + cmePhase * 4.8);
          const burstX = sun.x + burstR * 0.52;
          glow(ctx, burstX, sun.y, burstR * 0.42, SUN_EDGE, cme * 0.12);
          ctx.save();
          ctx.strokeStyle = SUN_EDGE;
          ctx.lineWidth = Math.max(1, minSide * 0.005);
          ctx.globalAlpha = cme * 0.34;
          for (let i = 0; i < 4; i += 1) {
            ctx.beginPath();
            ctx.ellipse(
              sun.x + burstR * (0.36 + i * 0.05),
              sun.y,
              burstR * (0.28 + i * 0.08),
              burstR * (0.12 + i * 0.035),
              0.04,
              -0.8,
              0.8,
            );
            ctx.stroke();
          }
          ctx.restore();
        }

        ctx.beginPath();
        ctx.ellipse(earth.x - earthR * 0.9, earth.y, earthR * 2.25, earthR * 1.22, 0, -1.35, 1.35);
        strokePath(ctx, accent, 0.18 + cme * 0.1, 1);
        ctx.beginPath();
        ctx.ellipse(earth.x + earthR * 0.95, earth.y, earthR * 2.8, earthR * 0.9, 0, 1.42, 4.86);
        strokePath(ctx, accent2, 0.1, 1);

        drawEarth(ctx, earth, earthR, accent, accent2, clamp01(aurora));

        const panelW = Math.min(98, w * 0.2);
        const panelH = Math.min(58, h * 0.18);
        const panelX = w - panelW - 22;
        const panelY = 18;
        const kp = clamp01((2.6 + 2.5 * (0.5 + 0.5 * Math.sin(t * 0.74)) + cme * 3.2) / 9);

        ctx.fillStyle = "rgba(3, 10, 26, 0.34)";
        ctx.strokeStyle = accent2;
        ctx.globalAlpha = 0.5;
        ctx.beginPath();
        ctx.roundRect(panelX, panelY, panelW, panelH, 7);
        ctx.fill();
        ctx.globalAlpha = 0.22;
        ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = "white";
        ctx.font = `${Math.max(10, minSide * 0.024)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.globalAlpha = 0.58;
        ctx.fillText("Kp", panelX + 11, panelY + 18);
        ctx.globalAlpha = 1;

        const bars = 7;
        const gap = panelW * 0.025;
        const barW = (panelW * 0.64 - gap * (bars - 1)) / bars;
        const baseY = panelY + panelH - 12;
        for (let i = 0; i < bars; i += 1) {
          const u = (i + 1) / bars;
          const bh = panelH * 0.42 * u;
          const bx = panelX + panelW * 0.28 + i * (barW + gap);
          ctx.fillStyle = u <= kp ? (i > 4 ? SUN_EDGE : accent) : "rgba(255,255,255,0.18)";
          ctx.globalAlpha = u <= kp ? 0.78 : 0.38;
          ctx.fillRect(bx, baseY - bh, barW, bh);
        }
        ctx.globalAlpha = 1;
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
