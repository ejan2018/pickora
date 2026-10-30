import App from "@/components/pickora/App";

/**
 * The gate below is server-rendered in the very first HTML paint, so visitors
 * see the charcoal brand mark INSTEAD of the storefront flash while React
 * hydrates and decides whether to play the intro. The IntroOverlay removes
 * this element once the decision is made (intro shows / returning visitor /
 * signed-in shopper). No-JS visitors get it hidden via <noscript>.
 */
const GATE_HTML = `<div class="gate-mark" aria-hidden="true"></div>`;

export default function Page() {
  return (
    <>
      <div
        id="pk-intro-gate"
        aria-hidden="true"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: GATE_HTML }}
      />
      <App />
    </>
  );
}
