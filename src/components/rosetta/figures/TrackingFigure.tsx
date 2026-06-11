"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

const TAU = Math.PI * 2;
const HOT = "#fff3ea";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type Track = {
  id: string;
  confidence: number;
  x: number;
  y: number;
  seed: number;
};

const TRACKS: readonly Track[] = [
  { id: "#7", confidence: 0.94, x: -0.62, y: 0.28, seed: 1.4 },
  { id: "#11", confidence: 0.91, x: -0.22, y: -0.24, seed: 2.8 },
  { id: "#6", confidence: 0.96, x: 0.18, y: 0.18, seed: 4.2 },
  { id: "#9", confidence: 0.89, x: 0.52, y: -0.08, seed: 5.6 },
  { id: "#3", confidence: 0.93, x: 0.72, y: 0.34, seed: 7.1 },
];

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function stageRect(w: number, h: number): Rect {
  const marginX = w * 0.09;
  const marginY = h * 0.12;
  return {
    x: marginX,
    y: marginY,
    w: w - marginX * 2,
    h: h - marginY * 1.55,
  };
}

function roundRect(ctx: CanvasRenderingContext2D, rect: Rect, radius: number): void {
  const r = Math.min(radius, rect.w / 2, rect.h / 2);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y + rect.h, rect.x + rect.w - r, rect.y + rect.h);
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
  ctx.closePath();
}

function trackPoint(track: Track, t: number): Point {
  const speed = 0.34 + rnd(track.seed + 10) * 0.22;
  const swayX = 0.11 + rnd(track.seed + 20) * 0.07;
  const swayY = 0.08 + rnd(track.seed + 30) * 0.06;
  return {
    x: clamp(track.x + Math.sin(t * speed + track.seed * 1.8) * swayX, -0.86, 0.86),
    y: clamp(track.y + Math.cos(t * (speed * 0.92) + track.seed * 2.25) * swayY, -0.72, 0.72),
  };
}

function project(stage: Rect, point: Point): Point {
  const depth = (point.y + 1) / 2;
  const perspective = 0.86 + depth * 0.14;
  return {
    x: stage.x + stage.w * 0.5 + point.x * stage.w * 0.44 * perspective,
    y: stage.y + stage.h * (0.14 + depth * 0.78),
  };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.5, h * 0.45, 0, w * 0.5, h * 0.45, r * 0.72);
  bg.addColorStop(0, "rgba(8,11,14,0.7)");
  bg.addColorStop(0.6, "rgba(4,7,10,0.48)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.32, h * 0.78, r * 0.34, accent2, 0.035);
}

