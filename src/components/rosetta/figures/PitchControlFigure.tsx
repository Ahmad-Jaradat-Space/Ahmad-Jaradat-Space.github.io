"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

const TAU = Math.PI * 2;
const HOT = "#fff4ec";
const DEFENSE_COOL = "#7dd3fc";
const DEFENSE_NEUTRAL = "#94a3b8";

type Team = "attack" | "defense";
type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Player = {
  team: Team;
  x: number;
  y: number;
  seed: number;
  weight: number;
};

const PLAYERS: readonly Player[] = [
  { team: "attack", x: -0.76, y: 0.1, seed: 1.1, weight: 0.96 },
  { team: "attack", x: -0.44, y: -0.36, seed: 2.2, weight: 0.98 },
  { team: "attack", x: -0.24, y: 0.28, seed: 3.3, weight: 1.04 },
  { team: "attack", x: 0.08, y: -0.08, seed: 4.4, weight: 1.1 },
  { team: "attack", x: 0.42, y: 0.36, seed: 5.5, weight: 1.02 },
  { team: "attack", x: 0.73, y: -0.18, seed: 6.6, weight: 1.08 },
  { team: "defense", x: -0.58, y: -0.08, seed: 7.7, weight: 1.04 },
  { team: "defense", x: -0.18, y: -0.26, seed: 8.8, weight: 1.12 },
  { team: "defense", x: 0.04, y: 0.18, seed: 9.9, weight: 1.08 },
  { team: "defense", x: 0.34, y: -0.02, seed: 10.1, weight: 1.1 },
  { team: "defense", x: 0.58, y: 0.24, seed: 11.2, weight: 1.06 },
  { team: "defense", x: 0.82, y: 0.02, seed: 12.3, weight: 0.98 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function pitchRect(w: number, h: number): Rect {
  const ratio = 105 / 68;
  let pw = Math.min(w * 0.88, h * 1.36);
  let ph = pw / ratio;
  if (ph > h * 0.76) {
    ph = h * 0.76;
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

function driftPlayer(player: Player, t: number): Player {
  const sx = 0.02 + rnd(player.seed + 21) * 0.026;
  const sy = 0.018 + rnd(player.seed + 31) * 0.022;
  const pace = 0.42 + rnd(player.seed + 41) * 0.22;
  return {
    ...player,
    x: clamp(player.x + Math.sin(t * pace + player.seed * 1.7) * sx, -0.94, 0.94),
    y: clamp(
      player.y + Math.cos(t * (pace * 0.86) + player.seed * 2.1) * sy,
      -0.88,
      0.88,
    ),
  };
}

function controlAt(
  x: number,
  y: number,
  attackers: readonly Player[],
  defenders: readonly Player[],
): number {
  let attack = 0;
  let defense = 0;
  for (const player of attackers) {
    const dx = (x - player.x) * 1.03;
    const dy = y - player.y;
    attack += player.weight / (dx * dx + dy * dy + 0.033);
  }
  for (const player of defenders) {
    const dx = (x - player.x) * 1.03;
    const dy = y - player.y;
    defense += (player.weight * 1.05) / (dx * dx + dy * dy + 0.03);
  }
  return attack / (attack + defense || 1);
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.54, h * 0.46, 0, w * 0.54, h * 0.46, r * 0.72);
  bg.addColorStop(0, "rgba(9,12,15,0.66)");
  bg.addColorStop(0.55, "rgba(4,7,10,0.46)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.72, h * 0.36, r * 0.42, accent2, 0.045);
}

function drawPitchBase(ctx: CanvasRenderingContext2D, pitch: Rect): void {
  ctx.save();
  ctx.fillStyle = "rgba(2,12,10,0.42)";
  ctx.strokeStyle = "rgba(227,236,235,0.12)";
  ctx.lineWidth = Math.max(1, pitch.w * 0.002);
  ctx.beginPath();
  ctx.rect(pitch.x, pitch.y, pitch.w, pitch.h);
  ctx.fill();
  ctx.stroke();
  ctx.clip();

  ctx.strokeStyle = "rgba(224,235,232,0.032)";
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

function drawPitchMarkings(ctx: CanvasRenderingContext2D, pitch: Rect): void {
  const lineWidth = Math.max(1, pitch.w * 0.0022);
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
  ctx.strokeStyle = "rgba(231,240,238,0.19)";
  ctx.fillStyle = "rgba(231,240,238,0.2)";
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(pitch.x, pitch.y, pitch.w, pitch.h);
  line(mapPitch(pitch, 0, -1), mapPitch(pitch, 0, 1));
  ctx.beginPath();
  const center = mapPitch(pitch, 0, 0);
  ctx.arc(center.x, center.y, pitch.h * 0.135, 0, TAU);
  ctx.stroke();
  box(-1, -0.42, -0.69, 0.42);
  box(0.69, -0.42, 1, 0.42);
  box(-1, -0.19, -0.89, 0.19);
  box(0.89, -0.19, 1, 0.19);
  for (const spot of [-0.78, 0.78]) {
    const p = mapPitch(pitch, spot, 0);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(1.2, pitch.w * 0.003), 0, TAU);
    ctx.fill();
  }
  ctx.restore();
}

function isoSegments(values: readonly number[], cols: number, rows: number, pitch: Rect): Array<[Point, Point]> {
  const get = (gx: number, gy: number) => values[gy * (cols + 1) + gx] ?? 0;
  const pointAt = (gx: number, gy: number): Point => ({
    x: pitch.x + (gx / cols) * pitch.w,
    y: pitch.y + (gy / rows) * pitch.h,
  });
  const cross = (a: number, b: number, pa: Point, pb: Point): Point | null => {
    if ((a < 0 && b < 0) || (a >= 0 && b >= 0)) return null;
    const q = Math.abs(a) / (Math.abs(a) + Math.abs(b));
    return { x: pa.x + (pb.x - pa.x) * q, y: pa.y + (pb.y - pa.y) * q };
  };
  const segments: Array<[Point, Point]> = [];

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const tl = get(gx, gy);
      const tr = get(gx + 1, gy);
      const br = get(gx + 1, gy + 1);
      const bl = get(gx, gy + 1);
      const ptl = pointAt(gx, gy);
      const ptr = pointAt(gx + 1, gy);
      const pbr = pointAt(gx + 1, gy + 1);
      const pbl = pointAt(gx, gy + 1);
      const pts = [
        cross(tl, tr, ptl, ptr),
        cross(tr, br, ptr, pbr),
        cross(bl, br, pbl, pbr),
        cross(tl, bl, ptl, pbl),
      ].filter((p): p is Point => p !== null);

      if (pts.length === 2) segments.push([pts[0]!, pts[1]!]);
      if (pts.length === 4) {
        segments.push([pts[0]!, pts[1]!]);
        segments.push([pts[2]!, pts[3]!]);
      }
    }
  }
  return segments;
}

function drawPitchControl(
  ctx: CanvasRenderingContext2D,
  pitch: Rect,
  attackers: readonly Player[],
  defenders: readonly Player[],
  accent: string,
): void {
  const cols = 56;
  const rows = 36;
  const values: number[] = new Array((cols + 1) * (rows + 1)).fill(0);

  for (let gy = 0; gy <= rows; gy += 1) {
    for (let gx = 0; gx <= cols; gx += 1) {
      const x = -1 + (gx / cols) * 2;
      const y = -1 + (gy / rows) * 2;
      values[gy * (cols + 1) + gx] = controlAt(x, y, attackers, defenders) - 0.5;
    }
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(pitch.x, pitch.y, pitch.w, pitch.h);
  ctx.clip();

  for (let gy = 0; gy < rows; gy += 1) {
    for (let gx = 0; gx < cols; gx += 1) {
      const i = gy * (cols + 1) + gx;
      const v =
        ((values[i] ?? 0) +
          (values[i + 1] ?? 0) +
          (values[i + cols + 1] ?? 0) +
          (values[i + cols + 2] ?? 0)) /
        4;
      const control = clamp(Math.abs(v) * 2, 0, 1);
      ctx.globalAlpha = 0.075 + control * 0.2;
      ctx.fillStyle = v >= 0 ? accent : DEFENSE_COOL;
      ctx.fillRect(
        pitch.x + (gx / cols) * pitch.w,
        pitch.y + (gy / rows) * pitch.h,
        pitch.w / cols + 0.9,
        pitch.h / rows + 0.9,
      );
    }
  }

  const segments = isoSegments(values, cols, rows, pitch);
  for (const [alpha, width, color, blur] of [
    [0.48, Math.max(1.15, pitch.w * 0.0032), HOT, 8],
    [0.26, Math.max(0.9, pitch.w * 0.0017), DEFENSE_NEUTRAL, 1],
  ] as const) {
    ctx.beginPath();
    for (const [a, b] of segments) {
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
    }
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.shadowColor = HOT;
    ctx.shadowBlur = blur;
    ctx.stroke();
  }

  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  pitch: Rect,
  player: Player,
  accent: string,
  key: boolean,
): void {
  const p = mapPitch(pitch, player.x, player.y);
  const r = pitch.w * (key ? 0.0135 : 0.011);
  const attacker = player.team === "attack";

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.38)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + r * 1.18, r * 1.85, r * 0.64, 0, 0, TAU);
  ctx.fill();

  if (attacker) {
    glow(ctx, p.x, p.y, r * (key ? 4.1 : 2.7), accent, key ? 0.18 : 0.08);
  }

  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, TAU);
  ctx.fillStyle = attacker ? "rgba(255,74,42,0.82)" : "rgba(210,218,222,0.72)";
  ctx.fill();
  ctx.lineWidth = Math.max(1, pitch.w * 0.0012);
  ctx.strokeStyle = attacker ? HOT : "rgba(232,238,240,0.28)";
  ctx.globalAlpha = attacker ? 0.82 : 0.48;
  ctx.stroke();

  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.arc(p.x - r * 0.25, p.y - r * 0.25, r * 0.24, 0, TAU);
  ctx.fillStyle = attacker ? HOT : "rgba(255,255,255,0.55)";
  ctx.fill();
  ctx.restore();
}

