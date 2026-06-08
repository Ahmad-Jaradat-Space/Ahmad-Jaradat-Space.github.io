"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = {
  x: number;
  y: number;
};

type DishSite = {
  angle: number;
  seed: number;
};

type DishDrawn = {
  foot: Point;
  mount: Point;
  normal: Point;
  hit: number;
  q: number;
  seed: number;
};

const TAU = Math.PI * 2;
const FONT = "ui-sans-serif, system-ui, sans-serif";

const SITES: readonly DishSite[] = [
  { angle: -1.92, seed: 12.4 },
  { angle: -1.24, seed: 57.2 },
];

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

function dot(a: Point, b: Point): number {
  return a.x * b.x + a.y * b.y;
}

function add(a: Point, b: Point): Point {
  return { x: a.x + b.x, y: a.y + b.y };
}

function sub(a: Point, b: Point): Point {
  return { x: a.x - b.x, y: a.y - b.y };
}

function scale(a: Point, value: number): Point {
  return { x: a.x * value, y: a.y * value };
}

function length(a: Point): number {
  return Math.hypot(a.x, a.y);
}

function normalize(a: Point): Point {
  const d = length(a);
  if (d < 0.001) return { x: 1, y: 0 };
  return { x: a.x / d, y: a.y / d };
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function pulse(distance: number, width: number): number {
  return smooth01(1 - Math.min(1, distance / width));
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

function fillPath(ctx: CanvasRenderingContext2D, color: string, alpha: number): void {
  ctx.fillStyle = color;
  ctx.globalAlpha = alpha;
  ctx.fill();
  ctx.globalAlpha = 1;
}

function drawText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  size: number,
  alpha: number,
  align: CanvasTextAlign = "left",
): void {
  ctx.font = `500 ${size}px ${FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillStyle = "white";
  ctx.globalAlpha = alpha;
  ctx.fillText(text, x, y);
  ctx.globalAlpha = 1;
  ctx.textAlign = "left";
}

function drawArrow(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
): void {
  const delta = sub(to, from);
  const d = length(delta);
  if (d < 0.01) return;

  const u = scale(delta, 1 / d);
  const side = { x: -u.y, y: u.x };
  const head = Math.min(9, d * 0.18);

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  strokePath(ctx, color, alpha, width);

  ctx.beginPath();
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - u.x * head + side.x * head * 0.5, to.y - u.y * head + side.y * head * 0.5);
  ctx.moveTo(to.x, to.y);
  ctx.lineTo(to.x - u.x * head - side.x * head * 0.5, to.y - u.y * head - side.y * head * 0.5);
  strokePath(ctx, color, alpha, width);
}

function roundRectPath(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  const r = Math.min(radius, width * 0.5, height * 0.5);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + width - r, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + r);
  ctx.lineTo(x + width, y + height - r);
  ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
  ctx.lineTo(x + r, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

function drawEarthLimb(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  accent: string,
  accent2: string,
  minSide: number,
): void {
  glow(ctx, center.x, center.y - radius * 0.72, radius * 0.62, accent, 0.07);

  const g = ctx.createRadialGradient(
    center.x - radius * 0.34,
    center.y - radius * 0.86,
    0,
    center.x,
    center.y,
    radius * 1.08,
  );
  g.addColorStop(0, "rgba(232, 245, 255, 0.36)");
  g.addColorStop(0.3, accent);
  g.addColorStop(1, "rgba(1, 8, 24, 0)");

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  ctx.globalAlpha = 0.17;
  ctx.fillStyle = g;
  ctx.fill();
  ctx.globalAlpha = 1;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, Math.PI * 1.08, Math.PI * 1.92);
  ctx.shadowColor = accent;
  ctx.shadowBlur = minSide * 0.045;
  strokePath(ctx, accent, 0.34, Math.max(1, minSide * 0.006));
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.arc(center.x, center.y, radius * 0.94, Math.PI * 1.13, Math.PI * 1.87);
  ctx.setLineDash([Math.max(3, minSide * 0.012), Math.max(9, minSide * 0.026)]);
  strokePath(ctx, accent2, 0.12, Math.max(0.7, minSide * 0.0026));
  ctx.setLineDash([]);
}

function pointOnEarth(center: Point, radius: number, angle: number): Point {
  return {
    x: center.x + Math.cos(angle) * radius,
    y: center.y + Math.sin(angle) * radius,
  };
}

// The two dishes synthesise one telescope as wide as the baseline. Draw that as a
// clean dashed semicircle (a "virtual dish") spanning the two real dishes, bulging
// up into the sky so it never dips into the Earth.
function drawVirtualAperture(
  ctx: CanvasRenderingContext2D,
  left: Point,
  right: Point,
  accent2: string,
  minSide: number,
  showLabels: boolean,
): void {
  const mid = scale(add(left, right), 0.5);
  const u = normalize(sub(right, left));
  const apertureR = length(sub(right, left)) * 0.5;
  let n: Point = { x: -u.y, y: u.x };
  if (n.y > 0) n = scale(n, -1); // point the bulge toward the sky

  const bulge = apertureR * 0.55; // shallow arc so it never reaches the quasar
  const steps = 48;
  ctx.beginPath();
  for (let i = 0; i <= steps; i += 1) {
    const th = Math.PI * (i / steps);
    const p = add(
      add(mid, scale(u, -apertureR * Math.cos(th))),
      scale(n, bulge * Math.sin(th)),
    );
    if (i === 0) ctx.moveTo(p.x, p.y);
    else ctx.lineTo(p.x, p.y);
  }
  ctx.setLineDash([Math.max(4, minSide * 0.016), Math.max(8, minSide * 0.03)]);
  strokePath(ctx, accent2, 0.2, Math.max(0.8, minSide * 0.003));
  ctx.setLineDash([]);

  if (showLabels) {
    const apex = add(mid, scale(n, bulge));
    const labelSize = Math.max(7, minSide * 0.02);
    drawText(ctx, "virtual aperture", apex.x, apex.y + minSide * 0.05, labelSize, 0.52, "center");
    drawText(ctx, "θ ≈ λ / B", apex.x, apex.y + minSide * 0.05 + minSide * 0.026, labelSize * 0.9, 0.44, "center");
  }
}

// A distant quasar is in the far field, so its radiation reaches the array as a
// PLANE wave: straight wavefronts perpendicular to the line of sight (s-hat),
// marching toward the array along s-hat. `q` is the wavefront's signed distance
// from the origin along s-hat; the line is centred at q*s-hat and runs along the
// perpendicular tangent.
function drawPlaneWavefront(
  ctx: CanvasRenderingContext2D,
  sHat: Point,
  tangent: Point,
  q: number,
  halfLen: number,
  color: string,
  alpha: number,
  width: number,
): void {
  const c = scale(sHat, q);
  ctx.beginPath();
  ctx.moveTo(c.x - tangent.x * halfLen, c.y - tangent.y * halfLen);
  ctx.lineTo(c.x + tangent.x * halfLen, c.y + tangent.y * halfLen);
  strokePath(ctx, color, alpha, width);
}

// The quasar: an active galactic nucleus, not a plain dot. A bright unresolved
// core, a tilted accretion disk, and two opposing relativistic jets.
function drawQuasar(
  ctx: CanvasRenderingContext2D,
  c: Point,
  r: number,
  accent: string,
  accent2: string,
  t: number,
): void {
  const corePulse = 0.86 + Math.sin(t * 1.6) * 0.14;

  glow(ctx, c.x, c.y, r * 2.5 * corePulse, accent, 0.13);
  glow(ctx, c.x, c.y, r * 1.25, accent2, 0.2);

  const jetAxis = 2.18;
  const jetDir: Point = { x: Math.cos(jetAxis), y: Math.sin(jetAxis) };
  const perp: Point = { x: -jetDir.y, y: jetDir.x };
  const diskAxis = jetAxis - Math.PI / 2;

  for (const sgn of [1, -1]) {
    const tip = add(c, scale(jetDir, r * 2.7 * sgn));
    const flick = 0.7 + Math.sin(t * 3.1 + sgn * 1.7) * 0.3;
    const baseW = r * 0.18;
    glow(ctx, tip.x, tip.y, r * 0.55, accent2, 0.12 * flick);
    ctx.beginPath();
    ctx.moveTo(c.x + perp.x * baseW, c.y + perp.y * baseW);
    ctx.lineTo(tip.x, tip.y);
    ctx.lineTo(c.x - perp.x * baseW, c.y - perp.y * baseW);
    ctx.closePath();
    fillPath(ctx, accent2, 0.15 * flick);
    ctx.beginPath();
    ctx.moveTo(c.x, c.y);
    ctx.lineTo(tip.x, tip.y);
    strokePath(ctx, "white", 0.18 * flick, Math.max(0.6, r * 0.03));
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(diskAxis);
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.55, r * 0.5, 0, 0, TAU);
  strokePath(ctx, accent, 0.5, Math.max(0.9, r * 0.06));
  ctx.beginPath();
  ctx.ellipse(0, 0, r * 1.02, r * 0.32, 0, 0, TAU);
  strokePath(ctx, "white", 0.3, Math.max(0.7, r * 0.04));
  ctx.restore();

  glow(ctx, c.x, c.y, r * 0.62 * corePulse, "white", 0.5);
  ctx.beginPath();
  ctx.arc(c.x, c.y, Math.max(2.4, r * 0.26) * corePulse, 0, TAU);
  fillPath(ctx, "white", 0.96);

  const flareR = r * 1.15 * corePulse;
  ctx.beginPath();
  ctx.moveTo(c.x - flareR, c.y);
  ctx.lineTo(c.x + flareR, c.y);
  ctx.moveTo(c.x, c.y - flareR);
  ctx.lineTo(c.x, c.y + flareR);
  strokePath(ctx, "white", 0.22, Math.max(0.6, r * 0.02));
}

// A Galileo navigation satellite carrying a VLBI beacon: central body, two solar
// wings, and a downlink horn. Because it is near (not at infinity) its signal
// reaches the dishes as a SPHERICAL wave, in contrast to the quasar's plane wave.
function drawSatellite(
  ctx: CanvasRenderingContext2D,
  c: Point,
  size: number,
  accent: string,
  accent2: string,
): void {
  const tilt = -0.32;
  const ux: Point = { x: Math.cos(tilt), y: Math.sin(tilt) };
  const uy: Point = { x: -Math.sin(tilt), y: Math.cos(tilt) };

  glow(ctx, c.x, c.y, size * 2, accent2, 0.12);

  for (const sgn of [1, -1]) {
    const inner = add(c, scale(ux, sgn * size * 0.55));
    const outer = add(c, scale(ux, sgn * size * 1.6));
    const wWing = size * 0.42;
    const p1 = add(inner, scale(uy, wWing));
    const p2 = add(outer, scale(uy, wWing));
    const p3 = add(outer, scale(uy, -wWing));
    const p4 = add(inner, scale(uy, -wWing));
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
    ctx.lineTo(p3.x, p3.y);
    ctx.lineTo(p4.x, p4.y);
    ctx.closePath();
    fillPath(ctx, accent2, 0.16);
    strokePath(ctx, accent2, 0.5, Math.max(0.6, size * 0.05));
    for (let i = 1; i < 3; i += 1) {
      const a = add(inner, scale(ux, sgn * size * 1.05 * (i / 3)));
      const g1 = add(a, scale(uy, wWing));
      const g2 = add(a, scale(uy, -wWing));
      ctx.beginPath();
      ctx.moveTo(g1.x, g1.y);
      ctx.lineTo(g2.x, g2.y);
      strokePath(ctx, accent2, 0.3, Math.max(0.4, size * 0.03));
    }
  }

  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate(tilt);
  roundRectPath(ctx, -size * 0.44, -size * 0.52, size * 0.88, size * 1.04, size * 0.2);
  fillPath(ctx, "rgba(3, 12, 29, 0.92)", 1);
  roundRectPath(ctx, -size * 0.44, -size * 0.52, size * 0.88, size * 1.04, size * 0.2);
  strokePath(ctx, accent, 0.8, Math.max(0.8, size * 0.08));
  ctx.restore();

  const horn = add(c, scale(uy, size * 0.78));
  ctx.beginPath();
  ctx.arc(horn.x, horn.y, size * 0.17, 0, TAU);
  fillPath(ctx, "white", 0.75);
  ctx.beginPath();
  ctx.arc(c.x, c.y, Math.max(1.4, size * 0.13), 0, TAU);
  fillPath(ctx, "white", 0.85);
}

function drawClock(
  ctx: CanvasRenderingContext2D,
  center: Point,
  radius: number,
  phase: number,
  accent2: string,
  alpha: number,
): void {
  ctx.beginPath();
  ctx.arc(center.x, center.y, radius, 0, TAU);
  strokePath(ctx, accent2, alpha, Math.max(0.7, radius * 0.12));

  for (let i = 0; i < 4; i += 1) {
    const a = (i / 4) * TAU;
    ctx.beginPath();
    ctx.moveTo(center.x + Math.cos(a) * radius * 0.72, center.y + Math.sin(a) * radius * 0.72);
    ctx.lineTo(center.x + Math.cos(a) * radius, center.y + Math.sin(a) * radius);
    strokePath(ctx, "white", alpha * 0.58, Math.max(0.55, radius * 0.08));
  }

  const handA = phase;
  const handB = phase * 0.42 + 1.2;
  ctx.beginPath();
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(handA) * radius * 0.58, center.y + Math.sin(handA) * radius * 0.58);
  ctx.moveTo(center.x, center.y);
  ctx.lineTo(center.x + Math.cos(handB) * radius * 0.38, center.y + Math.sin(handB) * radius * 0.38);
  strokePath(ctx, "white", alpha * 0.76, Math.max(0.6, radius * 0.1));
}

function drawDish(
  ctx: CanvasRenderingContext2D,
  foot: Point,
  normal: Point,
  boresight: Point,
  size: number,
  accent: string,
  accent2: string,
  alpha: number,
  hit: number,
  phase: number,
): Point {
  const tangent = { x: -normal.y, y: normal.x };
  const side = { x: -boresight.y, y: boresight.x };
  const mount = add(foot, scale(normal, size * 0.42));
  const rimA = add(add(mount, scale(side, -size * 0.34)), scale(boresight, size * 0.11));
  const rimB = add(add(mount, scale(side, size * 0.34)), scale(boresight, size * 0.11));
  const bowlBack = add(mount, scale(boresight, -size * 0.2));
  const focus = add(mount, scale(boresight, size * 0.34));
  const clock = add(add(foot, scale(normal, size * 0.2)), scale(tangent, size * 0.23));

  if (hit > 0.02) {
    glow(ctx, focus.x, focus.y, size * 1.2, accent, hit * 0.24);
    glow(ctx, focus.x, focus.y, size * 0.5, "white", hit * 0.42);
  }

  ctx.beginPath();
  ctx.moveTo(foot.x - tangent.x * size * 0.2, foot.y - tangent.y * size * 0.2);
  ctx.lineTo(foot.x + tangent.x * size * 0.2, foot.y + tangent.y * size * 0.2);
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(mount.x, mount.y);
  strokePath(ctx, accent2, alpha * 0.5, Math.max(0.9, size * 0.045));

  ctx.beginPath();
  ctx.moveTo(rimA.x, rimA.y);
  ctx.quadraticCurveTo(bowlBack.x, bowlBack.y, rimB.x, rimB.y);
  ctx.shadowColor = accent;
  ctx.shadowBlur = size * 0.2 * hit;
  strokePath(ctx, accent, alpha * (0.7 + hit * 0.28), Math.max(1, size * 0.05));
  ctx.shadowBlur = 0;

  ctx.beginPath();
  ctx.moveTo(rimA.x, rimA.y);
  ctx.lineTo(focus.x, focus.y);
  ctx.lineTo(rimB.x, rimB.y);
  ctx.moveTo(mount.x, mount.y);
  ctx.lineTo(focus.x, focus.y);
  strokePath(ctx, "white", alpha * 0.34, Math.max(0.7, size * 0.026));

  ctx.beginPath();
  ctx.moveTo(focus.x, focus.y);
  ctx.lineTo(focus.x + boresight.x * size * 0.5, focus.y + boresight.y * size * 0.5);
  ctx.setLineDash([Math.max(2, size * 0.12), Math.max(5, size * 0.22)]);
  strokePath(ctx, accent2, alpha * 0.2, Math.max(0.6, size * 0.02));
  ctx.setLineDash([]);

  drawClock(ctx, clock, Math.max(2.7, size * 0.095), phase, accent2, alpha * 0.68);

  // feed horn: brightens and swells the instant the wavefront reaches the dish
  ctx.beginPath();
  ctx.arc(focus.x, focus.y, Math.max(1.4, size * 0.035) * (1 + hit * 0.7), 0, TAU);
  fillPath(ctx, "white", alpha * (0.42 + hit * 0.52));

  return mount;
}

// Geometric delay for a plane wave. The wavefront reaches the LEAD dish first; the
// TRAIL dish is an extra distance further along the line of sight. That extra path
// is the projection of the baseline onto s-hat, c*tau. We drop a perpendicular from
// the trail dish onto the wavefront plane through the lead dish (foot = P); the leg
// P->trail (parallel to s-hat) is the extra path, and lead->P lies in the wavefront.
function drawDelayGeometry(
  ctx: CanvasRenderingContext2D,
  lead: Point,
  trail: Point,
  sHat: Point,
  accent: string,
  accent2: string,
  minSide: number,
  sweepProgress: number,
  flash: number,
): void {
  const extra = Math.max(0.001, dot(sub(trail, lead), sHat));
  const foot = sub(trail, scale(sHat, extra)); // P on the lead wavefront plane
  const baselineMid = scale(add(lead, trail), 0.5);
  const labelSize = Math.max(7, minSide * 0.021);
  const tiny = Math.max(6, minSide * 0.017);

  // baseline B between the two dishes
  drawArrow(ctx, lead, trail, accent2, 0.5, Math.max(0.9, minSide * 0.0032));
  drawText(ctx, "B", baselineMid.x, baselineMid.y + minSide * 0.03, labelSize, 0.56, "center");

  // projection inside the wavefront plane (lead -> P), dashed
  ctx.beginPath();
  ctx.moveTo(lead.x, lead.y);
  ctx.lineTo(foot.x, foot.y);
  ctx.setLineDash([Math.max(3, minSide * 0.009), Math.max(6, minSide * 0.018)]);
  strokePath(ctx, accent2, 0.3, Math.max(0.7, minSide * 0.0022));
  ctx.setLineDash([]);

  // extra path P -> trail (= c*tau), highlighted; this is the geometric delay
  ctx.beginPath();
  ctx.moveTo(foot.x, foot.y);
  ctx.lineTo(trail.x, trail.y);
  ctx.shadowColor = accent;
  ctx.shadowBlur = minSide * 0.04 * flash;
  strokePath(ctx, "white", 0.34 + flash * 0.5, Math.max(1, minSide * 0.0034));
  ctx.shadowBlur = 0;

  // right-angle mark at P
  const m = Math.max(5, minSide * 0.018);
  const toLead = normalize(sub(lead, foot));
  const toTrail = normalize(sub(trail, foot));
  const cA = add(foot, scale(toLead, m));
  const cB = add(add(foot, scale(toLead, m)), scale(toTrail, m));
  const cC = add(foot, scale(toTrail, m));
  ctx.beginPath();
  ctx.moveTo(cA.x, cA.y);
  ctx.lineTo(cB.x, cB.y);
  ctx.lineTo(cC.x, cC.y);
  strokePath(ctx, "white", 0.3, Math.max(0.6, minSide * 0.002));

  // the wavefront sweeping from the lead plane onto the trail dish
  const spot = add(foot, scale(sub(trail, foot), clamp01(sweepProgress)));
  if (flash > 0.02) {
    glow(ctx, spot.x, spot.y, minSide * 0.05, accent, flash * 0.18);
    ctx.beginPath();
    ctx.arc(spot.x, spot.y, Math.max(2, minSide * 0.006), 0, TAU);
    fillPath(ctx, "white", 0.4 + flash * 0.4);
  }

  const legMid = scale(add(foot, trail), 0.5);
  drawText(ctx, "extra path = c·τ", legMid.x + minSide * 0.045, legMid.y - minSide * 0.012, tiny, 0.56 + flash * 0.24, "left");
  drawText(ctx, "τ = B·ŝ / c", legMid.x + minSide * 0.045, legMid.y + minSide * 0.014, tiny, 0.48, "left");
}

function drawSignalLine(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  accent2: string,
  pulseValue: number,
  phase: number,
  minSide: number,
): void {
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  strokePath(ctx, accent2, 0.13, Math.max(0.65, minSide * 0.002));

  if (pulseValue <= 0.02) return;
  const p = clamp01(phase);
  const head = {
    x: lerp(from.x, to.x, p),
    y: lerp(from.y, to.y, p),
  };
  const tail = {
    x: lerp(from.x, to.x, clamp01(p - 0.08)),
    y: lerp(from.y, to.y, clamp01(p - 0.08)),
  };
  glow(ctx, head.x, head.y, minSide * 0.035, accent2, pulseValue * 0.08);
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(head.x, head.y);
  strokePath(ctx, "white", pulseValue * 0.36, Math.max(0.8, minSide * 0.0028));
}

function drawCorrelator(
  ctx: CanvasRenderingContext2D,
  node: Point,
  size: number,
  pulseValue: number,
  accent: string,
  accent2: string,
  minSide: number,
): void {
  glow(ctx, node.x, node.y, size * 2.8, accent, 0.06 + pulseValue * 0.14);

  ctx.beginPath();
  ctx.arc(node.x, node.y, size * 0.34, 0, TAU);
  fillPath(ctx, "rgba(3, 12, 29, 0.72)", 1);

  ctx.beginPath();
  ctx.arc(node.x, node.y, size * 0.34, 0, TAU);
  strokePath(ctx, accent, 0.44 + pulseValue * 0.26, Math.max(1, minSide * 0.003));

  for (let i = 0; i < 3; i += 1) {
    const a = (i / 3) * TAU + 0.18;
    ctx.beginPath();
    ctx.moveTo(node.x + Math.cos(a) * size * 0.13, node.y + Math.sin(a) * size * 0.13);
    ctx.lineTo(node.x + Math.cos(a) * size * 0.48, node.y + Math.sin(a) * size * 0.48);
    strokePath(ctx, accent2, 0.28 + pulseValue * 0.2, Math.max(0.6, minSide * 0.002));
  }

  drawText(ctx, "correlator", node.x, node.y + size * 0.62, Math.max(6, minSide * 0.018), 0.48, "center");
}

function drawFringeTrace(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  phase: number,
  color: string,
  alpha: number,
  lineWidth: number,
): void {
  ctx.beginPath();
  for (let i = 0; i <= 96; i += 1) {
    const u = i / 96;
    const envelope = 0.66 + 0.34 * Math.sin(Math.PI * u);
    const px = x + width * u;
    const py = y + height * 0.5 + Math.cos(u * TAU * 3.1 + phase) * height * 0.26 * envelope;
    if (i === 0) ctx.moveTo(px, py);
    else ctx.lineTo(px, py);
  }
  strokePath(ctx, color, alpha, lineWidth);
}

function drawFringeInset(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  phase: number,
  pulseValue: number,
  accent: string,
  accent2: string,
  minSide: number,
): void {
  roundRectPath(ctx, x, y, width, height, Math.max(4, minSide * 0.018));
  fillPath(ctx, "rgba(1, 7, 18, 0.38)", 1);

  roundRectPath(ctx, x, y, width, height, Math.max(4, minSide * 0.018));
  strokePath(ctx, accent2, 0.22 + pulseValue * 0.16, Math.max(0.7, minSide * 0.0022));

  const traceX = x + width * 0.12;
  const traceY = y + height * 0.2;
  const traceW = width * 0.78;
  const traceH = height * 0.56;

  ctx.beginPath();
  ctx.moveTo(traceX, traceY + traceH * 0.5);
  ctx.lineTo(traceX + traceW, traceY + traceH * 0.5);
  strokePath(ctx, accent2, 0.16, Math.max(0.55, minSide * 0.0016));

  drawFringeTrace(ctx, traceX, traceY, traceW, traceH, phase * 0.82, accent2, 0.34, Math.max(0.7, minSide * 0.0022));
  ctx.shadowColor = accent;
  ctx.shadowBlur = minSide * 0.04 * pulseValue;
  drawFringeTrace(
    ctx,
    traceX,
    traceY,
    traceW,
    traceH,
    phase,
    pulseValue > 0.18 ? "white" : accent,
    0.44 + pulseValue * 0.42,
    Math.max(0.9, minSide * 0.0032),
  );
  ctx.shadowBlur = 0;

  drawText(ctx, "fringe", x + width * 0.5, y + height * 0.84, Math.max(6, minSide * 0.018), 0.46 + pulseValue * 0.24, "center");
}

export default function Component({ accent, accent2, active }: FigureProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion() ?? false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;

    return mountCanvas2D(
      canvas,
      { active, reduced, staticT: 2.72, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const minSide = Math.min(w, h);
        // small idea-card vs large hero: drop labels + correlator/fringe detail
        // when compact so the small version reads as clean geometry.
        const compact = Math.min(w, h) < 220 || h < 180;
        // Show only a shallow sliver of the Earth: large radius + centre pushed
        // well below the frame so just a gentle limb shows along the bottom.
        const earthRadius = Math.max(minSide * 1.7, w * 1.05);
        const earthCenter: Point = { x: w * 0.5, y: h + earthRadius * 0.82 };
        const quasarR = minSide * (compact ? 0.12 : 0.092);
        // High in the sky near the top of the frame. Kept a little east of centre so
        // the baseline still carries a clear (small) geometric delay.
        const source: Point = {
          x: Math.min(w - quasarR * 2.0, w * (compact ? 0.58 : 0.56)),
          y: Math.max(quasarR * 1.7, h * 0.045),
        };
        const rotation = Math.sin(t * 0.1) * 0.03;
        const arrayCentre = pointOnEarth(earthCenter, earthRadius, -1.58 + rotation);
        // s-hat = propagation direction (source -> array). The far-field wave arrives
        // as a PLANE wave: straight fronts perpendicular to s-hat marching along it.
        const sHat = normalize(sub(arrayCentre, source));
        const tangent: Point = { x: -sHat.y, y: sHat.x };
        const qSource = dot(source, sHat); // wavefronts only exist beyond the quasar
        // Source is effectively at infinity, so every dish points the SAME way along
        // a single common boresight (toward the source), i.e. parallel rays.
        const boresight = scale(sHat, -1);
        const dishSize = Math.max(26, minSide * 0.19);
        const waveSpacing = Math.max(46, minSide * 0.3);
        const waveSpeed = minSide * 0.15;
        const halfLen = Math.hypot(w, h);
        const cornersQ = [
          dot({ x: 0, y: 0 }, sHat),
          dot({ x: w, y: 0 }, sHat),
          dot({ x: 0, y: h }, sHat),
          dot({ x: w, y: h }, sHat),
        ];
        const minQ = Math.min(...cornersQ) - waveSpacing;
        const maxQ = Math.max(...cornersQ) + waveSpacing;
        const lineSeed = minQ + wrap(t * waveSpeed, waveSpacing);

        ctx.fillStyle = "rgba(1, 7, 18, 0.16)";
        ctx.fillRect(0, 0, w, h);

        for (let i = 0; i < 34; i += 1) {
          const sx = rnd(i + 18.3) * w;
          const sy = rnd(i + 74.9) * h * 0.72;
          const r = 1.2 + rnd(i + 112.6) * 2.4;
          glow(ctx, sx, sy, r, i % 6 === 0 ? accent : accent2, 0.018);
        }

        drawEarthLimb(ctx, earthCenter, earthRadius, accent, accent2, minSide);

        const drawn: DishDrawn[] = SITES.map((site) => {
          const foot = pointOnEarth(earthCenter, earthRadius, site.angle + rotation);
          const normal = normalize(sub(foot, earthCenter));
          const q = dot(foot, sHat);
          const offset = wrap(q - lineSeed, waveSpacing);
          const hit = pulse(Math.min(offset, waveSpacing - offset), waveSpacing * 0.085);
          return {
            foot,
            mount: foot,
            normal,
            hit,
            q,
            seed: site.seed,
          };
        });

        const leftDish = drawn[0];
        const rightDish = drawn[1];
        if (!leftDish || !rightDish) return;

        // faint line of sight from the quasar to the array centre
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(arrayCentre.x, arrayCentre.y);
        ctx.setLineDash([Math.max(2, minSide * 0.006), Math.max(8, minSide * 0.028)]);
        strokePath(ctx, accent2, 0.12, Math.max(0.6, minSide * 0.0016));
        ctx.setLineDash([]);

        drawVirtualAperture(ctx, leftDish.foot, rightDish.foot, accent2, minSide, !compact);

        // plane wavefronts emitted BY the quasar: only fronts at or beyond the
        // quasar (q >= qSource) exist, and they are brightest near it, so the wave
        // visibly comes from the quasar and marches down onto the array.
        for (let q = lineSeed; q <= maxQ; q += waveSpacing) {
          if (q < Math.max(minQ, qSource - waveSpacing * 0.15)) continue;
          const nearby = Math.min(...drawn.map((dish) => Math.abs(q - dish.q)), waveSpacing);
          const bright = pulse(nearby, waveSpacing * 0.4);
          const fade = 1 - clamp01((q - qSource) / Math.max(1, maxQ - qSource)) * 0.5;
          ctx.shadowColor = accent;
          ctx.shadowBlur = minSide * 0.04 * bright;
          drawPlaneWavefront(
            ctx,
            sHat,
            tangent,
            q,
            halfLen,
            bright > 0.08 ? accent : accent2,
            (0.1 + bright * 0.32) * fade,
            Math.max(0.7, minSide * 0.0022 + bright * minSide * 0.0014),
          );
          ctx.shadowBlur = 0;
        }

        drawQuasar(ctx, source, quasarR, accent, accent2, t);

        if (!compact) {
          drawText(ctx, "quasar", source.x, source.y + quasarR * 1.85, Math.max(7, minSide * 0.02), 0.54, "center");
          drawText(ctx, "source at infinity, not to scale", source.x, source.y + quasarR * 1.85 + minSide * 0.03, Math.max(6, minSide * 0.015), 0.3, "center");

          // s-hat arrow in open left sky, pointing toward the source
          const sArrowBase: Point = { x: w * 0.26, y: h * 0.44 };
          const sArrowEnd = add(sArrowBase, scale(boresight, minSide * 0.16));
          drawArrow(ctx, sArrowBase, sArrowEnd, accent, 0.5, Math.max(0.8, minSide * 0.0028));
          drawText(ctx, "ŝ (to source)", sArrowBase.x - minSide * 0.018, sArrowBase.y + minSide * 0.035, Math.max(6, minSide * 0.017), 0.5, "center");
        }

        if (!compact) {
          // A Galileo satellite with a VLBI beacon also transmits to the dishes.
          // Being nearby, its signal arrives as a SPHERICAL wave (expanding arcs),
          // unlike the quasar's plane wave. Tying the two ties the satellite frame
          // to the quasar frame (the ASR 2021 idea).
          const sat: Point = { x: w * 0.82, y: h * 0.24 };
          const toArr = normalize(sub(arrayCentre, sat));
          const satMid = Math.atan2(toArr.y, toArr.x);
          const satMaxR = length(sub(arrayCentre, sat)) * 0.98;
          const satGap = Math.max(26, minSide * 0.17);
          const satPhase = wrap(t * minSide * 0.1, satGap);
          for (let r = satPhase; r <= satMaxR; r += satGap) {
            if (r < satGap * 0.3) continue;
            ctx.beginPath();
            ctx.arc(sat.x, sat.y, r, satMid - 0.6, satMid + 0.6);
            strokePath(ctx, accent2, 0.13 * (1 - (r / satMaxR) * 0.55), Math.max(0.6, minSide * 0.0018));
          }
          for (const dish of drawn) {
            ctx.beginPath();
            ctx.moveTo(sat.x, sat.y);
            ctx.lineTo(dish.foot.x, dish.foot.y);
            ctx.setLineDash([Math.max(2, minSide * 0.005), Math.max(7, minSide * 0.022)]);
            strokePath(ctx, accent2, 0.12, Math.max(0.5, minSide * 0.0014));
            ctx.setLineDash([]);
          }
          drawSatellite(ctx, sat, minSide * 0.055, accent, accent2);
          drawText(ctx, "Galileo beacon", sat.x, sat.y + minSide * 0.105, Math.max(6, minSide * 0.017), 0.52, "center");
        }

        // the dish with the smaller projection q is swept by each plane first
        const lead = leftDish.q <= rightDish.q ? leftDish : rightDish;
        const trail = leftDish.q <= rightDish.q ? rightDish : leftDish;
        const extraPath = Math.max(0.001, trail.q - lead.q);
        const sweepDistance = wrap(lineSeed - lead.q, waveSpacing);
        const sweepProgress = clamp01(sweepDistance / extraPath);
        const delayFlash =
          sweepDistance <= extraPath
            ? smooth01(sweepProgress / 0.14) * (1 - smooth01((sweepProgress - 0.86) / 0.14))
            : Math.max(lead.hit, trail.hit) * 0.42;
        const correlatorPulse = trail.hit;
        const baseMid = scale(add(lead.foot, trail.foot), 0.5);
        const correlator: Point = {
          x: w * 0.5,
          y: Math.min(h - minSide * 0.05, baseMid.y + minSide * 0.15),
        };
        const signalPhase = smooth01(wrap(t * 0.78, 1));

        if (!compact) {
          for (const dish of drawn) {
            drawSignalLine(ctx, dish.foot, correlator, accent2, Math.max(dish.hit, correlatorPulse * 0.6), signalPhase, minSide);
          }

          drawDelayGeometry(
            ctx,
            lead.foot,
            trail.foot,
            sHat,
            accent,
            accent2,
            minSide,
            sweepProgress,
            delayFlash,
          );

          const labelSize = Math.max(7, minSide * 0.02);
          drawText(ctx, "leads", lead.foot.x - minSide * 0.03, lead.foot.y - minSide * 0.115, labelSize, 0.5, "center");
        }

        drawn.forEach((dish, index) => {
          // All dishes share one common boresight (parallel pointing at the
          // far-field source).
          const mount = drawDish(
            ctx,
            dish.foot,
            dish.normal,
            boresight,
            dishSize,
            accent,
            accent2,
            0.62 + dish.hit * 0.28,
            dish.hit,
            t * (1.4 + index * 0.17) + dish.seed,
          );
          dish.mount = mount;
        });

        if (!compact) {
          drawCorrelator(ctx, correlator, Math.max(18, minSide * 0.08), correlatorPulse, accent, accent2, minSide);

          const insetW = Math.min(w * 0.3, minSide * 0.5);
          const insetH = Math.min(h * 0.16, minSide * 0.22);
          const insetX = Math.max(10, minSide * 0.05);
          const insetY = Math.max(10, minSide * 0.05);
          drawFringeInset(
            ctx,
            insetX,
            insetY,
            insetW,
            insetH,
            t * 2.35,
            Math.max(correlatorPulse, delayFlash * 0.42),
            accent,
            accent2,
            minSide,
          );
        }
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={canvasRef} style={fill} aria-hidden />;
}
