import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Layers, Hash, Calendar, Building2, Filter, Palette, AlertTriangle,
  PackageCheck, FlaskConical, TrendingUp, CheckCircle2, XCircle,
  RotateCcw, ClipboardList, CalendarClock, FileText, Target, Scissors,
  FileBarChart, Plus, X, Percent
} from "lucide-react";
import { useTokens, gradeColor } from "../tokens";
import { KpiCard, shadeHex } from "../lib";

const dash = (v) => (v === undefined || v === null || v === "" ? "—" : v);
const num = (v, d = 2) => (v === undefined || v === null || v === "" || isNaN(Number(v)) ? "—" : Number(v).toFixed(d));

// ---------------- RMWH ----------------
export function RMWHView({ grnRecords, onAdd, canWrite }) {
  const tokens = useTokens();
  const [styleFilter, setStyleFilter] = useState("All");
  const [gradeFilter, setGradeFilter] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const styles = useMemo(() => Array.from(new Set(grnRecords.map((r) => r.style).filter(Boolean))), [grnRecords]);
  const totalQty = grnRecords.reduce((a, r) => a + Number(r.qty || 0), 0);
  const totalRolls = grnRecords.reduce((a, r) => a + Number(r.rolls || 0), 0);
  const uniquePOs = new Set(grnRecords.map((r) => r.po)).size;
  const uniqueStyles = styles.length;

  const gradeCounts = { A: 0, B: 0, C: 0, D: 0 };
  let totalGraded = 0;
  grnRecords.forEach((r) => (r.shades || []).forEach((s) => { gradeCounts[s[0]] = (gradeCounts[s[0]] || 0) + 1; totalGraded += 1; }));
  const gradeChartData = ["A", "B", "C", "D"].map((g) => ({ grade: g, count: gradeCounts[g] || 0 }));
  const batchQtyData = grnRecords.map((r) => ({ batch: (r.batch || "").length > 10 ? r.batch.slice(0, 9) + "…" : r.batch, qty: Number(r.qty || 0) }));

  const filtered = useMemo(() => grnRecords.filter((r) => {
    const styleOk = styleFilter === "All" || r.style === styleFilter;
    const gradeOk = !gradeFilter || (r.shades || []).some((s) => s[0] === gradeFilter);
    return styleOk && gradeOk;
  }), [grnRecords, styleFilter, gradeFilter]);

  if (grnRecords.length === 0 && !canWrite) return <EmptyState label="RMWH" path="depts/RMWH/grn" />;

  const cols = ["PO Number", "Buyer", "Style", "Schedule", "Category", "Colour Code", "Supplier", "Batch", "Invoice", "Lay Job", "GRN Date", "Roll No", "Rolls", "GRN Qty", "Composition", "Proc. Group", "Fabric Type", "Shades"];

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={PackageCheck} label="GRN Records" value={grnRecords.length} sub="Live from Firebase" accent={tokens.teal} />
        <KpiCard icon={Layers} label="Total GRN Qty" value={totalQty.toLocaleString(undefined, { minimumFractionDigits: 2 })} sub="All records" accent={tokens.indigo} />
        <KpiCard icon={Hash} label="Purchase Orders" value={uniquePOs} sub="Distinct POs" accent={tokens.amber} />
        <KpiCard icon={Building2} label="Styles Covered" value={uniqueStyles} sub={styles.join(", ") || "—"} accent={tokens.teal} />
        <KpiCard icon={Layers} label="Rolls Received" value={totalRolls || "—"} sub="Number of rolls" accent={tokens.indigo} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-1">
          <div>
            <h2 className="text-sm font-semibold">Shade Grade Distribution</h2>
            <p className="text-xs mt-0.5" style={{ color: tokens.textMuted }}>Grade A = closest match to standard · Grade D = most off-shade — click a tier to filter</p>
          </div>
          {gradeFilter && <button onClick={() => setGradeFilter(null)} className="text-xs px-2.5 py-1 rounded-md" style={{ color: tokens.amber, backgroundColor: `${tokens.amber}18` }}>Clear filter</button>}
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
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{gradeChartData.map((g, i) => <Cell key={i} fill={gradeColor[g.grade]} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="GRN Quantity by Batch" sub="Quantity received per batch">
          <BarChart data={batchQtyData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="batch" tick={{ fill: tokens.textMuted, fontSize: 9 }} axisLine={{ stroke: tokens.line }} tickLine={false} interval={0} angle={-35} textAnchor="end" height={60} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
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
              { key: "po", label: "PO Number", required: true },
              { key: "buyer", label: "Buyer Name" },
              { key: "style", label: "Style Number", required: true },
              { key: "schedule", label: "Schedule" },
              { key: "category", label: "Category" },
              { key: "colourCode", label: "Colour Code", default: "SD BLACK 093-54A2" },
              { key: "supplier", label: "Supplier Name", default: "Best Pacific Textile Ltd." },
              { key: "batch", label: "Supplier Batch Number", required: true },
              { key: "invoice", label: "Invoice Number" },
              { key: "layJob", label: "Lay Job No." },
              { key: "date", label: "GRN Date", type: "date", required: true },
              { key: "rollNo", label: "Roll Number" },
              { key: "rolls", label: "Number of Rolls Received", type: "number" },
              { key: "qty", label: "Roll Quantity (m/yd)", type: "number", required: true },
              { key: "composition", label: "Fabric Composition" },
              { key: "procurementGroup", label: "Procurement Group" },
              { key: "fabricType", label: "Fabric Type", default: "Weft Knit" },
              { key: "shades", label: "Shade Groups (comma-separated)", type: "list", placeholder: "A40, B40", required: true, wide: true },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{cols.map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id || r.batch} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.po)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.buyer)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.style)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.schedule)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.category)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.colourCode)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.supplier)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.batch)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.invoice)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.layJob)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.date)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.rollNo)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.rolls)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{num(r.qty)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.composition)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.procurementGroup)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.fabricType)}</td>
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
  const tokens = useTokens();
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

  const chartData = dockets.map((d) => ({ docket: d.docketId, consumption: Number(d.consumption || 0), component: d.component }));
  const topShades = shadeList.slice(0, 12);
  const components = Array.from(new Set(dockets.map((d) => d.component).filter(Boolean)));

  if (dockets.length === 0 && !canWrite) return <EmptyState label="Cutting" path="depts/CUTTING/dockets" />;

  const cols = ["Docket ID", "CO", "Component", "Comp Group", "Style", "Category", "Schedule", "Shade Codes", "Fabric Code", "Fabric Color", "Lot No", "Lay Job", "Created", "Consumption", "Binding Cons", "Total Req", "Allocated Qty"];

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
          {activeShade && <button onClick={() => setActiveShade(null)} className="text-xs px-2.5 py-1 rounded-md" style={{ color: tokens.amber, backgroundColor: `${tokens.amber}18` }}>Clear filter</button>}
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
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{topShades.map((s, i) => <Cell key={i} fill={s.component === "Body" ? tokens.indigo : tokens.teal} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="Consumption by Docket" sub="Per-unit fabric consumption">
          <BarChart data={chartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="docket" tick={{ fill: tokens.textMuted, fontSize: 10 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
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
              { type: "heading", label: "Docket" },
              { key: "docketId", label: "Docket ID", required: true },
              { key: "co", label: "CO" },
              { key: "barcode", label: "Barcode" },
              { type: "heading", label: "Style & marker" },
              { key: "styleNo", label: "Style No." },
              { key: "category", label: "Category" },
              { key: "component", label: "Component", placeholder: "Body / CFL+Binding", required: true },
              { key: "componentGroup", label: "Component Group", placeholder: "CG1 / CG2" },
              { key: "mkType", label: "MK Type" },
              { key: "mkName", label: "MK Name" },
              { key: "ratioId", label: "Ratio ID" },
              { key: "ratioDescription", label: "Ratio Description" },
              { key: "fabWay", label: "Fab Way" },
              { key: "pattern", label: "Pattern" },
              { type: "heading", label: "Fabric" },
              { key: "fabCode", label: "Fabric Code" },
              { key: "fabricDescription", label: "Fabric Description" },
              { key: "fabricColor", label: "Fabric Color", default: "BLACK 093 5A2" },
              { key: "fabricName", label: "Fabric Name" },
              { key: "color", label: "Color" },
              { key: "lotNo", label: "Lot No." },
              { key: "shades", label: "Shade Codes (comma-separated)", type: "list", placeholder: "A17, B5", required: true, wide: true },
              { type: "heading", label: "Schedule & production" },
              { key: "schedule", label: "Schedule", required: true },
              { key: "layJob", label: "Lay Job No." },
              { key: "created", label: "Created Date", type: "date" },
              { key: "printDate", label: "Print Date", type: "date" },
              { key: "location", label: "Location" },
              { key: "rollNo", label: "Roll No." },
              { type: "heading", label: "Consumption & requirement" },
              { key: "consumption", label: "Actual Consumption", type: "number", required: true },
              { key: "bindingConsumption", label: "Binding Consumption", type: "number" },
              { key: "requirementWO", label: "Requirement (WO)", type: "number" },
              { key: "requirementWastage", label: "Requirement (With Wastage)", type: "number" },
              { key: "totalRequirement", label: "Total Requirement", type: "number" },
              { key: "allocatedQty", label: "Allocated Qty", type: "number" },
              { type: "heading", label: "Widths & cut" },
              { key: "purchaseWidth", label: "Purchase Width", type: "number" },
              { key: "actualWidth", label: "Actual Width", type: "number" },
              { key: "cutLength", label: "Cut Length", type: "number" },
              { key: "cutWidth", label: "Cut Width", type: "number" },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{cols.map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filteredDockets.map((d) => (
                <tr key={d.id || d.docketId} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.docketId)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.co)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.component)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.componentGroup || d.category)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.styleNo)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.category)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.schedule)}</td>
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
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(d.fabCode)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.fabricColor)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(d.lotNo)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.layJob)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(d.created)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.consumption)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.bindingConsumption)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.totalRequirement)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.allocatedQty)}</td>
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
  const tokens = useTokens();
  const [resultFilter, setResultFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  const filtered = useMemo(() => results.filter((r) => resultFilter === "All" || r.result === resultFilter), [results, resultFilter]);
  const mqaResultColor = { Pass: tokens.teal, Retest: tokens.amber, Fail: tokens.crimson };
  const passCount = results.filter((r) => r.result === "Pass").length;
  const retestCount = results.filter((r) => r.result === "Retest").length;
  const failCount = results.filter((r) => r.result === "Fail").length;
  const avgDeltaE = results.length ? (results.reduce((a, r) => a + Number(r.deltaE || 0), 0) / results.length).toFixed(2) : "—";
  const withMatch = results.filter((r) => r.matchPct !== undefined && r.matchPct !== null && r.matchPct !== "");
  const avgMatch = withMatch.length ? (withMatch.reduce((a, r) => a + Number(r.matchPct || 0), 0) / withMatch.length).toFixed(1) : "—";

  if (results.length === 0 && !canWrite) return <EmptyState label="MQA" path="depts/MQA/results" />;

  const cols = ["Shade Code", "GRN No", "Batch", "Roll", "DECMC", "DLCMC", "Da", "Db", "DCCMC", "DHCMC", "Delta E", "Match %", "Closest Std", "Result", "Recommendation", "Tested By", "Date"];

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={FlaskConical} label="Samples Tested" value={results.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={CheckCircle2} label="Pass" value={passCount} sub={results.length ? `${((passCount / results.length) * 100).toFixed(0)}%` : ""} accent={tokens.teal} />
        <KpiCard icon={RotateCcw} label="Retest" value={retestCount} sub="Delta E 0.8 – 1.2" accent={tokens.amber} />
        <KpiCard icon={XCircle} label="Fail" value={failCount} sub="Delta E > 1.2" accent={tokens.crimson} />
        <KpiCard icon={TrendingUp} label="Avg Delta E" value={avgDeltaE} sub="Across all samples" accent={tokens.indigo} />
        <KpiCard icon={Percent} label="Avg Colour Match" value={avgMatch === "—" ? "—" : `${avgMatch}%`} sub="Datacolor 1000" accent={tokens.teal} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <h2 className="text-sm font-semibold mb-1">Delta E by Shade Code</h2>
        <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>Lower is a closer match to the master standard (Delta E CMC)</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={results} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="shade" tick={{ fill: tokens.textMuted, fontSize: 9 }} axisLine={{ stroke: tokens.line }} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="deltaE" radius={[3, 3, 0, 0]}>{results.map((r, i) => <Cell key={i} fill={mqaResultColor[r.result] || tokens.indigo} />)}</Bar>
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
            note="Delta E, Colour Match %, Result and Recommendation are generated automatically from the readings."
            fields={[
              { type: "heading", label: "Sample identification" },
              { key: "shade", label: "Shade / Batch Shade Code", required: true },
              { key: "grnNumber", label: "GRN Number" },
              { key: "batchNumber", label: "Batch Number" },
              { key: "rollNumber", label: "Roll Number" },
              { key: "closestStandard", label: "Closest Matching Standard Shade" },
              { type: "heading", label: "Spectrophotometer readings (Datacolor 1000)" },
              { key: "deECMC", label: "DECMC (Delta E CMC)", type: "number", required: true },
              { key: "dlCMC", label: "DLCMC", type: "number" },
              { key: "da", label: "Da", type: "number" },
              { key: "db", label: "Db", type: "number" },
              { key: "dcCMC", label: "DCCMC", type: "number" },
              { key: "dhCMC", label: "DHCMC", type: "number" },
              { type: "heading", label: "Inspection" },
              { key: "tester", label: "Tested By", required: true },
              { key: "date", label: "Date", type: "date", required: true },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{cols.map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id || r.shade} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: shadeHex(r.shade) }} />{dash(r.shade)}</div></td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.grnNumber)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.batchNumber)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.rollNumber)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.deECMC)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.dlCMC)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.da)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.db)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.dcCMC)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.dhCMC)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.deltaE)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{r.matchPct !== undefined && r.matchPct !== "" ? `${r.matchPct}%` : "—"}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.closestStandard)}</td>
                  <td className="py-2.5 pr-4"><span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ color: mqaResultColor[r.result], backgroundColor: `${mqaResultColor[r.result] || tokens.line}22` }}>{dash(r.result)}</span></td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.recommendation)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.tester)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.date)}</td>
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
  const tokens = useTokens();
  const [showAdd, setShowAdd] = useState(false);
  const totalRequired = rows.reduce((a, r) => a + Number(r.required || 0), 0);
  const totalAllocated = rows.reduce((a, r) => a + Number(r.allocated || 0), 0);
  const totalCutDockets = rows.reduce((a, r) => a + Number(r.cutDockets || 0), 0);
  const fullyAllocated = rows.filter((r) => r.status === "Fully Allocated").length;
  const planningStatusColor = { "Fully Allocated": tokens.teal, "Partial": tokens.amber, "Pending": tokens.crimson };

  if (rows.length === 0 && !canWrite) return <EmptyState label="Planning" path="depts/PLANNING/rows" />;

  const cols = ["Schedule", "Style", "Colour", "Components", "Marker", "Required", "Allocated", "Approx (m)", "Cut Dockets", "Body Dockets", "Plies", "Lay Length", "Marker Ratio", "Status", "Remarks"];

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={CalendarClock} label="Active Schedules" value={rows.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={ClipboardList} label="Fabric Required" value={totalRequired.toLocaleString()} sub="Across all schedules" accent={tokens.teal} />
        <KpiCard icon={PackageCheck} label="Fabric Allocated" value={totalAllocated.toLocaleString()} sub={totalRequired ? `${((totalAllocated / totalRequired) * 100).toFixed(0)}% of required` : ""} accent={tokens.indigo} />
        <KpiCard icon={CheckCircle2} label="Fully Allocated" value={fullyAllocated} sub={`Of ${rows.length} schedules`} accent={tokens.teal} />
        <KpiCard icon={Scissors} label="Cut Dockets" value={totalCutDockets || "—"} sub="Total released" accent={tokens.amber} />
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <h2 className="text-sm font-semibold mb-1">Required vs Allocated by Schedule</h2>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={rows} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="schedule" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
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
              { key: "schedule", label: "Schedule No.", required: true },
              { key: "style", label: "Style", required: true },
              { key: "colour", label: "Colour", default: "SD BLACK 093 54A2" },
              { key: "components", label: "Components" },
              { key: "marker", label: "Marker" },
              { key: "required", label: "Required (yd)", type: "number", required: true },
              { key: "allocated", label: "Allocated (yd)", type: "number", required: true },
              { key: "approxM", label: "Approx Qty (m)", type: "number" },
              { key: "cutDockets", label: "Cut Dockets", type: "number" },
              { key: "bodyDockets", label: "Body Dockets", type: "number" },
              { key: "plies", label: "Number of Plies", type: "number" },
              { key: "layLength", label: "Lay Length", type: "number" },
              { key: "markerRatio", label: "Marker Ratio", type: "number" },
              { key: "status", label: "Status", type: "select", options: ["Fully Allocated", "Partial", "Pending"], default: "Pending", required: true },
              { key: "remarks", label: "Remarks", wide: true },
            ]}
          />
        )}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{cols.map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id || r.schedule} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.schedule)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.style)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.colour)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.components)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.marker)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{r.required !== undefined ? Number(r.required).toLocaleString() : "—"}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{r.allocated !== undefined ? Number(r.allocated).toLocaleString() : "—"}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.approxM)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.cutDockets)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.bodyDockets)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.plies)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.layLength)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.markerRatio)}</td>
                  <td className="py-2.5 pr-4"><span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ color: planningStatusColor[r.status], backgroundColor: `${planningStatusColor[r.status] || tokens.line}22` }}>{dash(r.status)}</span></td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.remarks)}</td>
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
  const tokens = useTokens();
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
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{gradeChartData.map((g, i) => <Cell key={i} fill={gradeColor[g.grade]} />)}</Bar>
          </BarChart>
        </ChartCard>
        <ChartCard title="Top Recurring Shade Codes" sub="Cutting">
          <BarChart data={topShades} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="code" tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={{ stroke: tokens.line }} tickLine={false} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} allowDecimals={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="count" radius={[4, 4, 0, 0]}>{topShades.map((s, i) => <Cell key={i} fill={s.component === "Body" ? tokens.indigo : tokens.teal} />)}</Bar>
          </BarChart>
        </ChartCard>
      </div>
    </>
  );
}

