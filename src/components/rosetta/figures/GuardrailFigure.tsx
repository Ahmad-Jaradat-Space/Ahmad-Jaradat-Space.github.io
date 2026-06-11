"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type Gate = { x: number; label: string; seed: number };
type Proposal = {
  kind: "request" | "tool-call" | "response";
  lane: number;
  rejectAt: number;
  seed: number;
};

const GATES: readonly Gate[] = [
  { x: 0.34, label: "POLICY", seed: 11 },
  { x: 0.52, label: "LIMITS", seed: 17 },
  { x: 0.68, label: "RISK", seed: 23 },
];

const PROPOSALS: readonly Proposal[] = [
  { kind: "request", lane: -0.38, rejectAt: -1, seed: 31 },
  { kind: "tool-call", lane: -0.2, rejectAt: 1, seed: 37 },
  { kind: "response", lane: -0.05, rejectAt: -1, seed: 41 },
  { kind: "request", lane: 0.15, rejectAt: 0, seed: 43 },
  { kind: "tool-call", lane: 0.32, rejectAt: -1, seed: 47 },
  { kind: "response", lane: 0.46, rejectAt: 2, seed: 53 },
];

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

function gateProgress(index: number): number {
  const gate = GATES[index];
  // maps a gate's x onto the chip path (startX 0.21w → endX 0.86w)
  return gate ? (gate.x - 0.21) / 0.65 : 1;
}

function proposalY(proposal: Proposal, cy: number, band: number, t: number): number {
  const drift = Math.sin(t * (0.32 + rnd(proposal.seed + 12) * 0.12) + proposal.seed) * band * 0.018;
  return cy + proposal.lane * band + drift;
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.5, 0, w * 0.5, h * 0.5, r * 0.68);
  bg.addColorStop(0, "rgba(18,10,30,0.72)");
  bg.addColorStop(0.56, "rgba(8,6,18,0.46)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.22, h * 0.48, r * 0.2, accent2, 0.035);
  glow(ctx, w * 0.84, h * 0.5, r * 0.24, accent, 0.045);
}

