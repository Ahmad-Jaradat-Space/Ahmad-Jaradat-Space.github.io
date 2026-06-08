"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = {
  x: number;
  y: number;
};

const TAU = Math.PI * 2;

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

function ellipsePoint(
  center: Point,
  rx: number,
  ry: number,
  rotation: number,
  angle: number,
): Point {
  const ca = Math.cos(angle);
  const sa = Math.sin(angle);
  const cr = Math.cos(rotation);
  const sr = Math.sin(rotation);
  return {
    x: center.x + ca * rx * cr - sa * ry * sr,
    y: center.y + ca * rx * sr + sa * ry * cr,
  };
}

function drawEarth(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  accent: string,
  accent2: string,
): void {
  glow(ctx, center.x, center.y, radius * 2.1, accent, 0.11);

  const g = ctx.createRadialGradient(
    center.x - radius * 0.4,
    center.y - radius * 0.5,
    0,
    center.x,
    center.y,
    radius * 1.18,
  );
  g.addColorStop(0, "rgba(245, 252, 255, 0.96)");
  g.addColorStop(0.38, accent);
  g.addColorStop(1, "rgba(4, 20, 55, 0.92)");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  ctx.clip();

  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(0.8, radius * 0.026);
  ctx.globalAlpha = 0.22;
  for (let i = -2; i <= 2; i += 1) {
    ctx.beginPath();
    ctx.ellipse(
      center.x,
      center.y + i * radius * 0.26,
      radius * 0.9,
      radius * (0.12 + Math.abs(i) * 0.02),
      -0.18,
      0,
      TAU,
    );
    ctx.stroke();
  }

  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.moveTo(center.x - radius * 0.56, center.y - radius * 0.12);
  ctx.bezierCurveTo(
    center.x - radius * 0.28,
    center.y - radius * 0.28,
    center.x - radius * 0.08,
    center.y + radius * 0.08,
    center.x + radius * 0.24,
    center.y - radius * 0.04,
  );
  ctx.bezierCurveTo(
    center.x + radius * 0.42,
    center.y - radius * 0.12,
    center.x + radius * 0.5,
    center.y + radius * 0.22,
    center.x + radius * 0.2,
    center.y + radius * 0.36,
  );
  ctx.stroke();
  ctx.restore();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, -0.35, 4.5);
  strokePath(ctx, "white", 0.22, Math.max(1, radius * 0.018));
}

