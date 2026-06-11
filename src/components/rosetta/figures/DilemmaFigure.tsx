"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };

const VERMILION = "#ff4f38";
const WARM_WHITE = "#fff0e8";

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

function fieldRect(w: number, h: number): Rect {
  return {
    x: w * 0.08,
    y: h * 0.13,
    w: w * 0.84,
    h: h * 0.74,
  };
}

function p(rect: Rect, x: number, y: number): Point {
  return { x: rect.x + rect.w * x, y: rect.y + rect.h * y };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  const r = Math.max(w, h);
  const bg = ctx.createRadialGradient(w * 0.52, h * 0.52, 0, w * 0.52, h * 0.52, r * 0.72);
  bg.addColorStop(0, "rgba(26,8,8,0.7)");
  bg.addColorStop(0.55, "rgba(10,4,5,0.48)");
  bg.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);
  glow(ctx, w * 0.66, h * 0.5, r * 0.22, accent, 0.034);
  glow(ctx, w * 0.28, h * 0.55, r * 0.2, accent2, 0.024);
}

function drawField(ctx: CanvasRenderingContext2D, rect: Rect, accent2: string): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,228,218,0.075)";
  ctx.lineWidth = 1;
  for (let i = 0; i <= 6; i += 1) {
    const x = rect.x + (rect.w * i) / 6;
    ctx.beginPath();
    ctx.moveTo(x, rect.y + rect.h * 0.06);
    ctx.lineTo(x, rect.y + rect.h * 0.94);
    ctx.stroke();
  }
  for (let i = 0; i <= 4; i += 1) {
    const y = rect.y + (rect.h * (0.12 + i * 0.19));
    ctx.beginPath();
    ctx.moveTo(rect.x + rect.w * 0.04, y);
    ctx.lineTo(rect.x + rect.w * 0.96, y);
    ctx.stroke();
  }

  ctx.globalAlpha = 0.22;
  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(1, rect.w * 0.002);
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.restore();
}

function drawDefensiveLine(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  y: number,
  accent2: string,
): void {
  const a = p(rect, 0.28, y);
  const b = p(rect, 0.86, y);
  ctx.save();
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = Math.max(1, rect.w * 0.0025);
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  ctx.stroke();
  ctx.restore();
}

function drawPlayer(
  ctx: CanvasRenderingContext2D,
  point: Point,
  radius: number,
  fillColor: string,
  strokeColor: string,
  activeLevel: number,
): void {
  glow(ctx, point.x, point.y, radius * 3.2, strokeColor, 0.06 + activeLevel * 0.08);
  ctx.save();
  ctx.fillStyle = fillColor;
  ctx.strokeStyle = strokeColor;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(1, radius * 0.14);
  ctx.shadowColor = strokeColor;
  ctx.shadowBlur = radius * activeLevel * 1.5;
  ctx.beginPath();
  ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.55 + activeLevel * 0.28;
  ctx.stroke();
  ctx.restore();
}

