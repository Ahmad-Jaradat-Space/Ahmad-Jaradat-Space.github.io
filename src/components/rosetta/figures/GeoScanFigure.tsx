"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Severity = 0 | 1 | 2 | 3;
type TileData = {
  preNbr: number;
  postNbr: number;
  dNbr: number;
  severity: Severity;
};

const COLS = 14;
const ROWS = 9;
const SEVERITY_STOPS: readonly {
  label: string;
  color: readonly [number, number, number];
}[] = [
  { label: "unburned", color: [46, 132, 74] },
  { label: "low", color: [238, 210, 68] },
  { label: "moderate", color: [231, 129, 45] },
  { label: "high", color: [203, 55, 47] },
];

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function clamp01(value: number): number {
  return clamp(value, 0, 1);
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function rgba(rgb: readonly [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function mapRect(w: number, h: number): Rect {
  return {
    x: w * 0.09,
    y: h * 0.13,
    w: w * 0.82,
    h: h * 0.72,
  };
}

function smoothField(x: number, y: number, seed: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth01(x - x0);
  const ty = smooth01(y - y0);
  const sample = (ix: number, iy: number) => rnd(seed + ix * 37.19 + iy * 101.73);
  const a = sample(x0, y0);
  const b = sample(x0 + 1, y0);
  const c = sample(x0, y0 + 1);
  const d = sample(x0 + 1, y0 + 1);
  return lerp(lerp(a, b, tx), lerp(c, d, tx), ty);
}

function severityForDnbr(dNbr: number): Severity {
  if (dNbr < 0.1) return 0;
  if (dNbr < 0.27) return 1;
  if (dNbr < 0.66) return 2;
  return 3;
}

function burnPressure(u: number, v: number): number {
  const core = Math.exp(-(((u - 0.58) / 0.27) ** 2 + ((v - 0.57) / 0.22) ** 2));
  const shoulder = Math.exp(-(((u - 0.36) / 0.18) ** 2 + ((v - 0.36) / 0.25) ** 2));
  const texture = smoothField(u * 4.3 + 0.8, v * 4.1 + 1.4, 59);
  return clamp01(core * 1.08 + shoulder * 0.48 + (texture - 0.48) * 0.38 - 0.08);
}

function tileData(col: number, row: number): TileData {
  const u = (col + 0.5) / COLS;
  const v = (row + 0.5) / ROWS;
  const vegetation = smoothField(u * 3.1, v * 2.8, 17);
  const moisture = smoothField(u * 1.9 + 2.1, v * 1.7 + 0.6, 33);
  const terrain = Math.sin(u * Math.PI * 2.2 + v * Math.PI * 0.7) * 0.035;
  const preNbr = clamp(0.35 + vegetation * 0.34 + moisture * 0.13 + terrain, -0.2, 0.86);
  const pressure = burnPressure(u, v);
  const lossTexture = (smoothField(u * 5.2 + 0.4, v * 5.5 + 0.2, 83) - 0.5) * 0.055;
  const nbrLoss = clamp(pressure * (0.36 + preNbr * 0.62) + lossTexture, 0, 0.95);
  const postNbr = clamp(preNbr - nbrLoss, -0.28, 0.82);
  const dNbr = preNbr - postNbr;

  return {
    preNbr,
    postNbr,
    dNbr,
    severity: severityForDnbr(dNbr),
  };
}

function preFill(data: TileData, col: number, row: number): string {
  const veg = clamp01((data.preNbr + 0.05) / 0.9);
  const texture = (rnd(col * 19.3 + row * 43.7) - 0.5) * 12;
  const r = Math.round(42 + (1 - veg) * 56 + texture);
  const g = Math.round(92 + veg * 102 + texture * 0.4);
  const b = Math.round(54 + veg * 42);
  return `rgba(${r}, ${g}, ${b}, 0.64)`;
}

function severityFill(data: TileData, reveal: number): string {
  const stop = SEVERITY_STOPS[data.severity] ?? SEVERITY_STOPS[0]!;
  const alpha = 0.2 + reveal * (0.48 + data.dNbr * 0.22);
  return rgba(stop.color, clamp(alpha, 0.2, 0.88));
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.48, h * 0.46, 0, w * 0.48, h * 0.46, r * 0.72);
  bg.addColorStop(0, "rgba(4,18,12,0.74)");
  bg.addColorStop(0.58, "rgba(2,10,8,0.42)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  glow(ctx, w * 0.35, h * 0.34, r * 0.25, accent, 0.035);
  glow(ctx, w * 0.78, h * 0.7, r * 0.22, accent2, 0.03);
}

function strokeMapFrame(ctx: CanvasRenderingContext2D, rect: Rect, accent: string): void {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.26;
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);

  ctx.globalAlpha = 0.16;
  const corner = Math.min(rect.w, rect.h) * 0.075;
  const points: readonly Point[] = [
    { x: rect.x, y: rect.y },
    { x: rect.x + rect.w, y: rect.y },
    { x: rect.x + rect.w, y: rect.y + rect.h },
    { x: rect.x, y: rect.y + rect.h },
  ];
  for (const p of points) {
    const sx = p.x < rect.x + rect.w / 2 ? 1 : -1;
    const sy = p.y < rect.y + rect.h / 2 ? 1 : -1;
    ctx.beginPath();
    ctx.moveTo(p.x, p.y + sy * corner);
    ctx.lineTo(p.x, p.y);
    ctx.lineTo(p.x + sx * corner, p.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTerrainGrid(ctx: CanvasRenderingContext2D, rect: Rect, accent2: string): void {
  ctx.save();
  ctx.strokeStyle = "rgba(188, 255, 210, 0.075)";
  ctx.lineWidth = 1;
  for (let col = 0; col <= COLS; col += 1) {
    const x = rect.x + (rect.w * col) / COLS;
    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
    ctx.stroke();
  }
  for (let row = 0; row <= ROWS; row += 1) {
    const y = rect.y + (rect.h * row) / ROWS;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    ctx.stroke();
  }

  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.08;
  for (let col = 1; col < COLS; col += 3) {
    const x = rect.x + (rect.w * (col + 0.22)) / COLS;
    ctx.beginPath();
    ctx.moveTo(x, rect.y + rect.h * 0.07);
    ctx.lineTo(x + rect.w * 0.035, rect.y + rect.h * 0.93);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTiles(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  sweep: number,
  strength: number,
): void {
  const tileW = rect.w / COLS;
  const tileH = rect.h / ROWS;
  const inset = Math.max(0.7, Math.min(tileW, tileH) * 0.03);

  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const data = tileData(col, row);
      const x = rect.x + col * tileW;
      const y = rect.y + row * tileH;
      ctx.fillStyle = preFill(data, col, row);
      ctx.fillRect(x + inset, y + inset, tileW - inset * 2, tileH - inset * 2);
    }
  }

  if (sweep <= 0.01 || strength <= 0.01) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w * sweep, rect.h);
  ctx.clip();
  ctx.globalAlpha = strength;
  for (let row = 0; row < ROWS; row += 1) {
    for (let col = 0; col < COLS; col += 1) {
      const data = tileData(col, row);
      const x = rect.x + col * tileW;
      const y = rect.y + row * tileH;
      ctx.fillStyle = severityFill(data, 1);
      ctx.fillRect(x + inset, y + inset, tileW - inset * 2, tileH - inset * 2);
    }
  }
  ctx.restore();
}

function drawContours(ctx: CanvasRenderingContext2D, rect: Rect, accent: string, accent2: string): void {
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  for (let line = 0; line < 6; line += 1) {
    const yBase = rect.y + rect.h * (0.14 + line * 0.13);
    ctx.beginPath();
    for (let i = 0; i <= 64; i += 1) {
      const u = i / 64;
      const wave =
        Math.sin(u * Math.PI * 2.4 + line * 0.88) * rect.h * 0.025 +
        Math.sin(u * Math.PI * 5.2 + line * 0.42) * rect.h * 0.012;
      const x = rect.x + u * rect.w;
      const y = yBase + wave + (rnd(line * 19.4 + i * 0.17) - 0.5) * rect.h * 0.006;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = line % 2 === 0 ? accent : accent2;
    ctx.globalAlpha = line % 2 === 0 ? 0.11 : 0.075;
    ctx.lineWidth = 1;
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawRevealDivider(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  reveal: number,
  accent2: string,
): void {
  if (reveal <= 0.03 || reveal >= 0.98) return;

  const x = rect.x + rect.w * reveal;
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  // soft trailing band behind the scanline
  const band = ctx.createLinearGradient(x - rect.w * 0.08, 0, x, 0);
  band.addColorStop(0, "rgba(235, 255, 243, 0)");
  band.addColorStop(1, "rgba(235, 255, 243, 0.14)");
  ctx.fillStyle = band;
  ctx.fillRect(x - rect.w * 0.08, rect.y, rect.w * 0.08, rect.h);

  ctx.strokeStyle = "rgba(240, 255, 246, 0.85)";
  ctx.lineWidth = Math.max(1.2, rect.w * 0.0028);
  ctx.shadowColor = accent2;
  ctx.shadowBlur = Math.max(6, rect.w * 0.015);
  ctx.beginPath();
  ctx.moveTo(x, rect.y);
  ctx.lineTo(x, rect.y + rect.h);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.fillStyle = "rgba(240, 255, 246, 0.9)";
  ctx.beginPath();
  ctx.arc(x, rect.y + rect.h * 0.5, Math.max(2.5, rect.w * 0.006), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawLabels(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  reveal: number,
  compact: boolean,
): void {
  ctx.save();
  const fs = compact ? 9 : 10;
  ctx.font = `600 ${fs}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "rgba(229, 255, 240, 0.78)";
  ctx.globalAlpha = 0.7;
  ctx.fillText(compact ? "BEFORE" : "BEFORE NBR", rect.x + 8, rect.y + 8);
  if (reveal > 0.26) {
    ctx.textAlign = "right";
    ctx.fillText(compact ? "dNBR" : "dNBR MASK", rect.x + rect.w - 8, rect.y + 8);
  }

  if (!compact) {
    ctx.textAlign = "left";
    ctx.textBaseline = "bottom";
    ctx.globalAlpha = 0.56;
    ctx.fillText("dNBR = NBR_pre - NBR_post", rect.x + 8, rect.y + rect.h - 8);
  }
  ctx.restore();
}

function drawLegend(ctx: CanvasRenderingContext2D, rect: Rect): void {
  const swatch = Math.max(7, Math.min(10, rect.w * 0.025));
  const groupW = rect.w / SEVERITY_STOPS.length;
  const y = rect.y + rect.h + Math.min(22, rect.h * 0.08);

  ctx.save();
  const fs = Math.max(8, Math.min(10, rect.w * 0.026));
  ctx.font = `500 ${fs}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "rgba(229, 255, 240, 0.7)";
  ctx.globalAlpha = 0.82;

  SEVERITY_STOPS.forEach((stop, index) => {
    const x = rect.x + groupW * index;
    ctx.fillStyle = rgba(stop.color, 0.88);
    ctx.fillRect(x, y - swatch * 0.5, swatch, swatch);
    ctx.fillStyle = "rgba(229, 255, 240, 0.72)";
    ctx.fillText(stop.label, x + swatch + 5, y);
  });
  ctx.restore();
}

export default function GeoScanFigure({
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
      { active, reduced, staticT: 5.1, speed: 0.014 },
      ({ ctx, w, h }, t) => {
        const rect = mapRect(w, h);
        const compact = h < 200;
        const phase = (t % 7.2) / 7.2;
        // short "before" beat → scan sweep → hold the mask → fade back
        const sweep =
          phase < 0.06 ? 0 : phase < 0.5 ? smooth01((phase - 0.06) / 0.44) : 1;
        const strength = phase < 0.84 ? 1 : 1 - smooth01((phase - 0.84) / 0.16);

        drawBackdrop(ctx, w, h, accent, accent2);
        drawTiles(ctx, rect, sweep, strength);
        drawContours(ctx, rect, accent, accent2);
        drawTerrainGrid(ctx, rect, accent2);
        drawRevealDivider(ctx, rect, sweep, accent2);
        drawLabels(ctx, rect, sweep * strength, compact);
        strokeMapFrame(ctx, rect, accent);
        drawLegend(ctx, rect);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
