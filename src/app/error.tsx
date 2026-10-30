"use client";

/** Global error boundary — keeps the store feeling human when things break. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <p className="font-display text-3xl font-extrabold">Something glitched</p>
      <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
        An unexpected error occurred. Give it another go.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-8 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
      >
        Try again
      </button>
      <a
        href="#/"
        className="mt-4 text-sm font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-primary"
      >
        Back home
      </a>
    </div>
  );
}
