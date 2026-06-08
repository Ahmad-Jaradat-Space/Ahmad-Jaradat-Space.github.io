"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Posterior = {
  startMean: number;
  endMean: number;
  startSigma: number;
  endSigma: number;
  color: string;
  alpha: number;
};

const TAU = Math.PI * 2;

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function easeOutCubic(value: number): number {
  const x = clamp01(value);
  return 1 - (1 - x) * (1 - x) * (1 - x);
}

function wrap(value: number, period: number): number {
  const r = value % period;
  return r < 0 ? r + period : r;
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function bell(x: number, mean: number, sigma: number): number {
  const z = (x - mean) / sigma;
  return Math.exp(-0.5 * z * z);
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

function drawCurve(
  ctx: CanvasRenderingContext2D,
  posterior: Posterior,
  settle: number,
  left: number,
  right: number,
  base: number,
  height: number,
): void {
  const mean = lerp(posterior.startMean, posterior.endMean, settle);
  const sigma = lerp(posterior.startSigma, posterior.endSigma, settle);
  const width = right - left;
  const amp = height * lerp(0.34, 0.72, settle) * (0.08 / sigma) ** 0.22;
  const steps = 116;

  ctx.save();
  ctx.beginPath();
  ctx.moveTo(left, base);
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const x = left + u * width;
    const y = base - bell(u, mean, sigma) * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(right, base);
  ctx.closePath();
  ctx.fillStyle = posterior.color;
  ctx.globalAlpha = posterior.alpha * 0.16;
  ctx.fill();

  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const x = left + u * width;
    const y = base - bell(u, mean, sigma) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.shadowColor = posterior.color;
  ctx.shadowBlur = 12;
  strokePath(ctx, posterior.color, posterior.alpha, 1.6);
  ctx.shadowBlur = 0;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const x = left + u * width;
    const y = base - bell(u, mean, sigma) * amp;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  strokePath(ctx, "white", posterior.alpha * 0.16, 0.8);
  ctx.restore();
}

function drawCredibleBand(
  ctx: CanvasRenderingContext2D,
  mean: number,
  sigma: number,
  left: number,
  right: number,
  top: number,
  base: number,
  height: number,
  color: string,
): void {
  const width = right - left;
  const ci0 = clamp01(mean - sigma * 1.96);
  const ci1 = clamp01(mean + sigma * 1.96);
  const x0 = left + ci0 * width;
  const x1 = left + ci1 * width;
  const band = ctx.createLinearGradient(x0, 0, x1, 0);
  band.addColorStop(0, "rgba(0,0,0,0)");
  band.addColorStop(0.5, color);
  band.addColorStop(1, "rgba(0,0,0,0)");

  ctx.save();
  ctx.fillStyle = band;
  ctx.globalAlpha = 0.09;
  ctx.fillRect(x0, top, x1 - x0, base - top);
  ctx.globalAlpha = 0.24;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1;
  ctx.setLineDash([4, 7]);
  ctx.beginPath();
  ctx.moveTo(x0, top);
  ctx.lineTo(x0, base);
  ctx.moveTo(x1, top);
  ctx.lineTo(x1, base);
  ctx.stroke();
  ctx.setLineDash([]);

  const amp = height * 0.72 * (0.08 / sigma) ** 0.22;
  const steps = 44;
  ctx.beginPath();
  ctx.moveTo(x0, base);
  for (let i = 0; i <= steps; i += 1) {
    const u = ci0 + ((ci1 - ci0) * i) / steps;
    const x = left + u * width;
    const y = base - bell(u, mean, sigma) * amp;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(x1, base);
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.13;
  ctx.fill();
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  color: string,
  alpha: number,
): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced: Boolean(reduced), staticT: 5.9, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const left = w * 0.12;
        const right = w * 0.9;
        const top = h * 0.15;
        const base = h * 0.78;
        const plotH = base - top;
        const phase = wrap(t * 0.13, 1);
        const build = phase < 0.72 ? easeOutCubic(phase / 0.72) : 1;
        const resetFade = phase > 0.88 ? 1 - smooth01((phase - 0.88) / 0.12) : 1;
        const settle = build * resetFade;
        const labelSize = Math.max(10, minSide * 0.028);
        const mainMean = lerp(0.38, 0.51, settle);
        const mainSigma = lerp(0.22, 0.058, settle);
        const estimate =
          lerp(0.28, 0.51, easeOutCubic(settle)) +
          Math.sin(t * 2.2) * (1 - settle) * 0.025;

        ctx.fillStyle = "rgba(1, 7, 18, 0.13)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 26; i += 1) {
          glow(
            ctx,
            rnd(i + 212.8) * w,
            rnd(i + 19.4) * h,
            2 + rnd(i + 441.5) * 4.5,
            i % 5 === 0 ? "white" : i % 2 === 0 ? accent : accent2,
            0.014,
          );
        }

        ctx.font = `${labelSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textBaseline = "alphabetic";

        ctx.save();
        ctx.strokeStyle = accent2;
        ctx.globalAlpha = 0.09;
        ctx.lineWidth = 1;
        for (let i = 0; i <= 4; i += 1) {
          const y = top + (plotH * i) / 4;
          ctx.beginPath();
          ctx.moveTo(left, y);
          ctx.lineTo(right, y);
          ctx.stroke();
        }
        for (let i = 0; i <= 6; i += 1) {
          const x = left + ((right - left) * i) / 6;
          ctx.beginPath();
          ctx.moveTo(x, top);
          ctx.lineTo(x, base + plotH * 0.03);
          ctx.stroke();
        }
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(left, top);
        ctx.lineTo(left, base);
        ctx.lineTo(right, base);
        strokePath(ctx, "white", 0.3, 1.1);

        drawCredibleBand(ctx, mainMean, mainSigma, left, right, top, base, plotH, accent);

        const curves: Posterior[] = [
          {
            startMean: 0.38,
            endMean: 0.51,
            startSigma: 0.22,
            endSigma: 0.058,
            color: accent,
            alpha: 0.88,
          },
          {
            startMean: 0.58,
            endMean: 0.54,
            startSigma: 0.2,
            endSigma: 0.08,
            color: accent2,
            alpha: 0.6,
          },
          {
            startMean: 0.47,
            endMean: 0.49,
            startSigma: 0.27,
            endSigma: 0.07,
            color: "white",
            alpha: 0.34,
          },
        ];

        for (const curve of curves) {
          drawCurve(ctx, curve, settle, left, right, base, plotH);
        }

        const estimateX = left + clamp01(estimate) * (right - left);
        const estimateY =
          base - bell(clamp01(estimate), mainMean, mainSigma) * plotH * 0.72 * (0.08 / mainSigma) ** 0.22;

        ctx.save();
        ctx.shadowColor = accent;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = accent;
        ctx.globalAlpha = 0.76;
        ctx.lineWidth = 1.35;
        ctx.beginPath();
        ctx.moveTo(estimateX, top + plotH * 0.07);
        ctx.lineTo(estimateX, base + plotH * 0.04);
        ctx.stroke();
        ctx.shadowBlur = 0;
        ctx.setLineDash([3, 6]);
        ctx.strokeStyle = "white";
        ctx.globalAlpha = 0.28;
        ctx.beginPath();
        ctx.moveTo(estimateX + 6, top + plotH * 0.09);
        ctx.lineTo(estimateX + 6, base);
        ctx.stroke();
        ctx.setLineDash([]);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(estimateX, estimateY, Math.max(2.4, minSide * 0.008), 0, TAU);
        ctx.fill();
        ctx.restore();

        glow(ctx, estimateX, estimateY, minSide * 0.055, accent, 0.12);

        drawLabel(ctx, "posterior", left + (right - left) * 0.58, top + plotH * 0.17, "white", 0.54);
        drawLabel(ctx, "95% CI", left + (right - left) * 0.43, base + labelSize * 1.7, accent2, 0.58);
        drawLabel(ctx, "estimate", estimateX + labelSize * 0.8, top + plotH * 0.12, accent, 0.55);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
