"use client";

import { useRef, type KeyboardEvent } from "react";
import type { Face } from "@/lib/types";

/**
 * Static fixed-position orbit strip. The active node glows IN ITS OWN
 * position (never re-centers). role=tablist with roving tabindex.
 */
export function OrbitNavigation({
  faces,
  activeIndex,
  onSelect,
}: {
  faces: Face[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  const btns = useRef<Array<HTMLButtonElement | null>>([]);
  const count = faces.length;

  const focusTab = (i: number) => btns.current[i]?.focus();

  const onKeyDown = (e: KeyboardEvent, i: number) => {
    let t = i;
    switch (e.key) {
      case "ArrowRight":
      case "ArrowDown":
        t = (i + 1) % count;
        break;
      case "ArrowLeft":
      case "ArrowUp":
        t = (i - 1 + count) % count;
        break;
      case "Home":
        t = 0;
        break;
      case "End":
        t = count - 1;
        break;
      case "Enter":
      case " ":
        e.preventDefault();
        onSelect(i);
        return;
      default:
        return;
    }
    e.preventDefault();
    focusTab(t);
    onSelect(t);
  };

  return (
    <div className="r-orbit">
      <div className="r-orbit-track" role="tablist" aria-label="Choose a face">
        <svg
          className="r-orbit-curve"
          viewBox="0 0 1000 110"
          preserveAspectRatio="none"
          aria-hidden
        >
          <path d="M0 24 Q 500 84 1000 24" vectorEffect="non-scaling-stroke" />
        </svg>
        {faces.map((f, i) => {
          const active = i === activeIndex;
          // nodes ride the front arc of an elliptical orbit ring (deeper in the
          // middle) — the curve reads as a circle wrapping around the cube.
          const dy = Math.sin((i / (count - 1)) * Math.PI) * 30;
          return (
            <button
              key={f.id}
              ref={(el) => {
                btns.current[i] = el;
              }}
              role="tab"
              id={`orbit-tab-${f.id}`}
              aria-selected={active}
              aria-current={active ? "true" : undefined}
              tabIndex={active ? 0 : -1}
              className={`r-onode${active ? " active" : ""}`}
              style={{ transform: `translateY(${dy}px)` }}
              onClick={() => onSelect(i)}
              onKeyDown={(e) => onKeyDown(e, i)}
            >
              <span className="dot" aria-hidden />
              <span className="lbl">{f.shortTitle}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
