// Client-side report exporters. A "report" is:
//   { title, subtitle, summary: [{label, value}], columns: [{header, key}], rows: [{}] }
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

const cellValue = (row, col) => {
  const v = typeof col.key === "function" ? col.key(row) : row[col.key];
  if (Array.isArray(v)) return v.join(", ");
  return v === undefined || v === null ? "" : v;
};

const stamp = () => new Date().toISOString().slice(0, 10);
const fileName = (title, ext) => `${title.replace(/[^a-z0-9]+/gi, "_")}_${stamp()}.${ext}`;

export function exportExcel(report) {
  const wb = XLSX.utils.book_new();

  // Summary sheet
  const summaryAoa = [
    [report.title],
    [report.subtitle || ""],
    [`Generated ${new Date().toLocaleString()}`],
    [],
    ["Summary", ""],
    ...report.summary.map((s) => [s.label, s.value]),
  ];
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryAoa);
  summarySheet["!cols"] = [{ wch: 32 }, { wch: 28 }];
  XLSX.utils.book_append_sheet(wb, summarySheet, "Summary");

  // Detail sheet
  const header = report.columns.map((c) => c.header);
  const body = report.rows.map((r) => report.columns.map((c) => cellValue(r, c)));
  const detailSheet = XLSX.utils.aoa_to_sheet([header, ...body]);
  detailSheet["!cols"] = report.columns.map((c) => ({ wch: Math.max(12, c.header.length + 2) }));
  XLSX.utils.book_append_sheet(wb, detailSheet, "Details");

  XLSX.writeFile(wb, fileName(report.title, "xlsx"));
}

export function exportPdf(report) {
  const doc = new jsPDF({ orientation: report.columns.length > 8 ? "landscape" : "portrait", unit: "pt", format: "a4" });
  const marginX = 40;
  let y = 46;

  doc.setFontSize(16);
  doc.text(report.title, marginX, y);
  y += 18;
  if (report.subtitle) {
    doc.setFontSize(10);
    doc.setTextColor(110);
    doc.text(report.subtitle, marginX, y);
    y += 14;
  }
  doc.setFontSize(9);
  doc.setTextColor(140);
  doc.text(`Generated ${new Date().toLocaleString()}`, marginX, y);
  doc.setTextColor(0);
  y += 10;

  // Summary block as a compact 2-column table
  autoTable(doc, {
    startY: y + 6,
    head: [["Summary", ""]],
    body: report.summary.map((s) => [s.label, String(s.value)]),
    theme: "grid",
    styles: { fontSize: 9, cellPadding: 4 },
    headStyles: { fillColor: [59, 91, 165] },
    columnStyles: { 0: { cellWidth: 200, fontStyle: "bold" } },
    margin: { left: marginX, right: marginX },
  });

  // Detail table
  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 18,
    head: [report.columns.map((c) => c.header)],
    body: report.rows.map((r) => report.columns.map((c) => String(cellValue(r, c)))),
    theme: "striped",
    styles: { fontSize: 7, cellPadding: 3, overflow: "linebreak" },
    headStyles: { fillColor: [59, 91, 165] },
    margin: { left: marginX, right: marginX },
  });

  doc.save(fileName(report.title, "pdf"));
}
