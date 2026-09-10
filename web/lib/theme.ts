"use client";

import { useState, useEffect, useCallback } from "react";

export type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "roomie_theme";

export function getStoredTheme(): ThemeMode {
  if (typeof window === "undefined") return "system";
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark" || saved === "system") {
      return saved;
    }
  } catch {}
  return "system";
}

export function setStoredTheme(theme: ThemeMode) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {}
  applyThemeToDocument(theme);
}

export function applyThemeToDocument(theme: ThemeMode): "light" | "dark" {
  if (typeof window === "undefined") return "light";

  let resolved: "light" | "dark" = "light";
  if (theme === "system") {
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    resolved = isDark ? "dark" : "light";
  } else {
    resolved = theme;
  }

  document.documentElement.setAttribute("data-theme", resolved);
  return resolved;
}

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeMode>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const initial = getStoredTheme();
    setThemeState(initial);
    const res = applyThemeToDocument(initial);
    setResolvedTheme(res);

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleMediaChange = () => {
      const current = getStoredTheme();
      if (current === "system") {
        const nextResolved = applyThemeToDocument("system");
        setResolvedTheme(nextResolved);
      }
    };

    mediaQuery.addEventListener("change", handleMediaChange);

    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        const next = (e.newValue as ThemeMode) || "system";
        setThemeState(next);
        const nextResolved = applyThemeToDocument(next);
        setResolvedTheme(nextResolved);
      }
    };
    window.addEventListener("storage", handleStorage);

    return () => {
      mediaQuery.removeEventListener("change", handleMediaChange);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const setTheme = useCallback((nextTheme: ThemeMode) => {
    setThemeState(nextTheme);
    setStoredTheme(nextTheme);
    const res = applyThemeToDocument(nextTheme);
    setResolvedTheme(res);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
