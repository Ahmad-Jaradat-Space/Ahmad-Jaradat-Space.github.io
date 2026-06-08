import type { Face, ThemeVars } from "./types";

export type Direction = "cw" | "ccw";

/** Always-positive modulo. */
export function mod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

/**
 * Shortest way around a ring of `count` faces from `from` to `to`.
 * Returns the step count and which direction to hinge.
 * cw  = forward / "next"  (increasing index)
 * ccw = backward / "prev" (decreasing index)
 */
export function shortestPath(
  from: number,
  to: number,
  count: number,
): { steps: number; direction: Direction } {
  const forward = mod(to - from, count); // steps going cw
  const backward = mod(from - to, count); // steps going ccw
  if (forward === 0) return { steps: 0, direction: "cw" };
  return forward <= backward
    ? { steps: forward, direction: "cw" }
    : { steps: backward, direction: "ccw" };
}

/** Build the CSS custom-property bag for a face's theme + mood. */
export function themeVars(face: Face): ThemeVars {
  const { theme, mood } = face;
  return {
    "--bg": theme.background,
    "--bg-2": theme.background2,
    "--accent": theme.accent,
    "--accent-2": theme.accent2,
    "--accent-soft": theme.accentSoft,
    "--panel": theme.panel,
    "--text-muted": theme.textMuted,
    "--glow": String(mood.glowIntensity),
    "--grain": String(mood.grainOpacity),
    "--vignette": String(mood.vignetteStrength),
    "--panel-tilt": `${mood.panelTilt}deg`,
  };
}