function drawCoverShadow(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  carrier: Point,
  defender: Point,
  accent: string,
): void {
  const dx = defender.x - carrier.x;
  const dy = defender.y - carrier.y;
  const len = Math.hypot(dx, dy) || 1;
  const ux = dx / len;
  const uy = dy / len;
  const px = -uy;
  const py = ux;
  const farDistance = Math.hypot(rect.w, rect.h) * 0.78;
  const far = {
    x: carrier.x + ux * farDistance,
    y: carrier.y + uy * farDistance,
  };
  const halfWidth = Math.max(rect.w * 0.04, len * 0.32);
  const left = { x: far.x + px * halfWidth, y: far.y + py * halfWidth };
  const right = { x: far.x - px * halfWidth, y: far.y - py * halfWidth };
  const gradient = ctx.createLinearGradient(carrier.x, carrier.y, far.x, far.y);
  gradient.addColorStop(0, "rgba(255,82,62,0.28)");
  gradient.addColorStop(0.42, "rgba(255,82,62,0.15)");
  gradient.addColorStop(1, "rgba(255,82,62,0)");

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  ctx.fillStyle = gradient;
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.58;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(carrier.x, carrier.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.18;
  ctx.beginPath();
  ctx.moveTo(carrier.x, carrier.y);
  ctx.lineTo(far.x, far.y);
  ctx.stroke();
  ctx.globalAlpha = 0.16;
  ctx.beginPath();
  ctx.moveTo(carrier.x, carrier.y);
  ctx.lineTo(left.x, left.y);
  ctx.lineTo(right.x, right.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();
}

function drawLane(
  ctx: CanvasRenderingContext2D,
  from: Point,
  c1: Point,
  c2: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
  dashed: boolean,
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = alpha;
  ctx.lineWidth = width;
  if (dashed) ctx.setLineDash([6, 8]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.bezierCurveTo(c1.x, c1.y, c2.x, c2.y, to.x, to.y);
  ctx.stroke();
  ctx.restore();
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
  ctx.lineTo(tip.x - Math.cos(angle - 0.46) * size, tip.y - Math.sin(angle - 0.46) * size);
  ctx.lineTo(tip.x - Math.cos(angle + 0.46) * size, tip.y - Math.sin(angle + 0.46) * size);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawPass(
  ctx: CanvasRenderingContext2D,
  from: Point,
  gap: Point,
  to: Point,
  t: number,
  scale: number,
): void {
  glow(ctx, gap.x, gap.y, scale * 68, VERMILION, 0.08);
  ctx.save();
  ctx.strokeStyle = VERMILION;
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = Math.max(2, scale * 2.2);
  ctx.shadowColor = VERMILION;
  ctx.shadowBlur = scale * 16;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  const angle = Math.atan2(to.y - from.y, to.x - from.x);
  drawArrowHead(ctx, to, angle, scale * 10, VERMILION, 0.92);
  ctx.restore();

  const progress = (t * 0.22) % 1;
  const eased = smooth01(progress);
  const ball = {
    x: lerp(from.x, to.x, eased),
    y: lerp(from.y, to.y, eased),
  };
  glow(ctx, ball.x, ball.y, scale * 24, WARM_WHITE, 0.18);
  ctx.save();
  ctx.fillStyle = WARM_WHITE;
  ctx.globalAlpha = 0.95;
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, Math.max(2.6, scale * 4.2), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawFork(
  ctx: CanvasRenderingContext2D,
  center: Point,
  scale: number,
  accent: string,
): void {
  const stem = scale * 23;
  const wing = scale * 22;

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = Math.max(1, scale * 1.4);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * 8;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y + stem * 0.45);
  ctx.lineTo(center.x, center.y);
  ctx.lineTo(center.x - wing * 0.75, center.y - wing * 0.54);
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + wing * 0.75, center.y - wing * 0.54);
  ctx.stroke();

  drawArrowHead(ctx, { x: center.x - wing * 0.75, y: center.y - wing * 0.54 }, -2.52, scale * 7, accent, 0.74);
  drawArrowHead(ctx, { x: center.x + wing * 0.75, y: center.y - wing * 0.54 }, -0.62, scale * 7, accent, 0.74);
  ctx.restore();
}

function drawCaption(
  ctx: CanvasRenderingContext2D,
  text: string,
  at: Point,
  scale: number,
  color: string,
): void {
  ctx.save();
  ctx.font = `500 ${Math.max(9, scale * 10)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.62;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, at.x, at.y);
  ctx.restore();
}

export default function DilemmaFigure({
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
      { active, reduced, staticT: 4.1, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const rect = fieldRect(w, h);
        const scale = Math.min(w, h) / 320;
        const carrier = p(rect, 0.17, 0.53);
        const upperDefender = p(rect, 0.55, 0.39 + rnd(12.3) * 0.02);
        const lowerDefender = p(rect, 0.57, 0.61 - rnd(24.6) * 0.02);
        const gap = {
          x: (upperDefender.x + lowerDefender.x) / 2,
          y: (upperDefender.y + lowerDefender.y) / 2,
        };
        const receiverX = rect.x + rect.w * 0.78;
        const receiver = {
          x: receiverX,
          y: carrier.y + (gap.y - carrier.y) * ((receiverX - carrier.x) / (gap.x - carrier.x || 1)),
        };

        drawBackdrop(ctx, w, h, accent, accent2);
        drawField(ctx, rect, accent2);
        drawDefensiveLine(ctx, rect, 0.33, accent2);
        drawDefensiveLine(ctx, rect, 0.67, accent2);

        drawCoverShadow(ctx, rect, carrier, upperDefender, accent);
        drawCoverShadow(ctx, rect, carrier, lowerDefender, accent);

        drawLane(ctx, carrier, p(rect, 0.38, 0.35), p(rect, 0.58, 0.38), receiver, accent2, 0.22, 1, true);
        drawLane(ctx, carrier, p(rect, 0.38, 0.66), p(rect, 0.59, 0.63), receiver, accent2, 0.22, 1, true);
        drawPass(ctx, carrier, gap, receiver, t, scale);

        const defenders: readonly Point[] = [
          p(rect, 0.36, 0.33),
          upperDefender,
          p(rect, 0.76, 0.33),
          p(rect, 0.36, 0.67),
          lowerDefender,
          p(rect, 0.75, 0.67),
        ];

        for (const defender of defenders) {
          const near =
            Math.abs(defender.x - upperDefender.x) < 1 && Math.abs(defender.y - upperDefender.y) < 1
              ? 1
              : Math.abs(defender.x - lowerDefender.x) < 1 && Math.abs(defender.y - lowerDefender.y) < 1
                ? 1
                : 0.35;
          drawPlayer(
            ctx,
            defender,
            Math.max(5, scale * 8.2),
            "rgba(42,15,16,0.92)",
            near > 0.5 ? accent : "rgba(255,167,148,0.56)",
            near,
          );
        }

        drawPlayer(ctx, carrier, Math.max(6, scale * 9), "rgba(255,79,56,0.9)", VERMILION, 1);
        drawPlayer(ctx, receiver, Math.max(6, scale * 8.5), "rgba(255,238,231,0.82)", WARM_WHITE, 0.82);
        drawFork(ctx, p(rect, 0.56, 0.28), scale, accent);

        if (w >= 380) {
          drawCaption(
            ctx,
            "carrier",
            { x: carrier.x, y: carrier.y + rect.h * 0.11 },
            scale,
            "rgba(255,228,218,0.9)",
          );
          drawCaption(
            ctx,
            "free man",
            { x: receiver.x, y: receiver.y + rect.h * 0.11 },
            scale,
            "rgba(255,238,231,0.95)",
          );
          drawCaption(ctx, "cover shadow", p(rect, 0.8, 0.16), scale, accent);
          drawCaption(ctx, "cover shadow", p(rect, 0.8, 0.86), scale, accent);
        }
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
