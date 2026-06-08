"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type PlotPoint = {
  x: number;
  y: number;
};

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function easeOutCubic(value: number): number {
  const x = clamp01(value);
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function toPlot(
  x: number,
  y: number,
  left: number,
  top: number,
  width: number,
  height: number,
): PlotPoint {
  return {
    x: left + x * width,
    y: top + (1 - y) * height,
  };
}

function scintillationFit(x: number): number {
  const baseline = clamp01(x);
  return 0.13 + 0.78 * (1 - Math.exp(-2.65 * Math.pow(baseline, 5 / 6)));
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

export default function Component({ accent, accent2, active }: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 4.4, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const left = w * 0.14;
        const right = w * 0.9;
        const top = h * 0.15;
        const bottom = h * 0.82;
        const plotW = right - left;
        const plotH = bottom - top;
        const settle = easeOutCubic(t * 0.44);
        const shimmer = 0.5 + 0.5 * Math.sin(t * 0.85);
        const labelSize = Math.max(10, minSide * 0.026);

        ctx.fillStyle = "rgba(1, 7, 18, 0.16)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 28; i += 1) {
          const sx = rnd(i + 220.4) * w;
          const sy = rnd(i + 604.7) * h;
          const r = 2.5 + rnd(i + 12.7) * 4.5;
          glow(ctx, sx, sy, r, i % 4 === 0 ? accent : accent2, 0.018);
        }

        ctx.font = `${labelSize}px ui-sans-serif, system-ui, sans-serif`;

        for (let i = 0; i <= 5; i += 1) {
          const u = i / 5;
          const gx = left + plotW * u;
          const gy = top + plotH * u;

          ctx.beginPath();
          ctx.moveTo(gx, top);
          ctx.lineTo(gx, bottom);
          strokePath(ctx, accent2, i === 0 ? 0.2 : 0.08, 1);

          ctx.beginPath();
          ctx.moveTo(left, gy);
          ctx.lineTo(right, gy);
          strokePath(ctx, accent2, i === 5 ? 0.2 : 0.08, 1);
        }

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, bottom);
        ctx.lineTo(right, bottom);
        strokePath(ctx, "white", 0.38, 1.15);

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left - 4, top + 10);
        ctx.moveTo(left, top);
        ctx.lineTo(left + 4, top + 10);
        ctx.moveTo(right, bottom);
        ctx.lineTo(right - 10, bottom - 4);
        ctx.moveTo(right, bottom);
        ctx.lineTo(right - 10, bottom + 4);
        strokePath(ctx, "white", 0.28, 1);

        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.44;
        ctx.fillText("scintillation index", left - labelSize * 4.6, top + labelSize * 0.65);
        ctx.fillText("projected baseline", right - labelSize * 6.25, bottom + labelSize * 1.45);
        ctx.globalAlpha = 1;

        const tickCount = 5;
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.24;
        for (let i = 0; i < tickCount; i += 1) {
          const u = i / (tickCount - 1);
          const tx = left + plotW * u;
          const ty = bottom + labelSize * 1.1;
          ctx.fillText(i === 0 ? "0" : `${i}`, tx - labelSize * 0.35, ty);
        }
        ctx.globalAlpha = 1;

        const fitAlpha = 0.2 + settle * (0.5 + shimmer * 0.08);

        ctx.beginPath();
        for (let i = 0; i <= 84; i += 1) {
          const u = 0.04 + (i / 84) * 0.92;
          const p = toPlot(u, scintillationFit(u), left, top, plotW, plotH);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        ctx.shadowColor = accent;
        ctx.shadowBlur = 14 + settle * 12;
        strokePath(ctx, accent, fitAlpha, 2);
        ctx.shadowBlur = 0;

        ctx.beginPath();
        for (let i = 0; i <= 84; i += 1) {
          const u = 0.04 + (i / 84) * 0.92;
          const p = toPlot(u, scintillationFit(u), left, top, plotW, plotH);
          if (i === 0) ctx.moveTo(p.x, p.y);
          else ctx.lineTo(p.x, p.y);
        }
        strokePath(ctx, "white", 0.1 + settle * 0.14, 0.75);

        const count = 42;
        for (let i = 0; i < count; i += 1) {
          const baseX = (i + 0.5) / count;
          const targetX = clamp01(baseX + (rnd(i + 9.2) - 0.5) * 0.024);
          const structure = Math.sin(targetX * Math.PI * 5.4 + rnd(i + 18.4) * 1.2) * 0.018;
          const targetY = clamp01(
            scintillationFit(targetX) +
              structure +
              (rnd(i + 31.8) - 0.5) * (0.066 - settle * 0.026),
          );
          const startX = clamp01(baseX + (rnd(i + 156.3) - 0.5) * 0.28);
          const startY = 0.14 + rnd(i + 74.6) * 0.72;
          const ownDelay = rnd(i + 400.1) * 0.42;
          const arrive = smooth01((settle - ownDelay * 0.36) / 0.82);
          const px = lerp(startX, targetX, arrive);
          const py = lerp(startY, targetY, arrive);
          const point = toPlot(px, py, left, top, plotW, plotH);
          const radius = 1.55 + rnd(i + 88.5) * 1.45;
          const emphasis = 0.42 + rnd(i + 18.1) * 0.28;

          glow(ctx, point.x, point.y, radius * 5.4, accent, 0.045 * arrive);
          ctx.beginPath();
          ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
          ctx.fillStyle = i % 7 === 0 ? "white" : i % 3 === 0 ? accent2 : accent;
          ctx.globalAlpha = 0.18 + emphasis * (0.35 + arrive * 0.6);
          ctx.fill();
          ctx.globalAlpha = 1;
        }

        const label = toPlot(0.55, 0.74, left, top, plotW, plotH);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.56 + settle * 0.16;
        ctx.fillText("p = 11/3", label.x, label.y);
        ctx.globalAlpha = 1;
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
