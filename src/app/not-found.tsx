import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <span className="text-5xl" role="img" aria-label="Ghost">
        👻
      </span>
      <h1 className="mt-4 font-display text-4xl font-extrabold">404</h1>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        This page wandered off. Let&apos;s get you back to the good stuff.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex h-11 items-center rounded-full bg-primary px-6 text-sm font-bold text-primary-foreground shadow-lg transition-transform hover:brightness-110 active:scale-95"
      >
        Back to the store
      </Link>
    </div>
  );
}
