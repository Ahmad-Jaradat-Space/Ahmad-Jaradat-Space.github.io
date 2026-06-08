"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
type State = { storage: number; price: number };
type TimedState = {
  state: State;
  cursor: number;
  index: number;
};

const TAU = Math.PI * 2;
const GREEN = "#10b981";
const GREEN_SOFT = "#86efac";
const LOW_RELEASE: readonly [number, number, number] = [15, 118, 110];
const MID_RELEASE: readonly [number, number, number] = [239, 206, 74];
const HIGH_RELEASE: readonly [number, number, number] = [220, 73, 53];

const STATE_PATH: readonly State[] = [
  { storage: 0.34, price: 0.38 },
  { storage: 0.42, price: 0.46 },
  { storage: 0.5, price: 0.64 },
  { storage: 0.57, price: 0.78 },
  { storage: 0.62, price: 0.7 },
  { storage: 0.55, price: 0.54 },
  { storage: 0.48, price: 0.42 },
  { storage: 0.43, price: 0.58 },
  { storage: 0.52, price: 0.74 },
  { storage: 0.68, price: 0.82 },
  { storage: 0.75, price: 0.66 },
  { storage: 0.69, price: 0.48 },
  { storage: 0.6, price: 0.34 },
  { storage: 0.51, price: 0.45 },
];

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function easeInOut(value: number): number {
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

function roundRectPath(ctx: CanvasRenderingContext2D, rect: Rect, radius: number): void {
  const r = Math.min(radius, rect.w * 0.5, rect.h * 0.5);
  ctx.beginPath();
  ctx.moveTo(rect.x + r, rect.y);
  ctx.lineTo(rect.x + rect.w - r, rect.y);
  ctx.quadraticCurveTo(rect.x + rect.w, rect.y, rect.x + rect.w, rect.y + r);
  ctx.lineTo(rect.x + rect.w, rect.y + rect.h - r);
  ctx.quadraticCurveTo(
    rect.x + rect.w,
    rect.y + rect.h,
    rect.x + rect.w - r,
    rect.y + rect.h,
  );
  ctx.lineTo(rect.x + r, rect.y + rect.h);
  ctx.quadraticCurveTo(rect.x, rect.y + rect.h, rect.x, rect.y + rect.h - r);
  ctx.lineTo(rect.x, rect.y + r);
  ctx.quadraticCurveTo(rect.x, rect.y, rect.x + r, rect.y);
}

function mixRgb(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  p: number,
): readonly [number, number, number] {
  return [
    Math.round(lerp(a[0], b[0], p)),
    Math.round(lerp(a[1], b[1], p)),
    Math.round(lerp(a[2], b[2], p)),
  ];
}

function rgba(rgb: readonly [number, number, number], alpha: number): string {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function releaseRgb(action: number): readonly [number, number, number] {
  const x = clamp01(action);
  if (x < 0.5) return mixRgb(LOW_RELEASE, MID_RELEASE, x * 2);
  return mixRgb(MID_RELEASE, HIGH_RELEASE, (x - 0.5) * 2);
}

function releaseFill(action: number, alpha: number): string {
  return rgba(releaseRgb(action), alpha);
}

function releasePolicy(storage: number, price: number): number {
  const highValueRelease = storage * 0.5 + price * 0.42 + storage * price * 0.2;
  const conservation = (1 - storage) * (1 - price) * 0.22;
  return clamp01(0.06 + highValueRelease - conservation);
}

function stateValue(storage: number, price: number): number {
  return (
    0.34 * storage +
    0.46 * storage * price -
    0.18 * (1 - storage) ** 2 -
    0.1 * (1 - price) * (1 - storage)
  );
}

function statePoint(rect: Rect, state: State): Point {
  return {
    x: rect.x + state.storage * rect.w,
    y: rect.y + (1 - state.price) * rect.h,
  };
}

function tracePoint(rect: Rect, u: number, value: number): Point {
  return {
    x: rect.x + clamp01(u) * rect.w,
    y: rect.y + (1 - clamp01(value)) * rect.h,
  };
}

function currentState(t: number): TimedState {
  const span = STATE_PATH.length - 1;
  const scaled = (t * 0.58) % span;
  const index = Math.min(span - 1, Math.floor(scaled));
  const local = scaled - index;
  const stepMix = easeInOut(clamp01((local - 0.58) / 0.42));
  const a = STATE_PATH[index] ?? STATE_PATH[0]!;
  const b = STATE_PATH[index + 1] ?? STATE_PATH[STATE_PATH.length - 1]!;

  return {
    state: {
      storage: lerp(a.storage, b.storage, stepMix),
      price: lerp(a.price, b.price, stepMix),
    },
    cursor: (index + stepMix) / span,
    index,
  };
}

function drawBackdrop(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  accent: string,
  accent2: string,
): void {
  ctx.fillStyle = "rgba(0,8,5,0.82)";
  ctx.fillRect(0, 0, w, h);

  const r = Math.max(w, h);
  const wash = ctx.createRadialGradient(w * 0.33, h * 0.32, 0, w * 0.33, h * 0.32, r * 0.7);
  wash.addColorStop(0, "rgba(16,185,129,0.13)");
  wash.addColorStop(0.48, "rgba(6,24,17,0.18)");
  wash.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  glow(ctx, w * 0.77, h * 0.42, r * 0.28, accent, 0.035);
  glow(ctx, w * 0.2, h * 0.77, r * 0.22, accent2, 0.026);

  ctx.fillStyle = accent2;
  for (let i = 0; i < 34; i += 1) {
    const x = rnd(30 + i * 1.7) * w;
    const y = rnd(90 + i * 2.3) * h;
    const radius = 0.6 + rnd(140 + i) * 1.3;
    ctx.globalAlpha = 0.035 + rnd(210 + i) * 0.04;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, TAU);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

function drawGrid(ctx: CanvasRenderingContext2D, rect: Rect, accent2: string): void {
  for (let i = 0; i <= 4; i += 1) {
    const u = i / 4;
    const x = rect.x + rect.w * u;
    const y = rect.y + rect.h * u;

    ctx.beginPath();
    ctx.moveTo(x, rect.y);
    ctx.lineTo(x, rect.y + rect.h);
    strokePath(ctx, accent2, i === 0 || i === 4 ? 0.16 : 0.06, 1);

    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    strokePath(ctx, accent2, i === 0 || i === 4 ? 0.16 : 0.06, 1);
  }
}

function drawReleaseLegend(ctx: CanvasRenderingContext2D, rect: Rect): void {
  const x = rect.x + rect.w - Math.max(16, rect.w * 0.045);
  const y = rect.y + rect.h * 0.17;
  const w = Math.max(7, rect.w * 0.018);
  const h = rect.h * 0.44;
  const steps = 10;

  for (let i = 0; i < steps; i += 1) {
    const u = i / (steps - 1);
    ctx.fillStyle = releaseFill(1 - u, 0.76);
    ctx.fillRect(x, y + (h * i) / steps, w, h / steps + 1);
  }

  ctx.fillStyle = "rgba(229, 255, 240, 0.62)";
  ctx.font = "500 9px ui-sans-serif, system-ui, sans-serif";
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillText("high", x - 5, y + 2);
  ctx.fillText("low", x - 5, y + h);
  ctx.save();
  ctx.translate(x + w + 8, y + h * 0.5);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.fillText("release", 0, 0);
  ctx.restore();
}

function drawValueContours(ctx: CanvasRenderingContext2D, rect: Rect, accent2: string): void {
  ctx.save();
  const targets = [-0.02, 0.12, 0.26, 0.4, 0.54];
  for (let k = 0; k < targets.length; k += 1) {
    const target = targets[k]!;
    let started = false;
    ctx.beginPath();
    for (let i = 0; i <= 80; i += 1) {
      const storage = i / 80;
      const low = stateValue(storage, 0);
      const high = stateValue(storage, 1);
      if (target < low || target > high) {
        started = false;
        continue;
      }

      let lo = 0;
      let hi = 1;
      for (let step = 0; step < 14; step += 1) {
        const mid = (lo + hi) / 2;
        if (stateValue(storage, mid) < target) lo = mid;
        else hi = mid;
      }

      const point = statePoint(rect, { storage, price: (lo + hi) / 2 });
      if (!started) {
        ctx.moveTo(point.x, point.y);
        started = true;
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    strokePath(ctx, k % 2 === 0 ? "white" : accent2, k % 2 === 0 ? 0.14 : 0.1, 1);
  }
  ctx.restore();
}

function drawStatePolicy(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  timed: TimedState,
  accent: string,
  accent2: string,
): void {
  roundRectPath(ctx, rect, Math.min(rect.w, rect.h) * 0.035);
  ctx.fillStyle = "rgba(0,12,8,0.48)";
  ctx.fill();
  strokePath(ctx, "white", 0.14, 1);

  const cols = 18;
  const rows = 13;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const storage = (col + 0.5) / cols;
      const price = 1 - (row + 0.5) / rows;
      const action = releasePolicy(storage, price);
      ctx.fillStyle = releaseFill(action, 0.2 + action * 0.48);
      ctx.fillRect(
        rect.x + (col / cols) * rect.w,
        rect.y + (row / rows) * rect.h,
        rect.w / cols + 0.5,
        rect.h / rows + 0.5,
      );
    }
  }

  drawGrid(ctx, rect, accent2);
  drawValueContours(ctx, rect, accent2);

  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();

  ctx.beginPath();
  STATE_PATH.forEach((state, index) => {
    const p = statePoint(rect, state);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.setLineDash([4, 7]);
  strokePath(ctx, "white", 0.2, 1.15);
  ctx.setLineDash([]);

  STATE_PATH.forEach((state, index) => {
    const p = statePoint(rect, state);
    const action = releasePolicy(state.storage, state.price);
    ctx.fillStyle = releaseFill(action, index <= timed.index ? 0.72 : 0.34);
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(2.3, rect.w * 0.006), 0, TAU);
    ctx.fill();
  });

  const marker = statePoint(rect, timed.state);
  const markerAction = releasePolicy(timed.state.storage, timed.state.price);
  glow(ctx, marker.x, marker.y, Math.max(18, rect.w * 0.12), accent, 0.17);
  ctx.fillStyle = releaseFill(markerAction, 0.96);
  ctx.beginPath();
  ctx.arc(marker.x, marker.y, Math.max(4.8, rect.w * 0.014), 0, TAU);
  ctx.fill();
  ctx.strokeStyle = "white";
  ctx.globalAlpha = 0.82;
  ctx.lineWidth = 1.2;
  ctx.stroke();
  ctx.restore();

  drawReleaseLegend(ctx, rect);

  ctx.font = `${Math.max(10, rect.h * 0.052)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(229, 255, 240, 0.76)";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText("policy over state", rect.x + 10, rect.y + 9);
  ctx.globalAlpha = 0.58;
  ctx.fillText("V(state)", rect.x + 10, rect.y + 27);
  ctx.textAlign = "right";
  ctx.fillText("storage", rect.x + rect.w - 8, rect.y + rect.h + 8);
  ctx.textAlign = "left";
  ctx.fillText("price", rect.x + 8, rect.y - 16);
  ctx.globalAlpha = 1;
}

function drawTracePanel(
  ctx: CanvasRenderingContext2D,
  rect: Rect,
  values: readonly number[],
  currentValue: number,
  cursor: number,
  label: string,
  color: string,
  accent2: string,
): void {
  roundRectPath(ctx, rect, Math.min(rect.w, rect.h) * 0.08);
  ctx.fillStyle = "rgba(0,12,8,0.42)";
  ctx.fill();
  strokePath(ctx, "white", 0.12, 1);

  for (let i = 1; i < 4; i += 1) {
    const y = rect.y + (rect.h * i) / 4;
    ctx.beginPath();
    ctx.moveTo(rect.x, y);
    ctx.lineTo(rect.x + rect.w, y);
    strokePath(ctx, accent2, 0.06, 1);
  }

  ctx.beginPath();
  values.forEach((value, index) => {
    const p = tracePoint(rect, index / (values.length - 1), value);
    if (index === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  });
  ctx.shadowColor = color;
  ctx.shadowBlur = 12;
  strokePath(ctx, color, 0.78, 1.8);
  ctx.shadowBlur = 0;

  const marker = tracePoint(rect, cursor, currentValue);
  ctx.beginPath();
  ctx.moveTo(marker.x, rect.y);
  ctx.lineTo(marker.x, rect.y + rect.h);
  strokePath(ctx, accent2, 0.18, 1);

  glow(ctx, marker.x, marker.y, Math.max(12, rect.h * 0.22), color, 0.12);
  ctx.fillStyle = "white";
  ctx.globalAlpha = 0.84;
  ctx.beginPath();
  ctx.arc(marker.x, marker.y, Math.max(2.8, rect.h * 0.045), 0, TAU);
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.font = `${Math.max(10, rect.h * 0.14)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.fillStyle = "rgba(229, 255, 240, 0.7)";
  ctx.textBaseline = "top";
  ctx.textAlign = "left";
  ctx.fillText(label, rect.x + 8, rect.y + 7);
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return undefined;

    const primary = accent || GREEN;
    const secondary = accent2 || GREEN_SOFT;
    const storageValues = STATE_PATH.map((state) => state.storage);
    const priceValues = STATE_PATH.map((state) => state.price);

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 5.8, speed: 0.015 },
      ({ ctx, w, h }, t) => {
        const wide = w >= h * 1.05;
        const stateRect = wide
          ? { x: w * 0.09, y: h * 0.16, w: w * 0.56, h: h * 0.62 }
          : { x: w * 0.1, y: h * 0.11, w: w * 0.8, h: h * 0.48 };
        const levelRect = wide
          ? { x: w * 0.69, y: h * 0.18, w: w * 0.22, h: h * 0.23 }
          : { x: w * 0.1, y: h * 0.66, w: w * 0.37, h: h * 0.2 };
        const priceRect = wide
          ? { x: w * 0.69, y: h * 0.53, w: w * 0.22, h: h * 0.23 }
          : { x: w * 0.53, y: h * 0.66, w: w * 0.37, h: h * 0.2 };
        const timed = currentState(t);

        drawBackdrop(ctx, w, h, primary, secondary);
        drawStatePolicy(ctx, stateRect, timed, primary, secondary);
        drawTracePanel(
          ctx,
          levelRect,
          storageValues,
          timed.state.storage,
          timed.cursor,
          "reservoir level",
          primary,
          secondary,
        );
        drawTracePanel(
          ctx,
          priceRect,
          priceValues,
          timed.state.price,
          timed.cursor,
          "price trace",
          secondary,
          primary,
        );
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
