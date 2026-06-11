"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = {
  x: number;
  y: number;
};

type Station = {
  lat: number;
  lon: number;
  vNorth: number;
  vEast: number;
  seed: number;
};

type Projected = Point & {
  z: number;
  visible: boolean;
};

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

const STATIONS: readonly Station[] = [
  { lat: 34, lon: -118, vNorth: 1.1, vEast: 2.4, seed: 12 },
  { lat: -23, lon: 133, vNorth: -0.8, vEast: 1.8, seed: 19 },
  { lat: 52, lon: 13, vNorth: 0.6, vEast: 1.4, seed: 27 },
  { lat: 36, lon: 140, vNorth: -0.4, vEast: 2.1, seed: 31 },
  { lat: -34, lon: 18, vNorth: 0.7, vEast: -1.2, seed: 44 },
  { lat: 64, lon: -21, vNorth: 0.4, vEast: -1.6, seed: 58 },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
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

function project(
  latDeg: number,
  lonDeg: number,
  angle: number,
  center: Point,
  radius: number,
): Projected {
  const lat = latDeg * DEG;
  const lon = lonDeg * DEG + angle;
  const tilt = -18 * DEG;
  const x = Math.cos(lat) * Math.sin(lon);
  const y = Math.sin(lat);
  const z = Math.cos(lat) * Math.cos(lon);
  const yt = y * Math.cos(tilt) - z * Math.sin(tilt);
  const zt = y * Math.sin(tilt) + z * Math.cos(tilt);
  return {
    x: center.x + x * radius,
    y: center.y - yt * radius,
    z: zt,
    visible: zt > -0.08,
  };
}

function projectLocalVelocity(
  station: Station,
  angle: number,
  pixelsPerMmYr: number,
): Point {
  const lat = station.lat * DEG;
  const lon = station.lon * DEG + angle;
  const tilt = -18 * DEG;
  const sinLat = Math.sin(lat);
  const cosLat = Math.cos(lat);
  const sinLon = Math.sin(lon);
  const cosLon = Math.cos(lon);

  const east = {
    x: cosLon,
    y: 0,
    z: -sinLon,
  };
  const north = {
    x: -sinLat * sinLon,
    y: cosLat,
    z: -sinLat * cosLon,
  };

  const eastYt = east.y * Math.cos(tilt) - east.z * Math.sin(tilt);
  const northYt = north.y * Math.cos(tilt) - north.z * Math.sin(tilt);

  return {
    x: (east.x * station.vEast + north.x * station.vNorth) * pixelsPerMmYr,
    y: (-eastYt * station.vEast - northYt * station.vNorth) * pixelsPerMmYr,
  };
}

function drawProjectedPolyline(
  ctx: CanvasRenderingContext2D,
  points: readonly Projected[],
  color: string,
  alpha: number,
  width: number,
): void {
  let drawing = false;
  ctx.beginPath();
  for (const point of points) {
    if (!point.visible) {
      drawing = false;
      continue;
    }
    if (!drawing) {
      ctx.moveTo(point.x, point.y);
      drawing = true;
    } else {
      ctx.lineTo(point.x, point.y);
    }
  }
  strokePath(ctx, color, alpha, width);
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
  const head = Math.min(6, length * 0.45);

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

function drawStraightPulse(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  progress: number,
  color: string,
): void {
  const p = clamp01(progress);
  const q = clamp01(progress - 0.06);
  const a = {
    x: from.x + (to.x - from.x) * q,
    y: from.y + (to.y - from.y) * q,
  };
  const b = {
    x: from.x + (to.x - from.x) * p,
    y: from.y + (to.y - from.y) * p,
  };
  glow(ctx, b.x, b.y, 12, color, 0.07);
  ctx.beginPath();
  ctx.moveTo(a.x, a.y);
  ctx.lineTo(b.x, b.y);
  strokePath(ctx, "white", 0.36, 1);
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 2.5, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        const center: Point = { x: w * 0.46, y: h * 0.57 };
        const radius = Math.max(86, minSide * 0.29);
        const quasarCue: Point = { x: w * 0.82, y: h * 0.18 };
        const incoming: Point = { x: -0.42, y: 0.91 };
        const rayLength = Math.hypot(w, h) * 0.72;
        const velocityScale = Math.max(3.2, minSide * 0.009);
        const angle = t * 0.18;

        ctx.fillStyle = "rgba(1, 7, 18, 0.17)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 34; i += 1) {
          glow(
            ctx,
            rnd(i + 201.6) * w,
            rnd(i + 77.4) * h,
            1.8 + rnd(i + 44.2) * 3.2,
            i % 5 === 0 ? accent : accent2,
            0.018,
          );
        }

        glow(ctx, center.x, center.y, radius * 1.18, accent, 0.05);
        ctx.beginPath();
        ctx.arc(center.x, center.y, radius, 0, TAU);
        strokePath(ctx, accent2, 0.24, 1.05);

        for (let lat = -60; lat <= 60; lat += 30) {
          const points: Projected[] = [];
          for (let lon = -180; lon <= 180; lon += 4) {
            points.push(project(lat, lon, angle, center, radius));
          }
          drawProjectedPolyline(ctx, points, accent2, lat === 0 ? 0.24 : 0.13, 0.9);
        }

        for (let lon = -150; lon <= 180; lon += 30) {
          const points: Projected[] = [];
          for (let lat = -84; lat <= 84; lat += 4) {
            points.push(project(lat, lon, angle, center, radius));
          }
          drawProjectedPolyline(ctx, points, accent2, 0.12, 0.85);
        }

        const northPole = project(90, 0, angle, center, radius * 1.08);
        const southPole = project(-90, 0, angle, center, radius * 1.08);
        drawArrow(ctx, southPole, northPole, accent, 0.36, 1.15);
        ctx.fillStyle = "white";
        ctx.font = `${Math.max(10, minSide * 0.024)}px ui-sans-serif, system-ui, sans-serif`;
        ctx.globalAlpha = 0.44;
        ctx.fillText("EOP", northPole.x + 8, northPole.y + 5);
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(quasarCue.x, quasarCue.y, 2.8, 0, TAU);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.86;
        ctx.fill();
        ctx.globalAlpha = 1;
        glow(ctx, quasarCue.x, quasarCue.y, minSide * 0.07, accent, 0.18);
        ctx.beginPath();
        ctx.moveTo(quasarCue.x - 9, quasarCue.y);
        ctx.lineTo(quasarCue.x + 9, quasarCue.y);
        ctx.moveTo(quasarCue.x, quasarCue.y - 9);
        ctx.lineTo(quasarCue.x, quasarCue.y + 9);
        strokePath(ctx, accent, 0.58, 1);

        const quasarLabel = w < 380 ? "QUASAR" : "QUASAR DIRECTION";
        const quasarLabelW = ctx.measureText(quasarLabel).width;
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.5;
        ctx.fillText(
          quasarLabel,
          Math.min(quasarCue.x - quasarLabelW * 0.5, w - quasarLabelW - 8),
          quasarCue.y + 20,
        );
        ctx.globalAlpha = 1;

        for (const station of STATIONS) {
          const p = project(station.lat, station.lon, angle, center, radius);
          if (!p.visible) continue;

          const sky: Point = {
            x: p.x - incoming.x * rayLength,
            y: p.y - incoming.y * rayLength,
          };

          ctx.beginPath();
          ctx.moveTo(sky.x, sky.y);
          ctx.lineTo(p.x, p.y);
          ctx.setLineDash([3, 8]);
          strokePath(ctx, accent2, 0.14, 0.9);
          ctx.setLineDash([]);

          const pulse = (t * 0.32 + station.seed * 0.071) % 1;
          drawStraightPulse(ctx, sky, p, pulse, accent);
        }

        for (const station of STATIONS) {
          const p = project(station.lat, station.lon, angle, center, radius);
          if (!p.visible) continue;
          const depth = clamp01((p.z + 0.08) / 1.08);
          const dotR = 2.3 + depth * 1.9;

          glow(ctx, p.x, p.y, 18 + depth * 12, accent, 0.08 + depth * 0.08);
          ctx.beginPath();
          ctx.arc(p.x, p.y, dotR, 0, TAU);
          ctx.fillStyle = station.seed % 2 === 0 ? accent : accent2;
          ctx.globalAlpha = 0.6 + depth * 0.28;
          ctx.fill();
          ctx.globalAlpha = 1;

          const localVelocity = projectLocalVelocity(station, angle, velocityScale);
          const arrowTo: Point = {
            x: p.x + localVelocity.x,
            y: p.y + localVelocity.y,
          };
          drawArrow(ctx, p, arrowTo, "white", 0.34 + depth * 0.28, 1);
        }

        const rulerX = w * 0.71;
        const rulerY = h * 0.82;
        const rulerLength = velocityScale * 10;
        ctx.beginPath();
        ctx.moveTo(rulerX, rulerY);
        ctx.lineTo(rulerX + rulerLength, rulerY);
        strokePath(ctx, accent, 0.6, 1.4);
        ctx.beginPath();
        ctx.moveTo(rulerX, rulerY - 5);
        ctx.lineTo(rulerX, rulerY + 5);
        ctx.moveTo(rulerX + rulerLength, rulerY - 5);
        ctx.lineTo(rulerX + rulerLength, rulerY + 5);
        strokePath(ctx, "white", 0.3, 1);
        ctx.fillStyle = "white";
        ctx.globalAlpha = 0.48;
        ctx.fillText("10 mm/yr", rulerX, rulerY + 18);
        ctx.globalAlpha = 1;
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