function drawGroundStation(
  ctx: CanvasRenderingContext2D,
  p: Point,
  size: number,
  angle: number,
  accent: string,
  accent2: string,
): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = Math.max(1, size * 0.04);

  ctx.beginPath();
  ctx.moveTo(-size * 0.48, -size * 0.08);
  ctx.quadraticCurveTo(0, size * 0.26, size * 0.48, -size * 0.08);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(-size * 0.28, size * 0.03);
  ctx.lineTo(0, -size * 0.36);
  ctx.lineTo(size * 0.28, size * 0.03);
  ctx.moveTo(0, size * 0.14);
  ctx.lineTo(0, size * 0.58);
  ctx.moveTo(-size * 0.28, size * 0.58);
  ctx.lineTo(size * 0.28, size * 0.58);
  ctx.stroke();

  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.7;
  ctx.beginPath();
  ctx.arc(0, -size * 0.36, size * 0.06, 0, TAU);
  strokePath(ctx, "white", 0.55, Math.max(1, size * 0.026));
  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawQuasar(
  ctx: CanvasRenderingContext2D,
  p: Point,
  radius: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const pulse = 0.68 + 0.32 * Math.sin(t * 1.7);
  glow(ctx, p.x, p.y, radius * 5.2, accent, 0.16 + pulse * 0.05);
  glow(ctx, p.x, p.y, radius * 2.4, "white", 0.16 + pulse * 0.09);

  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(t * 0.08);
  ctx.strokeStyle = accent2;
  ctx.lineWidth = Math.max(1, radius * 0.42);
  ctx.globalAlpha = 0.42;
  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * Math.PI;
    ctx.beginPath();
    ctx.moveTo(Math.cos(a) * radius * 1.5, Math.sin(a) * radius * 1.5);
    ctx.lineTo(Math.cos(a) * radius * 4.8, Math.sin(a) * radius * 4.8);
    ctx.stroke();
  }
  ctx.restore();

  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.9;
  ctx.beginPath();
  ctx.arc(p.x, p.y, radius * (0.8 + pulse * 0.18), 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawSatellite(
  ctx: CanvasRenderingContext2D,
  p: Point,
  angle: number,
  size: number,
  accent: string,
  accent2: string,
): void {
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(angle);
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.8;
  ctx.strokeStyle = accent;
  ctx.fillStyle = "rgba(56, 189, 248, 0.14)";
  ctx.globalAlpha = 0.94;
  ctx.lineWidth = Math.max(1, size * 0.045);

  ctx.beginPath();
  ctx.rect(-size * 0.2, -size * 0.16, size * 0.4, size * 0.32);
  ctx.fill();
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.strokeStyle = accent2;
  ctx.globalAlpha = 0.62;
  ctx.beginPath();
  ctx.moveTo(-size * 0.2, 0);
  ctx.lineTo(-size * 0.68, 0);
  ctx.moveTo(size * 0.2, 0);
  ctx.lineTo(size * 0.68, 0);
  ctx.stroke();

  for (const side of [-1, 1]) {
    ctx.fillStyle = "rgba(125, 211, 252, 0.1)";
    ctx.strokeStyle = accent2;
    ctx.beginPath();
    ctx.rect(side * size * 0.68 - (side < 0 ? size * 0.48 : 0), -size * 0.18, size * 0.48, size * 0.36);
    ctx.fill();
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(side * size * 0.5, -size * 0.18);
    ctx.lineTo(side * size * 0.5, size * 0.18);
    ctx.moveTo(side * size * 0.34, -size * 0.18);
    ctx.lineTo(side * size * 0.34, size * 0.18);
    ctx.stroke();
  }

  ctx.strokeStyle = "white";
  ctx.globalAlpha = 0.5;
  ctx.beginPath();
  ctx.moveTo(0, -size * 0.16);
  ctx.lineTo(0, -size * 0.44);
  ctx.moveTo(-size * 0.09, -size * 0.38);
  ctx.lineTo(size * 0.09, -size * 0.38);
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;
}

function drawTieLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
): void {
  ctx.save();
  ctx.setLineDash([5, 8]);
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  strokePath(ctx, color, alpha, 1);
  ctx.restore();
}

