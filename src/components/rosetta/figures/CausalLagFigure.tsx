"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const HALF_LIFE_DAYS = 44;
const RESPONSE_DAYS = 132;

function drawNode(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  radius: number,
  label: string,
  color: string,
  fontPx: number,
): void {
  glow(ctx, x, y, radius * 2.8, color, 0.14);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = "rgba(4, 14, 12, 0.72)";
  ctx.globalAlpha = 0.9;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  ctx.globalAlpha = 0.8;
  ctx.fillStyle = "rgba(229, 255, 240, 0.82)";
  ctx.font = `500 ${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, x, y + radius + fontPx * 0.6);
  ctx.restore();
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  fromX: number,
  fromY: number,
  toX: number,
  toY: number,
  color: string,
  t: number,
  seed: number,
): void {
  const angle = Math.atan2(toY - fromY, toX - fromX);
  const head = 8;
  const endX = toX - Math.cos(angle) * 17;
  const endY = toY - Math.sin(angle) * 17;
  const startX = fromX + Math.cos(angle) * 17;
  const startY = fromY + Math.sin(angle) * 17;
  const flow = (t * 0.34 + rnd(seed)) % 1;
  const pulseX = startX + (endX - startX) * flow;
  const pulseY = startY + (endY - startY) * flow;

  ctx.save();
  ctx.strokeStyle = "rgba(209, 255, 230, 0.16)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(startX, startY);
  ctx.lineTo(endX, endY);
  ctx.stroke();

  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = 1.2;
  ctx.beginPath();
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - Math.cos(angle - 0.55) * head, endY - Math.sin(angle - 0.55) * head);
  ctx.moveTo(endX, endY);
  ctx.lineTo(endX - Math.cos(angle + 0.55) * head, endY - Math.sin(angle + 0.55) * head);
  ctx.stroke();

  glow(ctx, pulseX, pulseY, 18, color, 0.18);
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.arc(pulseX, pulseY, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawImpulseResponses(
  ctx: CanvasRenderingContext2D,
  x0: number,
  x1: number,
  yBase: number,
  amp: number,
  storageColor: string,
  priceColor: string,
  reveal: number,
  t: number,
  compact: boolean,
  fontPx: number,
): void {
  const steps = 90;
  const width = x1 - x0;
  const halfX = x0 + width * (HALF_LIFE_DAYS / RESPONSE_DAYS);
  const storageHalfY = yBase - amp * 0.5;
  const priceHalfY = yBase + amp * 0.82 * 0.5;
  const axisY = yBase + amp * 1.08;
  const visibleSteps = Math.max(1, Math.floor(steps * reveal));

  ctx.save();
  ctx.strokeStyle = "rgba(210, 255, 232, 0.12)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(x0, yBase);
  ctx.lineTo(x1, yBase);
  ctx.stroke();
  ctx.globalAlpha = 0.28;
  ctx.beginPath();
  ctx.moveTo(x0, axisY);
  ctx.lineTo(x1, axisY);
  ctx.stroke();

  ctx.fillStyle = "rgba(229, 255, 240, 0.58)";
  ctx.font = `500 ${Math.max(8, fontPx - 2)}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  for (const day of compact ? [0, HALF_LIFE_DAYS] : [0, HALF_LIFE_DAYS, RESPONSE_DAYS]) {
    const x = x0 + width * (day / RESPONSE_DAYS);
    ctx.globalAlpha = day === HALF_LIFE_DAYS ? 0.72 : 0.5;
    ctx.beginPath();
    ctx.moveTo(x, axisY - 5);
    ctx.lineTo(x, axisY + 5);
    ctx.stroke();
    ctx.fillText(`${day} d`, x, axisY + 7);
  }
  ctx.globalAlpha = 1;

  ctx.setLineDash([3, 7]);
  ctx.strokeStyle = priceColor;
  ctx.globalAlpha = 0.34;
  ctx.beginPath();
  ctx.moveTo(halfX, storageHalfY);
  ctx.lineTo(halfX, priceHalfY);
  ctx.stroke();
  ctx.setLineDash([]);

  const drawCurve = (color: string, sign: 1 | -1, scale: number) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.88;
    ctx.shadowColor = color;
    ctx.shadowBlur = 13;
    ctx.beginPath();
    for (let i = 0; i <= visibleSteps; i += 1) {
      const u = i / steps;
      const decay = 2 ** (-(u * RESPONSE_DAYS) / HALF_LIFE_DAYS);
      const x = x0 + width * u;
      const y = yBase + sign * amp * scale * decay;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = color;
    const startY = yBase + sign * amp * scale;
    ctx.beginPath();
    ctx.moveTo(x0, yBase);
    ctx.lineTo(x0, startY);
    ctx.stroke();
    glow(ctx, x0, startY, 23, color, 0.16);
    ctx.beginPath();
    ctx.arc(x0, startY, 2.6, 0, Math.PI * 2);
    ctx.fill();
  };

  drawCurve(storageColor, -1, 1);
  drawCurve(priceColor, 1, 0.82);

  const cursorU = (t * 0.08 + rnd(41) * 0.2) % 1;
  const cursorX = x0 + width * cursorU;
  const cursorDecay = 2 ** (-(cursorU * RESPONSE_DAYS) / HALF_LIFE_DAYS);
  glow(ctx, cursorX, yBase - amp * cursorDecay, 26, storageColor, 0.06);
  glow(ctx, cursorX, yBase + amp * 0.82 * cursorDecay, 26, priceColor, 0.06);

  ctx.globalAlpha = 0.78;
  ctx.fillStyle = "rgba(229, 255, 240, 0.78)";
  ctx.font = `500 ${fontPx}px ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif`;
  ctx.textAlign = "left";
  ctx.textBaseline = "middle";
  if (!compact) {
    // skip the in-plot duplicates on small tiles; the node labels carry them
    ctx.fillText("storage +", x0 + 10, yBase - amp - 8);
    ctx.fillText("price -", x0 + 10, yBase + amp * 0.82 + 10);
  }
  ctx.globalAlpha = 0.72;
  ctx.fillText(compact ? "44 d half-life" : "~44-day half-life", halfX + 9, yBase);
  ctx.restore();
}

