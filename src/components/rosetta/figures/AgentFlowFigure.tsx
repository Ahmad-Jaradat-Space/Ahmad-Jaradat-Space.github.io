"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import { fill, glow, mountCanvas2D, rnd, type FigureProps } from "./_canvas";

type Point = { x: number; y: number };
type AgentNode = Point & { label: string; seed: number; tool: number };
type ToolNode = Point & { label: string; seed: number };

const AGENTS: readonly AgentNode[] = [
  { x: 0.2, y: 0.57, label: "RETRIEVE", seed: 11, tool: 0 },
  { x: 0.39, y: 0.69, label: "PLAN", seed: 17, tool: 1 },
  { x: 0.61, y: 0.69, label: "CODE", seed: 23, tool: 2 },
  { x: 0.8, y: 0.57, label: "VERIFY", seed: 31, tool: 3 },
];

const TOOLS: readonly ToolNode[] = [
  { x: 0.2, y: 0.86, label: "SEARCH", seed: 41 },
  { x: 0.43, y: 0.88, label: "DATA", seed: 47 },
  { x: 0.58, y: 0.88, label: "CODE", seed: 53 },
  { x: 0.8, y: 0.86, label: "API", seed: 59 },
];

const ORCHESTRATOR = { x: 0.5, y: 0.35, label: "ORCH" };

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function smooth01(value: number): number {
  const x = clamp01(value);
  return x * x * (3 - 2 * x);
}

function windowPulse(value: number, start: number, end: number, fade = 0.08): number {
  return (
    smooth01((value - start) / fade) *
    (1 - smooth01((value - end) / fade))
  );
}

function lerp(a: number, b: number, p: number): number {
  return a + (b - a) * p;
}

function pointOnLine(from: Point, to: Point, p: number): Point {
  const eased = smooth01(p);
  return {
    x: lerp(from.x, to.x, eased),
    y: lerp(from.y, to.y, eased),
  };
}

function toPoint(node: Point, w: number, h: number): Point {
  return { x: node.x * w, y: node.y * h };
}

function roundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.lineTo(x + w - rr, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + rr);
  ctx.lineTo(x + w, y + h - rr);
  ctx.quadraticCurveTo(x + w, y + h, x + w - rr, y + h);
  ctx.lineTo(x + rr, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - rr);
  ctx.lineTo(x, y + rr);
  ctx.quadraticCurveTo(x, y, x + rr, y);
  ctx.closePath();
}

function drawWire(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  color: string,
  alpha: number,
  width: number,
): void {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
  ctx.restore();
}

