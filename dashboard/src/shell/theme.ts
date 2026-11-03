import { useEffect, useState } from "react";

export type ThemeMode = "light" | "dark";

export function getStoredMode(): ThemeMode {
  if (typeof window === "undefined") return "dark";
  try {
    const saved = localStorage.getItem("theme");
    if (saved === "dark" || saved === "light") return saved;
  } catch {
    // Storage unavailable
  }
  const attr = document.documentElement.getAttribute("data-mode");
  if (attr === "dark" || attr === "light") return attr;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function isExplicitMode(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const saved = localStorage.getItem("theme");
    return saved === "dark" || saved === "light";
  } catch {
    return false;
  }
}

export function currentMode(): ThemeMode {
  if (typeof document === "undefined") return "dark";
  const attr = document.documentElement.getAttribute("data-mode");
  if (attr === "dark" || attr === "light") return attr;
  return getStoredMode();
}

export function applyMode(mode: ThemeMode, persist = true) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-mode", mode);
  document.documentElement.style.colorScheme = mode;
  if (persist) {
    try {
      // localStorage only: os-lab's server never reads the theme, so no cookie is set
      localStorage.setItem("theme", mode);
    } catch {
      // Storage unavailable: the choice lasts for this page view
    }
  }
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute("content", mode === "dark" ? "#080D14" : "#ffffff");
}

export function clearMode() {
  if (typeof document === "undefined") return;
  try {
    localStorage.removeItem("theme");
  } catch {}
  const next = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  applyMode(next, false);
}

export function toggleMode() {
  const current = getStoredMode();
  applyMode(current === "dark" ? "light" : "dark", true);
}

// Follows stored theme and data-mode, persisting reliably across Astro ClientRouter navigations
export function useThemeMode(): ThemeMode {
  const [mode, setMode] = useState<ThemeMode>(getStoredMode);

  useEffect(() => {
    const current = getStoredMode();
    const explicit = isExplicitMode();
    if (document.documentElement.getAttribute("data-mode") !== current) {
      applyMode(current, explicit);
    }
    setMode(current);

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    const onSystemChange = (e: MediaQueryListEvent) => {
      if (!isExplicitMode()) {
        const next = e.matches ? "dark" : "light";
        applyMode(next, false);
        setMode(next);
      }
    };
    mql.addEventListener("change", onSystemChange);

    const observer = new MutationObserver(() => {
      setMode(getStoredMode());
    });
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-mode"]
    });

    const onSwap = () => {
      const activeMode = getStoredMode();
      applyMode(activeMode, isExplicitMode());
      setMode(activeMode);
    };
    document.addEventListener("astro:after-swap", onSwap);
    document.addEventListener("astro:page-load", onSwap);

    return () => {
      mql.removeEventListener("change", onSystemChange);
      observer.disconnect();
      document.removeEventListener("astro:after-swap", onSwap);
      document.removeEventListener("astro:page-load", onSwap);
    };
  }, []);

  return mode;
}
