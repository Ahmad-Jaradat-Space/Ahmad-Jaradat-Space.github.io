"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const easeOutCubic = (value: number) => 1 - (1 - value) ** 3;

function medianY(mid: number, height: number, u: number): number {
  return mid - height * (0.13 * u) + Math.sin(u * Math.PI * 1.35) * height * 0.035;
}

function observedY(mid: number, height: number, u: number): number {
  const taper = u * u;
  const endOffset =
    Math.sin(Math.PI * 2.8 + 0.35) * height * 0.045 +
    Math.sin(Math.PI * 6.2) * height * 0.018 -
    height * 0.085;
  const raw =
    mid +
    Math.sin(u * Math.PI * 2.8 + 0.35) * height * 0.045 +
    Math.sin(u * Math.PI * 6.2) * height * 0.018 -
    height * 0.085 * taper;
  return raw - endOffset * taper;
}

function forecastSpread(height: number, u: number, multiplier: number): number {
  return height * 0.18 * Math.sqrt(clamp01(u)) * multiplier;
}

function drawBand(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  mid: number,
  height: number,
  multiplier: number,
  color: string,
  alpha: number,
): void {
  const steps = 54;
  const span = toX - fromX;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const spread = forecastSpread(height, u, multiplier);
    const x = fromX + span * u;
    const y = medianY(mid, height, u) - spread;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  for (let i = steps; i >= 0; i -= 1) {
    const u = i / steps;
    const spread = forecastSpread(height, u, multiplier);
    ctx.lineTo(fromX + span * u, medianY(mid, height, u) + spread);
  }
  ctx.closePath();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = alpha * 1.8;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
}

function drawBandLabel(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  mid: number,
  height: number,
  multiplier: number,
  label: string,
  color: string,
  u: number,
): void {
  const span = toX - fromX;
  const x = fromX + span * u;
  const y = medianY(mid, height, u) - forecastSpread(height, u, multiplier) + 12;
  ctx.save();
  ctx.font = "600 10px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.78;
  ctx.fillText(label, x + 4, y);
  ctx.restore();
}

function drawMedian(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  mid: number,
  height: number,
  color: string,
): void {
  const steps = 64;
  const span = toX - fromX;
  ctx.save();
  ctx.setLineDash([7, 8]);
  ctx.lineWidth = 1.35;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.72;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const x = fromX + span * u;
    const y = medianY(mid, height, u);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawObserved(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  nowX: number,
  mid: number,
  height: number,
  color: string,
): void {
  const steps = 48;
  const span = nowX - fromX;
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = color;
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const x = fromX + span * u;
    const y = observedY(mid, height, u);
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawSamplePaths(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  toX: number,
  mid: number,
  height: number,
  color: string,
): void {
  const steps = 42;
  const span = toX - fromX;
  ctx.save();
  ctx.lineWidth = 0.9;
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.16;
  for (let path = 0; path < 7; path += 1) {
    const bias = (rnd(path + 4) - 0.5) * height * 0.045;
    ctx.beginPath();
    for (let i = 0; i <= steps; i += 1) {
      const u = i / steps;
      const horizon = Math.sqrt(u);
      const x = fromX + span * u;
      const wave =
        Math.sin(u * Math.PI * (1.3 + rnd(path + 14) * 1.8) + rnd(path + 24) * 6.2) *
        height *
        0.055 *
        horizon;
      const drift = (rnd(path + 34) - 0.5) * height * 0.2 * u;
      const y = medianY(mid, height, u) + bias * horizon + wave + drift;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const left = w * 0.09;
  const right = w * 0.92;
  const nowX = w * 0.39;
  const top = h * 0.15;
  const bottom = h * 0.84;
  const mid = h * 0.57;
  const height = Math.max(90, h);
  const phase = (t % 6.8) / 6.8;
  const reveal = phase < 0.32 ? easeOutCubic(clamp01(phase / 0.32)) : 1;
  const revealX = left + (right - left) * reveal;

  ctx.fillStyle = "rgba(2, 8, 10, 0.2)";
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.strokeStyle = "rgba(210, 255, 232, 0.08)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 4; i += 1) {
    const y = top + ((bottom - top) * i) / 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  ctx.restore();

  ctx.save();
  ctx.beginPath();
  ctx.rect(0, 0, revealX + w * 0.035, h);
  ctx.clip();

  drawBand(ctx, nowX, right, mid, height, 1.48, accent2, 0.06);
  drawBand(ctx, nowX, right, mid, height, 0.9, accent, 0.095);
  drawBand(ctx, nowX, right, mid, height, 0.48, accent, 0.16);
  drawSamplePaths(ctx, nowX, right, mid, height, accent2);
  drawMedian(ctx, nowX, right, mid, height, accent);
  drawBandLabel(ctx, nowX, right, mid, height, 0.48, "50%", accent, 0.5);
  drawBandLabel(ctx, nowX, right, mid, height, 0.9, "80%", accent, 0.66);
  drawBandLabel(ctx, nowX, right, mid, height, 1.48, "95%", accent2, 0.82);
  drawObserved(ctx, left, nowX, mid, height, accent);

  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.42;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 7]);
  ctx.beginPath();
  ctx.moveTo(nowX, top);
  ctx.lineTo(nowX, bottom);
  ctx.stroke();
  ctx.restore();

  glow(ctx, nowX, observedY(mid, height, 1), w * 0.045, accent, 0.2);
  ctx.restore();

  if (reveal < 1) {
    const head = ctx.createLinearGradient(revealX - w * 0.045, 0, revealX + w * 0.04, 0);
    head.addColorStop(0, "rgba(0,0,0,0)");
    head.addColorStop(0.55, accent);
    head.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = head;
    ctx.globalAlpha = 0.12;
    ctx.fillRect(revealX - w * 0.05, top * 0.55, w * 0.095, bottom - top * 0.1);
    glow(ctx, revealX, mid, w * 0.07, accent, 0.1);
  }
}

export default function ForecastFanFigure({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return mountCanvas2D(
      canvas,
      { active, reduced: Boolean(reduced), staticT: 2.7, speed: 0.016 },
      ({ ctx, w, h }, t) => drawFrame(ctx, w, h, t, accent, accent2),
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