function drawControlLegend(
  ctx: CanvasRenderingContext2D,
  pitch: Rect,
  accent: string,
): void {
  const x = pitch.x + pitch.w * 0.035;
  const y = pitch.y + pitch.h * 0.09;
  const fs = Math.max(8, pitch.w * 0.018);
  const sw = pitch.w * 0.034;

  ctx.save();
  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(4, 8, 12, 0.52)";
  ctx.fillRect(x - sw * 0.45, y - fs * 1.5, sw * 6.4, fs * 4.6);

  ctx.fillStyle = "rgba(238,244,245,0.86)";
  ctx.font = `${fs}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("WHO CONTROLS EACH AREA", x, y - fs * 0.75);

  ctx.fillStyle = accent;
  ctx.globalAlpha = 0.78;
  ctx.fillRect(x, y, sw, fs * 0.58);
  ctx.fillStyle = "rgba(238,244,245,0.8)";
  ctx.globalAlpha = 0.82;
  ctx.fillText("attack", x + sw * 1.3, y + fs * 0.29);

  ctx.fillStyle = DEFENSE_COOL;
  ctx.globalAlpha = 0.62;
  ctx.fillRect(x, y + fs * 1.25, sw, fs * 0.58);
  ctx.fillStyle = "rgba(238,244,245,0.8)";
  ctx.globalAlpha = 0.82;
  ctx.fillText("defense", x + sw * 1.3, y + fs * 1.54);

  ctx.strokeStyle = HOT;
  ctx.globalAlpha = 0.78;
  ctx.lineWidth = Math.max(1, pitch.w * 0.002);
  ctx.beginPath();
  ctx.moveTo(x, y + fs * 2.75);
  ctx.lineTo(x + sw, y + fs * 2.75);
  ctx.stroke();
  ctx.fillStyle = "rgba(238,244,245,0.8)";
  ctx.fillText("0.5 boundary", x + sw * 1.3, y + fs * 2.75);
  ctx.restore();
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 18.4, speed: 0.014 },
      ({ ctx, w, h }, t) => {
        const pitch = pitchRect(w, h);
        const players = PLAYERS.map((player) => driftPlayer(player, t));
        const attackers = players.filter((player) => player.team === "attack");
        const defenders = players.filter((player) => player.team === "defense");

        drawBackdrop(ctx, w, h, accent2);
        drawPitchBase(ctx, pitch);
        drawPitchControl(ctx, pitch, attackers, defenders, accent);
        drawPitchMarkings(ctx, pitch);
        for (const player of players) {
          drawPlayer(ctx, pitch, player, accent, false);
        }
        drawControlLegend(ctx, pitch, accent);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
