"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type StageNode = Point & { label: string; seed: number };
type DocNode = Point & { seed: number; selected: boolean; rank?: number };

const STAGES: readonly StageNode[] = [
  { x: 0.13, y: 0.52, label: "QUERY", seed: 101 },
  { x: 0.38, y: 0.52, label: "RETRIEVE", seed: 107 },
  { x: 0.64, y: 0.52, label: "GROUND", seed: 113 },
  { x: 0.87, y: 0.52, label: "ANSWER", seed: 127 },
];

const DOCS: readonly DocNode[] = [
  { x: 0.28, y: 0.2, seed: 211, selected: false },
  { x: 0.36, y: 0.18, seed: 223, selected: true, rank: 1 },
  { x: 0.46, y: 0.22, seed: 227, selected: false },
  { x: 0.31, y: 0.32, seed: 229, selected: true, rank: 2 },
  { x: 0.41, y: 0.32, seed: 233, selected: false },
  { x: 0.5, y: 0.34, seed: 239, selected: true, rank: 3 },
  { x: 0.34, y: 0.42, seed: 241, selected: false },
  { x: 0.45, y: 0.43, seed: 251, selected: false },
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

function toPoint(point: Point, w: number, h: number): Point {
  return { x: point.x * w, y: point.y * h };
}

function pointOnLine(from: Point, to: Point, p: number): Point {
  const eased = smooth01(p);
  return {
    x: lerp(from.x, to.x, eased),
    y: lerp(from.y, to.y, eased),
  };
}

function activation(phase: number, start: number, end: number): number {
  return smooth01((phase - start) / 0.06) * (1 - smooth01((phase - end) / 0.08));
}

function roundedRect(
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

function drawLink(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  accent: string,
  activeLevel: number,
  scale: number,
): void {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.16 + activeLevel * 0.38;
  ctx.lineWidth = scale * (0.9 + activeLevel * 0.7);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * activeLevel * 12;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawPulse(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  progress: number,
  accent: string,
  scale: number,
): void {
  if (progress <= 0 || progress >= 1) return;
  const head = pointOnLine(from, to, progress);
  const tail = pointOnLine(from, to, clamp01(progress - 0.1));
  glow(ctx, head.x, head.y, scale * 28, accent, 0.2);
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.lineWidth = scale * 2.2;
  ctx.globalAlpha = 0.82;
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  ctx.stroke();
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(head.x, head.y, scale * 3.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawStage(
  ctx: CanvasRenderingContext2D,
  p: Point,
  label: string,
  activeLevel: number,
  accent: string,
  accent2: string,
  scale: number,
): void {
  const w = scale * (label === "RETRIEVE" ? 78 : 66);
  const h = scale * 35;
  glow(ctx, p.x, p.y, scale * 55, accent, 0.05 + activeLevel * 0.16);

  ctx.save();
  roundedRect(ctx, p.x - w / 2, p.y - h / 2, w, h, scale * 9);
  ctx.fillStyle = `rgba(10, 12, 24, ${0.56 + activeLevel * 0.1})`;
  ctx.strokeStyle = activeLevel > 0.05 ? accent : "rgba(178, 153, 255, 0.3)";
  ctx.lineWidth = scale * (0.95 + activeLevel * 0.75);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * activeLevel * 14;
  ctx.fill();
  ctx.globalAlpha = 0.44 + activeLevel * 0.5;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.78 + activeLevel * 0.2;
  ctx.fillStyle = "rgba(244, 240, 255, 0.9)";
  ctx.font = `${Math.max(8, scale * 8.2)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y + scale * 0.5);

  ctx.globalAlpha = 0.18 + activeLevel * 0.35;
  ctx.strokeStyle = accent2;
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.moveTo(p.x - w * 0.25, p.y + h * 0.34);
  ctx.lineTo(p.x + w * 0.25, p.y + h * 0.34);
  ctx.stroke();
  ctx.restore();
}

function drawDocument(
  ctx: CanvasRenderingContext2D,
  p: Point,
  activeLevel: number,
  accent: string,
  scale: number,
  rank?: number,
): void {
  const w = scale * 15;
  const h = scale * 19;
  glow(ctx, p.x, p.y, scale * 25, accent, activeLevel * 0.12);

  ctx.save();
  roundedRect(ctx, p.x - w / 2, p.y - h / 2, w, h, scale * 3);
  ctx.fillStyle = `rgba(16, 18, 31, ${0.44 + activeLevel * 0.18})`;
  ctx.strokeStyle = activeLevel > 0.08 ? accent : "rgba(193, 180, 235, 0.28)";
  ctx.lineWidth = scale * (0.75 + activeLevel * 0.55);
  ctx.globalAlpha = 0.58 + activeLevel * 0.36;
  ctx.fill();
  ctx.stroke();
  ctx.strokeStyle = "rgba(235, 231, 255, 0.32)";
  ctx.lineWidth = scale * 0.65;
  ctx.globalAlpha = 0.22 + activeLevel * 0.34;
  ctx.beginPath();
  ctx.moveTo(p.x - w * 0.25, p.y - h * 0.12);
  ctx.lineTo(p.x + w * 0.25, p.y - h * 0.12);
  ctx.moveTo(p.x - w * 0.25, p.y + h * 0.14);
  ctx.lineTo(p.x + w * 0.18, p.y + h * 0.14);
  ctx.stroke();
  if (rank !== undefined) {
    ctx.globalAlpha = 0.72 + activeLevel * 0.2;
    ctx.fillStyle = accent;
    ctx.font = `${Math.max(6, scale * 6.2)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(`[${rank}]`, p.x, p.y + h * 0.72);
  }
  ctx.restore();
}

function drawTopKLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  activeLevel: number,
  accent: string,
  scale: number,
): void {
  const fs = Math.max(7, scale * 7.1);
  const text = "TOP-K DOCS";
  ctx.save();
  ctx.globalAlpha = 0.34 + activeLevel * 0.42;
  ctx.fillStyle = accent;
  ctx.font = `${fs}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, x, y);
  ctx.restore();
}

function drawSnippetFeed(
  ctx: CanvasRenderingContext2D,
  retrieve: Point,
  ground: Point,
  activeLevel: number,
  accent: string,
  accent2: string,
  scale: number,
): void {
  if (activeLevel <= 0.02) return;

  const snippets: readonly { rank: number; dy: number; width: number }[] = [
    { rank: 1, dy: -42, width: 48 },
    { rank: 2, dy: -24, width: 42 },
    { rank: 3, dy: -6, width: 45 },
  ];

  ctx.save();
  for (const [i, snippet] of snippets.entries()) {
    const reveal = smooth01((activeLevel - i * 0.13) / 0.52);
    if (reveal <= 0.02) continue;

    const p = {
      x: lerp(retrieve.x, ground.x, 0.62),
      y: ground.y + scale * snippet.dy,
    };
    const w = scale * snippet.width;
    const h = scale * 13;

    ctx.globalAlpha = 0.12 + reveal * 0.32;
    ctx.strokeStyle = accent2;
    ctx.lineWidth = scale * 0.75;
    ctx.beginPath();
    ctx.moveTo(lerp(retrieve.x, p.x, 0.7), lerp(retrieve.y, p.y, 0.7));
    ctx.lineTo(p.x - w * 0.58, p.y);
    ctx.moveTo(p.x + w * 0.58, p.y);
    ctx.lineTo(ground.x - scale * 33, ground.y - scale * 12);
    ctx.stroke();

    roundedRect(ctx, p.x - w / 2, p.y - h / 2, w, h, scale * 4);
    ctx.fillStyle = `rgba(15, 18, 30, ${0.42 + reveal * 0.18})`;
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.28 + reveal * 0.5;
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 0.72 + reveal * 0.2;
    ctx.fillStyle = accent2;
    ctx.font = `${Math.max(6, scale * 6.5)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`[${snippet.rank}]`, p.x - w * 0.42, p.y);

    ctx.globalAlpha = 0.28 + reveal * 0.35;
    ctx.strokeStyle = "rgba(244, 240, 255, 0.88)";
    ctx.lineWidth = scale * 0.7;
    ctx.beginPath();
    ctx.moveTo(p.x - w * 0.08, p.y - h * 0.16);
    ctx.lineTo(p.x + w * 0.34, p.y - h * 0.16);
    ctx.moveTo(p.x - w * 0.08, p.y + h * 0.18);
    ctx.lineTo(p.x + w * 0.26, p.y + h * 0.18);
    ctx.stroke();
  }
  ctx.restore();
}

function drawAnswerLines(
  ctx: CanvasRenderingContext2D,
  p: Point,
  activeLevel: number,
  accent2: string,
  scale: number,
): void {
  if (activeLevel <= 0.02) return;
  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.lineWidth = scale * 1.25;
  ctx.lineCap = "round";
  for (let i = 0; i < 3; i += 1) {
    const reveal = smooth01((activeLevel - i * 0.18) / 0.46);
    const y = p.y + scale * (33 + i * 8);
    const x0 = p.x - scale * 28;
    const x1 = p.x + scale * (22 - i * 5);
    ctx.globalAlpha = 0.18 + reveal * 0.45;
    ctx.beginPath();
    ctx.moveTo(x0, y);
    ctx.lineTo(lerp(x0, x1, reveal), y);
    ctx.stroke();
  }
  ctx.restore();
}

export default function RagFlowFigure({
  accent,
  accent2,
  active,
}: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    return mountCanvas2D(
      canvas,
      { active, reduced: Boolean(reduced), staticT: 3.25, speed: 0.014 },
      ({ ctx, w, h }, t) => {
        const scale = Math.max(0.74, Math.min(w, h) / 420);
        const stages = STAGES.map((stage) => ({
          ...stage,
          p: toPoint(stage, w, h),
        }));
        const query = stages[0]?.p ?? { x: w * 0.13, y: h * 0.52 };
        const retrieve = stages[1]?.p ?? { x: w * 0.38, y: h * 0.52 };
        const ground = stages[2]?.p ?? { x: w * 0.64, y: h * 0.52 };
        const answer = stages[3]?.p ?? { x: w * 0.87, y: h * 0.52 };

        const cycle = 4.9;
        const phase = (t % cycle) / cycle;
        const queryLevel = activation(phase, 0.02, 0.22);
        const retrieveLevel = activation(phase, 0.2, 0.48);
        const groundLevel = activation(phase, 0.46, 0.72);
        const answerLevel = activation(phase, 0.7, 0.94);

        ctx.fillStyle = "rgba(4, 5, 12, 0.36)";
        ctx.fillRect(0, 0, w, h);
        glow(ctx, w * 0.42, h * 0.34, Math.min(w, h) * 0.5, accent, 0.055);
        glow(ctx, w * 0.82, h * 0.66, Math.min(w, h) * 0.36, accent2, 0.04);

        ctx.save();
        ctx.globalAlpha = 0.09;
        ctx.strokeStyle = "rgba(222, 214, 255, 0.7)";
        ctx.lineWidth = scale * 0.55;
        for (let i = 0; i < 7; i += 1) {
          const y = h * (0.2 + i * 0.1);
          ctx.beginPath();
          ctx.moveTo(w * 0.08, y);
          ctx.lineTo(w * 0.92, y);
          ctx.stroke();
        }
        ctx.restore();

        drawLink(ctx, query, retrieve, accent, retrieveLevel, scale);
        drawLink(ctx, retrieve, ground, accent, groundLevel, scale);
        drawLink(ctx, ground, answer, accent2, answerLevel, scale);

        const pulse1 = smooth01((phase - 0.06) / 0.2);
        const pulse2 = smooth01((phase - 0.34) / 0.2);
        const pulse3 = smooth01((phase - 0.6) / 0.2);
        drawPulse(ctx, query, retrieve, pulse1, accent, scale);
        drawPulse(ctx, retrieve, ground, pulse2, accent, scale);
        drawPulse(ctx, ground, answer, pulse3, accent2, scale);

        const docPull = smooth01((phase - 0.24) / 0.18) * (1 - smooth01((phase - 0.5) / 0.1));
        for (const doc of DOCS) {
          const base = toPoint(
            {
              x: doc.x + (rnd(doc.seed) - 0.5) * 0.012,
              y: doc.y + (rnd(doc.seed + 1) - 0.5) * 0.012,
            },
            w,
            h,
          );
          const orbit = {
            x: base.x + Math.sin(t * 0.75 + rnd(doc.seed) * 6.28) * scale * 2.2,
            y: base.y + Math.cos(t * 0.65 + rnd(doc.seed + 2) * 6.28) * scale * 1.6,
          };
          const selectedPull = doc.selected ? docPull : 0;
          const pulled = {
            x: lerp(orbit.x, retrieve.x, selectedPull * 0.62),
            y: lerp(orbit.y, retrieve.y - scale * 7, selectedPull * 0.62),
          };
          const activeDoc = doc.selected ? retrieveLevel : retrieveLevel * 0.16;
          drawDocument(ctx, pulled, activeDoc, doc.selected ? accent : accent2, scale, doc.rank);
        }

        drawTopKLabel(ctx, w * 0.39, h * 0.135, retrieveLevel, accent, scale);

        const levels = [queryLevel, retrieveLevel, groundLevel, answerLevel] as const;
        for (const [i, stage] of stages.entries()) {
          drawStage(ctx, stage.p, stage.label, levels[i] ?? 0, accent, accent2, scale);
        }

        ctx.save();
        ctx.globalAlpha = 0.12 + groundLevel * 0.36;
        ctx.strokeStyle = accent2;
        ctx.lineWidth = scale * 1.1;
        for (let i = 0; i < 3; i += 1) {
          const offset = scale * (12 + i * 7);
          ctx.beginPath();
          ctx.moveTo(ground.x - offset, ground.y - scale * (35 + i * 3));
          ctx.lineTo(ground.x + offset, ground.y - scale * (35 + i * 3));
          ctx.stroke();
        }
        ctx.restore();

        drawSnippetFeed(ctx, retrieve, ground, groundLevel, accent, accent2, scale);
        drawAnswerLines(ctx, answer, answerLevel, accent2, scale);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
