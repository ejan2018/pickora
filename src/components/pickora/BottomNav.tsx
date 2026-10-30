"use client";

import { House, LayoutGrid, ShoppingCart, Heart, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRoute } from "@/lib/router";
import { useStore } from "@/lib/store";

/**
 * Bottom navigation — Temu/Shein-style mobile tab bar.
 * Home · Categories · Cart · Liked · Account. Fixed, safe-area aware.
 * The Account tab opens the sign-up modal for guests.
 */
export function BottomNav({ shopper }: { shopper: { username: string } | null }) {
  const route = useRoute();
  const { cart, favorites, openAuth } = useStore();

  const cartCount = cart.reduce((n, i) => n + i.qty, 0);

  const tabs = [
    { key: "home", label: "Home", icon: House, to: "#/" },
    { key: "categories", label: "Categories", icon: LayoutGrid, to: "#/categories" },
    { key: "cart", label: "Cart", icon: ShoppingCart, to: "#/cart", badge: cartCount },
    { key: "favorites", label: "Liked", icon: Heart, to: "#/favorites", badge: favorites.length },
    { key: "account", label: "Account", icon: UserRound, to: "#/account" },
  ] as const;

  const isActive = (key: string) => {
    switch (key) {
      case "home":
        return route.path === "/" || route.path === "";
      case "categories":
        return route.path === "/categories";
      case "cart":
        return route.path === "/cart";
      case "favorites":
        return route.path === "/favorites";
      case "account":
        return route.path === "/account";
      default:
        return false;
    }
  };

  return (
    <nav
      aria-label="Bottom navigation"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 glass md:hidden"
    >
      <div className="grid grid-cols-5 pb-[max(6px,env(safe-area-inset-bottom))]">
        {tabs.map((tab) => {
          const active = isActive(tab.key);
          const Icon = tab.icon;
          const badge = "badge" in tab ? tab.badge : 0;
          return (
            <a
              key={tab.key}
              href={tab.to}
              aria-label={tab.label}
              aria-current={active ? "page" : undefined}
              className={cn(
                "relative flex min-h-[52px] flex-col items-center justify-center gap-0.5 pt-1.5 transition-colors",
                active ? "text-primary" : "text-muted-foreground"
              )}
              onClick={(e) => {
                // Account tab: guests get the sign-up modal (X closes and the
                // account panel is reachable after signing in)
                if (tab.key === "account" && !shopper) {
                  e.preventDefault();
                  openAuth();
                }
              }}
            >
              <span className="relative">
                <Icon
                  className={cn(
                    "h-[22px] w-[22px]",
                    active && "fill-[color-mix(in_oklab,var(--primary)_18%,transparent)]"
                  )}
                  strokeWidth={active ? 2.2 : 1.8}
                  aria-hidden="true"
                />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground">
                    {badge > 99 ? "99+" : badge}
                  </span>
                )}
              </span>
              <span className={cn("text-[10px] leading-none", active ? "font-bold" : "font-medium")}>
                {tab.label}
              </span>
            </a>
          );
        })}
      </div>
    </nav>
  );
}