function drawCalibrationGrid(ctx: CanvasRenderingContext2D, stage: Rect): void {
  ctx.save();
  ctx.strokeStyle = "rgba(225,236,235,0.055)";
  ctx.lineWidth = 1;

  for (let i = 0; i <= 6; i += 1) {
    const y = stage.y + stage.h * (0.17 + i * 0.118);
    const left = stage.x + stage.w * (0.08 + i * 0.008);
    const right = stage.x + stage.w * (0.92 - i * 0.008);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();
  }

  for (let i = -3; i <= 3; i += 1) {
    const top = stage.x + stage.w * (0.5 + i * 0.074);
    const bottom = stage.x + stage.w * (0.5 + i * 0.126);
    ctx.beginPath();
    ctx.moveTo(top, stage.y + stage.h * 0.15);
    ctx.lineTo(bottom, stage.y + stage.h * 0.9);
    ctx.stroke();
  }

  ctx.strokeStyle = "rgba(225,236,235,0.14)";
  ctx.lineWidth = Math.max(1, stage.w * 0.0018);
  const frame: Point[] = [
    { x: stage.x + stage.w * 0.1, y: stage.y + stage.h * 0.14 },
    { x: stage.x + stage.w * 0.9, y: stage.y + stage.h * 0.14 },
    { x: stage.x + stage.w * 0.96, y: stage.y + stage.h * 0.9 },
    { x: stage.x + stage.w * 0.04, y: stage.y + stage.h * 0.9 },
  ];
  ctx.beginPath();
  ctx.moveTo(frame[0]!.x, frame[0]!.y);
  for (let i = 1; i < frame.length; i += 1) ctx.lineTo(frame[i]!.x, frame[i]!.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawTrail(
  ctx: CanvasRenderingContext2D,
  stage: Rect,
  track: Track,
  t: number,
  accent: string,
): void {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  for (let i = 7; i >= 1; i -= 1) {
    const a = project(stage, trackPoint(track, t - i * 0.3));
    const b = project(stage, trackPoint(track, t - (i - 1) * 0.3));
    const fade = 1 - i / 7;
    ctx.globalAlpha = 0.025 + fade * 0.26;
    ctx.strokeStyle = fade > 0.82 ? HOT : accent;
    ctx.lineWidth = Math.max(1, stage.w * (0.0011 + fade * 0.0022));
    ctx.shadowColor = accent;
    ctx.shadowBlur = fade * 8;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawTrackSystemLabel(
  ctx: CanvasRenderingContext2D,
  stage: Rect,
  accent: string,
): void {
  const fs = clamp(stage.w * 0.026, 9, 12);

  ctx.save();
  ctx.globalAlpha = 0.62;
  ctx.fillStyle = accent;
  ctx.font = `${fs}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  ctx.fillText("YOLO boxes + ByteTrack IDs", stage.x + stage.w * 0.045, stage.y + stage.h * 0.955);
  ctx.restore();
}

type Tag = { text: string; rect: Rect; fs: number; anchor: Point };

function tagFont(fs: number): string {
  return `${fs}px ui-monospace, SFMono-Regular, Menlo, Consolas, monospace`;
}

function computeTag(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  w: number,
): Tag {
  const fs = clamp(w * 0.026, 9, 12);
  ctx.font = tagFont(fs);
  const padX = fs * 0.48;
  const padY = fs * 0.28;
  const tw = ctx.measureText(text).width;
  return {
    text,
    fs,
    anchor: { x, y },
    rect: {
      x: clamp(x + fs * 0.85, 6, w - tw - padX * 2 - 6),
      y: Math.max(6, y - fs * 2.15),
      w: tw + padX * 2,
      h: fs + padY * 2,
    },
  };
}

function rectsTouch(a: Rect, b: Rect, gap: number): boolean {
  return (
    a.x < b.x + b.w + gap &&
    a.x + a.w + gap > b.x &&
    a.y < b.y + b.h + gap &&
    a.y + a.h + gap > b.y
  );
}

/** Push colliding tags upward so clustered players keep readable IDs. */
function declutterTags(tags: Tag[]): void {
  const placed: Rect[] = [];
  for (const tag of tags) {
    for (let attempt = 0; attempt < 8; attempt += 1) {
      const hit = placed.find((r) => rectsTouch(tag.rect, r, 3));
      if (!hit) break;
      tag.rect.y = hit.y - tag.rect.h - 4;
      if (tag.rect.y < 6) {
        tag.rect.y = Math.max(...placed.map((r) => r.y + r.h)) + 4;
      }
    }
    placed.push(tag.rect);
  }
}

function drawTag(ctx: CanvasRenderingContext2D, tag: Tag, accent: string): void {
  const { rect, fs } = tag;
  const padX = fs * 0.48;

  ctx.save();
  // leader line when the tag was pushed away from its box
  const dy = tag.anchor.y - (rect.y + rect.h);
  if (dy > fs * 1.2) {
    ctx.strokeStyle = accent;
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.5, rect.y + rect.h);
    ctx.lineTo(tag.anchor.x, tag.anchor.y);
    ctx.stroke();
  }
  ctx.font = tagFont(fs);
  roundRect(ctx, rect, 5);
  ctx.globalAlpha = 1;
  ctx.fillStyle = "rgba(2,5,8,0.76)";
  ctx.fill();
  ctx.globalAlpha = 0.42;
  ctx.strokeStyle = accent;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.fillStyle = HOT;
  ctx.textBaseline = "middle";
  ctx.textAlign = "left";
  ctx.fillText(tag.text, rect.x + padX, rect.y + rect.h / 2);
  ctx.restore();
}

function drawYoloBox(
  ctx: CanvasRenderingContext2D,
  box: Rect,
  accent: string,
  scale: number,
): void {
  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.76;
  ctx.lineWidth = Math.max(1, scale * 1.4);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * 5;
  ctx.strokeRect(box.x, box.y, box.w, box.h);

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.95;
  ctx.strokeStyle = HOT;
  ctx.lineWidth = Math.max(1, scale);
  const tick = Math.min(box.w, box.h) * 0.18;
  ctx.beginPath();
  ctx.moveTo(box.x, box.y + tick);
  ctx.lineTo(box.x, box.y);
  ctx.lineTo(box.x + tick, box.y);
  ctx.moveTo(box.x + box.w - tick, box.y);
  ctx.lineTo(box.x + box.w, box.y);
  ctx.lineTo(box.x + box.w, box.y + tick);
  ctx.moveTo(box.x + box.w, box.y + box.h - tick);
  ctx.lineTo(box.x + box.w, box.y + box.h);
  ctx.lineTo(box.x + box.w - tick, box.y + box.h);
  ctx.moveTo(box.x + tick, box.y + box.h);
  ctx.lineTo(box.x, box.y + box.h);
  ctx.lineTo(box.x, box.y + box.h - tick);
  ctx.stroke();
  ctx.restore();
}

function drawTrack(
  ctx: CanvasRenderingContext2D,
  stage: Rect,
  track: Track,
  t: number,
  w: number,
  accent: string,
): Tag {
  const point = trackPoint(track, t);
  const p = project(stage, point);
  const depth = (point.y + 1) / 2;
  const scale = 0.82 + depth * 0.32;
  const unit = Math.min(stage.w, stage.h);
  const rx = unit * 0.035 * scale;
  const ry = unit * 0.013 * scale;
  const body = unit * 0.043 * scale;

  drawTrail(ctx, stage, track, t, accent);
  glow(ctx, p.x, p.y, rx * 2.2, accent, 0.1);

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.globalAlpha = 0.78;
  ctx.strokeStyle = accent;
  ctx.lineWidth = Math.max(1, unit * 0.003);
  ctx.shadowColor = accent;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, rx, ry, 0, 0, TAU);
  ctx.stroke();
  ctx.globalAlpha = 0.07;
  ctx.fillStyle = accent;
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.42)";
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + ry * 0.92, rx * 0.72, ry * 0.58, 0, 0, TAU);
  ctx.fill();

  ctx.fillStyle = "rgba(214,220,224,0.82)";
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - body * 0.55, body * 0.32, body * 0.58, 0.04, 0, TAU);
  ctx.fill();
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(p.x, p.y - body * 1.25, body * 0.22, 0, TAU);
  ctx.fillStyle = "rgba(235,239,241,0.9)";
  ctx.fill();

  ctx.strokeStyle = "rgba(255,255,255,0.26)";
  ctx.lineWidth = Math.max(1, body * 0.06);
  ctx.beginPath();
  ctx.moveTo(p.x - body * 0.27, p.y - body * 0.18);
  ctx.lineTo(p.x - body * 0.43, p.y + body * 0.38);
  ctx.moveTo(p.x + body * 0.25, p.y - body * 0.18);
  ctx.lineTo(p.x + body * 0.43, p.y + body * 0.32);
  ctx.stroke();
  ctx.restore();

  const box = {
    x: p.x - body * 0.62,
    y: p.y - body * 1.58,
    w: body * 1.24,
    h: body * 2.12,
  };
  drawYoloBox(ctx, box, accent, unit * 0.01);
  return computeTag(ctx, `ID ${track.id}`, box.x + box.w, box.y, w);
}

function drawRadar(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  tracks: readonly Track[],
  t: number,
  accent: string,
  accent2: string,
): void {
  const rw = Math.min(w * 0.24, h * 0.35, 132);
  const rh = rw * 0.64;
  const rect = { x: w - rw - w * 0.075, y: h * 0.095, w: rw, h: rh };

  ctx.save();
  roundRect(ctx, rect, 6);
  ctx.fillStyle = "rgba(2,5,8,0.58)";
  ctx.fill();
  ctx.globalAlpha = 0.3;
  ctx.strokeStyle = "rgba(230,238,238,0.3)";
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = HOT;
  ctx.beginPath();
  ctx.moveTo(rect.x + rect.w / 2, rect.y + 5);
  ctx.lineTo(rect.x + rect.w / 2, rect.y + rect.h - 5);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(rect.x + rect.w / 2, rect.y + rect.h / 2, rect.h * 0.18, 0, TAU);
  ctx.stroke();

  const corners: readonly Point[] = [
    { x: rect.x + 5, y: rect.y + 5 },
    { x: rect.x + rect.w - 5, y: rect.y + 5 },
    { x: rect.x + rect.w - 5, y: rect.y + rect.h - 5 },
    { x: rect.x + 5, y: rect.y + rect.h - 5 },
  ];
  ctx.globalAlpha = 0.82;
  ctx.fillStyle = HOT;
  ctx.font = `${Math.max(7, rect.w * 0.055)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  for (const [i, corner] of corners.entries()) {
    ctx.beginPath();
    ctx.arc(corner.x, corner.y, Math.max(2, rect.w * 0.018), 0, TAU);
    ctx.fill();
    ctx.fillText(String(i + 1), corner.x, corner.y + rect.h * 0.12 * (i < 2 ? 1 : -1));
  }
  ctx.globalAlpha = 0.48;
  ctx.fillStyle = accent2;
  ctx.fillText("H", rect.x + rect.w * 0.12, rect.y + rect.h * 0.5);

  ctx.globalCompositeOperation = "lighter";
  for (const track of tracks) {
    const p = trackPoint(track, t);
    const x = rect.x + ((p.x + 1) / 2) * rect.w;
    const y = rect.y + ((p.y + 1) / 2) * rect.h;
    glow(ctx, x, y, rect.w * 0.075, accent2, 0.08);
    ctx.globalAlpha = track.id === "#7" ? 0.92 : 0.6;
    ctx.fillStyle = track.id === "#7" ? HOT : accent;
    ctx.beginPath();
    ctx.arc(x, y, Math.max(2, rect.w * 0.017), 0, TAU);
    ctx.fill();
  }
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
      { active, reduced, staticT: 22.2, speed: 0.015 },
      ({ ctx, w, h }, t) => {
        const stage = stageRect(w, h);
        drawBackdrop(ctx, w, h, accent2);
        drawCalibrationGrid(ctx, stage);
        const tags = TRACKS.map((track) =>
          drawTrack(ctx, stage, track, t, w, accent),
        );
        declutterTags(tags);
        for (const tag of tags) drawTag(ctx, tag, accent);
        drawTrackSystemLabel(ctx, stage, accent);
        drawRadar(ctx, w, h, TRACKS, t, accent, accent2);
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
