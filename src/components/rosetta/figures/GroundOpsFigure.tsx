"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

/**
 * GroundOps-Copilot: a bilingual voice command becomes a safety-gated tool call.
 * Left to right: a voice waveform (EN / AR) -> intent -> tool-call chips flowing
 * along a path -> a SAFETY gate that admits valid calls (they brighten to white)
 * and rejects unsafe ones (red cross) -> an executed action node.
 */

type Token = { lane: number; rejected: boolean; seed: number };

const TOKENS: readonly Token[] = [
  { lane: -0.34, rejected: false, seed: 13 },
  { lane: -0.12, rejected: true, seed: 19 },
  { lane: 0.08, rejected: false, seed: 29 },
  { lane: 0.3, rejected: false, seed: 37 },
  { lane: 0.5, rejected: true, seed: 41 },
];

const GATE_X = 0.6; // gate position along the path (normalised)
const START_X = 0.3;
const END_X = 0.88;
// where the gate sits on the token's 0..1 travel progress
const GATE_PROGRESS = (GATE_X - START_X) / (END_X - START_X);

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, r * 0.7);
  bg.addColorStop(0, "rgba(18,10,30,0.7)");
  bg.addColorStop(0.56, "rgba(8,6,18,0.44)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.12, h * 0.5, r * 0.2, accent2, 0.05);
  glow(ctx, w * 0.9, h * 0.5, r * 0.22, accent, 0.05);
}

