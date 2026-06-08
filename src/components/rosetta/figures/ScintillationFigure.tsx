"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = {
  x: number;
  y: number;
};

const TAU = Math.PI * 2;
const FRESNEL_KNEE = 0.36;

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

function scintillation(t: number): number {
  return (
    Math.sin(t * 2.7) * 0.34 +
    Math.sin(t * 5.8 + 1.4) * 0.24 +
    Math.sin(t * 12.6 + 0.5) * 0.12 +
    Math.sin(t * 19.4 + 2.1) * 0.06
  );
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

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length < 0.01) return;

  const ux = dx / length;
  const uy = dy / length;
  const head = Math.min(7, length * 0.18);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  strokePath(ctx, color, alpha, width);

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - ux * head - uy * head * 0.55, to.y - uy * head + ux * head * 0.55);
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - ux * head + uy * head * 0.55, to.y - uy * head - ux * head * 0.55);
  strokePath(ctx, color, alpha, width);
}

function drawSource(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radius: number,
  brightness: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  glow(ctx, p.x, p.y, radius * (6 + brightness * 2.4), accent, 0.12 + brightness * 0.12);
  glow(ctx, p.x, p.y, radius * (2.6 + brightness), "white", 0.08 + brightness * 0.14);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(t * 0.08);
  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(1, radius * 0.22);
  ctx.globalAlpha = 0.28 + brightness * 0.22;
  for (let i = 0; i < 6; i += 1) {
    const a = (i / 6) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 1.4, Math.sin(a) * radius * 1.4);
    ctx.lineTo(Math.cos(a) * radius * (3.2 + brightness), Math.sin(a) * radius * (3.2 + brightness));
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.92;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * (0.8 + brightness * 0.32), 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSolarWindScreen(
  ctx: CanvasRenderingContext2D,
  x: number,
  top: number,
  bottom: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const height = bottom - top;
  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.lineWidth = 1;
  for (let i = 0; i < 6; i += 1) {
    const offset = (i - 2.5) * 8;
    ctx.beginPath();
    for (let j = 0; j <= 42; j += 1) {
      const u = j / 42;
      const y = top + u * height;
      const wiggle =
        Math.sin(u * Math.PI * 4.5 + t * 1.1 + i * 0.7) * 6 +
        Math.sin(u * Math.PI * 9 + t * 0.55) * 2.4;
      const px = x + offset + wiggle;
      if (j === 0) ctx.moveTo(px, y);
      else ctx.lineTo(px, y);
    }
    strokePath(ctx, i % 2 === 0 ? accent : accent2, 0.12, 0.8);
  }

  for (let i = 0; i < 26; i += 1) {
    const u = wrap(rnd(i + 94.7) + t * (0.035 + rnd(i + 22.1) * 0.04), 1);
    const y = top + u * height;
    const px = x + (rnd(i + 10.6) - 0.5) * 55 + Math.sin(t * 0.9 + i) * 4;
    const fade = smooth01(u / 0.12) * (1 - smooth01((u - 0.92) / 0.08));
    glow(ctx, px, y, 5 + rnd(i + 3.5) * 7, i % 3 === 0 ? accent : accent2, fade * 0.035);
  }
  ctx.restore();
}

function drawSunCue(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radius: number,
  t: number,
): void {
  const color = "rgba(251, 191, 36, 0.95)";
  glow(ctx, p.x, p.y, radius * 4.6, color, 0.11);
  glow(ctx, p.x, p.y, radius * 2.2, "white", 0.06);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(t * 0.08);
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = Math.max(1, radius * 0.12);
  for (let i = 0; i < 10; i += 1) {
    const a = (i / 10) * TAU;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 1.35, Math.sin(a) * radius * 1.35);
    ctx.lineTo(Math.cos(a) * radius * 2.25, Math.sin(a) * radius * 2.25);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = color;
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawGroundTelescope(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  signal: number,
  accent: string,
  accent2: string,
): void {
  glow(ctx, p.x, p.y - size * 0.26, size * (1.4 + signal * 1.2), accent, 0.04 + signal * 0.09);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-0.72);
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.66;
  ctx.lineWidth = Math.max(1, size * 0.045);

  ctx.beginPath();
  ctx.moveTo(-size * 0.48, -size * 0.08);
  ctx.quadraticCurveTo(0, size * 0.24, size * 0.48, -size * 0.08);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.02);
  ctx.lineTo(0, -size * 0.36);
  ctx.lineTo(size * 0.28, size * 0.02);
  ctx.moveTo(0, size * 0.14);
  ctx.lineTo(0, size * 0.55);
  ctx.moveTo(-size * 0.25, size * 0.55);
  ctx.lineTo(size * 0.25, size * 0.55);
  ctx.stroke();

  ctx.shadowColor = accent;
  ctx.shadowBlur = size * signal;
  ctx.beginPath();
  ctx.arc(0, -size * 0.36, size * 0.06, 0, TAU);
  strokePath(ctx, "white", 0.46 + signal * 0.3, Math.max(1, size * 0.026));
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawTracePanel(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const base = top + height * 0.54;

  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.1;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = top + (height * i) / 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(left + width, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 5; i += 1) {
    const x = left + (width * i) / 5;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, top + height);
    ctx.stroke();
  }
  ctx.restore();

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, top + height);
  ctx.lineTo(left + width, top + height);
  strokePath(ctx, "white", 0.24, 1);

  const steps = 138;
  ctx.save();
  ctx.shadowColor = accent;
  ctx.shadowBlur = 12;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const age = (1 - u) * 7.4;
    const signal = scintillation(t * 1.7 - age);
    const y = base - signal * height * 0.33;
    const x = left + u * width;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  strokePath(ctx, accent, 0.84, 1.7);
  ctx.shadowBlur = 0;

  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const age = (1 - u) * 7.4;
    const signal = scintillation(t * 1.7 - age);
    const y = base - signal * height * 0.33;
    const x = left + u * width;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  strokePath(ctx, "white", 0.12, 0.75);
  ctx.restore();

  const cursorX = left + width * 0.92;
  const cursorY = base - scintillation(t * 1.7 - 0.59) * height * 0.33;
  glow(ctx, cursorX, cursorY, 18, accent, 0.11);
  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.74;
  ctx.beginPath();
  ctx.arc(cursorX, cursorY, 2.4, 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.fillStyle = "white";
  ctx.font = `${Math.max(9, height * 0.11)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.globalAlpha = 0.4;
  ctx.fillText("timescale ~1 s", left + width * 0.57, top + height * 0.18);
  ctx.globalAlpha = 1;
}

function spectrumY(u: number, t: number): number {
  const ripple = Math.sin(u * 19 + t * 0.7) * 0.01 + Math.sin(u * 33 + 0.8) * 0.007;
  if (u < FRESNEL_KNEE) {
    return clamp01(0.82 + ripple);
  }
  const roll = (u - FRESNEL_KNEE) / (1 - FRESNEL_KNEE);
  return clamp01(0.82 * Math.pow(1 + roll * 8.5, -0.82) + ripple);
}

function drawSpectrumPanel(
  ctx: CanvasRenderingContext2D,
  left: number,
  top: number,
  width: number,
  height: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const reveal = smooth01(wrap(t * 0.12, 1) / 0.72);
  const right = left + width;
  const bottom = top + height;

  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.12;
  ctx.lineWidth = 1;
  for (let i = 0; i <= 3; i += 1) {
    const y = top + (height * i) / 3;
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }
  for (let i = 0; i <= 3; i += 1) {
    const x = left + (width * i) / 3;
    ctx.beginPath();
    ctx.moveTo(x, top);
    ctx.lineTo(x, bottom);
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(left, top);
  ctx.lineTo(left, bottom);
  ctx.lineTo(right, bottom);
  strokePath(ctx, "white", 0.28, 1);
  ctx.restore();

  const steps = 58;
  ctx.save();
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const u = i / steps;
    const visible = clamp01(reveal * 1.15 - u * 0.15);
    const x = left + u * width;
    const y = bottom - spectrumY(u, t) * height * 0.78 * visible - height * 0.08;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.shadowColor = accent;
  ctx.shadowBlur = 11;
  strokePath(ctx, accent2, 0.78, 1.5);
  ctx.shadowBlur = 0;

  for (let i = 0; i < 18; i += 1) {
    const u = i / 17;
    const local = clamp01(reveal * 1.2 - u * 0.18);
    const x = left + u * width;
    const y = bottom - spectrumY(u, t) * height * 0.78 * local - height * 0.08;
    ctx.beginPath();
    ctx.moveTo(x, bottom);
    ctx.lineTo(x, y);
    strokePath(ctx, accent, 0.08 + local * 0.18, 0.9);
  }

  const kneeX = left + FRESNEL_KNEE * width;
  const kneeY = bottom - spectrumY(FRESNEL_KNEE, t) * height * 0.78 * reveal - height * 0.08;
  ctx.setLineDash([3, 5]);
  ctx.beginPath();
  ctx.moveTo(kneeX, bottom);
  ctx.lineTo(kneeX, top);
  strokePath(ctx, "white", 0.2 + reveal * 0.2, 0.8);
  ctx.setLineDash([]);
  glow(ctx, kneeX, kneeY, 10, accent2, 0.07 * reveal);
  ctx.fillStyle = "white";
  ctx.font = `${Math.max(8, height * 0.085)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.globalAlpha = 0.44 + reveal * 0.18;
  ctx.fillText("Fresnel knee", kneeX + 5, top + height * 0.18);
  ctx.globalAlpha = 1;
  ctx.restore();
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
      { active, reduced: Boolean(reduced), staticT: 4.8, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const source = { x: w * 0.15, y: h * 0.25 };
        const screenX = w * 0.39;
        const screenPoint = { x: screenX, y: h * 0.31 };
        const telescope = { x: w * 0.64, y: h * 0.36 };
        const sun = { x: screenX - w * 0.085, y: h * 0.17 };
        const traceLeft = w * 0.11;
        const traceTop = h * 0.51;
        const traceW = w * 0.58;
        const traceH = h * 0.29;
        const spectrumLeft = w * 0.72;
        const spectrumTop = h * 0.45;
        const spectrumW = w * 0.2;
        const spectrumH = h * 0.33;
        const sourceBrightness = 0.56;
        const received = clamp01(0.54 + scintillation(t * 1.7) * 0.34);
        const labelSize = Math.max(10, minSide * 0.026);

        ctx.fillStyle = "rgba(1, 7, 18, 0.13)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 34; i += 1) {
          glow(
            ctx,
            rnd(i + 81.4) * w,
            rnd(i + 233.5) * h,
            1.4 + rnd(i + 19.6) * 3.8,
            i % 6 === 0 ? "white" : i % 2 === 0 ? accent : accent2,
            0.012 + rnd(i + 8.9) * 0.01,
          );
        }

        drawSunCue(ctx, sun, Math.max(5, minSide * 0.023), t);
        drawArrow(
          ctx,
          { x: sun.x + minSide * 0.035, y: sun.y + minSide * 0.02 },
          { x: screenX - minSide * 0.035, y: screenPoint.y - minSide * 0.055 },
          "rgba(251, 191, 36, 0.95)",
          0.24,
          1,
        );

        drawSource(ctx, source, Math.max(3.2, minSide * 0.012), sourceBrightness, t, accent, accent2);
        drawSolarWindScreen(ctx, screenX, h * 0.12, h * 0.43, t, accent, accent2);

        ctx.save();
        ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.moveTo(source.x + minSide * 0.03, source.y);
        ctx.lineTo(screenPoint.x, screenPoint.y);
        strokePath(ctx, "white", 0.14, 1);
        ctx.beginPath();
        ctx.moveTo(screenPoint.x, screenPoint.y);
        ctx.lineTo(telescope.x, telescope.y - minSide * 0.026);
        strokePath(ctx, accent2, 0.22 + received * 0.16, 1);
        ctx.setLineDash([]);
        ctx.restore();

        const packet = wrap(t * 0.33, 1);
        const beforeScreen = packet < 0.48;
        const localPacket = beforeScreen ? packet / 0.48 : (packet - 0.48) / 0.52;
        const from = beforeScreen ? source : screenPoint;
        const to = beforeScreen ? screenPoint : { x: telescope.x, y: telescope.y - minSide * 0.026 };
        const px = lerp(from.x, to.x, localPacket);
        const py = lerp(from.y, to.y, localPacket);
        glow(
          ctx,
          px,
          py,
          minSide * 0.025,
          beforeScreen ? "white" : accent,
          beforeScreen ? 0.05 : 0.05 + received * 0.1,
        );

        drawGroundTelescope(ctx, telescope, Math.max(20, minSide * 0.062), received, accent, accent2);

        drawTracePanel(ctx, traceLeft, traceTop, traceW, traceH, t, accent, accent2);
        drawSpectrumPanel(ctx, spectrumLeft, spectrumTop, spectrumW, spectrumH, t, accent, accent2);

        ctx.font = `${labelSize}px ui-sans-serif, system-ui, sans-serif`;
        ctx.textBaseline = "alphabetic";
        drawLabel(ctx, "source", source.x - labelSize * 1.8, source.y + labelSize * 2.9, "white", 0.42);
        drawLabel(ctx, "Sun", sun.x - labelSize * 0.7, sun.y + labelSize * 2.8, "white", 0.4);
        drawLabel(ctx, "screen", screenX - labelSize * 1.55, h * 0.45, accent2, 0.5);
        drawLabel(ctx, "telescope", telescope.x - labelSize * 1.9, telescope.y + labelSize * 2.6, "white", 0.4);
        drawLabel(ctx, "intensity", traceLeft, traceTop - labelSize * 0.7, accent, 0.56);
        drawLabel(ctx, "time", traceLeft + traceW - labelSize * 2.2, traceTop + traceH + labelSize * 1.35, "white", 0.34);
        drawLabel(ctx, "power", spectrumLeft, spectrumTop - labelSize * 0.65, accent2, 0.56);
        drawLabel(ctx, "log f", spectrumLeft + spectrumW - labelSize * 2.2, spectrumTop + spectrumH + labelSize * 1.35, "white", 0.34);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
