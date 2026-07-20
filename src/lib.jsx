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
  // Guard: Firebase records can arrive with undefined/null shade fields; return a mid‑grey fallback.
  if (!code) return "#6B7280";
  const h = hashCode(code);
  // Small set of grayscale shades of black.
  const greys = ["#111111", "#333333", "#555555", "#777777", "#999999"];
  const idx = Math.abs(h) % greys.length;
  return greys[idx];
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

// Master-Shade-Library grouping tolerance, expressed as a Delta E (ΔE) difference.
// Two shades whose ΔE differ by ≤ this value are treated as the same shade and
// share one Roman-numeral Shade Group. A scan whose ΔE differs by more than this
// from every known group gets a brand-new Shade Group (its original shade name
// is always retained).
export const SHADE_TOLERANCE = 0.02;

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
    if (!groups[g]) groups[g] = { group: g, standard: r.mappedStandard || `STD-${g}`, das: [], dbs: [], deltaEs: [], shades: [], count: 0 };
    groups[g].das.push(Number(r.avgDa ?? 0));
    groups[g].dbs.push(Number(r.avgDb ?? 0));
    groups[g].deltaEs.push(Number(r.deltaE ?? 0));
    if (r.shade && !groups[g].shades.includes(r.shade)) groups[g].shades.push(r.shade);
    groups[g].count += 1;
  }
  const romanValue = (s) => toRomanValue(s);
  return Object.values(groups)
    .map((g) => ({ group: g.group, standard: g.standard, count: g.count, shades: g.shades, centroidDa: +mean(g.das).toFixed(3), centroidDb: +mean(g.dbs).toFixed(3), centroidDeltaE: +mean(g.deltaEs).toFixed(3) }))
    .sort((a, b) => romanValue(a.group) - romanValue(b.group));
}

// Live Shade-Group assignment for the WHOLE result set, computed from ΔE alone.
// Records are sorted by ΔE and walked in order: a record joins the current group
// while its ΔE stays within SHADE_TOLERANCE (≤ 0.02) of that group's running
// centroid ΔE; the first record that exceeds it opens the next Roman-numeral
// group (I, II, III, …). Original shade names are always kept — only the group
// label is (re)assigned. Returns the records in their original order with fresh
// `shadeGroup` / `mappedStandard` fields, so the table and Master Shade Library
// always reflect the rule regardless of what was stored at insert time.
export function groupResultsByDeltaE(results) {
  const rows = results.map((r) => ({ ...r, deltaE: +Number(r.deltaE ?? 0).toFixed(2) }));
  const sorted = [...rows].sort((a, b) => a.deltaE - b.deltaE);
  let sum = 0, count = 0, groupIndex = 0;
  for (const r of sorted) {
    if (count > 0 && Math.abs(r.deltaE - sum / count) <= SHADE_TOLERANCE) {
      sum += r.deltaE; count += 1;
    } else {
      groupIndex += 1; sum = r.deltaE; count = 1;
    }
    const roman = toRoman(groupIndex);
    r.shadeGroup = roman;
    r.mappedStandard = `STD-${roman}`;
  }
  return rows;
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

// Map a scan against the existing library by Delta E. If the scan's ΔE is
// within SHADE_TOLERANCE (≤ 0.02) of a known group's ΔE, reuse that group's
// Roman-numeral Shade Group; otherwise mint the next Roman numeral as a new
// group. The original shade name is always retained for traceability.
export function assignShadeGroup(deltaE, library) {
  const e = Number(deltaE);
  let best = null, bestDiff = Infinity;
  for (const m of library) {
    const d = Math.abs(e - m.centroidDeltaE);
    if (d < bestDiff) { bestDiff = d; best = m; }
  }
  if (best && bestDiff <= SHADE_TOLERANCE) {
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
  const mapping = assignShadeGroup(deltaE, library);
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
