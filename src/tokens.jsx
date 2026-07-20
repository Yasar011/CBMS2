import React, { createContext, useContext, useEffect, useState } from "react";

// Two full palettes. Components read real hex strings (not CSS variables) so
// that Recharts SVG fills and `${color}22` alpha concatenations keep working.
export const PALETTES = {
  dark: {
    bg: "#12151A",
    sidebar: "#0F1216",
    panel: "#1B2027",
    panelAlt: "#20262E",
    line: "#2C333C",
    text: "#E9EAE4",
    textMuted: "#8B93A0",
    indigo: "#3B5BA5",
    indigoSoft: "#3B5BA522",
    amber: "#E8A33D",
    teal: "#4C8C86",
    crimson: "#B23A3A",
  },
  light: {
    bg: "#F4F5F7",
    sidebar: "#FFFFFF",
    panel: "#FFFFFF",
    panelAlt: "#EEF1F5",
    line: "#D9DDE3",
    text: "#1A1D22",
    textMuted: "#5B6472",
    indigo: "#3B5BA5",
    indigoSoft: "#3B5BA514",
    amber: "#B4791F",
    teal: "#3C716B",
    crimson: "#A62F2F",
  },
};

// Shade-tier swatches — distinct, visible colours for grades A–D.
// Previous values were near-black (#17181A, #2B2C2E …) which were
// invisible against the dark panel background (#1B2027).
// New values use a teal→amber→crimson progression so each tier is
// immediately readable on both the dark and light themes.
export const gradeColor = {
  A: "#4C8C86",  // teal  — best match (closest to standard)
  B: "#3B5BA5",  // indigo
  C: "#E8A33D",  // amber
  D: "#B23A3A",  // crimson — worst match (most off-shade)
};

// Default export kept as the dark palette for any non-component code that still
// imports `tokens` directly.
export const tokens = PALETTES.dark;

const ThemeCtx = createContext({ theme: "dark", tokens: PALETTES.dark, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("cbms-theme") || "dark"; } catch { return "dark"; }
  });

  useEffect(() => {
    try { localStorage.setItem("cbms-theme", theme); } catch {}
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.backgroundColor = PALETTES[theme].bg;
  }, [theme]);

  const value = {
    theme,
    tokens: PALETTES[theme],
    toggle: () => setTheme((t) => (t === "dark" ? "light" : "dark")),
  };
  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

// Convenience: the palette for the current theme.
export function useTokens() {
  return useContext(ThemeCtx).tokens;
}
