import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Layers, Hash, Calendar, Building2, Filter, Palette, AlertTriangle,
  PackageCheck, FlaskConical, TrendingUp, CheckCircle2, XCircle,
  RotateCcw, ClipboardList, CalendarClock, FileText, Target, Scissors,
  FileBarChart, Plus, X
} from "lucide-react";
import { tokens, gradeColor } from "../tokens";
import { KpiCard, shadeHex } from "../lib";

// ---------------- RMWH ----------------
export function RMWHView({ grnRecords, onAdd, canWrite }) {
  const [styleFilter, setStyleFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const styles = useMemo(() => Array.from(new Set(grnRecords.map((r) => r.style))), [grnRecords]);
  const totalQty = grnRecords.reduce((a, r) => a + r.qty, 0);
  const uniquePOs = new Set(grnRecords.map((r) => r.po)).size;
  const uniqueStyles = new Set(grnRecords.map((r) => r.style)).size;

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
  let totalGraded = 0;
  grnRecords.forEach((r) => (r.shades || []).forEach((s) => { gradeCounts[s[0]] = (gradeCounts[s[0]] || 0) + 1; totalGraded += 1; }));
  const gradeChartData = ["A", "B", "C", "D"].map((g) => ({ grade: g, count: gradeCounts[g] || 0 }));
  const batchQtyData = grnRecords.map((r) => ({ batch: r.batch.length > 10 ? r.batch.slice(0, 9) + "…" : r.batch, qty: r.qty }));

  const filtered = useMemo(() => grnRecords.filter((r) => {
    const styleOk = styleFilter === "All" || r.style === styleFilter;
    const gradeOk = !gradeFilter || (r.shades || []).some((s) => s[0] === gradeFilter);
    return styleOk && gradeOk;
  }), [grnRecords, styleFilter, gradeFilter]);

  if (grnRecords.length === 0 && !canWrite) return <EmptyState label="RMWH" path="depts/RMWH/grn" />;

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={PackageCheck} label="GRN Records" value={grnRecords.length} sub="Live from Firebase" accent={tokens.teal} />
        <KpiCard icon={Layers} label="Total GRN Qty" value={totalQty.toLocaleString(undefined, { minimumFractionDigits: 2 })} sub="All records" accent={tokens.indigo} />
        <KpiCard icon={Hash} label="Purchase Orders" value={uniquePOs} sub="Distinct POs" accent={tokens.amber} />
        <KpiCard icon={Building2} label="Styles Covered" value={uniqueStyles} sub={styles.join(", ")} accent={tokens.teal} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold">Shade Grade Distribution</h2>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>Grade A = closest match to standard · Grade D = most off-shade — click a tier to filter</p>
          </div>
          {gradeFilter && <button onClick={() => setGradeFilter(null)} className="text-xs px-2.5 py-1 rounded-md" style={{ color: tokens.amber, backgroundColor: "#E8A33D18" }}>Clear filter</button>}
        </div>
        <div className="flex gap-4 mt-4 flex-wrap">
          {gradeChartData.map((g) => {
            const isActive = gradeFilter === g.grade;
            const pct = totalGraded ? ((g.count / totalGraded) * 100).toFixed(0) : 0;
            return (
              <div key={g.grade} onClick={() => setGradeFilter(isActive ? null : g.grade)}
                className="flex-1 min-w-[140px] rounded-lg p-4 cursor-pointer transition-transform"
                style={{ backgroundColor: isActive ? tokens.panelAlt : "transparent", border: `1px solid ${isActive ? tokens.indigo : tokens.line}`, transform: isActive ? "translateY(-2px)" : "none" }}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-6 h-6 rounded-md" style={{ backgroundColor: gradeColor[g.grade], boxShadow: "inset 0 0 0 1px #ffffff22" }} />
                  <span className="text-sm font-semibold">Grade {g.grade}</span>
                </div>
                <div className="text-xl font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{g.count} rolls</div>
                <div className="text-[11px] mt-1" style={{ color: tokens.textMuted }}>{pct}% of graded rolls</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <ChartCard title="Rolls per Shade Grade" sub="All GRNs">
          <BarChart data={gradeChartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="grade" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{gradeChartData.map((g, i) => <Cell key={i} fill={gradeColor[g.grade]} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="GRN Quantity by Batch" sub="Quantity received per batch">
          <BarChart data={batchQtyData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="batch" tick={{ fill: tokens.textMuted, fontSize: 9 }} axisLine={{ stroke: tokens.line }} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="qty" radius={[4, 4, 0, 0]} fill={tokens.indigo} />
          </BarChart>
        </ChartCard>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">GRN Records</h2>
          <div className="flex items-center gap-2">
            <Filter size={13} color={tokens.textMuted} />
            {["All", ...styles].map((s) => (
              <button key={s} onClick={() => setStyleFilter(s)} className="text-xs px-2.5 py-1 rounded-md transition-colors"
                style={{ color: styleFilter === s ? tokens.text : tokens.textMuted, backgroundColor: styleFilter === s ? tokens.panelAlt : "transparent", border: `1px solid ${styleFilter === s ? tokens.indigo : "transparent"}` }}>
                {s}
              </button>
            ))}
            {canWrite && !showAdd && <AddButton label="Add GRN Record" onClick={() => setShowAdd(true)} />}
          </div>
        </div>
        {showAdd && (
          <AddRecordForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) => onAdd(data)}
            fields={[
              { key: "po", label: "PO Number" },
              { key: "style", label: "Style" },
              { key: "batch", label: "Batch Number" },
              { key: "invoice", label: "Invoice Number" },
              { key: "qty", label: "GRN Qty", type: "number" },
              { key: "date", label: "GRN Date", type: "date" },
              { key: "shades", label: "Shades (comma-separated)", type: "list", placeholder: "A7, B7", wide: true },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["PO Number", "Style", "Batch", "Invoice", "GRN Qty", "GRN Date", "Shades"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id || r.batch} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono">{r.po}</td>
                  <td className="py-2.5 pr-4 text-xs">{r.style}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{r.batch}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: tokens.textMuted }}>{r.invoice}</td>
                  <td className="py-2.5 pr-4 text-xs">{Number(r.qty).toFixed(2)}</td>
                  <td className="py-2.5 pr-4 text-xs" style={{ color: tokens.textMuted }}>{r.date}</td>
                  <td className="py-2.5 pr-4 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(r.shades || []).map((s) => (
                        <div key={s} className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ backgroundColor: tokens.panelAlt }}>
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: gradeColor[s[0]] || tokens.line }} />
                          <span className="font-mono text-[10px]">{s}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------- Cutting ----------------
export function CuttingView({ dockets, onAdd, canWrite }) {
  const [activeShade, setActiveShade] = useState(null);
  const [componentFilter, setComponentFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);

  const shadeOccurrence = {};
  dockets.forEach((d) => (d.shades || []).forEach((s) => {
    const key = `${d.component}:${s}`;
    if (!shadeOccurrence[key]) shadeOccurrence[key] = { code: s, component: d.component, count: 0 };
    shadeOccurrence[key].count += 1;
  }));
  const shadeList = Object.values(shadeOccurrence).sort((a, b) => b.count - a.count);
  const uniqueSchedules = new Set(dockets.flatMap((d) => (d.schedule || "").split(",").map((s) => s.trim()).filter(Boolean))).size;
  const bodyDockets = dockets.filter((d) => d.component === "Body");
  const bodyAvgConsumption = bodyDockets.length ? (bodyDockets.reduce((a, d) => a + Number(d.consumption || 0), 0) / bodyDockets.length).toFixed(4) : "—";

  const filteredDockets = useMemo(() => dockets.filter((d) => {
    const compOk = componentFilter === "All" || d.component === componentFilter;
    const shadeOk = !activeShade || (d.shades || []).includes(activeShade);
    return compOk && shadeOk;
  }), [dockets, componentFilter, activeShade]);

  const chartData = dockets.map((d) => ({ docket: d.docketId, consumption: d.consumption, component: d.component }));
  const topShades = shadeList.slice(0, 12);
  const components = Array.from(new Set(dockets.map((d) => d.component)));

  if (dockets.length === 0 && !canWrite) return <EmptyState label="Cutting" path="depts/CUTTING/dockets" />;

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={Layers} label="Cutting Dockets" value={dockets.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={Palette} label="Shade Sub-codes" value={shadeList.length} sub="Same nominal color" accent={tokens.crimson} />
        <KpiCard icon={Hash} label="Avg Consumption — Body" value={bodyAvgConsumption} sub="Per unit" accent={tokens.teal} />
        <KpiCard icon={FileBarChart} label="Schedules" value={uniqueSchedules} sub="Across components" accent={tokens.amber} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold">Shade Fragmentation — {shadeList.length} codes</h2>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>Click a swatch to filter dockets</p>
          </div>
          {activeShade && <button onClick={() => setActiveShade(null)} className="text-xs px-2.5 py-1 rounded-md" style={{ color: tokens.amber, backgroundColor: "#E8A33D18" }}>Clear filter</button>}
        </div>
        <div className="flex gap-3 flex-wrap mt-4">
          {shadeList.map((s) => {
            const isActive = activeShade === s.code;
            return (
              <div key={`${s.component}-${s.code}`} onClick={() => setActiveShade(isActive ? null : s.code)}
                className="flex flex-col items-center cursor-pointer rounded-lg p-2 transition-transform"
                style={{ backgroundColor: isActive ? tokens.panelAlt : "transparent", border: isActive ? `1px solid ${tokens.indigo}` : "1px solid transparent", transform: isActive ? "translateY(-2px)" : "none" }}>
                <div className="w-12 h-12 rounded-md" style={{ backgroundColor: shadeHex(s.code), boxShadow: "inset 0 0 0 1px #ffffff22" }} />
                <div className="text-[10px] mt-1.5 font-mono" style={{ color: tokens.text }}>{s.code}</div>
                <div className="text-[9px]" style={{ color: tokens.textMuted }}>{s.component} · {s.count}×</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <ChartCard title="Most Recurring Shade Codes" sub="Dockets each code appears in">
          <BarChart data={topShades} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="code" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{topShades.map((s, i) => <Cell key={i} fill={s.component === "Body" ? tokens.indigo : tokens.teal} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="Consumption by Docket" sub="Per-unit fabric consumption">
          <BarChart data={chartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="docket" tick={{ fill: tokens.textMuted, fontSize: 10 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="consumption" radius={[4, 4, 0, 0]}>{chartData.map((d, i) => <Cell key={i} fill={d.component === "Body" ? tokens.indigo : tokens.amber} />)}</Bar>
          </BarChart>
        </ChartCard>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Cutting Docket Log</h2>
          <div className="flex items-center gap-2">
            <Filter size={13} color={tokens.textMuted} />
            {["All", ...components].map((c) => (
              <button key={c} onClick={() => setComponentFilter(c)} className="text-xs px-2.5 py-1 rounded-md transition-colors"
                style={{ color: componentFilter === c ? tokens.text : tokens.textMuted, backgroundColor: componentFilter === c ? tokens.panelAlt : "transparent", border: `1px solid ${componentFilter === c ? tokens.indigo : "transparent"}` }}>
                {c}
              </button>
            ))}
            {canWrite && !showAdd && <AddButton label="Add Docket" onClick={() => setShowAdd(true)} />}
          </div>
        </div>
        {showAdd && (
          <AddRecordForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) => onAdd(data)}
            fields={[
              { key: "docketId", label: "Docket ID" },
              { key: "layJob", label: "Lay Job No" },
              { key: "component", label: "Component", placeholder: "Body / CFL+Binding" },
              { key: "schedule", label: "Schedule" },
              { key: "shades", label: "Shade Codes (comma-separated)", type: "list", placeholder: "A17, B5" },
              { key: "fabCode", label: "Fab Code" },
              { key: "created", label: "Created", type: "date" },
              { key: "consumption", label: "Consumption", type: "number" },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["Docket ID", "Lay Job No", "Component", "Schedule", "Shade Codes", "Fab Code", "Created", "Consumption"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredDockets.map((d) => (
                <tr key={d.id || d.docketId} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono">{d.docketId}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{d.layJob}</td>
                  <td className="py-2.5 pr-4 text-xs">{d.component}</td>
                  <td className="py-2.5 pr-4 text-xs">{d.schedule}</td>
                  <td className="py-2.5 pr-4 text-xs">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(d.shades || []).map((s) => (
                        <div key={s} className="flex items-center gap-1 rounded px-1.5 py-0.5" style={{ backgroundColor: tokens.panelAlt }}>
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: shadeHex(s) }} />
                          <span className="font-mono text-[10px]">{s}</span>
                        </div>
                      ))}
                    </div>
                  </td>
                  <td className="py-2.5 pr-4 text-xs font-mono" style={{ color: tokens.textMuted }}>{d.fabCode}</td>
                  <td className="py-2.5 pr-4 text-xs" style={{ color: tokens.textMuted }}>{d.created}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{d.consumption}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------- MQA ----------------
export function MQAView({ results, onAdd, canWrite }) {
  const [resultFilter, setResultFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const filtered = useMemo(() => results.filter((r) => resultFilter === "All" || r.result === resultFilter), [results, resultFilter]);
  const mqaResultColor = { Pass: tokens.teal, Retest: tokens.amber, Fail: tokens.crimson };
  const passCount = results.filter((r) => r.result === "Pass").length;
  const retestCount = results.filter((r) => r.result === "Retest").length;
  const failCount = results.filter((r) => r.result === "Fail").length;
  const avgDeltaE = results.length ? (results.reduce((a, r) => a + Number(r.deltaE || 0), 0) / results.length).toFixed(2) : "—";

  if (results.length === 0 && !canWrite) return <EmptyState label="MQA" path="depts/MQA/results" />;

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={FlaskConical} label="Samples Tested" value={results.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={CheckCircle2} label="Pass" value={passCount} sub={results.length ? `${((passCount / results.length) * 100).toFixed(0)}%` : ""} accent={tokens.teal} />
        <KpiCard icon={RotateCcw} label="Retest" value={retestCount} sub="Delta E 0.8 – 1.2" accent={tokens.amber} />
        <KpiCard icon={XCircle} label="Fail" value={failCount} sub="Delta E > 1.2" accent={tokens.crimson} />
        <KpiCard icon={TrendingUp} label="Avg Delta E" value={avgDeltaE} sub="Across all samples" accent={tokens.indigo} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <h2 className="text-sm font-semibold mb-1">Delta E by Shade Code</h2>
        <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>Lower is a closer match to the master standard</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={results} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="shade" tick={{ fill: tokens.textMuted, fontSize: 9 }} axisLine={{ stroke: tokens.line }} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="deltaE" radius={[3, 3, 0, 0]}>{results.map((r, i) => <Cell key={i} fill={mqaResultColor[r.result]} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Spectrophotometer Results</h2>
          <div className="flex items-center gap-2">
            <Filter size={13} color={tokens.textMuted} />
            {["All", "Pass", "Retest", "Fail"].map((s) => (
              <button key={s} onClick={() => setResultFilter(s)} className="text-xs px-2.5 py-1 rounded-md transition-colors"
                style={{ color: resultFilter === s ? tokens.text : tokens.textMuted, backgroundColor: resultFilter === s ? tokens.panelAlt : "transparent", border: `1px solid ${resultFilter === s ? tokens.indigo : "transparent"}` }}>
                {s}
              </button>
            ))}
            {canWrite && !showAdd && <AddButton label="Add Result" onClick={() => setShowAdd(true)} />}
          </div>
        </div>
        {showAdd && (
          <AddRecordForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) => onAdd(data)}
            fields={[
              { key: "shade", label: "Shade Code" },
              { key: "deltaE", label: "Delta E", type: "number" },
              { key: "result", label: "Result", type: "select", options: ["Pass", "Retest", "Fail"], default: "Pass" },
              { key: "tester", label: "Tested By" },
              { key: "date", label: "Date", type: "date" },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["Shade Code", "Delta E", "Result", "Tested By", "Date"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id || r.shade} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: shadeHex(r.shade) }} />{r.shade}</div></td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{r.deltaE}</td>
                  <td className="py-2.5 pr-4"><span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: mqaResultColor[r.result], backgroundColor: `${mqaResultColor[r.result]}22` }}>{r.result}</span></td>
                  <td className="py-2.5 pr-4 text-xs" style={{ color: tokens.textMuted }}>{r.tester}</td>
                  <td className="py-2.5 pr-4 text-xs" style={{ color: tokens.textMuted }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------- Planning ----------------
export function PlanningView({ rows, onAdd, canWrite }) {
  const [showAdd, setShowAdd] = useState(false);
  const totalRequired = rows.reduce((a, r) => a + Number(r.required || 0), 0);
  const totalAllocated = rows.reduce((a, r) => a + Number(r.allocated || 0), 0);
  const fullyAllocated = rows.filter((r) => r.status === "Fully Allocated").length;
  const planningStatusColor = { "Fully Allocated": tokens.teal, "Partial": tokens.amber, "Pending": tokens.crimson };

  if (rows.length === 0 && !canWrite) return <EmptyState label="Planning" path="depts/PLANNING/rows" />;

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={CalendarClock} label="Active Schedules" value={rows.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={ClipboardList} label="Fabric Required" value={totalRequired.toLocaleString()} sub="Across all schedules" accent={tokens.teal} />
        <KpiCard icon={PackageCheck} label="Fabric Allocated" value={totalAllocated.toLocaleString()} sub={totalRequired ? `${((totalAllocated / totalRequired) * 100).toFixed(0)}% of required` : ""} accent={tokens.indigo} />
        <KpiCard icon={CheckCircle2} label="Fully Allocated" value={fullyAllocated} sub={`Of ${rows.length} schedules`} accent={tokens.teal} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <h2 className="text-sm font-semibold mb-1">Required vs Allocated by Schedule</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="schedule" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="required" fill={tokens.line} radius={[3, 3, 0, 0]} />
            <Bar dataKey="allocated" fill={tokens.indigo} radius={[3, 3, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Schedule Allocation</h2>
          {canWrite && !showAdd && <AddButton label="Add Schedule" onClick={() => setShowAdd(true)} />}
        </div>
        {showAdd && (
          <AddRecordForm
            onCancel={() => setShowAdd(false)}
            onSubmit={(data) => onAdd(data)}
            fields={[
              { key: "schedule", label: "Schedule" },
              { key: "style", label: "Style" },
              { key: "components", label: "Components" },
              { key: "required", label: "Required", type: "number" },
              { key: "allocated", label: "Allocated", type: "number" },
              { key: "status", label: "Status", type: "select", options: ["Fully Allocated", "Partial", "Pending"], default: "Pending" },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["Schedule", "Style", "Components", "Required", "Allocated", "Status"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id || r.schedule} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono">{r.schedule}</td>
                  <td className="py-2.5 pr-4 text-xs">{r.style}</td>
                  <td className="py-2.5 pr-4 text-xs">{r.components}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{Number(r.required).toLocaleString()}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono">{Number(r.allocated).toLocaleString()}</td>
                  <td className="py-2.5 pr-4"><span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: planningStatusColor[r.status], backgroundColor: `${planningStatusColor[r.status]}22` }}>{r.status}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// ---------------- Executive ----------------
export function ExecutiveView({ grnRecords, dockets, results }) {
  const totalGrnQty = grnRecords.reduce((a, r) => a + Number(r.qty || 0), 0);
  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
  let totalGraded = 0;
  grnRecords.forEach((r) => (r.shades || []).forEach((s) => { gradeCounts[s[0]] = (gradeCounts[s[0]] || 0) + 1; totalGraded += 1; }));
  const goodGradePct = totalGraded ? (((gradeCounts.A + gradeCounts.B) / totalGraded) * 100).toFixed(0) : "—";
  const gradeChartData = ["A", "B", "C", "D"].map((g) => ({ grade: g, count: gradeCounts[g] || 0 }));

  const shadeOccurrence = {};
  dockets.forEach((d) => (d.shades || []).forEach((s) => {
    const key = `${d.component}:${s}`;
    if (!shadeOccurrence[key]) shadeOccurrence[key] = { code: s, component: d.component, count: 0 };
    shadeOccurrence[key].count += 1;
  }));
  const shadeList = Object.values(shadeOccurrence).sort((a, b) => b.count - a.count);
  const topShades = shadeList.slice(0, 8);
  const mqaPassCount = results.filter((r) => r.result === "Pass").length;
  const mqaFailCount = results.filter((r) => r.result === "Fail").length;
  const mqaRetestCount = results.filter((r) => r.result === "Retest").length;

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={Layers} label="Black GRN Received" value={totalGrnQty.toLocaleString(undefined, { minimumFractionDigits: 2 })} sub={`${grnRecords.length} GRNs`} accent={tokens.indigo} />
        <KpiCard icon={Scissors} label="Cutting Dockets" value={dockets.length} sub="Body + CFL+Binding" accent={tokens.teal} />
        <KpiCard icon={Palette} label="Shade Codes in Use" value={shadeList.length} sub="1 nominal color" accent={tokens.crimson} />
        <KpiCard icon={Target} label="Grade A/B Match Rate" value={`${goodGradePct}%`} sub="Of incoming rolls" accent={tokens.teal} />
        <KpiCard icon={FlaskConical} label="MQA Pass Rate" value={results.length ? `${((mqaPassCount / results.length) * 100).toFixed(0)}%` : "—"} sub={`${mqaFailCount} fails, ${mqaRetestCount} retests`} accent={tokens.amber} />
      </div>

      <div className="rounded-xl px-4 py-4 flex items-start gap-3" style={{ backgroundColor: tokens.indigoSoft, border: `1px solid ${tokens.indigo}44` }}>
        <AlertTriangle size={16} color={tokens.indigo} className="mt-0.5 shrink-0" />
        <div>
          <div className="text-sm font-semibold mb-1">Key insight: one black, {shadeList.length} shade codes</div>
          <p className="text-xs" style={{ color: tokens.textMuted }}>
            RMWH grades incoming rolls into 4 shade tiers (A–D) and Cutting tracks {shadeList.length} distinct shade sub-codes downstream,
            for what is logged as a single nominal fabric color. Standardizing shade codes end-to-end removes this manual reconciliation step.
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-wrap">
        <ChartCard title="Incoming Grade Distribution" sub="RMWH">
          <BarChart data={gradeChartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="grade" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{gradeChartData.map((g, i) => <Cell key={i} fill={gradeColor[g.grade]} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="Top Recurring Shade Codes" sub="Cutting">
          <BarChart data={topShades} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="code" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tooltipStyle} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{topShades.map((s, i) => <Cell key={i} fill={s.component === "Body" ? tokens.indigo : tokens.teal} />)}</Bar>
          </BarChart>
        </ChartCard>
      </div>
    </>
  );
}

// ---------------- Reports ----------------
export function ReportsView({ grnRecords, dockets }) {
  const [activeReport, setActiveReport] = useState("grn");
  const shadeOccurrence = {};
  dockets.forEach((d) => (d.shades || []).forEach((s) => {
    const key = `${d.component}:${s}`;
    if (!shadeOccurrence[key]) shadeOccurrence[key] = { code: s, component: d.component, count: 0 };
    shadeOccurrence[key].count += 1;
  }));
  const shadeList = Object.values(shadeOccurrence).sort((a, b) => b.count - a.count);
  const reportDefs = [
    { key: "grn", label: "GRN Report", icon: PackageCheck, desc: "All live GRN records" },
    { key: "shade", label: "Shade Compatibility Report", icon: Palette, desc: "Grade distribution & shade code fragmentation" },
    { key: "cutting", label: "Cutting Report", icon: Scissors, desc: "Cutting dockets & fabric consumption" },
  ];

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        {reportDefs.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.key;
          return (
            <div key={r.key} onClick={() => setActiveReport(r.key)} className="rounded-xl p-4 flex-1 min-w-[220px] cursor-pointer transition-transform"
              style={{ backgroundColor: isActive ? tokens.panelAlt : tokens.panel, border: `1px solid ${isActive ? tokens.indigo : tokens.line}`, transform: isActive ? "translateY(-2px)" : "none" }}>
              <div className="flex items-center gap-2 mb-2"><FileText size={14} color={tokens.textMuted} /><span className="text-[10px] uppercase tracking-wide" style={{ color: tokens.textMuted }}>Report</span></div>
              <div className="flex items-center gap-2 mb-1"><Icon size={16} color={tokens.indigo} /><span className="text-sm font-semibold">{r.label}</span></div>
              <p className="text-[11px]" style={{ color: tokens.textMuted }}>{r.desc}</p>
            </div>
          );
        })}
      </div>

      {activeReport === "grn" && (
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
          <h2 className="text-sm font-semibold mb-4">GRN Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["PO Number", "Style", "Batch", "GRN Qty", "GRN Date", "Shades"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{grnRecords.map((r) => (
                <tr key={r.id || r.batch} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2 pr-4 text-xs font-mono">{r.po}</td>
                  <td className="py-2 pr-4 text-xs">{r.style}</td>
                  <td className="py-2 pr-4 text-xs font-mono">{r.batch}</td>
                  <td className="py-2 pr-4 text-xs">{Number(r.qty).toFixed(2)}</td>
                  <td className="py-2 pr-4 text-xs" style={{ color: tokens.textMuted }}>{r.date}</td>
                  <td className="py-2 pr-4 text-xs font-mono">{(r.shades || []).join(", ")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {activeReport === "shade" && (
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
          <h2 className="text-sm font-semibold mb-4">Shade Compatibility Report</h2>
          <div className="flex gap-3 flex-wrap">
            {shadeList.map((s) => (
              <div key={`${s.component}-${s.code}`} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}` }}>
                <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: shadeHex(s.code) }} />
                <span className="text-xs font-mono">{s.code}</span>
                <span className="text-[10px]" style={{ color: tokens.textMuted }}>{s.component} · {s.count}×</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeReport === "cutting" && (
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
          <h2 className="text-sm font-semibold mb-4">Cutting Report</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["Docket ID", "Component", "Schedule", "Fab Code", "Created", "Consumption"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{dockets.map((d) => (
                <tr key={d.id || d.docketId} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2 pr-4 text-xs font-mono">{d.docketId}</td>
                  <td className="py-2 pr-4 text-xs">{d.component}</td>
                  <td className="py-2 pr-4 text-xs">{d.schedule}</td>
                  <td className="py-2 pr-4 text-xs font-mono" style={{ color: tokens.textMuted }}>{d.fabCode}</td>
                  <td className="py-2 pr-4 text-xs" style={{ color: tokens.textMuted }}>{d.created}</td>
                  <td className="py-2 pr-4 text-xs font-mono">{d.consumption}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

// ---------------- shared bits ----------------
const tooltipStyle = { backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, borderRadius: 8, fontSize: 12 };

function ChartCard({ title, sub, children }) {
  return (
    <div className="rounded-xl p-5 flex-1 min-w-[320px]" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>{sub}</p>
      <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
    </div>
  );
}

function EmptyState({ label, path }) {
  return (
    <div className="rounded-xl p-10 flex flex-col items-center justify-center text-center gap-2" style={{ backgroundColor: tokens.panel, border: `1px dashed ${tokens.line}`, minHeight: 240 }}>
      <h2 className="text-sm font-semibold">No {label} data yet</h2>
      <p className="text-xs max-w-sm" style={{ color: tokens.textMuted }}>
        Nothing found at <span className="font-mono">{path}</span> in Firebase. Run <span className="font-mono">npm run seed</span> once to load the starting dataset.
      </p>
    </div>
  );
}

function AddButton({ label, onClick }) {
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium"
      style={{ backgroundColor: tokens.indigo, color: tokens.text }}>
      <Plus size={13} /> {label}
    </button>
  );
}

// Generic add-record form. `fields` describes each input; onSubmit receives
// the built record object (numbers/lists coerced) and should write it to Firebase.
function AddRecordForm({ fields, onSubmit, onCancel }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map((f) => [f.key, f.default ?? ""])));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = {};
      for (const f of fields) {
        let v = values[f.key];
        if (f.type === "number") v = Number(v);
        else if (f.type === "list") v = v.split(",").map((s) => s.trim()).filter(Boolean);
        data[f.key] = v;
      }
      await onSubmit(data);
      onCancel();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-lg" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}` }}>
      <div className="col-span-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.textMuted }}>New record</h3>
        <button type="button" onClick={onCancel} aria-label="Cancel"><X size={14} color={tokens.textMuted} /></button>
      </div>
      {fields.map((f) => (
        <div key={f.key} className={f.wide ? "col-span-2" : ""}>
          <label className="text-[11px]" style={{ color: tokens.textMuted }}>{f.label}</label>
          {f.type === "select" ? (
            <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}`, color: tokens.text }}>
              {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input
              required={f.required !== false}
              type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
              step={f.type === "number" ? "any" : undefined}
              value={values[f.key]}
              onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
              placeholder={f.placeholder}
              className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}`, color: tokens.text }}
            />
          )}
        </div>
      ))}
      {error && <div className="col-span-2 text-xs" style={{ color: tokens.crimson }}>{error}</div>}
      <div className="col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: tokens.indigo, color: tokens.text, opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving..." : "Save record"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ color: tokens.textMuted, border: `1px solid ${tokens.line}` }}>Cancel</button>
      </div>
    </form>
  );
}
