# Asset Credits

Each face's hero is a **cinematic photograph** (cover-cropped, darkened and
accent-tinted in CSS) with one shared, subtle **ambient motion layer** drawn on
top (`AmbientField.tsx` — slow-drifting dust + a soft accent beacon, HTML5
Canvas). No raw video clips or stock footage are embedded; the photos are used
as darkened, tinted backdrops only.

## Per-face hero photos (`public/visuals/`)

Processed (cropped, darkened, accent-tinted) from freely-licensed sources.

| File | Face | Accent | Image | Source | Author | Licence |
|------|------|--------|-------|--------|--------|---------|
| `scientist.webp` | 01 Scientist | Blue | ALMA antennas under the Milky Way (Chajnantor) | ESO | ESO / B. Tafreshi (twanight.org) | CC BY 4.0 |
| `ml.webp` | 02 ML / Data Builder | Green | Green aurora borealis over a dark fjord at night | Unsplash | Andrés Dallimonti (@dallimonti) | Unsplash License |
| `ai.webp` | 03 AI Engineer | Violet | Violet light-installation hallway | Unsplash | tommao wang (@tommaomaoer) | Unsplash License |
| `football.webp` | 04 Football Thinker | Red | Aerial top-down floodlit football pitch at night | Unsplash | Bence Balla-Schottner | Unsplash License |

- ESO images: [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) — credit "ESO/B. Tafreshi" required.
- [Unsplash License](https://unsplash.com/license): free for commercial use, no attribution required (credited here anyway).
- More candidates (real photos + codex-generated abstracts) are kept in `reference/candidates/` with a contact sheet `index.html`, plus full DALL·E prompts in `CHATGPT_PROMPTS.md`.

## Chapter result figures (`public/visuals/chapters/`)

Shown in the scroll chapters as editorial "plates". These are Ahmad's OWN result
figures, downloaded from his public repositories and papers (no third-party stock):

| File | Chapter | Source |
|------|---------|--------|
| `ml-fivemethods.webp` | ML | Five-method burn-severity comparison, from `bushfire-burn-severity-mapper` |
| `ai-hero.webp` | AI | AuroraGaze live-app screenshot, from the `auroragaze` repo |

The SCIENCE chapter intentionally uses NO raw paper/GitHub figures: its results are
re-drawn as original, theme-matched animations. Every animated chapter figure in
`src/components/rosetta/figures/` is original (Canvas 2D, built for this project):
vlbi, kolmogorov, spaceweather, geodesy, satlink, bayes, scintillation, forecast,
causal, geoscan, optim, agentflow, rag, guardrail, pitch, tracking, dilemma, passmap.
No animated figure is reused across two projects within a chapter.

## Motion layer (`src/components/rosetta/visuals/`)

- `AmbientField.tsx` — one shared, deliberately subtle Canvas layer used by every
  face: slow-drifting dust motes + a soft accent "beacon" that breathes in the
  upper-right. The photograph is the hero; the motion only adds gentle life.
- Hero photos also get a slow **Ken Burns** zoom (CSS) on the visible front face.
- Both respect `prefers-reduced-motion` (static frame / no zoom) and only the
  front face animates.

## Other generated elements
- Deep-space starfield + nebula background: generated in-browser (`SpaceBackground.tsx`, Canvas + CSS).
- The cube stage, the rigid-body quarter-turn, the lit cube edges and directional shading: pure CSS 3D (`globals.css`).
- Fonts: Cinzel, Playfair Display, Inter (Google Fonts, OFL).

## What is deliberately NOT used
- No video files (the earlier PhD-talk-derived clips were removed).
- No copyrighted football broadcast imagery.
- No private or sensitive documents.

> To restyle a face, swap its `media.image` in `src/lib/faceData.ts` or tune the
> shared `AmbientField.tsx` / `.r-media-*` rules in `globals.css`.
