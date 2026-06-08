"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

export function FacetControls({
  onPrev,
  onNext,
}: {
  onPrev: () => void;
  onNext: () => void;
}) {
  return (
    <div className="r-controls">
      <button className="r-rotate" onClick={onPrev} aria-label="Previous face">
        <ChevronLeft aria-hidden />
      </button>
      <button className="r-rotate" onClick={onNext} aria-label="Next face">
        <ChevronRight aria-hidden />
      </button>
      <span className="r-microcopy" aria-hidden>
        Rotate the cube · use ← →
      </span>
    </div>
  );
}