function drawResponseGrid(
  ctx: CanvasRenderingContext2D,
  curveX0: number,
  curveX1: number,
  yBase: number,
  amp: number,
): void {
  ctx.save();
  ctx.strokeStyle = "rgba(210, 255, 232, 0.07)";
  ctx.lineWidth = 1;
  for (const offset of [-1, 0, 0.82]) {
    const y = yBase + amp * offset;
    ctx.beginPath();
    ctx.moveTo(curveX0, y);
    ctx.lineTo(curveX1, y);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  t: number,
  accent: string,
  accent2: string,
): void {
  const scale = Math.min(w, h);
  const compact = h < 200;
  const fontPx = Math.max(9, Math.min(13, scale * 0.048));
  const nodeRadius = Math.max(compact ? 7 : 10, scale * 0.052);
  const nodeY = h * 0.28;
  const rainfallX = w * 0.18;
  const storageX = w * 0.5;
  const priceX = w * 0.82;
  const curveX0 = w * 0.15;
  const curveX1 = w * 0.87;
  const yBase = h * 0.66;
  const amp = h * 0.16;
  const phase = (t % 5.8) / 5.8;
  const reveal = phase < 0.22 ? clamp01(phase / 0.22) : 1;

  ctx.fillStyle = "rgba(2, 8, 10, 0.2)";
  ctx.fillRect(0, 0, w, h);

  drawResponseGrid(ctx, curveX0, curveX1, yBase, amp);

  drawArrow(ctx, rainfallX, nodeY, storageX, nodeY, accent, t, 11);
  drawArrow(ctx, storageX, nodeY, priceX, nodeY, accent2, t, 23);

  drawNode(ctx, rainfallX, nodeY, nodeRadius, "rainfall", accent, fontPx);
  drawNode(ctx, storageX, nodeY, nodeRadius, "storage +", accent, fontPx);
  drawNode(ctx, priceX, nodeY, nodeRadius, "price -", accent2, fontPx);

  drawImpulseResponses(
    ctx,
    curveX0,
    curveX1,
    yBase,
    amp,
    accent,
    accent2,
    reveal,
    t,
    compact,
    fontPx,
  );
}

export default function CausalLagFigure({ accent, accent2, active }: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    return mountCanvas2D(
      canvas,
      { active, reduced: Boolean(reduced), staticT: 2.1, speed: 0.016 },
      ({ ctx, w, h }, t) => drawFrame(ctx, w, h, t, accent, accent2),
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
