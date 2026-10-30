"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Gift, X } from "lucide-react";
import type { CustomWidget, Popup } from "@/lib/types";

/**
 * PopupHost — Temu-style marketing popups, fully dashboard-driven.
 *
 * Types:
 *  - "portrait": small phone-screen portrait card (media fills the frame)
 *  - "wheel":    interactive spin-the-wheel with configurable prize segments
 *  - "card":     classic popup, layout portrait / landscape / square
 *
 * Custom widgets placed as "popup" join the same queue (sandboxed iframe).
 * Each popup waits its configured delay; once-per-visitor popups are
 * remembered in localStorage. Timers only start after the first-visit intro
 * has finished so the two never fight for the screen.
 */

const SEEN_KEY = (id: string) => `pk_popup_${id}`;

function wasSeen(id: string) {
  try {
    return localStorage.getItem(SEEN_KEY(id)) === "1";
  } catch {
    return false;
  }
}
function markSeen(id: string) {
  try {
    localStorage.setItem(SEEN_KEY(id), "1");
  } catch {
    /* ignore */
  }
}

export function widgetDocument(w: CustomWidget): string {
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><style>html,body{margin:0;font-family:system-ui,-apple-system,sans-serif;background:transparent}${w.css}</style></head><body>${w.html}<script>try{${w.js}}catch(e){console.error(e)}</script></body></html>`;
}

export function PopupHost() {
  const [popups, setPopups] = useState<Popup[]>([]);
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  const [active, setActive] = useState<{ kind: "popup"; popup: Popup } | { kind: "widget"; widget: CustomWidget } | null>(null);
  const timersRef = useRef<number[]>([]);

  useEffect(() => {
    fetch("/api/popups")
      .then((r) => (r.ok ? r.json() : { popups: [] }))
      .then((d) => setPopups(d.popups || []))
      .catch(() => setPopups([]));
    fetch("/api/widgets")
      .then((r) => (r.ok ? r.json() : { widgets: [] }))
      .then((d) => setWidgets(d.widgets || []))
      .catch(() => setWidgets([]));
  }, []);

  /* Wait until the intro overlay is gone before starting any countdown. */
  const [introDone, setIntroDone] = useState(false);
  useEffect(() => {
    const check = () => {
      const gateGone = !document.getElementById("pk-intro-gate");
      let introSeen = true;
      try {
        introSeen = localStorage.getItem("pk_intro_seen_v1") === "1";
      } catch {
        /* ignore */
      }
      if (gateGone && introSeen) setIntroDone(true);
    };
    check();
    const id = window.setInterval(check, 1000);
    return () => window.clearInterval(id);
  }, []);

  const dismiss = useCallback(() => {
    if (active?.kind === "popup" && active.popup.oncePerVisitor) markSeen(active.popup.id);
    if (active?.kind === "widget" && active.widget.placement === "popup") markSeen(`w-${active.widget.id}`);
    setActive(null);
  }, [active]);

  /* Schedule the eligible queue one item at a time. */
  useEffect(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    if (!introDone || active) return;

    const now = Date.now();
    const items: { key: string; delay: number; run: () => void }[] = [];
    popups.forEach((p) => {
      if (!p.active) return;
      if (p.oncePerVisitor && wasSeen(p.id)) return;
      items.push({
        key: `p-${p.id}`,
        delay: Math.max(0, p.delaySeconds) * 1000,
        run: () => setActive({ kind: "popup", popup: p }),
      });
    });
    widgets.forEach((w) => {
      if (!w.active || w.placement !== "popup") return;
      if (wasSeen(`w-${w.id}`)) return;
      items.push({
        key: `w-${w.id}`,
        delay: Math.max(0, w.delaySeconds) * 1000,
        run: () => setActive({ kind: "widget", widget: w }),
      });
    });

    const first = items[0];
    if (!first) return;
    const id = window.setTimeout(first.run, first.delay);
    timersRef.current.push(id);
    return () => {
      window.clearTimeout(id);
    };
  }, [popups, widgets, introDone, active]);

  /* Escape closes; lock scroll while open. */
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [active, dismiss]);

  if (!active) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Special offer"
      onClick={dismiss}
    >
      <div onClick={(e) => e.stopPropagation()} className="animate-pop-in">
        {active.kind === "popup" ? (
          active.popup.type === "wheel" ? (
            <WheelPopup popup={active.popup} onClose={dismiss} />
          ) : active.popup.type === "portrait" ? (
            <PortraitPopup popup={active.popup} onClose={dismiss} />
          ) : (
            <CardPopup popup={active.popup} onClose={dismiss} />
          )
        ) : (
          <WidgetPopup widget={active.widget} onClose={dismiss} />
        )}
      </div>
    </div>
  );
}

/* ─── Shared bits ─────────────────────────────────────────── */

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close offer"
      className="absolute right-2.5 top-2.5 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-transform hover:scale-110 active:scale-90"
    >
      <X className="h-4 w-4" aria-hidden="true" />
    </button>
  );
}

function Cta({ label, url, onClose }: { label: string; url: string; onClose: () => void }) {
  if (!label) return null;
  const href = url || "#/products";
  return (
    <a
      href={href}
      onClick={(e) => {
        if (href.startsWith("#/")) {
          e.preventDefault();
          window.location.hash = href;
        }
        onClose();
      }}
      className="inline-flex h-11 items-center gap-2 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff6a00] px-6 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95"
    >
      <Gift className="h-4 w-4" aria-hidden="true" />
      {label}
    </a>
  );
}

function Media({ popup, className = "" }: { popup: Popup; className?: string }) {
  if (popup.mediaType === "video" && popup.media) {
    return (
      <video
        src={popup.media}
        className={className}
        autoPlay
        muted
        loop
        playsInline
        aria-label={popup.title || "Offer video"}
      />
    );
  }
  if (popup.mediaType === "image" && popup.media) {
     
    return <img src={popup.media} alt={popup.title || "Offer"} className={className} />;
  }
  return null;
}

/* ─── 1 · Portrait "phone screen" popup ───────────────────── */

function PortraitPopup({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const hasMedia = popup.mediaType !== "none" && popup.media;
  return (
    <div className="relative w-[290px] overflow-hidden rounded-[2rem] border-4 border-[#1a1d27] bg-[#12141c] shadow-[0_30px_80px_-16px_rgba(0,0,0,0.9)] sm:w-[320px]">
      <CloseButton onClick={onClose} />
      <div className="relative aspect-[9/16] max-h-[76vh]">
        {hasMedia ? (
          <Media popup={popup} className="absolute inset-0 h-full w-full object-cover" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-[#ff8a3d] to-[#f43f00]" />
        )}
        <div className="absolute inset-0 flex flex-col justify-end bg-gradient-to-t from-black/85 via-black/25 to-black/30 p-5">
          {popup.title && (
            <h3 className="font-display text-xl font-extrabold leading-tight text-white">
              {popup.title}
            </h3>
          )}
          {popup.body && (
            <p className="mt-1.5 text-sm leading-relaxed text-white/85">{popup.body}</p>
          )}
          <div className="mt-4">
            <Cta label={popup.ctaLabel || "Claim now"} url={popup.ctaUrl} onClose={onClose} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── 2 · Spin-the-wheel popup ────────────────────────────── */

const WHEEL_COLORS = [
  "#ff6a00",
  "#1f2430",
  "#ff8a3d",
  "#2a3040",
  "#f43f00",
  "#171b24",
  "#ffb01f",
  "#232838",
];

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)];
}

function WheelPopup({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const segments = useMemo(
    () => (popup.segments.length >= 2 ? popup.segments : ["10% OFF", "Free Shipping", "5% OFF", "Try Again", "15% OFF", "Lucky Draw"]),
    [popup.segments]
  );
  const [angle, setAngle] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [spins, setSpins] = useState(0);

  const segAngle = 360 / segments.length;

  const spin = () => {
    if (spinning) return;
    const target = Math.floor(Math.random() * segments.length);
    // Land the middle of the chosen segment under the top pointer.
    const jitter = (Math.random() - 0.5) * segAngle * 0.5;
    const landing = 360 - (target * segAngle + segAngle / 2) - jitter;
    const full = 5 * 360 + landing;
    setAngle((prev) => prev + full - (prev % 360));
    setSpinning(true);
    setSpins((n) => n + 1);
    window.setTimeout(() => {
      setSpinning(false);
      setResult(segments[target]);
    }, 4200);
  };

  return (
    <div className="relative w-[320px] max-w-[92vw] rounded-3xl bg-gradient-to-b from-[#1a1d27] to-[#101319] p-6 text-white shadow-[0_30px_80px_-16px_rgba(0,0,0,0.9)]">
      <CloseButton onClick={onClose} />
      <div className="text-center">
        <h3 className="font-display text-xl font-extrabold">{popup.title || "Spin & win"}</h3>
        {popup.body && <p className="mt-1 text-xs leading-relaxed text-white/70">{popup.body}</p>}
      </div>

      <div className="relative mx-auto mt-5 h-64 w-64 max-w-full">
        {/* Pointer */}
        <div className="absolute left-1/2 top-0 z-10 -translate-x-1/2 -translate-y-1">
          <div className="h-0 w-0 border-x-[10px] border-t-[16px] border-x-transparent border-t-[#ffb01f] drop-shadow" />
        </div>
        <svg
          viewBox="0 0 200 200"
          className="h-full w-full"
          style={{
            transform: `rotate(${angle}deg)`,
            transition: "transform 4.2s cubic-bezier(0.16, 0.84, 0.28, 1)",
          }}
          aria-hidden="true"
        >
          {segments.map((label, i) => {
            const start = i * segAngle;
            const [x1, y1] = polar(100, 100, 96, start);
            const [x2, y2] = polar(100, 100, 96, start + segAngle);
            const large = segAngle > 180 ? 1 : 0;
            const mid = start + segAngle / 2;
            const [tx, ty] = polar(100, 100, 62, mid);
            return (
              <g key={`${label}-${i}`}>
                <path
                  d={`M100 100 L ${x1} ${y1} A 96 96 0 ${large} 1 ${x2} ${y2} Z`}
                  fill={WHEEL_COLORS[i % WHEEL_COLORS.length]}
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth="1"
                />
                <text
                  x={tx}
                  y={ty}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  transform={`rotate(${mid}, ${tx}, ${ty})`}
                  fill="#fff"
                  fontSize={segments.length > 8 ? 8 : 10}
                  fontWeight="700"
                >
                  {label.length > 14 ? `${label.slice(0, 13)}…` : label}
                </text>
              </g>
            );
          })}
          <circle cx="100" cy="100" r="96" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth="3" />
          <circle cx="100" cy="100" r="14" fill="#ffb01f" stroke="#1a1d27" strokeWidth="3" />
        </svg>
      </div>

      <div className="mt-5 text-center">
        {result ? (
          <div className="animate-pop-in">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#ffb01f]">
              Your prize
            </p>
            <p className="mt-1 font-display text-2xl font-extrabold">{result}</p>
            <div className="mt-3 flex flex-col items-center gap-2">
              <Cta label={popup.ctaLabel || "Claim prize"} url={popup.ctaUrl} onClose={onClose} />
              {spins < 2 && !popup.ctaLabel && (
                <button
                  type="button"
                  onClick={() => {
                    setResult(null);
                  }}
                  className="text-xs font-semibold text-white/50 underline underline-offset-4 hover:text-white"
                >
                  Spin again
                </button>
              )}
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={spin}
            disabled={spinning}
            className="inline-flex h-12 items-center gap-2 rounded-full bg-gradient-to-r from-[#ff8a3d] to-[#ff6a00] px-10 text-sm font-extrabold uppercase tracking-wide text-white shadow-[0_10px_30px_-8px_rgba(255,106,0,0.8)] transition-transform hover:scale-[1.04] active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {spinning ? "Spinning…" : spins > 0 ? "Spin again" : "Tap to spin"}
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── 3 · Card popup (portrait / landscape / square) ─────── */

const CARD_ASPECT: Record<string, string> = {
  portrait: "aspect-[4/5]",
  landscape: "aspect-[16/10]",
  square: "aspect-square",
};

function CardPopup({ popup, onClose }: { popup: Popup; onClose: () => void }) {
  const hasMedia = popup.mediaType !== "none" && popup.media;
  return (
    <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-card shadow-[0_30px_80px_-16px_rgba(0,0,0,0.9)]">
      <CloseButton onClick={onClose} />
      {hasMedia ? (
        <Media popup={popup} className={`${CARD_ASPECT[popup.layout] || CARD_ASPECT.portrait} w-full object-cover`} />
      ) : (
        <div className={`w-full ${CARD_ASPECT[popup.layout] || CARD_ASPECT.portrait} bg-gradient-to-br from-[#ff8a3d] to-[#f43f00]`} />
      )}
      <div className="p-5">
        {popup.title && (
          <h3 className="font-display text-lg font-extrabold leading-tight">{popup.title}</h3>
        )}
        {popup.body && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{popup.body}</p>
        )}
        {popup.ctaLabel && (
          <div className="mt-4">
            <Cta label={popup.ctaLabel} url={popup.ctaUrl} onClose={onClose} />
          </div>
        )}
        {!popup.ctaLabel && (
          <button
            type="button"
            onClick={onClose}
            className="mt-3 text-xs font-semibold text-muted-foreground underline underline-offset-4 hover:text-foreground"
          >
            No thanks
          </button>
        )}
      </div>
    </div>
  );
}

