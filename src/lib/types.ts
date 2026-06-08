/** Rosetta Atlas — content model (serializable; no React components live here). */

export type Hex = `#${string}`;

/** The animated motion layer a face owns. */
export type VisualType =
  | "scientist"
  | "ml"
  | "agents"
  | "pitch";

/** How the motion layer renders: 2D canvas or a three.js/WebGL scene. */
export type MediaRenderer = "canvas" | "webgl";

/** A styled base image sitting under the motion layer (optional). */
export interface MediaImage {
  src: string;
  alt: string;
  /** CSS object-position for the cover crop, e.g. "center" or "50% 30%". */
  position?: string;
}

/**
 * What fills a face's visual zone: an optional styled base image, plus a motion
 * overlay (canvas or WebGL) drawn on top. The two compose into the hero visual.
 */
export interface FaceMediaSpec {
  image?: MediaImage;
  overlay: VisualType;
  renderer: MediaRenderer;
}

/** lucide-react icon name, resolved to a component by components/rosetta/icons.ts */
export type IconName =
  | "Telescope"
  | "Satellite"
  | "Globe"
  | "Wind"
  | "TrendingUp"
  | "Workflow"
  | "Map"
  | "Boxes"
  | "Network"
  | "Bot"
  | "Zap"
  | "Wrench"
  | "Target"
  | "Spline"
  | "Activity"
  | "Brain"
  | "Shapes"
  | "Presentation"
  | "Film"
  | "MessagesSquare"
  | "Radio"
  | "Database"
  | "Trophy"
  | "Sparkles";

export interface Metric {
  /** short, serif-numeral value (e.g. "2", "PhD", "60fps") */
  value: string;
  label: string;
  /** provenance — every metric must trace to something real */
  source: string;
  /** true only if genuinely approximate; never used to inflate */
  placeholder?: boolean;
}

export interface FeaturedProject {
  title: string;
  description: string;
  type: string;
  repoUrl?: string;
  liveUrl?: string;
}

export interface Keyword {
  label: string;
  icon: IconName;
}

export interface Portrait {
  src: string;
  isAIComposite: boolean;
  alt: string;
}

export interface FaceTheme {
  accent: Hex;
  accent2: Hex;
  accentSoft: string;
  background: Hex;
  background2: Hex;
  panel: string;
  textMuted: Hex;
}

export interface MoodTokens {
  glowIntensity: number; // 0..1  -> --glow
  grainOpacity: number; // 0..0.08 -> --grain
  vignetteStrength: number; // 0..1 -> --vignette
  particleDensity: number; // 0..1 (for canvas visuals)
  panelTilt: number; // deg -> --panel-tilt
}

/** Which animated chapter figure to render (resolved to a component by a registry). */
export type ChapterFigure =
  | "vlbi"
  | "kolmogorov"
  | "spaceweather"
  | "geodesy"
  | "satlink"
  | "bayes"
  | "scintillation"
  | "forecast"
  | "causal"
  | "geoscan"
  | "optim"
  | "agentflow"
  | "rag"
  | "guardrail"
  | "pitch"
  | "tracking"
  | "dilemma"
  | "passmap";

/** A still image shown as an editorial "figure plate". */
export interface ChapterImage {
  src: string;
  alt: string;
  /** caption shown under the plate */
  caption?: string;
}

/** A labelled key fact / result chip. */
export interface ChapterFact {
  label: string;
  value: string;
}

/** A core idea / concept beat (the "what I think" part of a chapter). */
export interface ChapterIdea {
  title: string;
  text: string;
  icon?: IconName;
  /** every idea carries its own small visual: an animation or an image */
  figure?: ChapterFigure;
  image?: ChapterImage;
}

/**
 * A work/result beat — a project, paper, or role told at the level of ideas and
 * outcomes (never code). Optional figure (animated), facts (chips), and a single
 * outbound link surfaced ONLY in the chapter's closing "sources" section.
 */
export interface ChapterBeat {
  title: string;
  kind: string; // category tag, e.g. "Publication", "Open source", "Live app"
  summary: string; // 2-4 sentences, concept + result
  facts?: ChapterFact[];
  icon?: IconName;
  figure?: ChapterFigure;
  image?: ChapterImage; // a real result figure shown as a plate (instead of an animation)
  href?: string;
  linkLabel?: string;
}

/** The in-site, self-contained story for a face — shown as a scroll chapter. */
export interface FaceChapterData {
  kicker: string; // short eyebrow above the chapter title, e.g. "Scientist"
  title: string; // big chapter title
  intro: string; // thesis paragraph
  heroFigure?: ChapterFigure; // the primary figure under the chapter header
  ideas: ChapterIdea[];
  beats: ChapterBeat[];
}

export interface Face {
  id: string;
  index: number;
  faceLabel: string; // "Face 01"
  title: string; // "Scientist"
  shortTitle: string; // orbit label, e.g. "Scientist"
  eyebrow: string;
  headlineLines: string[]; // manual line breaks to match mockup rag
  body: string;
  cta: string;
  ctaHref: string;
  media: FaceMediaSpec;
  theme: FaceTheme;
  mood: MoodTokens;
  keywords: Keyword[];
  metrics: Metric[];
  featuredProjects: FeaturedProject[];
  chapter: FaceChapterData;
  portrait?: Portrait;
}

/** CSS custom properties applied to the root / panel for a given theme. */
export type ThemeVars = Record<string, string>;
