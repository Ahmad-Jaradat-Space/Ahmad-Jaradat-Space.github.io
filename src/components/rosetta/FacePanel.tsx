import type { CSSProperties } from "react";
import { ArrowUpRight } from "lucide-react";
import type { Face } from "@/lib/types";
import { themeVars } from "@/lib/navigation";
import { KeywordRow } from "./KeywordRow";
import { MetricsPanel } from "./MetricsPanel";
import { FaceMedia } from "./FaceMedia";

/**
 * One glass panel. Carries its OWN theme so it keeps its colours during a turn.
 * `active` = interactive/primary (focusable). `visualActive` = animate the
 * canvas visual (the entering face animates before it becomes interactive).
 */
export function FacePanel({
  face,
  active,
  visualActive,
}: {
  face: Face;
  active: boolean;
  visualActive?: boolean;
}) {
  const animate = visualActive ?? active;
  return (
    <div className="r-panel" style={themeVars(face) as CSSProperties}>
      <span className="r-eyebrow">{face.eyebrow}</span>

      {active ? (
        <h1 className="r-headline">
          {face.headlineLines.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </h1>
      ) : (
        <div className="r-headline" aria-hidden>
          {face.headlineLines.map((line, i) => (
            <span key={i} style={{ display: "block" }}>
              {line}
            </span>
          ))}
        </div>
      )}

      <p className="r-body">{face.body}</p>
      <KeywordRow keywords={face.keywords} />

      <a
        className="r-btn r-cta"
        href="#chapter"
        tabIndex={active ? 0 : -1}
        aria-hidden={active ? undefined : true}
      >
        {face.cta}
        <ArrowUpRight aria-hidden />
      </a>

      <div className="r-visual">
        <FaceMedia
          media={face.media}
          accent={face.theme.accent}
          accent2={face.theme.accent2}
          active={animate}
          density={face.mood.particleDensity}
        />
      </div>

      <MetricsPanel metrics={face.metrics} />
    </div>
  );
}
