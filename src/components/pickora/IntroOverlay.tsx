"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRight, ChevronRight, ShoppingBag } from "lucide-react";
import { AuroraCanvas } from "./AuroraCanvas";
import { CountryPickerContent } from "./CountryPicker";
import { useStore } from "@/lib/store";
import { CURRENCY_NAMES } from "@/lib/countries";
import { toast } from "./BackToTop";

/**
 * First-visit intro — a full-screen takeover that ALWAYS renders before the
 * store (a server-rendered gate `#pk-intro-gate` blocks the storefront until
 * this overlay or the app decides otherwise — no store flash).
 *
 * Flow: owner video (public/intro-video.mp4, if present) → WebGL aurora
 * hero → "Start shopping" → country/currency picker (first time only).
 * The clip is always attempted first — the <video> element loads it with a
 * plain GET (proxy/CDN-safe; no HEAD probe) and falls back to the animated
 * hero automatically when it is missing, unreachable, or autoplay-blocked.
 * Signed-in shoppers and returning visitors skip straight to the store.
 * Replay any time via the footer link (pk:intro-replay).
 */

const FLAG = "pk_intro_seen_v1";
const CLOSE_MS = 350;
const VIDEO_SRC = "/intro-video.mp4";

export const INTRO_REPLAY_EVENT = "pk:intro-replay";

/** Re-show the intro overlay (footer → "Replay intro"). */
export function replayIntro() {
  try {
    localStorage.removeItem(FLAG);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new CustomEvent(INTRO_REPLAY_EVENT));
}

/** The server-rendered gate element that hides the store until first paint. */
function removeGate() {
  document.getElementById("pk-intro-gate")?.remove();
}

function markSeen() {
  try {
    localStorage.setItem(FLAG, "1");
  } catch {
    /* ignore */
  }
}

type Phase = "video" | "hero" | "country";

