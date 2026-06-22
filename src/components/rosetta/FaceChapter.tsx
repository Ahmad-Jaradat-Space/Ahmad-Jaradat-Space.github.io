"use client";

import { useRef, type CSSProperties } from "react";
import { motion, useInView, useReducedMotion, type MotionProps } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import type { ChapterBeat, ChapterFigure, ChapterImage, Face } from "@/lib/types";
import { themeVars } from "@/lib/navigation";
import { ICONS } from "./icons";
import { FIGURES } from "./figures/registry";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** Renders a part's visual: an animated figure, or a real image as a plate. */
function Visual({
  figure,
  image,
  accent,
  accent2,
  active,
}: {
  figure?: ChapterFigure;
  image?: ChapterImage;
  accent: string;
  accent2: string;
  active: boolean;
}) {
  if (image) {
    return (
      <figure className="r-plate">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={image.src} alt={image.alt} loading="lazy" decoding="async" />
        {image.caption && <figcaption>{image.caption}</figcaption>}
      </figure>
    );
  }
  if (figure) {
    const Cmp = FIGURES[figure];
    return (
      <div className="r-fig">
        <Cmp accent={accent} accent2={accent2} active={active} />
      </div>
    );
  }
  return null;
}

/**
 * A flagship beat given prominent placement at the top of a chapter: it takes the
 * hero slot, pairs the story with its figure, and surfaces its link inline (rather
 * than only in the closing "Sources" block).
 */
function Spotlight({
  beat,
  accent,
  accent2,
  active,
  reveal,
}: {
  beat: ChapterBeat;
  accent: string;
  accent2: string;
  active: boolean;
  reveal: MotionProps;
}) {
  const Icon = beat.icon ? ICONS[beat.icon] : null;
  const hasVis = Boolean(beat.figure || beat.image);
  return (
    <motion.article className="r-spotlight" {...reveal}>
      <div className="r-spotlight-body">
        <span className="r-spotlight-ribbon">Featured</span>
        {beat.kind && <span className="r-beat-kind">{beat.kind}</span>}
        <h3 className="r-spotlight-title">
          {Icon && <Icon aria-hidden strokeWidth={1.5} />}
          <span>{beat.title}</span>
        </h3>
        <p className="r-spotlight-summary">{beat.summary}</p>
        {beat.facts && beat.facts.length > 0 && (
          <div className="r-beat-facts">
            {beat.facts.map((f) => (
              <span className="r-fact" key={f.label}>
                <span className="r-fact-l">{f.label}</span>
                <span className="r-fact-v">{f.value}</span>
              </span>
            ))}
          </div>
        )}
        {beat.href && (
          <a
            className="r-btn r-spotlight-cta"
            href={beat.href}
            target="_blank"
            rel="noreferrer"
          >
            {beat.linkLabel ?? "Open"}
            <ArrowUpRight aria-hidden />
          </a>
        )}
      </div>
      {hasVis && (
        <div className="r-spotlight-fig">
          <Visual
            figure={beat.figure}
            image={beat.image}
            accent={accent}
            accent2={accent2}
            active={active}
          />
        </div>
      )}
    </motion.article>
  );
}

/**
 * One full scroll "chapter" for a face: a themed, self-contained story of the
 * person's ideas and results. Every idea and beat carries its own visual; the
 * only outbound links sit in the closing "Sources and Continue" block.
 */
export function FaceChapter({ face }: { face: Face }) {
  const ref = useRef<HTMLElement | null>(null);
  const reduced = useReducedMotion();
  const inView = useInView(ref, { amount: 0.1 });
  const active = inView && !reduced;
  const ch = face.chapter;
  const { accent, accent2 } = face.theme;
  const links = ch.beats.filter((b) => b.href);

  const reveal = reduced
    ? {}
    : {
        initial: { opacity: 0, y: 28 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.3 },
        transition: { duration: 0.6, ease: EASE },
      };

  return (
    <section
      ref={ref}
      id="chapter"
      className="r-chapter"
      style={themeVars(face) as CSSProperties}
      aria-label={`${face.title}: ${ch.title}`}
    >
      {face.media.image && (
        <div className="r-chapter-bg" aria-hidden>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={face.media.image.src} alt="" />
          <div className="r-chapter-bg-tint" />
        </div>
      )}

      <div className="r-chapter-inner">
        <motion.header className="r-chapter-head" {...reveal}>
          <span className="r-chapter-kicker">{ch.kicker}</span>
          <h2 className="r-chapter-title">{ch.title}</h2>
          <p className="r-chapter-intro">{ch.intro}</p>
        </motion.header>

        {ch.spotlight ? (
          <Spotlight
            beat={ch.spotlight}
            accent={accent}
            accent2={accent2}
            active={active}
            reveal={reveal}
          />
        ) : ch.heroFigure ? (
          <motion.div className="r-chapter-hero-fig" {...reveal}>
            <Visual
              figure={ch.heroFigure}
              accent={accent}
              accent2={accent2}
              active={active}
            />
          </motion.div>
        ) : null}

        <div className="r-ideas">
          {ch.ideas.map((idea) => {
            const Icon = idea.icon ? ICONS[idea.icon] : null;
            return (
              <motion.div className="r-idea" key={idea.title} {...reveal}>
                {(idea.figure || idea.image) && (
                  <div className="r-idea-vis">
                    <Visual
                      figure={idea.figure}
                      image={idea.image}
                      accent={accent}
                      accent2={accent2}
                      active={active}
                    />
                  </div>
                )}
                <h3 className="r-idea-title">
                  {Icon && <Icon aria-hidden strokeWidth={1.5} />}
                  <span>{idea.title}</span>
                </h3>
                <p className="r-idea-text">{idea.text}</p>
              </motion.div>
            );
          })}
        </div>

        <div className="r-beats">
          {ch.beats.map((beat) => {
            const Icon = beat.icon ? ICONS[beat.icon] : null;
            const hasVis = Boolean(beat.figure || beat.image);
            return (
              <motion.article
                className={`r-beat${hasVis ? " has-fig" : ""}`}
                key={beat.title}
                {...reveal}
              >
                <div className="r-beat-body">
                  <span className="r-beat-kind">{beat.kind}</span>
                  <h3 className="r-beat-title">
                    {Icon && <Icon aria-hidden strokeWidth={1.5} />}
                    <span>{beat.title}</span>
                  </h3>
                  <p className="r-beat-summary">{beat.summary}</p>
                  {beat.facts && beat.facts.length > 0 && (
                    <div className="r-beat-facts">
                      {beat.facts.map((f) => (
                        <span className="r-fact" key={f.label}>
                          <span className="r-fact-l">{f.label}</span>
                          <span className="r-fact-v">{f.value}</span>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                {hasVis && (
                  <div className="r-beat-fig">
                    <Visual
                      figure={beat.figure}
                      image={beat.image}
                      accent={accent}
                      accent2={accent2}
                      active={active}
                    />
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>

        {links.length > 0 && (
          <motion.div className="r-chapter-sources" {...reveal}>
            <span className="r-sources-label">Sources and Continue</span>
            <div className="r-sources-links">
              {links.map((b) => (
                <a
                  key={b.href}
                  className="r-btn"
                  href={b.href}
                  target="_blank"
                  rel="noreferrer"
                >
                  {b.linkLabel ?? "Open"}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
