"use client";

import { useRef, type CSSProperties, type TouchEvent, type WheelEvent } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Face } from "@/lib/types";
import { themeVars } from "@/lib/navigation";
import { useCubeRotation } from "./useCubeRotation";
import { CubeFace } from "./CubeFace";
import { SiteHeader } from "./SiteHeader";
import { FacetControls } from "./FacetControls";
import { OrbitNavigation } from "./OrbitNavigation";
import { SpaceBackground } from "./SpaceBackground";
import { FaceChapter } from "./FaceChapter";

/**
 * The Rosetta Atlas stage. At rest the viewport shows exactly ONE legible face
 * (the cube sits with a slight yaw, so its near edge + a shaded side read as
 * solid). A turn rotates the whole rigid cube a quarter-turn to its next side,
 * revealing the lit corner, then settles on a single face again. No carousel.
 */
export function RosettaStage({
  faces,
  defaultIndex,
}: {
  faces: Face[];
  defaultIndex: number;
}) {
  const {
    rotorDeg,
    frontIndex,
    displayIndex,
    isRotating,
    turnMs,
    announce,
    goTo,
    next,
    prev,
  } = useCubeRotation(faces, defaultIndex);

  const wheelLock = useRef(0);
  const touchX = useRef<number | null>(null);

  const chromeFace = (faces[displayIndex] ?? faces[0]) as Face;
  const rootStyle = themeVars(chromeFace) as CSSProperties;

  const onWheel = (e: WheelEvent) => {
    // vertical scroll moves the PAGE (cube hero → chapters); only a clearly
    // horizontal gesture turns the cube, so scrolling is never hijacked.
    if (Math.abs(e.deltaX) <= Math.abs(e.deltaY)) return;
    const now = e.timeStamp;
    if (now - wheelLock.current < 720) return;
    if (Math.abs(e.deltaX) < 18) return;
    wheelLock.current = now;
    if (e.deltaX > 0) next();
    else prev();
  };
  const onTouchStart = (e: TouchEvent) => {
    touchX.current = e.touches[0]?.clientX ?? null;
  };
  const onTouchEnd = (e: TouchEvent) => {
    if (touchX.current == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX.current) - touchX.current;
    touchX.current = null;
    if (Math.abs(dx) < 48) return;
    if (dx < 0) next();
    else prev();
  };

  return (
    <>
    <div className="r-root" id="top" style={rootStyle}>
      <a className="r-skip" href="#r-stage">
        Skip to content
      </a>

      {/* side arrows — change the face */}
      <button
        type="button"
        className="r-side r-side-prev"
        onClick={prev}
        aria-label="Previous face"
      >
        <ChevronLeft aria-hidden />
      </button>
      <button
        type="button"
        className="r-side r-side-next"
        onClick={next}
        aria-label="Next face"
      >
        <ChevronRight aria-hidden />
      </button>

      <SpaceBackground accent={chromeFace.theme.accent} />

      <svg className="r-grain" xmlns="http://www.w3.org/2000/svg" aria-hidden>
        <filter id="r-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix type="saturate" values="0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#r-noise)" />
      </svg>

      <SiteHeader face={chromeFace} />

      <main
        id="r-stage"
        className="r-scene"
        onWheel={onWheel}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >
        <div className="r-stage-shadow" aria-hidden />
        <div className="cube-stage" style={{ "--turn": `${turnMs}ms` } as CSSProperties}>
          {/* a static yaw gives the box dimensionality at rest; the rotor inside
              carries the live quarter-turns. overflow/perspective live on the
              flat .cube-stage wrapper, never on a preserve-3d node. */}
          <div className="cube-tilt">
            <div
              className="cube-rotor"
              style={{
                transform: `translateZ(calc(var(--half) * -1)) rotateY(${rotorDeg}deg)`,
              }}
            >
              {faces.map((face, i) => (
                <CubeFace
                  key={face.id}
                  face={face}
                  index={i}
                  isFront={i === frontIndex}
                  // only the front side animates its visual (perf); it becomes
                  // interactive only once the turn has fully settled.
                  visualActive={i === frontIndex}
                  interactive={i === frontIndex && !isRotating}
                  turnMs={turnMs}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="r-floor" aria-hidden />
      </main>

      <div className="r-belt">
        <FacetControls onPrev={prev} onNext={next} />
      </div>

      <OrbitNavigation faces={faces} activeIndex={displayIndex} onSelect={goTo} />

      <p className="r-caption">One cube. Four faces. Infinite curiosity.</p>

      <div aria-live="polite" className="sr-only">
        {announce}
      </div>
    </div>

    {/* only the CURRENT face's chapter is shown; it swaps as the cube turns */}
    <div className="r-chapters">
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={chromeFace.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <FaceChapter face={chromeFace} />
        </motion.div>
      </AnimatePresence>
    </div>

    <footer className="r-footer">
      <p className="r-footer-line">One cube. Four faces. Infinite curiosity.</p>
      <div className="r-footer-links">
        <a href="https://github.com/Ahmad-Jaradat-Space" target="_blank" rel="noreferrer">
          GitHub
        </a>
        <a href="mailto:jaradat08@gmail.com">jaradat08@gmail.com</a>
        <a href="#top">Back to top</a>
      </div>
    </footer>
    </>
  );
}