function drawBeam(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  t: number,
  seed: number,
  color: string,
  accent2: string,
): void {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const length = Math.hypot(dx, dy);
  if (length <= 0) return;
  const nx = dx / length;
  const ny = dy / length;
  const tx = -ny;
  const ty = nx;

  const beam = ctx.createLinearGradient(from.x, from.y, to.x, to.y);
  beam.addColorStop(0, "rgba(0,0,0,0)");
  beam.addColorStop(0.18, color);
  beam.addColorStop(0.74, accent2);
  beam.addColorStop(1, "rgba(255,255,255,0.42)");

  ctx.save();
  ctx.strokeStyle = beam;
  ctx.globalAlpha = 0.22;
  ctx.lineWidth = 1.25;
  ctx.shadowColor = color;
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();

  for (let i = 0; i < 3; i += 1) {
    const p = wrap(t * 0.36 + seed + i / 3, 1);
    const fade = smooth01(p / 0.12) * (1 - smooth01((p - 0.88) / 0.12));
    const x = lerp(from.x, to.x, p);
    const y = lerp(from.y, to.y, p);
    const span = Math.max(8, length * 0.045);
    ctx.globalAlpha = fade * 0.75;
    ctx.lineWidth = 1.8;
    ctx.strokeStyle = "white";
    ctx.beginPath();
    ctx.moveTo(x - nx * span * 0.5 + tx * 2.2, y - ny * span * 0.5 + ty * 2.2);
    ctx.lineTo(x + nx * span * 0.5 + tx * 2.2, y + ny * span * 0.5 + ty * 2.2);
    ctx.stroke();
    glow(ctx, x, y, 12, color, fade * 0.08);
  }

  ctx.restore();
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
      { active, reduced: Boolean(reduced), staticT: 3.4, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const earth = { x: w * 0.39, y: h * 0.64 };
        const earthR = Math.max(34, minSide * 0.115);
        const orbitCenter = earth;
        const orbitRx = Math.min(w * 0.35, minSide * 0.46);
        const orbitRy = orbitRx * 0.48;
        const orbitRot = -0.18;
        const satAngle = -0.86 + Math.sin(t * 0.32) * 0.16;
        const sat = ellipsePoint(orbitCenter, orbitRx, orbitRy, orbitRot, satAngle);
        const satNext = ellipsePoint(orbitCenter, orbitRx, orbitRy, orbitRot, satAngle + 0.02);
        const satRot = Math.atan2(satNext.y - sat.y, satNext.x - sat.x);
        const quasar = { x: w * 0.84, y: h * 0.16 };
        const stationA = {
          x: earth.x + earthR * 0.62,
          y: earth.y - earthR * 0.58,
        };
        const stationB = {
          x: earth.x - earthR * 0.58,
          y: earth.y - earthR * 0.28,
        };
        const incoming = { x: -0.38, y: 0.92 };
        const rayLength = Math.hypot(w, h) * 0.78;
        const skyA = {
          x: stationA.x - incoming.x * rayLength,
          y: stationA.y - incoming.y * rayLength,
        };
        const skyB = {
          x: stationB.x - incoming.x * rayLength,
          y: stationB.y - incoming.y * rayLength,
        };
        const stationSize = Math.max(20, minSide * 0.06);
        const stationAAngle = Math.atan2(sat.x - stationA.x, -(sat.y - stationA.y));
        const stationBAngle = Math.atan2(sat.x - stationB.x, -(sat.y - stationB.y));

        ctx.fillStyle = "rgba(1, 7, 18, 0.14)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 40; i += 1) {
          glow(
            ctx,
            rnd(i + 31.2) * w,
            rnd(i + 71.9) * h * 0.86,
            1.5 + rnd(i + 124.4) * 3.6,
            i % 7 === 0 ? "white" : i % 3 === 0 ? accent : accent2,
            0.014 + rnd(i + 8.4) * 0.012,
          );
        }

        ctx.save();
        ctx.translate(orbitCenter.x, orbitCenter.y);
        ctx.rotate(orbitRot);
        ctx.setLineDash([6, 10]);
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRx, orbitRy, 0, Math.PI * 1.02, Math.PI * 1.92);
        strokePath(ctx, accent2, 0.22, 1);
        ctx.setLineDash([]);
        ctx.beginPath();
        ctx.ellipse(0, 0, orbitRx, orbitRy, 0, Math.PI * 0.03, Math.PI * 0.92);
        strokePath(ctx, accent, 0.1, 0.8);
        ctx.restore();

        drawEarth(ctx, earth, earthR, accent, accent2);

        drawTieLine(ctx, stationA, stationB, "white", 0.18);
        drawTieLine(ctx, stationA, sat, accent2, 0.2);
        drawTieLine(ctx, stationB, sat, accent2, 0.2);

        drawBeam(ctx, skyA, stationA, t, 0.08, accent2, accent);
        drawBeam(ctx, skyB, stationB, t, 0.41, accent2, accent);
        drawBeam(ctx, stationA, sat, t, 0.18, accent, accent2);
        drawBeam(ctx, stationB, sat, t, 0.53, accent, accent2);

        drawGroundStation(ctx, stationA, stationSize, stationAAngle, accent, accent2);
        drawGroundStation(ctx, stationB, stationSize, stationBAngle, accent, accent2);
        drawQuasar(ctx, quasar, Math.max(2.8, minSide * 0.011), t, accent, accent2);
        drawSatellite(ctx, sat, satRot, Math.max(24, minSide * 0.075), accent, accent2);

        const ringPulse = 0.5 + 0.5 * Math.sin(t * 2.1);
        ctx.beginPath();
        ctx.arc(stationA.x, stationA.y, earthR * (0.18 + ringPulse * 0.12), -1.35, 0.55);
        strokePath(ctx, accent, 0.14 + ringPulse * 0.12, 1);
        ctx.beginPath();
        ctx.arc(stationB.x, stationB.y, earthR * (0.18 + (1 - ringPulse) * 0.12), -2.2, -0.15);
        strokePath(ctx, accent2, 0.12 + (1 - ringPulse) * 0.1, 1);

        ctx.fillStyle = "white";
        ctx.font = `${Math.max(10, minSide * 0.024)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.globalAlpha = 0.42;
        ctx.fillText("shared VLBI baseline", (stationA.x + stationB.x) * 0.5 - minSide * 0.12, (stationA.y + stationB.y) * 0.5 + 18);
        ctx.fillText("parallel quasar rays", quasar.x - minSide * 0.18, quasar.y + minSide * 0.07);
        ctx.globalAlpha = 1;
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