function drawGlyph(
  ctx: CanvasRenderingContext2D,
  p: Point,
  scale: number,
  accent: string,
  accent2: string,
): void {
  const size = scale * 44;
  glow(ctx, p.x, p.y, size * 1.7, accent2, 0.1);

  ctx.save();
  roundRect(ctx, p.x - size / 2, p.y - size / 2, size, size, scale * 10);
  ctx.fillStyle = "rgba(11, 8, 24, 0.62)";
  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(1, scale * 1.2);
  ctx.shadowColor = accent2;
  ctx.shadowBlur = scale * 12;
  ctx.fill();
  ctx.globalAlpha = 0.58;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.36;
  ctx.lineWidth = Math.max(1, scale);
  for (let i = 0; i < 3; i += 1) {
    const y = p.y - size * 0.18 + i * size * 0.18;
    ctx.beginPath();
    ctx.moveTo(p.x - size * 0.23, y);
    ctx.lineTo(p.x + size * 0.23, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(246,242,255,0.92)";
  ctx.font = `${Math.max(9, scale * 10)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("LLM", p.x, p.y + size * 0.33);
  ctx.restore();
}

function drawGate(
  ctx: CanvasRenderingContext2D,
  x: number,
  cy: number,
  height: number,
  pulse: number,
  label: string,
  accent: string,
  accent2: string,
): void {
  const top = cy - height / 2;
  const bottom = cy + height / 2;

  ctx.save();
  glow(ctx, x, cy, height * 0.42, accent2, 0.035 + pulse * 0.06);
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.25 + pulse * 0.35;
  ctx.lineWidth = 1.2 + pulse * 0.8;
  ctx.shadowColor = accent2;
  ctx.shadowBlur = pulse * 14;
  ctx.beginPath();
  ctx.moveTo(x, top);
  ctx.lineTo(x, bottom);
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.18 + pulse * 0.22;
  for (let i = 0; i < 5; i += 1) {
    const y = lerp(top, bottom, i / 4);
    ctx.beginPath();
    ctx.moveTo(x - height * 0.08, y);
    ctx.lineTo(x + height * 0.08, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.62 + pulse * 0.22;
  ctx.fillStyle = "rgba(247,242,255,0.9)";
  ctx.font = `${Math.max(7, height * 0.038)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, x, top - height * 0.055);
  ctx.restore();
}

function drawOutput(
  ctx: CanvasRenderingContext2D,
  p: Point,
  scale: number,
  pulse: number,
  accent: string,
): void {
  const r = scale * 24;
  glow(ctx, p.x, p.y, r * 2.5, accent, 0.12 + pulse * 0.08);

  ctx.save();
  ctx.fillStyle = "rgba(14, 9, 26, 0.62)";
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, scale * 1.4);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * (9 + pulse * 12);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.68 + pulse * 0.24;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = "rgba(249,246,255,0.92)";
  ctx.lineWidth = Math.max(1.5, scale * 2.1);
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.moveTo(p.x - r * 0.38, p.y + r * 0.02);
  ctx.lineTo(p.x - r * 0.1, p.y + r * 0.28);
  ctx.lineTo(p.x + r * 0.42, p.y - r * 0.28);
  ctx.stroke();
  ctx.restore();
}

function drawProposalObject(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  proposal: Proposal,
  scale: number,
  alpha: number,
  color: string,
  stopped: boolean,
  compact: boolean,
): void {
  if (alpha <= 0.02) return;

  const width = scale * (proposal.kind === "tool-call" ? 58 : 52);
  const height = scale * (compact ? 16 : 24);
  glow(ctx, x, y, height * 2.5, color, alpha * 0.18);
  ctx.save();
  roundRect(ctx, x - width / 2, y - height / 2, width, height, scale * 6);
  ctx.fillStyle = stopped ? "rgba(44,10,22,0.78)" : "rgba(12,10,25,0.76)";
  ctx.strokeStyle = stopped ? "rgba(255,112,160,0.84)" : "rgba(255,255,255,0.72)";
  ctx.globalAlpha = alpha;
  ctx.lineWidth = 1;
  ctx.fill();
  ctx.globalAlpha = alpha * 0.4;
  ctx.stroke();

  ctx.globalAlpha = alpha * 0.92;
  ctx.fillStyle = color;
  ctx.font = `${Math.max(7, scale * 7.2)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (compact) {
    ctx.fillText("proposal", x, y + height * 0.05);
  } else {
    ctx.fillText("proposal", x, y - height * 0.12);
    ctx.globalAlpha = alpha * 0.55;
    ctx.fillStyle = "rgba(247,242,255,0.9)";
    ctx.font = `${Math.max(6, scale * 5.9)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText(proposal.kind, x, y + height * 0.24);
  }

  if (stopped) {
    ctx.globalAlpha = alpha * 0.72;
    ctx.strokeStyle = "rgba(255,112,160,0.9)";
    ctx.beginPath();
    ctx.moveTo(x - width * 0.4, y - height * 0.34);
    ctx.lineTo(x + width * 0.4, y + height * 0.34);
    ctx.moveTo(x + width * 0.4, y - height * 0.34);
    ctx.lineTo(x - width * 0.4, y + height * 0.34);
    ctx.stroke();
  }
  ctx.restore();
}

function drawStream(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const compact = h < 200;
  const cy = h * 0.52;
  const startX = w * 0.21; // clear of the LLM glyph
  const endX = w * 0.86;
  const band = h * 0.28;
  const scale = Math.max(0.72, Math.min(w, h) / 320);
  const phase = (t * 0.115) % 1;
  // fewer chips on tiles so lanes do not collide
  const proposals = compact
    ? PROPOSALS.filter((_, i) => i % 2 === 0)
    : PROPOSALS;

  ctx.save();
  ctx.strokeStyle = "rgba(227,218,255,0.13)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, cy);
  ctx.bezierCurveTo(w * 0.34, cy - h * 0.08, w * 0.62, cy + h * 0.08, endX, cy);
  ctx.stroke();
  ctx.restore();

  for (const gate of GATES) {
    const pulse = 0.3 + 0.7 * Math.abs(Math.sin(t * 0.8 + gate.seed));
    drawGate(ctx, w * gate.x, cy, h * 0.52, pulse, gate.label, accent, accent2);
  }

  for (const [i, proposal] of proposals.entries()) {
    const progress = (phase + i / proposals.length) % 1;
    const rejectedAt = proposal.rejectAt;
    const y = proposalY(proposal, cy, band, t);
    const gateStop = rejectedAt >= 0 ? gateProgress(rejectedAt) : 1.1;

    if (progress > gateStop + 0.025) {
      const fade = 1 - smooth01((progress - gateStop - 0.025) / 0.24);
      const gate = GATES[rejectedAt];
      if (gate && fade > 0.02) {
        drawProposalObject(
          ctx,
          w * gate.x - scale * 8,
          y + h * 0.018 * smooth01((progress - gateStop) / 0.18),
          proposal,
          scale,
          fade * 0.8,
          "#ff5d9a",
          true,
          compact,
        );
      }
      continue;
    }

    const x = lerp(startX, endX, smooth01(progress));
    const passed =
      (progress > gateProgress(0) ? 1 : 0) +
      (progress > gateProgress(1) ? 1 : 0) +
      (progress > gateProgress(2) ? 1 : 0);
    const brighten = passed / GATES.length;
    const color = brighten > 0.66 ? "rgba(250,248,255,0.95)" : brighten > 0.33 ? accent : accent2;
    const fadeIn = 0.25 + 0.75 * smooth01(progress / 0.1);
    const alpha = (0.42 + brighten * 0.44 + smooth01(progress) * 0.1) * fadeIn;

    drawProposalObject(ctx, x, y, proposal, scale, alpha, color, false, compact);
  }
}

export default function GuardrailFigure({
  accent,
  accent2,
  active,
}: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 4.7, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const scale = Math.min(w, h) / 320;
        const cy = h * 0.52;
        const outputPulse = 0.5 + 0.5 * Math.sin(t * 1.2);

        drawBackdrop(ctx, w, h, accent, accent2);
        drawStream(ctx, w, h, t, accent, accent2);
        drawGlyph(ctx, { x: w * 0.13, y: cy }, scale, accent, accent2);
        drawOutput(ctx, { x: w * 0.89, y: cy }, scale, outputPulse, accent);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
