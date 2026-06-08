"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Face } from "@/lib/types";
import { mod, shortestPath } from "@/lib/navigation";

export type TurnDir = "next" | "prev";

const DURATION_FULL = 900; // ms — a deliberate, premium cube turn
const DURATION_REDUCED = 240; // ms — a quick crossfade for reduced motion

export type CubeNav = {
  /** accumulating rotor angle (deg); applied verbatim as rotateY(rotorDeg) */
  rotorDeg: number;
  /** the face index currently at the front, derived from rotorDeg */
  frontIndex: number;
  /** drives all chrome (theme, pill, orbit, counter); commits at the midpoint */
  displayIndex: number;
  /** true while a turn is animating */
  isRotating: boolean;
  reduced: boolean;
  /** turn duration in ms (shortened under reduced motion) */
  turnMs: number;
  announce: string;
  goTo: (target: number) => void;
  next: () => void;
  prev: () => void;
};

/**
 * True 4-face cube rotor. All faces are mounted at once, each fixed to a side
 * of the box (`rotateY(i·90°)`); a single ACCUMULATING angle on the rotor turns
 * the whole rigid body. We never reset the angle — `next` subtracts 90°, `prev`
 * adds 90°, `goTo` adds the signed shortest-path delta — so the cube always
 * turns the short way in the nav direction and never snaps backwards at the
 * 0↔(n-1) wrap. The front face is recovered from the angle; chrome commits at
 * the turn midpoint. One face is legible at rest; the cube only reveals its
 * corner during the turn.
 */
export function useCubeRotation(faces: Face[], defaultIndex: number): CubeNav {
  const count = faces.length;

  const [rotorDeg, setRotorDeg] = useState(-90 * defaultIndex);
  const [displayIndex, setDisplayIndex] = useState(defaultIndex);
  const [isRotating, setIsRotating] = useState(false);
  const [announce, setAnnounce] = useState("");
  const [reduced, setReduced] = useState(false);

  const rotorDegRef = useRef(-90 * defaultIndex);
  const rotatingRef = useRef(false);
  const pendingRef = useRef<number | null>(null);
  const reducedRef = useRef(false);
  const goToRef = useRef<(target: number) => void>(() => {});
  const tMid = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tEnd = useRef<ReturnType<typeof setTimeout> | null>(null);

  /** which side faces the viewer for a given accumulated angle */
  const frontFromDeg = useCallback(
    (deg: number) => mod(Math.round(-deg / 90), count),
    [count],
  );

  useEffect(() => {
    const mq =
      typeof window !== "undefined" && window.matchMedia
        ? window.matchMedia("(prefers-reduced-motion: reduce)")
        : null;
    if (mq) {
      const sync = () => {
        setReduced(mq.matches);
        reducedRef.current = mq.matches;
      };
      sync();
      mq.addEventListener?.("change", sync);
      return () => {
        mq.removeEventListener?.("change", sync);
        if (tMid.current) clearTimeout(tMid.current);
        if (tEnd.current) clearTimeout(tEnd.current);
      };
    }
    return () => {
      if (tMid.current) clearTimeout(tMid.current);
      if (tEnd.current) clearTimeout(tEnd.current);
    };
  }, []);

  const commitChrome = useCallback(
    (to: number) => {
      setDisplayIndex(to);
      const f = faces[to];
      if (f) {
        setAnnounce(
          `Face ${to + 1} of ${count}: ${f.title}. ${f.headlineLines.join(" ")}`,
        );
      }
    },
    [faces, count],
  );

  const goTo = useCallback(
    (rawTarget: number) => {
      const to = mod(rawTarget, count);
      const current = frontFromDeg(rotorDegRef.current);

      // mid-turn requests queue; the latest wins and runs on settle
      if (rotatingRef.current) {
        pendingRef.current = to;
        return;
      }
      if (to === current) return;

      // signed shortest-path delta → the rotor keeps accumulating, so the cube
      // turns the short way and never unwinds at the wrap (e.g. 3 → 0 = -90°).
      const { steps, direction } = shortestPath(current, to, count);
      const delta = (direction === "cw" ? -90 : 90) * steps;
      const nextDeg = rotorDegRef.current + delta;
      rotorDegRef.current = nextDeg;

      rotatingRef.current = true;
      setIsRotating(true);
      setRotorDeg(nextDeg); // CSS transition animates the rotor → no snap-back

      const dur = reducedRef.current ? DURATION_REDUCED : DURATION_FULL;

      // chrome/theme swaps as the new face swings to front
      tMid.current = setTimeout(() => commitChrome(to), Math.round(dur * 0.5));

      tEnd.current = setTimeout(() => {
        rotatingRef.current = false;
        setIsRotating(false);

        const queued = pendingRef.current;
        pendingRef.current = null;
        if (queued != null && queued !== frontFromDeg(rotorDegRef.current)) {
          goToRef.current(queued);
        }
      }, dur);
    },
    [count, commitChrome, frontFromDeg],
  );

  useEffect(() => {
    goToRef.current = goTo;
  }, [goTo]);

  // next/prev advance one quarter from the latest front (so rapid taps stack)
  const next = useCallback(
    () => goTo(frontFromDeg(rotorDegRef.current) + 1),
    [goTo, frontFromDeg],
  );
  const prev = useCallback(
    () => goTo(frontFromDeg(rotorDegRef.current) - 1),
    [goTo, frontFromDeg],
  );

  return {
    rotorDeg,
    frontIndex: frontFromDeg(rotorDeg),
    displayIndex,
    isRotating,
    reduced,
    turnMs: reduced ? DURATION_REDUCED : DURATION_FULL,
    announce,
    goTo,
    next,
    prev,
  };
}
