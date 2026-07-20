import React, { useMemo, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from "recharts";
import {
  Layers, Hash, Building2, Filter, Palette, AlertTriangle,
  PackageCheck, FlaskConical, TrendingUp, CheckCircle2, XCircle,
  FileText, Target, Scissors, FileBarChart, Plus, X,
  Download, FileSpreadsheet, Library, Link2
} from "lucide-react";
import { useTokens, gradeColor } from "../tokens";
import { KpiCard, shadeHex, deriveMasterLibrary, groupResultsByDeltaE, ILLUMINANTS } from "../lib";
import { exportExcel, exportPdf } from "../exporters";

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
                          <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: shadeHex(s) }} />
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
export function MQAView({ results, grnRecords = [], onAdd, canWrite }) {
  const tokens = useTokens();
  const [resultFilter, setResultFilter] = useState("All");
  const [showAdd, setShowAdd] = useState(false);
  // Shade Groups are (re)computed live from every record's ΔE (≤ 0.02 rule),
  // so the table and Master Shade Library always reflect the current rule rather
  // than whatever group was stored when each record was first saved.
  const grouped = useMemo(() => groupResultsByDeltaE(results), [results]);
  const filtered = useMemo(() => grouped.filter((r) => resultFilter === "All" || r.result === resultFilter), [grouped, resultFilter]);
  const mqaResultColor = { Pass: tokens.teal, Fail: tokens.crimson };
  const passCount = grouped.filter((r) => r.result === "Pass").length;
  const failCount = grouped.filter((r) => r.result === "Fail").length;
  const avgDeltaE = grouped.length ? (grouped.reduce((a, r) => a + Number(r.deltaE || 0), 0) / grouped.length).toFixed(2) : "—";
  const library = useMemo(() => deriveMasterLibrary(grouped), [grouped]);

  // Chart data must contain ONLY the fields the chart reads. Passing raw MQA
  // records straight to Recharts leaks extra data fields (notably `style`, a
  // fabric-style string) onto the rendered SVG element, which React rejects
  // with error #62 ("style prop expects a mapping ... not a string").
  const chartData = useMemo(
    () => filtered.map((r) => ({ shade: r.shade, deltaE: Number(r.deltaE) || 0, result: r.result })),
    [filtered]
  );

  // Batch ↔ RMWH linkage: choosing a GRN batch auto-fills its supplier details.
  const batches = useMemo(() => Array.from(new Set(grnRecords.map((r) => r.batch).filter(Boolean))), [grnRecords]);
  const grnByBatch = useMemo(() => Object.fromEntries(grnRecords.map((r) => [r.batch, r])), [grnRecords]);
  const autofill = (key, value) => {
    if (key !== "batch") return null;
    const g = grnByBatch[value];
    if (!g) return null;
    return {
      style: g.style || "",
      colourCode: g.colourCode || "SD BLACK 093-54A2",
      supplier: g.supplier || "Best Pacific Textile Ltd.",
      grnNumber: g.invoice || g.grnNumber || "",
      shade: (g.shades && g.shades[0]) || "",
    };
  };

  if (results.length === 0) return (
    <>
      <EmptyState label="MQA" path="depts/MQA/results" />
      {canWrite && (
        <div className="rounded-xl p-5 mt-4" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold">Add First MQA Result</h2>
            {!showAdd && <AddButton label="Add Result" onClick={() => setShowAdd(true)} />}
          </div>
          {showAdd && (
            <AddRecordForm
              onCancel={() => setShowAdd(false)}
              onSubmit={(data) => onAdd(data)}
              autofill={autofill}
              note="Pass/Fail, Delta E, Colour Match %, Shade Group and Recommendation are generated automatically from the Da/Db readings."
              fields={[
                { type: "heading", label: "Sample identification" },
                { key: "batch", label: "GRN Batch (links to RMWH)", type: "select", options: ["", ...batches], placeholder: "— select batch —" },
                { key: "shade", label: "Shade / Batch Shade Code", required: true },
                { key: "style", label: "Style" },
                { key: "colourCode", label: "Colour Code" },
                { key: "supplier", label: "Supplier" },
                { key: "grnNumber", label: "GRN Number" },
                { key: "rollNumber", label: "Roll Number" },
                { type: "heading", label: `Da readings (illuminants ${ILLUMINANTS.join(", ")})` },
                ...ILLUMINANTS.map((L) => ({ key: `da${L}`, label: `Da — ${L}`, type: "number", required: true })),
                { type: "heading", label: `Db readings (illuminants ${ILLUMINANTS.join(", ")})` },
                ...ILLUMINANTS.map((L) => ({ key: `db${L}`, label: `Db — ${L}`, type: "number", required: true })),
                { type: "heading", label: "Inspection" },
                { key: "tester", label: "Tested By", required: true },
                { key: "date", label: "Date", type: "date", required: true },
              ]}
            />
          )}
        </div>
      )}
    </>
  );

  const tri = (r, p) => ILLUMINANTS.map((L) => (r[p + L] === undefined || r[p + L] === "" ? "—" : r[p + L])).join(" / ");
  const cols = ["Shade", "Batch", "Style", "Colour Code", `Da (${ILLUMINANTS.join("/")})`, `Db (${ILLUMINANTS.join("/")})`, "Avg Da", "Avg Db", "Delta E", "Match %", "Shade Group", "Mapped Std", "Result", "Recommendation", "Tested By", "Date"];

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={FlaskConical} label="Samples Tested" value={results.length} sub="Live from Firebase" accent={tokens.indigo} />
        <KpiCard icon={CheckCircle2} label="Pass" value={passCount} sub={results.length ? `${((passCount / results.length) * 100).toFixed(0)}%` : ""} accent={tokens.teal} />
        <KpiCard icon={XCircle} label="Fail" value={failCount} sub="Any Da/Db ≥ 0" accent={tokens.crimson} />
        <KpiCard icon={TrendingUp} label="Avg Delta E" value={avgDeltaE} sub="Across all samples" accent={tokens.indigo} />
        <KpiCard icon={Library} label="Shade Groups" value={library.length} sub="Master standards" accent={tokens.amber} />
      </div>

      <div className="rounded-xl px-4 py-3 flex items-start gap-3" style={{ backgroundColor: `${tokens.indigo}33`, border: `1px solid ${tokens.indigo}66` }}>
        <Link2 size={15} color={tokens.indigo} className="mt-0.5 shrink-0" />
        <p className="text-xs" style={{ color: tokens.text }}>
          Pass rule: a shade passes only when every Da and Db reading (under illuminants {ILLUMINANTS.join(", ")}) is negative.
          Each scan is compared to the Master Shade Library; a match within tolerance is mapped to that standard’s Roman-numeral
          Shade Group, keeping the original shade name for traceability. Choosing a GRN batch pulls in its supplier and style details.
        </p>
      </div>


      {library.length > 0 && (
        <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
          <h2 className="text-sm font-semibold mb-1">Master Shade Library</h2>
          <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>Standard shades scans are mapped into · centroid Da/Db</p>
          <div className="flex gap-3 flex-wrap">
            {library.map((m) => (
              <div key={m.group} className="rounded-lg px-3 py-2 min-w-[150px]" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}` }}>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold px-2 py-0.5 rounded" style={{ backgroundColor: `${tokens.indigo}22`, color: tokens.indigo }}>Group {m.group}</span>
                  <span className="text-[11px] font-mono" style={{ color: tokens.textMuted }}>{m.standard}</span>
                </div>
                <div className="text-[10px] mt-1.5 font-mono" style={{ color: tokens.textMuted }}>Da {m.centroidDa} · Db {m.centroidDb} · {m.count} scans</div>
                <div className="text-[10px] mt-0.5" style={{ color: tokens.text }}>{m.shades.slice(0, 6).join(", ")}{m.shades.length > 6 ? "…" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <h2 className="text-sm font-semibold mb-1">Delta E by Shade Code</h2>
        <p className="text-[11px] mb-4" style={{ color: tokens.textMuted }}>Lower is a closer match · green = Pass, red = Fail</p>
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={chartData} margin={{ left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={tokens.line} vertical={false} />
            <XAxis dataKey="shade" tick={{ fill: tokens.textMuted, fontSize: 9 }} axisLine={{ stroke: tokens.line }} tickLine={false} interval={0} angle={-45} textAnchor="end" height={60} />
            <YAxis tick={{ fill: tokens.textMuted, fontSize: 11 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={tt(tokens)} labelStyle={{ color: tokens.text }} />
            <Bar dataKey="deltaE" radius={[3, 3, 0, 0]}>{chartData.map((r, i) => <Cell key={i} fill={mqaResultColor[r.result] || tokens.indigo} />)}</Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold">Spectrophotometer Results</h2>
          <div className="flex items-center gap-2">
            <Filter size={13} color={tokens.textMuted} />
            {["All", "Pass", "Fail"].map((s) => (
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
            autofill={autofill}
            note="Pass/Fail, Delta E, Colour Match %, Shade Group and Recommendation are generated automatically from the Da/Db readings."
            fields={[
              { type: "heading", label: "Sample identification" },
              { key: "batch", label: "GRN Batch (links to RMWH)", type: "select", options: ["", ...batches], placeholder: "— select batch —" },
              { key: "shade", label: "Shade / Batch Shade Code", required: true },
              { key: "style", label: "Style" },
              { key: "colourCode", label: "Colour Code" },
              { key: "supplier", label: "Supplier" },
              { key: "grnNumber", label: "GRN Number" },
              { key: "rollNumber", label: "Roll Number" },
              { type: "heading", label: `Da readings (illuminants ${ILLUMINANTS.join(", ")})` },
              ...ILLUMINANTS.map((L) => ({ key: `da${L}`, label: `Da — ${L}`, type: "number", required: true })),
              { type: "heading", label: `Db readings (illuminants ${ILLUMINANTS.join(", ")})` },
              ...ILLUMINANTS.map((L) => ({ key: `db${L}`, label: `Db — ${L}`, type: "number", required: true })),
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
              {filtered.map((r, i) => (
                <tr key={r.id || r.shade || i} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap"><div className="flex items-center gap-2"><div className="w-3 h-3 rounded-sm" style={{ backgroundColor: shadeHex(r.shade) }} />{dash(r.shade)}</div></td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.batch)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.style)}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap">{dash(r.colourCode)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{tri(r, "da")}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{tri(r, "db")}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.avgDa)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.avgDb)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{dash(r.deltaE)}</td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap">{r.matchPct !== undefined && r.matchPct !== "" ? `${r.matchPct}%` : "—"}</td>
                  <td className="py-2.5 pr-4 text-xs whitespace-nowrap"><span className="font-semibold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${tokens.indigo}22`, color: tokens.indigo }}>{dash(r.shadeGroup)}</span></td>
                  <td className="py-2.5 pr-4 text-xs font-mono whitespace-nowrap" style={{ color: tokens.textMuted }}>{dash(r.mappedStandard)}</td>
                  <td className="py-2.5 pr-4"><span className="text-xs font-medium px-2 py-1 rounded-full whitespace-nowrap" style={{ color: mqaResultColor[r.result] || tokens.textMuted, backgroundColor: `${mqaResultColor[r.result] || tokens.panelAlt}` }}>{dash(r.result)}</span></td>
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

  return (
    <>
      <div className="flex gap-4 flex-wrap">
        <KpiCard icon={Layers} label="Black GRN Received" value={totalGrnQty.toLocaleString(undefined, { minimumFractionDigits: 2 })} sub={`${grnRecords.length} GRNs`} accent={tokens.indigo} />
        <KpiCard icon={Scissors} label="Cutting Dockets" value={dockets.length} sub="Body + CFL+Binding" accent={tokens.teal} />
        <KpiCard icon={Palette} label="Shade Codes in Use" value={shadeList.length} sub="1 nominal color" accent={tokens.crimson} />
        <KpiCard icon={Target} label="Grade A/B Match Rate" value={`${goodGradePct}%`} sub="Of incoming rolls" accent={tokens.teal} />
        <KpiCard icon={FlaskConical} label="MQA Pass Rate" value={results.length ? `${((mqaPassCount / results.length) * 100).toFixed(0)}%` : "—"} sub={`${mqaFailCount} fails of ${results.length}`} accent={tokens.amber} />
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
export function ReportsView({ grnRecords, dockets, results = [] }) {
  const tokens = useTokens();
  const [activeReport, setActiveReport] = useState("grn");

  const reports = useMemo(() => buildReports(grnRecords, dockets, results), [grnRecords, dockets, results]);
  const reportDefs = [
    { key: "grn", label: "GRN Report", icon: PackageCheck, desc: "All RMWH goods-receipt records" },
    { key: "mqa", label: "Shade Inspection Report", icon: FlaskConical, desc: "Spectrophotometer results, groups & pass/fail" },
    { key: "cutting", label: "Cutting Report", icon: Scissors, desc: "Cutting dockets & fabric consumption" },
    { key: "library", label: "Master Shade Library", icon: Library, desc: "Standard shades & their mapped scans" },
    { key: "executive", label: "Executive Summary", icon: FileBarChart, desc: "Cross-department roll-up" },
  ];
  const report = reports[activeReport];
  const cell = (row, col) => {
    const v = typeof col.key === "function" ? col.key(row) : row[col.key];
    if (Array.isArray(v)) return v.join(", ");
    return v === undefined || v === null || v === "" ? "—" : v;
  };

  return (
    <>
      <div className="flex gap-3 flex-wrap">
        {reportDefs.map((r) => {
          const Icon = r.icon;
          const isActive = activeReport === r.key;
          return (
            <div key={r.key} onClick={() => setActiveReport(r.key)} className="rounded-xl p-4 flex-1 min-w-[200px] cursor-pointer transition-transform"
              style={{ backgroundColor: isActive ? tokens.panelAlt : tokens.panel, border: `1px solid ${isActive ? tokens.indigo : tokens.line}`, transform: isActive ? "translateY(-2px)" : "none" }}>
              <div className="flex items-center gap-2 mb-2"><FileText size={14} color={tokens.textMuted} /><span className="text-[10px] uppercase tracking-wide" style={{ color: tokens.textMuted }}>Report</span></div>
              <div className="flex items-center gap-2 mb-1"><Icon size={16} color={tokens.indigo} /><span className="text-sm font-semibold">{r.label}</span></div>
              <p className="text-[11px]" style={{ color: tokens.textMuted }}>{r.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="rounded-xl p-5" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}` }}>
        <div className="flex items-center justify-between mb-1 flex-wrap gap-3">
          <div>
            <h2 className="text-sm font-semibold">{report.title}</h2>
            <p className="text-[11px] mt-0.5" style={{ color: tokens.textMuted }}>{report.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => exportExcel(report)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium" style={{ backgroundColor: tokens.teal, color: "#fff" }}>
              <FileSpreadsheet size={13} /> Excel
            </button>
            <button onClick={() => exportPdf(report)} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md font-medium" style={{ backgroundColor: tokens.crimson, color: "#fff" }}>
              <Download size={13} /> PDF
            </button>
          </div>
        </div>

        {/* Summary */}
        <div className="flex gap-3 flex-wrap mt-4 mb-5">
          {report.summary.map((s) => (
            <div key={s.label} className="rounded-lg px-4 py-3 min-w-[150px]" style={{ backgroundColor: tokens.panelAlt, border: `1px solid ${tokens.line}` }}>
              <div className="text-lg font-semibold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{s.value}</div>
              <div className="text-[11px] mt-0.5" style={{ color: tokens.textMuted }}>{s.label}</div>
            </div>
          ))}
        </div>

        {/* Detail */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead><tr style={{ borderBottom: `1px solid ${tokens.line}` }}>{report.columns.map((c) => <th key={c.header} className="text-[11px] uppercase tracking-wide font-medium pb-2 pr-4 whitespace-nowrap" style={{ color: tokens.textMuted }}>{c.header}</th>)}</tr></thead>
            <tbody>
              {report.rows.map((row, ri) => (
                <tr key={row.id || ri} style={{ borderBottom: `1px solid ${tokens.line}` }}>
                  {report.columns.map((c) => <td key={c.header} className="py-2 pr-4 text-xs whitespace-nowrap">{cell(row, c)}</td>)}
                </tr>
              ))}
              {report.rows.length === 0 && <tr><td colSpan={report.columns.length} className="py-6 text-center text-xs" style={{ color: tokens.textMuted }}>No data for this report yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

// Assembles every report (title, subtitle, summary, columns, rows) from the
// live datasets so the same shape can be rendered and exported to Excel/PDF.
function buildReports(grnRecords, dockets, results) {
  const shadesJoin = (r) => (r.shades || []).join(", ");
  const library = deriveMasterLibrary(results);

  // GRN
  const grnQty = grnRecords.reduce((a, r) => a + Number(r.qty || 0), 0);
  const grnRolls = grnRecords.reduce((a, r) => a + Number(r.rolls || 0), 0);
  const grn = {
    title: "GRN Report",
    subtitle: "RMWH — all goods-receipt records",
    summary: [
      { label: "GRN Records", value: grnRecords.length },
      { label: "Total GRN Qty", value: grnQty.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
      { label: "Purchase Orders", value: new Set(grnRecords.map((r) => r.po)).size },
      { label: "Styles", value: new Set(grnRecords.map((r) => r.style).filter(Boolean)).size },
      { label: "Rolls Received", value: grnRolls || "—" },
    ],
    columns: [
      { header: "PO Number", key: "po" }, { header: "Buyer", key: "buyer" }, { header: "Style", key: "style" },
      { header: "Schedule", key: "schedule" }, { header: "Category", key: "category" }, { header: "Colour Code", key: "colourCode" },
      { header: "Supplier", key: "supplier" }, { header: "Batch", key: "batch" }, { header: "Invoice", key: "invoice" },
      { header: "Lay Job", key: "layJob" }, { header: "GRN Date", key: "date" }, { header: "Roll No", key: "rollNo" },
      { header: "Rolls", key: "rolls" }, { header: "GRN Qty", key: "qty" }, { header: "Composition", key: "composition" },
      { header: "Proc. Group", key: "procurementGroup" }, { header: "Fabric Type", key: "fabricType" }, { header: "Shades", key: shadesJoin },
    ],
    rows: grnRecords,
  };

  // MQA / Shade Inspection
  const pass = results.filter((r) => r.result === "Pass").length;
  const fail = results.filter((r) => r.result === "Fail").length;
  const avgDe = results.length ? (results.reduce((a, r) => a + Number(r.deltaE || 0), 0) / results.length).toFixed(2) : "—";
  const withMatch = results.filter((r) => r.matchPct !== undefined && r.matchPct !== "");
  const avgMatch = withMatch.length ? (withMatch.reduce((a, r) => a + Number(r.matchPct || 0), 0) / withMatch.length).toFixed(1) + "%" : "—";
  const mqa = {
    title: "Shade Inspection Report",
    subtitle: "MQA — spectrophotometer results (Da/Db under A, F2, D65)",
    summary: [
      { label: "Samples", value: results.length },
      { label: "Pass", value: pass },
      { label: "Fail", value: fail },
      { label: "Pass Rate", value: results.length ? `${((pass / results.length) * 100).toFixed(0)}%` : "—" },
      { label: "Avg Delta E", value: avgDe },
      { label: "Avg Match", value: avgMatch },
      { label: "Shade Groups", value: library.length },
    ],
    columns: [
      { header: "Shade", key: "shade" }, { header: "Batch", key: "batch" }, { header: "Style", key: "style" },
      { header: "Colour Code", key: "colourCode" }, { header: "GRN No", key: "grnNumber" }, { header: "Roll", key: "rollNumber" },
      { header: "Da A", key: "daA" }, { header: "Da F2", key: "daF2" }, { header: "Da D65", key: "daD65" },
      { header: "Db A", key: "dbA" }, { header: "Db F2", key: "dbF2" }, { header: "Db D65", key: "dbD65" },
      { header: "Avg Da", key: "avgDa" }, { header: "Avg Db", key: "avgDb" }, { header: "Delta E", key: "deltaE" },
      { header: "Match %", key: "matchPct" }, { header: "Shade Group", key: "shadeGroup" }, { header: "Mapped Std", key: "mappedStandard" },
      { header: "Result", key: "result" }, { header: "Recommendation", key: "recommendation" }, { header: "Tested By", key: "tester" }, { header: "Date", key: "date" },
    ],
    rows: results,
  };

  // Cutting
  const bodyDockets = dockets.filter((d) => d.component === "Body");
  const avgBody = bodyDockets.length ? (bodyDockets.reduce((a, d) => a + Number(d.consumption || 0), 0) / bodyDockets.length).toFixed(4) : "—";
  const subCodes = new Set(dockets.flatMap((d) => (d.shades || []).map((s) => `${d.component}:${s}`))).size;
  const cutting = {
    title: "Cutting Report",
    subtitle: "Cutting — dockets & fabric consumption",
    summary: [
      { label: "Dockets", value: dockets.length },
      { label: "Schedules", value: new Set(dockets.flatMap((d) => (d.schedule || "").split(",").map((s) => s.trim()).filter(Boolean))).size },
      { label: "Shade Sub-codes", value: subCodes },
      { label: "Avg Body Consumption", value: avgBody },
      { label: "Total Allocated Qty", value: dockets.reduce((a, d) => a + Number(d.allocatedQty || 0), 0) || "—" },
    ],
    columns: [
      { header: "Docket ID", key: "docketId" }, { header: "CO", key: "co" }, { header: "Component", key: "component" },
      { header: "Comp Group", key: "componentGroup" }, { header: "Style", key: "styleNo" }, { header: "Category", key: "category" },
      { header: "Schedule", key: "schedule" }, { header: "Shades", key: shadesJoin }, { header: "Fabric Code", key: "fabCode" },
      { header: "Fabric Color", key: "fabricColor" }, { header: "Lot No", key: "lotNo" }, { header: "Lay Job", key: "layJob" },
      { header: "Created", key: "created" }, { header: "Consumption", key: "consumption" }, { header: "Binding Cons", key: "bindingConsumption" },
      { header: "Total Req", key: "totalRequirement" }, { header: "Allocated Qty", key: "allocatedQty" },
      { header: "Purchase Width", key: "purchaseWidth" }, { header: "Actual Width", key: "actualWidth" }, { header: "Cut Length", key: "cutLength" }, { header: "Cut Width", key: "cutWidth" },
    ],
    rows: dockets,
  };

  // Master Shade Library
  const libraryReport = {
    title: "Master Shade Library",
    subtitle: "Standard shades and the scans mapped into each Roman-numeral group",
    summary: [
      { label: "Shade Groups", value: library.length },
      { label: "Total Scans Mapped", value: library.reduce((a, m) => a + m.count, 0) },
      { label: "Distinct Shade Names", value: new Set(results.map((r) => r.shade)).size },
    ],
    columns: [
      { header: "Shade Group", key: "group" }, { header: "Mapped Standard", key: "standard" },
      { header: "Centroid Da", key: "centroidDa" }, { header: "Centroid Db", key: "centroidDb" },
      { header: "Scan Count", key: "count" }, { header: "Member Shades", key: (m) => m.shades },
    ],
    rows: library,
  };

  // Executive summary
  const executive = {
    title: "Executive Summary",
    subtitle: "Cross-department roll-up · SD BLACK 093 54A2",
    summary: [
      { label: "GRN Qty", value: grnQty.toLocaleString(undefined, { minimumFractionDigits: 2 }) },
      { label: "Cutting Dockets", value: dockets.length },
      { label: "MQA Samples", value: results.length },
      { label: "MQA Pass Rate", value: results.length ? `${((pass / results.length) * 100).toFixed(0)}%` : "—" },
      { label: "Shade Groups", value: library.length },
    ],
    columns: [{ header: "Metric", key: "metric" }, { header: "Value", key: "value" }],
    rows: [
      { metric: "GRN records", value: grnRecords.length },
      { metric: "Total GRN quantity", value: grnQty.toFixed(2) },
      { metric: "Purchase orders", value: new Set(grnRecords.map((r) => r.po)).size },
      { metric: "Cutting dockets", value: dockets.length },
      { metric: "Distinct shade sub-codes (cutting)", value: subCodes },
      { metric: "MQA samples tested", value: results.length },
      { metric: "MQA pass", value: pass },
      { metric: "MQA fail", value: fail },
      { metric: "Average Delta E", value: avgDe },
      { metric: "Master shade groups", value: library.length },
    ],
  };

  return { grn, mqa, cutting, library: libraryReport, executive };
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
function AddRecordForm({ fields, onSubmit, onCancel, note, autofill }) {
  const tokens = useTokens();
  const [values, setValues] = useState(() =>
    Object.fromEntries(fields.filter((f) => f.type !== "heading").map((f) => [f.key, f.default ?? ""]))
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Update one field; if a parent supplied an autofill map, merge its patch too.
  const change = (key, value) => {
    setValues((prev) => {
      const next = { ...prev, [key]: value };
      const patch = autofill ? autofill(key, value, next) : null;
      return patch ? { ...next, ...patch } : next;
    });
  };

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
              <select value={values[f.key]} onChange={(e) => change(f.key, e.target.value)}
                className="w-full mt-1 px-3 py-2 rounded-lg text-sm outline-none" style={{ backgroundColor: tokens.panel, border: `1px solid ${tokens.line}`, color: tokens.text }}>
                {f.options.map((o) => <option key={o} value={o}>{o === "" ? (f.placeholder || "—") : o}</option>)}
              </select>
            ) : (
              <input
                required={f.required === true}
                type={f.type === "number" ? "number" : f.type === "date" ? "date" : "text"}
                step={f.type === "number" ? "any" : undefined}
                value={values[f.key]}
                onChange={(e) => change(f.key, e.target.value)}
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