// ---------------- Reports ----------------
export function ReportsView({ grnRecords, dockets }) {
  const tokens = useTokens();
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
              <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["PO Number", "Style", "Colour Code", "Supplier", "Batch", "GRN Qty", "GRN Date", "Shades"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{grnRecords.map((r) => (
                <tr key={r.id || r.batch} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.po)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(r.style)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(r.colourCode)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(r.supplier)}</td>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.batch)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{num(r.qty)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.date)}</td>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{(r.shades || []).join(", ") || "—"}</td>
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
              <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{["Docket ID", "Component", "Schedule", "Fab Code", "Lot No", "Created", "Consumption", "Total Req"].map((h) => <th key={h} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{h}</th>)}</tr></thead>
              <tbody>{dockets.map((d) => (
                <tr key={d.id || d.docketId} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.docketId)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(d.component)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(d.schedule)}</td>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(d.fabCode)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap">{dash(d.lotNo)}</td>
                  <td className="py-2 pr-4 text-xs whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(d.created)}</td>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.consumption)}</td>
                  <td className="py-2 pr-4 text-xs font-mono whitespace-nowrap">{dash(d.totalRequirement)}</td>
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
const tt = (tokens) => ({ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}`, borderRadius: 8, fontSize: 12 });

function ChartCard({ title, sub, children }) {
  const tokens = useTokens();
  return (
    <div className="rounded-xl p-5 flex-1 min-w-[320px]" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
      <h2 className="text-sm font-semibold mb-1">{title}</h2>
      <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>{sub}</p>
      <ResponsiveContainer width="100%" height={220}>{children}</ResponsiveContainer>
    </div>
  );
}

function AddButton({ label, onClick }) {
  const tokens = useTokens();
  return (
    <button onClick={onClick} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md font-medium"
      style={{ backgroundColor: tokens.indigo, color: "#fff" }}>
      <Plus size={13} /> {label}
    </button>
  );
}

// Generic add-record form. `fields` describes each input; a field with
// type "heading" renders a full-width section label. onSubmit receives the
// built record object (numbers/lists coerced, empty values omitted).
function AddRecordForm({ fields, onSubmit, onCancel, note }) {
  const tokens = useTokens();
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.filter((f) => f.type !== "heading").map((f) => [f.key, f.default ?? ""]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = {};
      for (const f of fields) {
        if (f.type === "heading") continue;
        let v = values[f.key];
        if (v === "" || v === undefined || v === null) continue;
        if (f.type === "number") v = Number(v);
        else if (f.type === "list") { v = v.split(",").map((s) => s.trim()).filter(Boolean); if (v.length === 0) continue; }
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
    <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3 mb-5 p-4 rounded-lg max-h-[70vh] overflow-y-auto" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}` }}>
      <div className="col-span-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide" style={{ color: tokens.textMuted }}>New record</h3>
        <button type="button" onClick={onCancel} aria-label="Cancel"><X size={14} color={tokens.textMuted} /></button>
      </div>
      {note && <p className="col-span-2 text-[11px]" style={{ color: tokens.textMuted }}>{note}</p>}
      {fields.map((f, i) => {
        if (f.type === "heading") {
          return <div key={`h-${i}`} className="col-span-2 text-[11px] uppercase tracking-wide font-semibold mt-1" style={{ color: tokens.indigo }}>{f.label}</div>;
        }
        return (
          <div key={f.key} className={f.wide ? "col-span-2" : ""}>
            <label className="text-[11px]" style={{ color: tokens.textMuted }}>{f.label}</label>
            {f.type === "select" ? (
              <select value={values[f.key]} onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}`, color: tokens.text }}>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            ) : (
              <input
                required={f.required === true}
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
        );
      })}
      {error && <div className="col-span-2 text-xs" style={{ color: tokens.crimson }}>{error}</div>}
      <div className="col-span-2 flex gap-2">
        <button type="submit" disabled={busy} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ backgroundColor: tokens.indigo, color: "#fff", opacity: busy ? 0.6 : 1 }}>
          {busy ? "Saving..." : "Save record"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm" style={{ color: tokens.textMuted, border: `1px solid ${tokens.line}` }}>Cancel</button>
      </div>
    </form>
  );
}

function EmptyState({ label, path }) {
  const tokens = useTokens();
  return (
    <div className="rounded-xl p-10 flex flex-col items-center justify-center text-center gap-2" style={{ backgroundColor: tokens.panel, border: `1px dashed ${tokens.line}`, minHeight: 240 }}>
      <h2 className="text-sm font-semibold">No {label} data yet</h2>
      <p className="text-xs max-w-sm" style={{ color: tokens.textMuted }}>
        Nothing found at <span className="font-mono">{path}</span> in Firebase. Run <span className="font-mono">npm run seed</span> once to load the starting dataset.
      </p>
    </div>
  );
}