/** Bilingual voice waveform on the left, with an EN / AR label that toggles. */
function drawVoice(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  cy: number,
  scale: number,
  accent: string,
  accent2: string,
): void {
  const x0 = w * 0.05;
  const x1 = w * 0.19;
  const bars = 11;
  const amp = h * 0.16;
  glow(ctx, (x0 + x1) / 2, cy, h * 0.34, accent2, 0.06);

  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(1.4, scale * 2.2);
  ctx.globalAlpha = 0.85;
  for (let i = 0; i < bars; i += 1) {
    const x = lerp(x0, x1, i / (bars - 1));
    const env = Math.sin((i / (bars - 1)) * Math.PI); // taper at the ends
    const a = amp * env * (0.35 + 0.65 * Math.abs(Math.sin(t * 2.4 + i * 0.7)));
    ctx.beginPath();
    ctx.moveTo(x, cy - a);
    ctx.lineTo(x, cy + a);
    ctx.stroke();
  }
  ctx.restore();

  // EN / AR label, alternating slowly
  const lang = Math.floor(t * 0.35) % 2 === 0 ? "EN" : "AR";
  ctx.save();
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = "rgba(247,242,255,0.9)";
  ctx.font = `${Math.max(8, scale * 9)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(lang, (x0 + x1) / 2, cy + amp + scale * 12);
  ctx.restore();
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  label: string,
  accent: string,
): void {
  const rw = scale * 46;
  const rh = scale * 22;
  glow(ctx, x, y, rh * 2.1, accent, 0.08);
  ctx.save();
  roundRect(ctx, x - rw / 2, y - rh / 2, rw, rh, scale * 7);
  ctx.fillStyle = "rgba(12,9,25,0.7)";
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, scale * 1.1);
  ctx.fill();
  ctx.globalAlpha = 0.5;
  ctx.stroke();
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(247,242,255,0.92)";
  ctx.font = `${Math.max(7, scale * 7.6)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, y);
  ctx.restore();
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  height: number,
  pulse: number,
  accent: string,
  accent2: string,
): void {
  const top = cy - height / 2;
  const bottom = cy + height / 2;
  ctx.save();
  glow(ctx, x, cy, height * 0.46, accent2, 0.04 + pulse * 0.06);
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.28 + pulse * 0.34;
  ctx.lineWidth = 1.3 + pulse * 0.9;
  ctx.shadowColor = accent2;
  ctx.shadowBlur = pulse * 14;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.16 + pulse * 0.2;
  for (let i = 0; i < 5; i += 1) {
    const y = lerp(top, bottom, i / 4);
    ctx.beginPath();
    ctx.moveTo(x - height * 0.07, y);
    ctx.lineTo(x + height * 0.07, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.64 + pulse * 0.22;
  ctx.fillStyle = "rgba(247,242,255,0.9)";
  ctx.font = `${Math.max(7, height * 0.06)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SAFETY", x, top - height * 0.085);
  ctx.restore();
}

function drawChip(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  alpha: number,
  color: string,
  rejected: boolean,
): void {
  if (alpha <= 0.02) return;
  const cw = scale * 56;
  const ch = scale * 20;
  glow(ctx, x, y, ch * 2.4, color, alpha * 0.16);
  ctx.save();
  roundRect(ctx, x - cw / 2, y - ch / 2, cw, ch, scale * 6);
  ctx.fillStyle = rejected ? "rgba(44,10,22,0.78)" : "rgba(12,10,25,0.76)";
  ctx.strokeStyle = rejected ? "rgba(255,112,160,0.85)" : "rgba(255,255,255,0.72)";
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.42;
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.92;
  ctx.fillStyle = color;
  ctx.font = `${Math.max(6, scale * 6.6)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("tool-call", x, y);

  if (rejected) {
    ctx.globalAlpha = alpha * 0.78;
    ctx.strokeStyle = "rgba(255,112,160,0.92)";
    ctx.lineWidth = Math.max(1, scale * 1.1);
    ctx.beginPath();
    ctx.moveTo(x - cw * 0.42, y - ch * 0.4);
    ctx.lineTo(x + cw * 0.42, y + ch * 0.4);
    ctx.moveTo(x + cw * 0.42, y - ch * 0.4);
    ctx.lineTo(x - cw * 0.42, y + ch * 0.4);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAction(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  scale: number,
  pulse: number,
  accent: string,
): void {
  const r = scale * 22;
  glow(ctx, x, y, r * 2.6, accent, 0.1 + pulse * 0.08);
  ctx.save();
  ctx.fillStyle = "rgba(14,9,26,0.62)";
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, scale * 1.4);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * (8 + pulse * 12);
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.66 + pulse * 0.24;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(249,246,255,0.92)";
  ctx.lineWidth = Math.max(1.5, scale * 2);
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(x - r * 0.36, y + r * 0.02);
  ctx.lineTo(x - r * 0.08, y + r * 0.28);
  ctx.lineTo(x + r * 0.4, y - r * 0.26);
  ctx.stroke();

  ctx.globalAlpha = 0.7;
  ctx.fillStyle = "rgba(247,242,255,0.88)";
  ctx.font = `${Math.max(7, scale * 7.6)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("action", x, y + r + scale * 11);
  ctx.restore();
}

export default function GroundOpsFigure({ accent, accent2, active }: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 3.4, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const cy = h * 0.5;
        const scale = Math.max(0.7, Math.min(w, h) / 320);
        const band = h * 0.3;
        const phase = (t * 0.12) % 1;

        drawBackdrop(ctx, w, h, accent, accent2);

        // the path from intent to action
        ctx.save();
        ctx.strokeStyle = "rgba(227,218,255,0.13)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(w * START_X, cy);
        ctx.bezierCurveTo(w * 0.45, cy - h * 0.06, w * 0.74, cy + h * 0.06, w * END_X, cy);
        ctx.stroke();
        ctx.restore();

        const gatePulse = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.85));
        drawGate(ctx, w * GATE_X, cy, h * 0.54, gatePulse, accent, accent2);

        for (const [i, token] of TOKENS.entries()) {
          const progress = (phase + i / TOKENS.length) % 1;
          const drift =
            Math.sin(t * (0.3 + rnd(token.seed) * 0.14) + token.seed) * band * 0.02;
          const y = cy + token.lane * band + drift;
          const stopAt = token.rejected ? GATE_PROGRESS : 1.1;

          if (progress > stopAt + 0.02) {
            // rejected: linger at the gate, fading with a red cross
            const fade = 1 - smooth01((progress - stopAt - 0.02) / 0.22);
            if (fade > 0.02) {
              drawChip(ctx, w * GATE_X - scale * 6, y, scale, fade * 0.8, "#ff5d9a", true);
            }
            continue;
          }

          const x = lerp(w * START_X, w * END_X, smooth01(progress));
          const passedGate = progress > GATE_PROGRESS;
          const color = passedGate ? "rgba(250,248,255,0.95)" : accent2;
          const fadeIn = 0.25 + 0.75 * smooth01(progress / 0.1);
          const alpha = (0.5 + smooth01(progress) * 0.32) * fadeIn;
          drawChip(ctx, x, y, scale, alpha, color, false);
        }

        drawVoice(ctx, w, h, t, cy, scale, accent, accent2);
        drawNode(ctx, w * START_X, cy, scale, "intent", accent);
        const actionPulse = 0.5 + 0.5 * Math.sin(t * 1.2);
        drawAction(ctx, w * 0.93, cy, scale, actionPulse, accent);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
