"use client";

import { useMemo, useState } from "react";
import { Check, Globe2, Search } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  COUNTRIES,
  POPULAR_COUNTRIES,
  flagOf,
  CURRENCY_NAMES,
} from "@/lib/countries";
import { useStore } from "@/lib/store";

/**
 * Shared country → currency picker.
 * Used by the intro flow ("Start shopping"), the header currency chip and
 * the account page. Selecting a country instantly converts every price.
 */

export function CountryPickerContent({
  onPick,
  compact = false,
}: {
  onPick: (code: string) => void;
  compact?: boolean;
}) {
  const { country } = useStore();
  const [q, setQ] = useState("");

  const query = q.trim().toLowerCase();
  const filtered = useMemo(() => {
    if (!query) return COUNTRIES;
    return COUNTRIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.code.toLowerCase().includes(query) ||
        c.currency.toLowerCase().includes(query)
    );
  }, [query]);

  return (
    <div className="flex w-full flex-col">
      <label className="relative block">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search country or currency…"
          aria-label="Search country or currency"
          className="h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-muted-foreground/70 focus:border-primary"
        />
      </label>

      {!query && (
        <div className="mt-3">
          <p className="eyebrow mb-2 text-muted-foreground">Popular</p>
          <div className="no-scrollbar flex gap-2 overflow-x-auto pb-1">
            {POPULAR_COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => onPick(c.code)}
                aria-label={`${c.name} — ${CURRENCY_NAMES[c.currency] || c.currency}`}
                className={`flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-all hover:border-primary hover:text-primary active:scale-95 ${
                  country === c.code
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-foreground/80"
                }`}
              >
                <span aria-hidden="true" className="text-sm leading-none">
                  {flagOf(c.code)}
                </span>
                {c.code}
              </button>
            ))}
          </div>
        </div>
      )}

      <div
        className={`scrollbar-slim mt-3 overflow-y-auto rounded-xl border border-border bg-background ${
          compact ? "max-h-64" : "max-h-72"
        }`}
        role="listbox"
        aria-label="All countries"
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-muted-foreground">
            No country matches “{q}”.
          </p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.code}
              type="button"
              role="option"
              aria-selected={country === c.code}
              onClick={() => onPick(c.code)}
              className={`flex w-full items-center gap-3 px-3.5 py-2.5 text-left transition-colors hover:bg-muted/70 ${
                country === c.code ? "bg-primary/10" : ""
              }`}
            >
              <span aria-hidden="true" className="text-lg leading-none">
                {flagOf(c.code)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-foreground/90">
                  {c.name}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {CURRENCY_NAMES[c.currency] || c.currency}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] font-bold text-muted-foreground">
                {c.currency}
              </span>
              {country === c.code && (
                <Check className="h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              )}
            </button>
          ))
        )}
      </div>
    </div>
  );
}

/** Header / account variant — opens the picker in a dialog. */
export function CountryPickerDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { setCountry, countryInfo, currencyCode } = useStore();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <Globe2 className="h-4 w-4 text-primary" aria-hidden="true" />
            Where are you shopping from?
          </DialogTitle>
          <DialogDescription>
            Prices will show in your local currency
            {countryInfo ? ` — currently ${currencyCode}.` : "."} Change it anytime.
          </DialogDescription>
        </DialogHeader>
        <CountryPickerContent
          onPick={(code) => {
            setCountry(code);
            onOpenChange(false);
          }}
        />
      </DialogContent>
    </Dialog>
  );
}
