"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Player = { id: number; x: number; y: number; role: "gk" | "def" | "mid" | "fwd" };
type Edge = { from: number; to: number; weight: number };

const TAU = Math.PI * 2;
const RED = "#ef4444";
const RED_SOFT = "#fb7185";

const PLAYERS: readonly Player[] = [
  { id: 0, x: -0.88, y: 0, role: "gk" },
  { id: 1, x: -0.58, y: -0.56, role: "def" },
  { id: 2, x: -0.58, y: -0.18, role: "def" },
  { id: 3, x: -0.56, y: 0.2, role: "def" },
  { id: 4, x: -0.52, y: 0.58, role: "def" },
  { id: 5, x: -0.18, y: -0.42, role: "mid" },
  { id: 6, x: -0.12, y: 0.04, role: "mid" },
  { id: 7, x: -0.02, y: 0.46, role: "mid" },
  { id: 8, x: 0.32, y: -0.36, role: "fwd" },
  { id: 9, x: 0.46, y: 0.08, role: "fwd" },
  { id: 10, x: 0.72, y: 0.38, role: "fwd" },
];

const EDGES: readonly Edge[] = [
  { from: 0, to: 2, weight: 0.38 },
  { from: 0, to: 3, weight: 0.32 },
  { from: 1, to: 5, weight: 0.56 },
  { from: 2, to: 5, weight: 0.48 },
  { from: 2, to: 6, weight: 0.78 },
  { from: 3, to: 6, weight: 0.72 },
  { from: 4, to: 7, weight: 0.52 },
  { from: 5, to: 6, weight: 0.66 },
  { from: 6, to: 7, weight: 0.44 },
  { from: 6, to: 8, weight: 0.82 },
  { from: 6, to: 9, weight: 0.88 },
  { from: 7, to: 10, weight: 0.64 },
  { from: 8, to: 9, weight: 0.42 },
  { from: 9, to: 10, weight: 0.74 },
  { from: 5, to: 8, weight: 0.5 },
];

const INVOLVEMENT: ReadonlyMap<number, number> = new Map(
  PLAYERS.map((player) => [
    player.id,
    EDGES.reduce(
      (sum, edge) => sum + (edge.from === player.id || edge.to === player.id ? edge.weight : 0),
      0,
    ),
  ]),
);

const MAX_INVOLVEMENT = Math.max(...Array.from(INVOLVEMENT.values()));

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
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

function quadPoint(from: Point, control: Point, to: Point, u: number): Point {
  const v = 1 - u;
  return {
    x: from.x * v * v + control.x * 2 * v * u + to.x * u * u,
    y: from.y * v * v + control.y * 2 * v * u + to.y * u * u,
  };
}