/* ─── 4 · Custom HTML/CSS/JS widget popup (sandboxed) ─────── */

function WidgetPopup({ widget, onClose }: { widget: CustomWidget; onClose: () => void }) {
  return (
    <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-card shadow-[0_30px_80px_-16px_rgba(0,0,0,0.9)]">
      <CloseButton onClick={onClose} />
      <iframe
        title={widget.name}
        srcDoc={widgetDocument(widget)}
        sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
        className="h-[420px] w-full max-w-[92vw] border-0 bg-transparent"
      />
    </div>
  );
}

/* ─── Home-inline widget strip (renders "home" placements) ── */

export function HomeWidgets() {
  const [widgets, setWidgets] = useState<CustomWidget[]>([]);
  useEffect(() => {
    fetch("/api/widgets")
      .then((r) => (r.ok ? r.json() : { widgets: [] }))
      .then((d) => setWidgets((d.widgets || []).filter((w: CustomWidget) => w.placement === "home")))
      .catch(() => setWidgets([]));
  }, []);

  const home = widgets.filter((w) => w.active);
  if (home.length === 0) return null;
  return (
    <section aria-label="Special offers" className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <div className="grid gap-4">
        {home.map((w) => (
          <div key={w.id} className="overflow-hidden rounded-2xl border border-border bg-card">
            <iframe
              title={w.name}
              srcDoc={widgetDocument(w)}
              sandbox="allow-scripts allow-forms allow-popups allow-popups-to-escape-sandbox allow-modals"
              className="h-[320px] w-full border-0 bg-transparent"
              loading="lazy"
            />
          </div>
        ))}
      </div>
    </section>
  );
}
