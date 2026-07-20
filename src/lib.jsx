import React from "react";
import { useTokens } from "./tokens";

export function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Derives a subtle near-black hex per shade code so nominally-identical
// "black" sub-codes are visually distinguishable.
export function shadeHex(code) {
  const h = hashCode(code);
  const warm = h % 2 === 0;
  const hue = warm ? 28 + (h % 20) : 215 + (h % 25);
  const light = 7 + (h % 11);
  const sat = 12 + (h % 18);
  const s = sat / 100, l = light / 100;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((hue / 60) % 2) - 1));
  const m = l - c / 2;
  let r, g, b;
  if (hue < 60) [r, g, b] = [c, x, 0];
  else if (hue < 120) [r, g, b] = [x, c, 0];
  else if (hue < 180) [r, g, b] = [0, c, x];
  else if (hue < 240) [r, g, b] = [0, x, c];
  else if (hue < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  const toHex = (v) => Math.round((v + m) * 255).toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Turns a Firebase RTDB snapshot object ({key: {...}}) into an array,
// keeping the key as `id` on each row. Arrays stored directly pass through.
export function objToArray(obj) {
  if (!obj) return [];
  if (Array.isArray(obj)) return obj.filter(Boolean);
  return Object.entries(obj).map(([id, v]) => ({ id, ...v }));
}

// Per the dashboard spec: from the Datacolor spectrophotometer readings the
// dashboard derives Delta E, Colour Match %, compatibility Result and a
// Recommendation. DECMC is the CMC total colour difference, so it is Delta E.
export function mqaResultFor(deltaE) {
  if (deltaE <= 0.8) return "Pass";
  if (deltaE <= 1.2) return "Retest";
  return "Fail";
}

export function mqaRecommendationFor(result) {
  if (result === "Pass") return "Approve & standardize shade";
  if (result === "Retest") return "Re-scan sample under QC light box";
  return "Reject batch — re-dye required";
}

export function computeMqaDerived(data) {
  const deltaE = Number(data.deECMC ?? data.deltaE ?? 0);
  const result = mqaResultFor(deltaE);
  return {
    deltaE: +deltaE.toFixed(2),
    matchPct: +Math.max(0, Math.min(100, 100 - deltaE * 5)).toFixed(1),
    result,
    recommendation: mqaRecommendationFor(result),
    closestStandard: data.closestStandard || data.shade || "",
  };
}

export function KpiCard({ icon: Icon, label, value, sub, accent }) {
  const tokens = useTokens();
  return (
    <div className="rounded-xl p-4 flex-1 min-w-[160px]" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
      <div className="flex items-center justify-between mb-3">
        <div className="rounded-lg p-2" style={{ backgroundColor: `${accent}22` }}>
          <Icon size={16} color={accent} strokeWidth={2.25} />
        </div>
      </div>
      <div className="text-2xl font-semibold" style={{ color: tokens.text, fontFamily: "'Space Grotesk', sans-serif" }}>{value}</div>
      <div className="text-xs mt-1" style={{ color: tokens.textMuted }}>{label}</div>
      {sub && <div className="text-[11px] mt-2" style={{ color: accent }}>{sub}</div>}
    </div>
  );
}