function drawArrowHead(
  ctx: CanvasRenderingContext2D,
  tip: Point,
  angle: number,
  size: number,
  color: string,
  alpha: number,
): void {
  ctx.save();
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.moveTo(tip.x, tip.y);
  ctx.lineTo(tip.x - Math.cos(angle - 0.5) * size, tip.y - Math.sin(angle - 0.5) * size);
  ctx.lineTo(tip.x - Math.cos(angle + 0.5) * size, tip.y - Math.sin(angle + 0.5) * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function pitchRect(w: number, h: number): Rect {
  const ratio = 105 / 68;
  let pw = Math.min(w * 0.88, h * 1.46);
  let ph = pw / ratio;
  if (ph > h * 0.78) {
    ph = h * 0.78;
    pw = ph * ratio;
  }
  return { x: (w - pw) / 2, y: (h - ph) / 2, w: pw, h: ph };
}

function mapPitch(pitch: Rect, x: number, y: number): Point {
  return {
    x: pitch.x + ((x + 1) / 2) * pitch.w,
    y: pitch.y + ((y + 1) / 2) * pitch.h,
  };
}

function playerPoint(player: Player, pitch: Rect): Point {
  return mapPitch(pitch, player.x, player.y);
}

function findPlayer(id: number): Player {
  return PLAYERS.find((player) => player.id === id) ?? PLAYERS[0]!;
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  ctx.fillStyle = "rgba(5,2,3,0.9)";
  ctx.fillRect(0, 0, w, h);

  const r = Math.max(w, h);
  const wash = ctx.createRadialGradient(w * 0.74, h * 0.46, 0, w * 0.74, h * 0.46, r * 0.62);
  wash.addColorStop(0, "rgba(239,68,68,0.12)");
  wash.addColorStop(0.55, "rgba(35,8,11,0.16)");
  wash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  glow(ctx, w * 0.78, h * 0.48, r * 0.25, accent, 0.04);
  glow(ctx, w * 0.36, h * 0.3, r * 0.2, accent2, 0.026);
}

function drawPitch(ctx: CanvasRenderingContext2D, pitch: Rect): void {
  ctx.save();
  ctx.fillStyle = "rgba(12,8,9,0.38)";
  ctx.strokeStyle = "rgba(255,237,237,0.14)";
  ctx.lineWidth = Math.max(1, pitch.w * 0.002);
  ctx.beginPath();
  ctx.rect(pitch.x, pitch.y, pitch.w, pitch.h);
  ctx.fill();
  ctx.stroke();
  ctx.clip();

  ctx.strokeStyle = "rgba(255,230,230,0.035)";
  ctx.lineWidth = 1;
  for (let i = 1; i < 14; i += 1) {
    const x = pitch.x + (pitch.w * i) / 14;
    ctx.beginPath();
    ctx.moveTo(x, pitch.y);
    ctx.lineTo(x, pitch.y + pitch.h);
    ctx.stroke();
  }
  for (let i = 1; i < 9; i += 1) {
    const y = pitch.y + (pitch.h * i) / 9;
    ctx.beginPath();
    ctx.moveTo(pitch.x, y);
    ctx.lineTo(pitch.x + pitch.w, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawThreatGrid(
  ctx: CanvasRenderingContext2D,
  pitch: Rect,
  t: number,
  accent: string,
  accent2: string,
): void {
  const cols = 12;
  const rows = 8;
  ctx.save();
  ctx.beginPath();
  ctx.rect(pitch.x, pitch.y, pitch.w, pitch.h);
  ctx.clip();

  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < cols; x += 1) {
      const u = (x + 0.5) / cols;
      const v = (y + 0.5) / rows;
      const lane = Math.exp(-Math.pow((v - 0.5) / 0.36, 2));
      const rightBias = Math.pow(u, 1.75);
      const pocket = Math.exp(-Math.pow((u - 0.78) / 0.2, 2) - Math.pow((v - 0.55) / 0.26, 2));
      const pulse = 0.85 + Math.sin(t * 0.72 + x * 0.35 + y * 0.22) * 0.15;
      const heat = clamp01((rightBias * 0.55 + pocket * 0.45) * lane * pulse);

      ctx.fillStyle = heat > 0.52 ? accent : accent2;
      ctx.globalAlpha = 0.018 + heat * 0.15;
      ctx.fillRect(
        pitch.x + (x / cols) * pitch.w,
        pitch.y + (y / rows) * pitch.h,
        pitch.w / cols + 0.6,
        pitch.h / rows + 0.6,
      );
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawPitchMarks(ctx: CanvasRenderingContext2D, pitch: Rect): void {
  const lineWidth = Math.max(1, pitch.w * 0.002);
  const line = (a: Point, b: Point) => {
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  };
  const box = (x0: number, y0: number, x1: number, y1: number) => {
    const a = mapPitch(pitch, x0, y0);
    const b = mapPitch(pitch, x1, y1);
    ctx.strokeRect(a.x, a.y, b.x - a.x, b.y - a.y);
  };

  ctx.save();
  ctx.strokeStyle = "rgba(255,238,238,0.17)";
  ctx.fillStyle = "rgba(255,238,238,0.18)";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(pitch.x, pitch.y, pitch.w, pitch.h);
  line(mapPitch(pitch, 0, -1), mapPitch(pitch, 0, 1));
  const center = mapPitch(pitch, 0, 0);
  ctx.beginPath();
  ctx.arc(center.x, center.y, pitch.h * 0.135, 0, TAU);
  ctx.stroke();
  box(-1, -0.42, -0.69, 0.42);
  box(0.69, -0.42, 1, 0.42);
  box(-1, -0.2, -0.89, 0.2);
  box(0.89, -0.2, 1, 0.2);
  for (const spot of [-0.78, 0.78]) {
    const p = mapPitch(pitch, spot, 0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.2, pitch.w * 0.003), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function drawEdges(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyMap<number, Point>,
  pitch: Rect,
  accent: string,
  accent2: string,
): void {
  for (const edge of EDGES) {
    const from = points.get(edge.from);
    const to = points.get(edge.to);
    if (!from || !to) continue;

    const alpha = 0.09 + edge.weight * 0.24;
    const width = Math.max(1, pitch.w * (0.002 + edge.weight * 0.0048));
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    const cx = (from.x + to.x) * 0.5;
    const cy = (from.y + to.y) * 0.5 - pitch.h * 0.03 * (edge.to > edge.from ? 1 : -1);
    const control = { x: cx, y: cy };
    ctx.quadraticCurveTo(cx, cy, to.x, to.y);
    ctx.shadowColor = accent;
    ctx.shadowBlur = edge.weight > 0.78 ? 9 : 0;
    const color = edge.weight > 0.7 ? accent : accent2;
    strokePath(ctx, color, alpha, width);
    ctx.shadowBlur = 0;

    const tip = quadPoint(from, control, to, 0.84);
    const before = quadPoint(from, control, to, 0.76);
    const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    drawArrowHead(ctx, tip, angle, Math.max(4, width * 2.1), color, alpha + 0.12);
  }
}

function drawLivePass(
  ctx: CanvasRenderingContext2D,
  points: ReadonlyMap<number, Point>,
  pitch: Rect,
  t: number,
  accent: string,
): void {
  const from = points.get(6);
  const to = points.get(9);
  if (!from || !to) return;

  const p = smooth01((t * 0.28) % 1);
  const cx = (from.x + to.x) * 0.5;
  const cy = (from.y + to.y) * 0.5 - pitch.h * 0.08;
  const x = lerp(lerp(from.x, cx, p), lerp(cx, to.x, p), p);
  const y = lerp(lerp(from.y, cy, p), lerp(cy, to.y, p), p);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.quadraticCurveTo(cx, cy, to.x, to.y);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 18;
  strokePath(ctx, accent, 0.42 + Math.sin(t * 3) * 0.08, Math.max(2, pitch.w * 0.008));
  ctx.shadowBlur = 0;

  glow(ctx, x, y, Math.max(18, pitch.w * 0.035), accent, 0.23);
  ctx.beginPath();
  ctx.arc(x, y, Math.max(3.5, pitch.w * 0.007), 0, TAU);
  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawNode(
  ctx: CanvasRenderingContext2D,
  player: Player,
  point: Point,
  pitch: Rect,
  accent: string,
  accent2: string,
): void {
  const involvement = INVOLVEMENT.get(player.id) ?? 0;
  const normalized = MAX_INVOLVEMENT > 0 ? involvement / MAX_INVOLVEMENT : 0;
  const r = Math.max(4.5, pitch.w * (0.0105 + normalized * 0.0105));

  glow(ctx, point.x, point.y, r * 3.2, accent, 0.055 + normalized * 0.095);

  ctx.beginPath();
  ctx.ellipse(point.x, point.y + r * 1.15, r * 1.65, r * 0.48, 0, 0, TAU);
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.fill();

  ctx.beginPath();
  ctx.arc(point.x, point.y, r, 0, TAU);
  ctx.fillStyle = player.role === "gk" ? "rgba(255,255,255,0.52)" : accent;
  ctx.globalAlpha = player.role === "gk" ? 0.62 : 0.76;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.strokeStyle = player.role === "fwd" ? "white" : accent2;
  ctx.globalAlpha = player.role === "fwd" ? 0.46 : 0.34;
  ctx.lineWidth = Math.max(1, pitch.w * 0.002);
  ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(point.x - r * 0.26, point.y - r * 0.25, r * 0.22, 0, TAU);
  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.42;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawAverageLabel(ctx: CanvasRenderingContext2D, pitch: Rect, accent2: string): void {
  ctx.save();
  ctx.globalAlpha = 0.54;
  ctx.fillStyle = accent2;
  ctx.font = `${Math.max(8, pitch.w * 0.018)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("AVERAGE POSITIONS", pitch.x + pitch.w * 0.035, pitch.y + pitch.h * 0.075);
  ctx.restore();
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const primary = accent || RED;
    const secondary = accent2 || RED_SOFT;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 7.2, speed: 0.014 },
      ({ ctx, w, h }, t) => {
        const pitch = pitchRect(w, h);
        const points = new Map<number, Point>();
        for (const player of PLAYERS) {
          points.set(player.id, playerPoint(player, pitch));
        }

        drawBackdrop(ctx, w, h, primary, secondary);
        drawPitch(ctx, pitch);
        drawThreatGrid(ctx, pitch, t, primary, secondary);
        drawPitchMarks(ctx, pitch);
        drawEdges(ctx, points, pitch, primary, secondary);
        drawLivePass(ctx, points, pitch, t, primary);

        for (const player of PLAYERS) {
          const point = points.get(player.id);
          if (point) drawNode(ctx, player, point, pitch, primary, secondary);
        }

        const target = mapPitch(pitch, 1, 0);
        ctx.beginPath();
        ctx.moveTo(target.x - pitch.w * 0.045, target.y);
        ctx.lineTo(target.x - pitch.w * 0.014, target.y - pitch.h * 0.055);
        ctx.lineTo(target.x - pitch.w * 0.014, target.y + pitch.h * 0.055);
        ctx.closePath();
        ctx.fillStyle = primary;
        ctx.globalAlpha = 0.14;
        ctx.fill();
        ctx.globalAlpha = 1;

        drawAverageLabel(ctx, pitch, secondary);

        const anchor = playerPoint(findPlayer(10), pitch);
        glow(ctx, anchor.x, anchor.y, Math.max(22, pitch.w * 0.045), primary, 0.12);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
