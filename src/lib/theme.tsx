"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { SiteSettings } from "./types";

/**
 * Theme manager — day / night toggle persisted in localStorage (pk_theme).
 * Default theme comes from the store settings (defaultTheme).
 */

type Theme = "day" | "night";
const THEME_KEY = "pk_theme";

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "night");
  root.style.colorScheme = theme === "night" ? "dark" : "light";
}

export function ThemeProvider({
  children,
  defaultTheme = "day",
}: {
  children: ReactNode;
  defaultTheme?: SiteSettings["defaultTheme"];
}) {
  const [theme, setThemeState] = useState<Theme>("day");

  useEffect(() => {
    let initial: Theme =
      defaultTheme === "night"
        ? "night"
        : defaultTheme === "system"
          ? window.matchMedia("(prefers-color-scheme: dark)").matches
            ? "night"
            : "day"
          : "day";
    try {
      const saved = localStorage.getItem(THEME_KEY);
      if (saved === "day" || saved === "night") initial = saved;
    } catch {
      /* ignore */
    }
    // Sync theme with the persisted localStorage value (external system).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThemeState(initial);
    applyTheme(initial);
  }, [defaultTheme]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    applyTheme(t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch {
      /* ignore */
    }
  };

  const toggle = () => setTheme(theme === "day" ? "night" : "day");

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used inside ThemeProvider");
  return ctx;
}
