import React from "react";
import { useTokens } from "./tokens";

export function hashCode(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) >>> 0;
  return h;
}

// Derives a distinct, visible hex colour per shade code so nominally-identical
// "black" sub-codes are visually distinguishable in both light and dark UI themes.
// Uses medium lightness (45–65 %) so the swatch is never invisible against a
// dark panel (#1B2027) or a light panel (#FFFFFF).
export function shadeHex(code) {
  // Guard: Firebase records can arrive with undefined/null shade fields;
  // returning a neutral mid-grey prevents hashCode(undefined) from crashing.
  if (!code) return "#6B7280";
  const h = hashCode(code);
  const warm = h % 2 === 0;
  // Spread hues across warm (orange/red) and cool (blue/purple) spectrums
  const hue = warm ? 15 + (h % 50) : 200 + (h % 60);
  // Lightness: 45–65 % — always readable on both themes
  const light = 45 + (h % 21);
  // Saturation: 35–60 % — enough chroma to distinguish codes
  const sat = 35 + (h % 26);
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

// ---------------- MQA shade evaluation ----------------
// The spectrophotometer is read under three illuminants (A, F2, D65). Each
// produces a Da (red/green) and Db (yellow/blue) delta vs. the master standard.
export const ILLUMINANTS = ["A", "F2", "D65"];

// Master-Shade-Library matching tolerance, in Da/Db signature space.
// A scan whose average (Da, Db) falls within this distance of an existing
// standard is mapped to that standard instead of creating a new one.
export const SHADE_TOLERANCE = 0.5;

// Pass rule (per Brandix QC): a shade passes only when every Da and Db reading
// across all three illuminants is negative. Any non-negative reading fails.
export function mqaResultFromDeltas(da = [], db = []) {
  const all = [...da, ...db].map(Number).filter((v) => !isNaN(v));
  if (all.length === 0) return "Fail";
  return all.every((v) => v < 0) ? "Pass" : "Fail";
}

export function mqaRecommendationFor(result) {
  if (result === "Pass") return "Approve & standardize shade";
  if (result === "Retest") return "Re-scan sample under QC light box";
  return "Reject batch — re-dye required";
}

function mean(arr) {
  const nums = arr.map(Number).filter((v) => !isNaN(v));
  return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
}

export function toRoman(n) {
  if (!n || n < 1) return "";
  const map = [[1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"], [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"]];
  let r = "";
  for (const [v, s] of map) while (n >= v) { r += s; n -= v; }
  return r;
}

// The (avgDa, avgDb) signature of a scanned record.
export function shadeSignature(data) {
  const da = ILLUMINANTS.map((L) => Number(data[`da${L}`] ?? 0));
  const db = ILLUMINANTS.map((L) => Number(data[`db${L}`] ?? 0));
  return { da, db, avgDa: +mean(da).toFixed(3), avgDb: +mean(db).toFixed(3) };
}

// Build the Master Shade Library from a set of MQA results: one entry per
// distinct Shade Group, with its centroid and the member shade names.
export function deriveMasterLibrary(results) {
  const groups = {};
  for (const r of results) {
    const g = r.shadeGroup;
    if (!g) continue;
    if (!groups[g]) groups[g] = { group: g, standard: r.mappedStandard || `STD-${g}`, das: [], dbs: [], shades: [], count: 0 };
    groups[g].das.push(Number(r.avgDa ?? 0));
    groups[g].dbs.push(Number(r.avgDb ?? 0));
    if (r.shade && !groups[g].shades.includes(r.shade)) groups[g].shades.push(r.shade);
    groups[g].count += 1;
  }
  const romanValue = (s) => toRomanValue(s);
  return Object.values(groups)
    .map((g) => ({ group: g.group, standard: g.standard, count: g.count, shades: g.shades, centroidDa: +mean(g.das).toFixed(3), centroidDb: +mean(g.dbs).toFixed(3) }))
    .sort((a, b) => romanValue(a.group) - romanValue(b.group));
}

function toRomanValue(roman) {
  if (!roman || typeof roman !== "string") return 0;
  const vals = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
  let total = 0, prev = 0;
  for (let i = roman.length - 1; i >= 0; i--) {
    const v = vals[roman[i]] || 0;
    total += v < prev ? -v : v;
    prev = v;
  }
  return total;
}

// Map a scan against the existing library. If its signature is within
// SHADE_TOLERANCE of a known standard, reuse that standard's Roman-numeral
// Shade Group; otherwise mint the next Roman numeral as a new standard.
// The original shade name is always retained for traceability.
export function assignShadeGroup(sig, library) {
  let best = null, bestDist = Infinity;
  for (const m of library) {
    const d = Math.hypot(sig.avgDa - m.centroidDa, sig.avgDb - m.centroidDb);
    if (d < bestDist) { bestDist = d; best = m; }
  }
  if (best && bestDist <= SHADE_TOLERANCE) {
    return { shadeGroup: best.group, mappedStandard: best.standard, newStandard: false };
  }
  const nextNum = library.reduce((mx, m) => Math.max(mx, toRomanValue(m.group)), 0) + 1;
  const group = toRoman(nextNum);
  return { shadeGroup: group, mappedStandard: `STD-${group}`, newStandard: true };
}

// Full derivation for a new MQA record: reads Da/Db, computes Delta E, colour
// match %, Pass/Fail, recommendation, and maps it into the Master Shade Library
// built from the records that already exist.
export function computeMqaDerived(data, existingResults = []) {
  const sig = shadeSignature(data);
  const perIllum = ILLUMINANTS.map((L, i) => Math.hypot(sig.da[i], sig.db[i]));
  const deltaE = +mean(perIllum).toFixed(2);
  const result = mqaResultFromDeltas(sig.da, sig.db);
  const library = deriveMasterLibrary(existingResults);
  const mapping = assignShadeGroup(sig, library);
  return {
    avgDa: sig.avgDa,
    avgDb: sig.avgDb,
    deltaE,
    matchPct: +Math.max(0, Math.min(100, 100 - deltaE * 10)).toFixed(1),
    result,
    recommendation: mqaRecommendationFor(result),
    closestStandard: mapping.mappedStandard,
    shadeGroup: mapping.shadeGroup,
    mappedStandard: mapping.mappedStandard,
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
