"use client";

import type { FaceMediaSpec } from "@/lib/types";

/**
 * Each face's hero is a cinematic PHOTOGRAPH — cover-cropped, darkened and
 * accent-tinted in CSS, with a slow CSS Ken-Burns zoom as the only motion.
 * (The old drifting-particle overlay was removed — it looked stretched/cheap.)
 */
export function FaceMedia({
  media,
}: {
  media: FaceMediaSpec;
  accent: string;
  accent2: string;
  active: boolean;
  density: number;
}) {
  return (
    <div className="r-media" data-renderer={media.renderer}>
      {media.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          className="r-media-img"
          src={media.image.src}
          alt={media.image.alt}
          style={{ objectPosition: media.image.position ?? "center" }}
          draggable={false}
          loading="lazy"
          decoding="async"
        />
      )}
      <div className="r-media-tint" />
      <div className="r-media-vignette" />
    </div>
  );
}