function drawPacket(
  ctx: CanvasRenderingContext2D,
  from: Point,
  to: Point,
  progress: number,
  color: string,
  alpha: number,
  size: number,
): void {
  if (progress <= 0 || progress >= 1 || alpha <= 0) return;
  const p = pointOnLine(from, to, progress);
  const tail = pointOnLine(from, to, clamp01(progress - 0.08));
  glow(ctx, p.x, p.y, size * 7, color, alpha * 0.28);
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(1, size * 0.72);
  ctx.beginPath();
  ctx.moveTo(tail.x, tail.y);
  ctx.lineTo(p.x, p.y);
  ctx.stroke();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawAgent(
  ctx: CanvasRenderingContext2D,
  p: Point,
  label: string,
  activeLevel: number,
  breath: number,
  accent: string,
  accent2: string,
  scale: number,
): void {
  const r = scale * (18 + breath * 1.2 + activeLevel * 2.8);
  glow(ctx, p.x, p.y, r * 2.7, accent, 0.06 + activeLevel * 0.16);

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = `rgba(11, 13, 25, ${0.5 + activeLevel * 0.12})`;
  ctx.lineWidth = scale * (1 + activeLevel * 0.7);
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * (activeLevel * 14 + 2);
  ctx.beginPath();
  ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.globalAlpha = 0.44 + activeLevel * 0.5;
  ctx.stroke();

  ctx.globalAlpha = 0.22 + activeLevel * 0.72;
  ctx.strokeStyle = accent2;
  ctx.lineWidth = scale * 1.1;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r + scale * 5, -Math.PI * 0.15, Math.PI * (0.95 + activeLevel * 0.35));
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.88;
  ctx.fillStyle = "rgba(236, 232, 255, 0.88)";
  ctx.font = `${Math.max(8, scale * 8.5)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y + scale * 0.5);
  ctx.restore();
}

function drawOrchestrator(
  ctx: CanvasRenderingContext2D,
  p: Point,
  activeLevel: number,
  accent: string,
  accent2: string,
  scale: number,
  compact: boolean,
): void {
  const r = scale * (28 + activeLevel * 2);
  glow(ctx, p.x, p.y, r * 3.4, accent, 0.12 + activeLevel * 0.12);

  ctx.save();
  ctx.strokeStyle = accent;
  ctx.fillStyle = "rgba(12, 12, 24, 0.58)";
  ctx.lineWidth = scale * 1.3;
  ctx.shadowColor = accent;
  ctx.shadowBlur = scale * (10 + activeLevel * 10);
  ctx.beginPath();
  for (let i = 0; i < 6; i += 1) {
    const a = -Math.PI / 2 + (i * Math.PI * 2) / 6;
    const x = p.x + Math.cos(a) * r;
    const y = p.y + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.globalAlpha = 0.78;
  ctx.stroke();

  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.55 + activeLevel * 0.35;
  ctx.strokeStyle = accent2;
  ctx.lineWidth = scale;
  ctx.beginPath();
  ctx.arc(p.x, p.y, r + scale * 7, 0, Math.PI * 2);
  ctx.stroke();

  ctx.globalAlpha = 0.95;
  ctx.fillStyle = "rgba(247, 244, 255, 0.94)";
  ctx.font = `${Math.max(10, scale * 11)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  if (compact) {
    ctx.fillText("ORCH", p.x, p.y + scale * 0.5);
  } else {
    ctx.fillText("ORCHESTRATOR", p.x, p.y - scale * 2);
    ctx.globalAlpha = 0.46 + activeLevel * 0.32;
    ctx.fillStyle = accent2;
    ctx.font = `${Math.max(7, scale * 7)}px ui-sans-serif, system-ui, sans-serif`;
    ctx.fillText("ROUTER", p.x, p.y + scale * 11);
  }
  ctx.restore();
}

function drawTool(
  ctx: CanvasRenderingContext2D,
  p: Point,
  label: string,
  activeLevel: number,
  accent: string,
  accent2: string,
  scale: number,
): void {
  const ww = scale * 58;
  const hh = scale * 20;
  glow(ctx, p.x, p.y, scale * 32, accent2, 0.04 + activeLevel * 0.13);

  ctx.save();
  roundedRect(ctx, p.x - ww / 2, p.y - hh / 2, ww, hh, scale * 7);
  ctx.fillStyle = `rgba(13, 14, 28, ${0.48 + activeLevel * 0.12})`;
  ctx.strokeStyle = activeLevel > 0.05 ? accent2 : "rgba(185, 163, 255, 0.34)";
  ctx.lineWidth = scale * (0.9 + activeLevel * 0.6);
  ctx.shadowColor = accent2;
  ctx.shadowBlur = scale * activeLevel * 10;
  ctx.fill();
  ctx.globalAlpha = 0.38 + activeLevel * 0.48;
  ctx.stroke();
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 0.74 + activeLevel * 0.2;
  ctx.fillStyle = "rgba(237, 232, 255, 0.78)";
  ctx.font = `${Math.max(7, scale * 7.4)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, p.x, p.y + scale * 0.3);
  ctx.restore();
}

function drawToolLayer(
  ctx: CanvasRenderingContext2D,
  tools: readonly (ToolNode & { p: Point })[],
  accent2: string,
  scale: number,
): void {
  if (tools.length === 0) return;
  const xs = tools.map((tool) => tool.p.x);
  const ys = tools.map((tool) => tool.p.y);
  const left = Math.min(...xs) - scale * 44;
  const right = Math.max(...xs) + scale * 44;
  const top = Math.min(...ys) - scale * 30;
  const bottom = Math.max(...ys) + scale * 26;

  ctx.save();
  roundedRect(ctx, left, top, right - left, bottom - top, scale * 12);
  ctx.fillStyle = "rgba(8, 11, 22, 0.28)";
  ctx.strokeStyle = "rgba(185, 163, 255, 0.2)";
  ctx.lineWidth = scale * 0.8;
  ctx.fill();
  ctx.stroke();

  ctx.globalAlpha = 0.5;
  ctx.fillStyle = accent2;
  ctx.font = `${Math.max(7, scale * 7)}px ui-sans-serif, system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SHARED TOOL LAYER", (left + right) / 2, top + scale * 10);
  ctx.restore();
}

export default function AgentFlowFigure({
  accent,
  accent2,
  active,
}: FigureProps) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    return mountCanvas2D(
      canvas,
      { active, reduced: Boolean(reduced), staticT: 3.35, speed: 0.016 },
      ({ ctx, w, h }, t) => {
        const scale = Math.max(0.72, Math.min(w, h) / 420);
        const compact = h < 200;
        // compact tiles drop the tool layer and spread the remaining nodes;
        // full size lifts the orchestrator so the canvas top is not empty
        const mapY = (y: number) => {
          if (y === ORCHESTRATOR.y) return compact ? 0.3 : 0.28;
          if (y < 0.6) return compact ? 0.66 : 0.53; // outer agents
          if (y < 0.8) return compact ? 0.78 : 0.66; // inner agents
          return y; // tools
        };
        const orch = toPoint({ x: ORCHESTRATOR.x, y: mapY(ORCHESTRATOR.y) }, w, h);
        const agents = AGENTS.map((agent) => ({
          ...agent,
          p: toPoint({ x: agent.x, y: mapY(agent.y) }, w, h),
        }));
        const tools = compact
          ? []
          : TOOLS.map((tool) => ({
              ...tool,
              p: toPoint(tool, w, h),
            }));

        const step = 2.25;
        const rawIndex = Math.floor(t / step);
        const agentIndex = rawIndex % AGENTS.length;
        const phase = (t % step) / step;
        const toAgent = smooth01((phase - 0.06) / 0.25);
        const fromAgent = smooth01((phase - 0.74) / 0.18);
        const workLevel = windowPulse(phase, 0.27, 0.72, 0.09);
        const orchLevel =
          windowPulse(phase, 0.02, 0.34, 0.08) +
          windowPulse(phase, 0.72, 0.96, 0.07);

        ctx.fillStyle = "rgba(4, 5, 12, 0.38)";
        ctx.fillRect(0, 0, w, h);
        glow(ctx, orch.x, orch.y, Math.min(w, h) * 0.5, accent, 0.06);
        glow(ctx, w * 0.5, h * 0.9, Math.min(w, h) * 0.44, accent2, 0.035);

        ctx.save();
        ctx.globalAlpha = 0.18;
        ctx.strokeStyle = accent;
        ctx.lineWidth = scale * 0.7;
        ctx.setLineDash([scale * 2.5, scale * 8]);
        ctx.beginPath();
        ctx.ellipse(w * 0.5, h * 0.6, w * 0.36, h * 0.24, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();

        for (const agent of agents) {
          const isActive = agent.seed === AGENTS[agentIndex]?.seed;
          const wireLevel = isActive ? 0.22 + workLevel * 0.3 : 0.12;
          drawWire(ctx, orch, agent.p, accent, wireLevel, scale * 0.85);
        }

        drawToolLayer(ctx, tools, accent2, scale);

        for (const agent of agents) {
          const tool = tools[agent.tool];
          if (tool) {
            const activeToolWire =
              agent.seed === AGENTS[agentIndex]?.seed ? workLevel * 0.22 : 0;
            drawWire(ctx, agent.p, tool.p, accent2, 0.08 + activeToolWire, scale * 0.65);
          }
        }

        const activeAgent = agents[agentIndex];
        if (activeAgent) {
          drawPacket(ctx, orch, activeAgent.p, toAgent, accent, 1 - fromAgent, scale * 3.6);
          drawPacket(ctx, activeAgent.p, orch, fromAgent, accent2, fromAgent, scale * 3.2);

          const tool = tools[activeAgent.tool];
          const toolCycle = rawIndex % 2 === 1;
          if (tool && toolCycle) {
            const out = smooth01((phase - 0.37) / 0.16);
            const back = smooth01((phase - 0.55) / 0.16);
            const toolAlpha = windowPulse(phase, 0.36, 0.72, 0.07);
            drawPacket(ctx, activeAgent.p, tool.p, out, accent2, (1 - back) * toolAlpha, scale * 2.5);
            drawPacket(ctx, tool.p, activeAgent.p, back, accent, back * toolAlpha, scale * 2.3);
          }
        }

        drawOrchestrator(ctx, orch, clamp01(orchLevel), accent, accent2, scale, compact);

        for (const agent of agents) {
          const isActive = agent.seed === AGENTS[agentIndex]?.seed;
          const breath = 0.5 + 0.5 * Math.sin(t * 1.1 + rnd(agent.seed) * Math.PI * 2);
          drawAgent(
            ctx,
            agent.p,
            agent.label,
            isActive ? workLevel : breath * 0.16,
            breath,
            accent,
            accent2,
            scale,
          );
        }

        for (const tool of tools) {
          const activeAgentTool = activeAgent?.tool === tools.indexOf(tool);
          const toolCycle = rawIndex % 2 === 1;
          const toolLevel = activeAgentTool && toolCycle ? windowPulse(phase, 0.39, 0.72, 0.08) : 0;
          const breath = 0.5 + 0.5 * Math.sin(t * 0.85 + rnd(tool.seed) * Math.PI * 2);
          drawTool(ctx, tool.p, tool.label, toolLevel + breath * 0.08, accent, accent2, scale);
        }
      },
    );
  }, [accent, accent2, active, reduced]);

  return <canvas ref={ref} style={fill} aria-hidden />;
}
