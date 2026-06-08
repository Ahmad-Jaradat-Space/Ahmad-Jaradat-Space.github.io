import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import type { ChapterFigure } from "@/lib/types";
import type { FigureProps } from "./_canvas";

/** ChapterFigure key → its lazy, client-only animated component. */
export const FIGURES: Record<ChapterFigure, ComponentType<FigureProps>> = {
  vlbi: dynamic(() => import("./VlbiBaselineFigure"), { ssr: false }),
  kolmogorov: dynamic(() => import("./KolmogorovFigure"), { ssr: false }),
  spaceweather: dynamic(() => import("./SpaceWeatherFigure"), { ssr: false }),
  geodesy: dynamic(() => import("./GeodesyFigure"), { ssr: false }),
  satlink: dynamic(() => import("./SatLinkFigure"), { ssr: false }),
  bayes: dynamic(() => import("./BayesFigure"), { ssr: false }),
  scintillation: dynamic(() => import("./ScintillationFigure"), { ssr: false }),
  forecast: dynamic(() => import("./ForecastFanFigure"), { ssr: false }),
  causal: dynamic(() => import("./CausalLagFigure"), { ssr: false }),
  geoscan: dynamic(() => import("./GeoScanFigure"), { ssr: false }),
  optim: dynamic(() => import("./OptimFigure"), { ssr: false }),
  agentflow: dynamic(() => import("./AgentFlowFigure"), { ssr: false }),
  rag: dynamic(() => import("./RagFlowFigure"), { ssr: false }),
  guardrail: dynamic(() => import("./GuardrailFigure"), { ssr: false }),
  pitch: dynamic(() => import("./PitchControlFigure"), { ssr: false }),
  tracking: dynamic(() => import("./TrackingFigure"), { ssr: false }),
  dilemma: dynamic(() => import("./DilemmaFigure"), { ssr: false }),
  passmap: dynamic(() => import("./PassMapFigure"), { ssr: false }),
};
