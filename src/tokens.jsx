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

// Shade-tier swatches — the fabric is black, so every grade is rendered as a
// shade of black (grey). Grade A (best match, closest to standard) is the
// darkest; grade D (most off-shade) is the lightest. The values stay light
// enough to remain visible against both the dark and light panel backgrounds.
export const gradeColor = {
  A: "#2A2A2A",  // near-black — best match (closest to standard)
  B: "#555555",  // dark grey
  C: "#808080",  // mid grey
  D: "#AAAAAA",  // light grey — worst match (most off-shade)
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