export function IntroOverlay({
  brand,
  authResolved,
  signedIn,
}: {
  brand: string;
  /** true once /api/account/me has settled (gate keeps covering until then) */
  authResolved: boolean;
  signedIn: boolean;
}) {
  const { country, setCountry } = useStore();
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [phase, setPhase] = useState<Phase>("video");
  const [progress, setProgress] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const decided = useRef(false);

  const open = (replay = false) => {
    if (replay) decided.current = true; // explicit replay overrides sign-in state
    setLeaving(false);
    setProgress(0);
    setVisible(true);
    // Always attempt the video first — no HEAD probe (some preview proxies
    // and CDNs break HEAD requests). The element's own error/stall events
    // fall back to the animated hero when the clip is genuinely missing.
    setPhase("video");
  };

  // Initial decision: wait for the auth check, then intro or straight in.
  useEffect(() => {
    if (decided.current || !authResolved) return;
    decided.current = true;
    let seen = false;
    try {
      seen = localStorage.getItem(FLAG) === "1";
    } catch {
      seen = false;
    }
    if (seen || signedIn) {
      removeGate();
    } else {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- deliberate first-visit takeover
      open();
    }
    const onReplay = () => open(true);
    window.addEventListener(INTRO_REPLAY_EVENT, onReplay);
    return () => window.removeEventListener(INTRO_REPLAY_EVENT, onReplay);
     
  }, [authResolved, signedIn]);

  const goHero = () => setPhase("hero");

  const close = () => {
    setLeaving(true);
    window.setTimeout(() => {
      setVisible(false);
      removeGate();
      markSeen();
    }, CLOSE_MS);
  };

  const startShopping = () => {
    markSeen();
    if (country) close();
    else setPhase("country");
  };

  const pickCountry = (code: string) => {
    setCountry(code);
    const cur = CURRENCY_NAMES[code] ? ` (${CURRENCY_NAMES[code as keyof typeof CURRENCY_NAMES]})` : "";
    toast(`Prices now shown in your local currency${cur}`);
    close();
  };

  // Lock body scroll while the takeover is on screen.
  useEffect(() => {
    if (!visible) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [visible]);

  // Kick playback and never trap the visitor: missing/unreachable clip or
  // blocked autoplay falls back to the animated hero automatically.
  useEffect(() => {
    if (phase !== "video") return;
    const v = videoRef.current;
    if (!v) return;
    v.play().catch(() => {}); // some browsers want an explicit kick

    // Nothing loaded at all after 4s → network black hole → hero.
    const stalled = window.setTimeout(() => {
      if (v.error || v.readyState === 0) goHero();
    }, 4000);

    // Autoplay blocked → retry once, then gracefully fall back.
    const blocked = window.setTimeout(() => {
      if (!v.paused) return;
      v.play().catch(() => goHero());
    }, 1800);

    const clear = () => {
      window.clearTimeout(stalled);
      window.clearTimeout(blocked);
    };
    v.addEventListener("playing", clear);
    return () => {
      clear();
      v.removeEventListener("playing", clear);
    };
  }, [phase]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] overflow-hidden bg-[#0d1017] transition-opacity duration-300 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Welcome intro"
    >
      {/* ── Phase 1 · owner video (auto-adjusts portrait & landscape) ── */}
      {phase === "video" && (
        <>
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full animate-kenburns object-cover"
            src={VIDEO_SRC}
            autoPlay
            muted
            playsInline
            preload="auto"
            onEnded={goHero}
            onError={goHero}
            onTimeUpdate={(e) => {
              const v = e.currentTarget;
              if (v.duration > 0) setProgress(v.currentTime / v.duration);
            }}
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/30" />
          <div className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-4 p-5 sm:p-8">
            <div className="animate-fade-up">
              <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-white/70">
                Curated marketplace
              </p>
              <p className="mt-1 font-display text-2xl font-extrabold tracking-tight text-white sm:text-4xl">
                {brand}
              </p>
            </div>
            <button
              type="button"
              onClick={goHero}
              className="inline-flex h-10 shrink-0 items-center gap-1 rounded-full bg-white/10 px-4 text-sm font-bold text-white backdrop-blur-md transition-all hover:bg-white/20 active:scale-95"
            >
              Skip video
              <ChevronRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
            </button>
          </div>
          <div className="absolute bottom-0 left-0 right-0 z-10 h-0.5 bg-white/15" aria-hidden="true">
            <div
              className="h-full bg-white transition-[width] duration-300 ease-linear"
              style={{ width: `${Math.min(100, progress * 100)}%` }}
            />
          </div>
        </>
      )}

      {/* ── Phase 2 · WebGL aurora hero ───────────────────────────────── */}
      {phase !== "video" && (
        <>
          {/* CSS fallback gradient (visible if WebGL is unavailable) */}
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_60%,#3a120a_0%,#1a0d08_38%,#0d1017_78%)]"
          />
          <AuroraCanvas className="absolute inset-0 h-full w-full" />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(5,7,12,0.55)_100%)]"
          />

          {phase === "hero" ? (
            <div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
              <p className="animate-fade-in text-[10px] font-bold uppercase tracking-[0.3em] text-white/60">
                Curated marketplace
              </p>

              <div className="mt-6 flex animate-fade-up items-center gap-2.5">
                <span
                  aria-hidden="true"
                  className="inline-flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#ff8a3d] via-[#ff6a00] to-[#f43f00] text-white shadow-[0_10px_30px_-8px_rgba(255,106,0,0.8)]"
                >
                  <ShoppingBag className="h-4 w-4" strokeWidth={2.4} />
                </span>
                <span className="sr-only">{brand}</span>
                <span className="font-display text-4xl font-extrabold tracking-tight text-white sm:text-6xl">
                  {brand}
                </span>
              </div>

              <div
                className="mt-8 h-1 w-52 overflow-hidden rounded-full bg-white/10"
                aria-hidden="true"
              >
                <div className="h-full w-full origin-left animate-line rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff6a00]" />
              </div>

              <p className="mt-8 max-w-md animate-fade-up text-lg font-medium leading-relaxed text-white/80 [animation-delay:300ms]">
                Hand-picked finds, checked before they&apos;re listed.
              </p>

              <div className="mt-10 flex animate-fade-up flex-col items-center gap-4 [animation-delay:600ms]">
                <button
                  type="button"
                  onClick={startShopping}
                  className="inline-flex h-12 items-center gap-2 rounded-full bg-white px-8 text-sm font-bold text-[#0d1017] shadow-[0_14px_36px_-12px_rgba(255,255,255,0.55)] transition-all hover:scale-[1.04] hover:brightness-95 active:scale-95"
                >
                  Start shopping
                  <ArrowRight className="h-4 w-4" strokeWidth={2.6} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={close}
                  className="text-xs font-semibold text-white/50 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Skip intro
                </button>
              </div>
            </div>
          ) : (
            /* ── Phase 3 · country & currency pick ──────────────────── */
            <div className="relative z-10 flex h-full items-center justify-center px-4 py-8">
              <div className="animate-pop-in w-full max-w-md rounded-2xl border border-white/10 bg-[#12151d]/95 p-5 shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] backdrop-blur-xl sm:p-6">
                <h2 className="font-display text-xl font-extrabold tracking-tight text-white">
                  Where are you shopping from?
                </h2>
                <p className="mt-1 text-sm leading-relaxed text-white/60">
                  We&apos;ll show every price in your local currency — change it
                  anytime from the header.
                </p>
                <div className="dark mt-4 rounded-xl text-[#e9ecf2]">
                  <CountryPickerContent compact onPick={pickCountry} />
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="mt-4 w-full text-center text-xs font-semibold text-white/50 underline underline-offset-4 transition-colors hover:text-white"
                >
                  Choose later — keep USD
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
