"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight, Zap } from "lucide-react";
import type { HeroSlide } from "@/lib/types";
import { navigate } from "@/lib/router";

/**
 * HeroCarousel — Temu-style auto-sliding hero banner.
 *
 * - Image AND video slides (videos play muted/looped, advance when they end)
 * - Auto-advances every 4 s (pauses while hovering on desktop)
 * - Arrows + dots + touch swipe; transform-only animation for zero jank
 * - With no custom slides it renders the store's original hero unchanged
 */

const AUTO_SLIDE_MS = 4000;

export function HeroCarousel({
  slides,
  fallbackHeadline,
  fallbackSubtitle,
  fallbackPriceLine,
}: {
  slides: HeroSlide[];
  fallbackHeadline: string;
  fallbackSubtitle: string;
  fallbackPriceLine: string;
}) {
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const touchX = useRef<number | null>(null);
  const currentVideo = useRef<HTMLVideoElement | null>(null);

  const go = useCallback(
    (next: number) => setIndex(((next % count) + count) % count),
    [count]
  );
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  /* Auto-advance: 4 s for images; a playing video advances on its own
     'ended' event (with a 4 s floor so broken videos never stall). */
  useEffect(() => {
    if (count <= 1 || paused) return;
    const slide = slides[index];
    const isVideo = slide?.mediaType === "video";
    const id = window.setTimeout(() => {
      const v = currentVideo.current;
      // If a video is actively playing and longer than 4 s, let 'ended' drive.
      if (isVideo && v && !v.paused && !v.ended && v.currentTime < 3.6) return;
      next();
    }, AUTO_SLIDE_MS);
    return () => window.clearTimeout(id);
  }, [index, count, paused, slides, next]);

  /* No custom slides → render the original hero exactly as it always was. */
  if (count === 0) {
    return (
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#ff8a3d] via-[#ff6a00] to-[#f43f00]">
        <div className="grid items-center gap-0 md:grid-cols-[1.1fr_1fr]">
          <div className="px-6 py-8 sm:px-10 sm:py-12">
            <p className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <Zap className="h-3 w-3" aria-hidden="true" />
              Top picks — updated weekly
            </p>
            <h1 className="mt-4 font-display text-2xl font-extrabold leading-tight text-white sm:text-4xl">
              {fallbackHeadline}
              <span className="mt-1 block text-lg font-bold sm:text-2xl">
                {fallbackPriceLine}
              </span>
            </h1>
            <p className="mt-3 max-w-md text-sm leading-relaxed text-white/90 sm:text-base">
              {fallbackSubtitle}
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => navigate("/products")}
                className="inline-flex h-11 items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#ff6a00] shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
              >
                Shop Now
                <ChevronRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => navigate("/categories")}
                className="inline-flex h-11 items-center gap-2 rounded-full border-2 border-white/60 px-6 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Browse categories
              </button>
            </div>
          </div>
          <div className="relative hidden h-full min-h-56 items-center justify-center p-6 md:flex">
            <img
              alt="Curated gadgets and lifestyle finds"
              className="max-h-64 w-full rounded-xl object-cover shadow-2xl"
              src="/images/hero.jpg"
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="group relative overflow-hidden rounded-2xl bg-muted"
      role="region"
      aria-roledescription="carousel"
      aria-label="Featured offers"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchX.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        const start = touchX.current;
        const end = e.changedTouches[0]?.clientX ?? null;
        touchX.current = null;
        if (start == null || end == null) return;
        const dx = end - start;
        if (Math.abs(dx) > 48) (dx < 0 ? next : prev)();
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") next();
        if (e.key === "ArrowLeft") prev();
      }}
      tabIndex={0}
    >
      {/* Track — transform-only movement, GPU friendly */}
      <div
        className="flex h-full w-full transition-transform duration-500 ease-out will-change-transform"
        style={{ transform: `translateX(-${index * 100}%)` }}
        aria-live="polite"
      >
        {slides.map((slide, i) => {
          const active = i === index;
          const near = i === index || i === (index + 1) % count || i === (index - 1 + count) % count;
          return (
            <div key={slide.id} className="relative w-full shrink-0" aria-hidden={!active}>
              {/* Media */}
              {slide.mediaType === "video" ? (
                near ? (
                  <video
                    ref={active ? currentVideo : undefined}
                    src={slide.media}
                    className="h-[240px] w-full object-cover sm:h-[320px] md:h-[380px]"
                    autoPlay={active}
                    muted
                    loop={false}
                    playsInline
                    preload={near ? "auto" : "none"}
                    onEnded={count > 1 && active ? next : undefined}
                    onError={count > 1 && active ? next : undefined}
                    aria-label={slide.headline || "Featured video"}
                  />
                ) : (
                  <div className="h-[240px] w-full bg-muted sm:h-[320px] md:h-[380px]" />
                )
              ) : (
                <img
                  src={slide.media}
                  alt={slide.headline || "Featured offer"}
                  loading={i === 0 ? "eager" : "lazy"}
                  className="h-[240px] w-full object-cover sm:h-[320px] md:h-[380px]"
                />
              )}

              {/* Legibility scrim + copy */}
              <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-black/65 via-black/35 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center gap-2 px-6 sm:px-10">
                {slide.headline && (
                  <h2 className="max-w-lg font-display text-xl font-extrabold leading-tight text-white drop-shadow-md sm:text-3xl">
                    {slide.headline}
                  </h2>
                )}
                {slide.subHeadline && (
                  <p className="max-w-md text-sm font-medium leading-relaxed text-white/90 drop-shadow sm:text-base">
                    {slide.subHeadline}
                  </p>
                )}
                {(slide.ctaLabel || !slide.headline) && (
                  <a
                    href={slide.ctaUrl || "#/products"}
                    onClick={(e) => {
                      const url = slide.ctaUrl || "#/products";
                      if (url.startsWith("#/")) {
                        e.preventDefault();
                        navigate(url.slice(1));
                      }
                    }}
                    className="mt-2 inline-flex h-11 w-fit items-center gap-2 rounded-full bg-white px-6 text-sm font-bold text-[#ff6a00] shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    {slide.ctaLabel || "Shop Now"}
                    <ChevronRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Arrows (desktop) */}
      {count > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 active:scale-90 sm:flex"
          >
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={next}
            aria-label="Next slide"
            className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition-all hover:bg-black/60 active:scale-90 sm:flex"
          >
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </button>
        </>
      )}

      {/* Dots */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => go(i)}
              aria-label={`Go to slide ${i + 1}`}
              aria-current={i === index}
              className={`h-2 rounded-full transition-all ${
                i === index ? "w-6 bg-white" : "w-2 bg-white/50 hover:bg-white/80"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
