"use client";

import type { CSSProperties } from "react";
import type { Face } from "@/lib/types";
import { themeVars } from "@/lib/navigation";
import { FacePanel } from "./FacePanel";

/**
 * One side of the cube. It is fixed to its slot on the box via `--i`
 * (`rotateY(var(--i) * 90deg) translateZ(--half)` in CSS); the rotor — its
 * parent — carries the actual rotation, so a face never animates on its own,
 * it just rides the rigid body. `isFront` lights the resting/incoming side and
 * suppresses the directional shade; only the settled front side is interactive.
 */
export function CubeFace({
  face,
  index,
  isFront,
  interactive,
  visualActive,
  turnMs,
}: {
  face: Face;
  index: number;
  isFront: boolean;
  interactive: boolean;
  visualActive: boolean;
  turnMs: number;
}) {
  return (
    <div
      className={`cube-face${isFront ? " is-front" : ""}`}
      style={
        {
          ...(themeVars(face) as CSSProperties),
          "--i": index,
          "--turn": `${turnMs}ms`,
        } as CSSProperties
      }
      data-active={interactive ? "true" : undefined}
      aria-hidden={interactive ? undefined : true}
      inert={interactive ? undefined : true}
    >
      <FacePanel face={face} active={interactive} visualActive={visualActive} />
    </div>
  );
}
