import { formatCurrency, formatDate } from "./format";
import type { Ranking } from "./types";

function downloadBlob(content: BlobPart[], type: string, fileName: string) {
  const url = URL.createObjectURL(new Blob(content, { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/^-|-$/g, "").toLowerCase();
}

function escapeHtml(value: string | number) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

export function exportRankingExcel(ranking: Ranking) {
  const executiveRows = ranking.entries.map((entry) => { const ticket = typeof entry.averageTicket === "number" ? entry.averageTicket : (entry.plates ? entry.revenue / entry.plates : 0); return `<tr><td>${entry.position}º</td><td>${escapeHtml(entry.name)}</td><td>${escapeHtml(entry.team)}</td><td>${entry.plates}</td><td>${Number(entry.revenue ?? 0).toFixed(2)}</td><td>${ticket.toFixed(2)}</td><td>${entry.movement ?? 0}</td></tr>`; }).join("");
  const teamRows = (ranking.teamEntries ?? []).map((entry) => { const ticket = typeof entry.averageTicket === "number" ? entry.averageTicket : (entry.plates ? entry.revenue / entry.plates : 0); return `<tr><td>${entry.position}º</td><td>${escapeHtml(entry.team)}</td><td>${escapeHtml(entry.cooperativeCode ?? "")}</td><td>${entry.members ?? 0}</td><td>${entry.plates}</td><td>${Number(entry.revenue ?? 0).toFixed(2)}</td><td>${ticket.toFixed(2)}</td><td>${entry.movement ?? 0}</td></tr>`; }).join("");
  const html = `<!doctype html><html><head><meta charset="utf-8"><style>body{font-family:Arial,sans-serif;color:#17191d}h1{background:#17191d;color:#ffc400;padding:18px}h2{margin-top:28px}table{border-collapse:collapse;width:100%}th{background:#ffc400;color:#17191d}th,td{border:1px solid #cfd3d7;padding:8px;text-align:left}.meta{margin:14px 0;color:#555}</style></head><body><h1>Ranking BR · ${escapeHtml(ranking.label)}</h1><div class="meta">Período: ${formatDate(ranking.periodStart)} a ${formatDate(ranking.periodEnd)} · Responsável: ${escapeHtml(ranking.createdByName || "Não informado")}</div><div class="meta">Veículos ativos: ${ranking.totalVehicles} · Previsão total: ${escapeHtml(formatCurrency(ranking.totalRevenue))}</div><h2>Ranking de executivos</h2><table><thead><tr><th>Posição</th><th>Executivo</th><th>Equipe</th><th>Placas</th><th>Previsão</th><th>Ticket médio</th><th>Movimento</th></tr></thead><tbody>${executiveRows}</tbody></table><h2>Ranking de equipes</h2><table><thead><tr><th>Posição</th><th>Equipe</th><th>Cooperativa</th><th>Participantes</th><th>Placas</th><th>Previsão</th><th>Ticket médio</th><th>Movimento</th></tr></thead><tbody>${teamRows}</tbody></table></body></html>`;
  downloadBlob(["\ufeff", html], "application/vnd.ms-excel;charset=utf-8", `ranking-br-${safeFileName(ranking.label)}.xls`);
}

type PdfLine = { text: string; bold?: boolean; size?: number; color?: "dark" | "yellow" | "muted" };

function pdfText(value: string) {
  return value
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[^\x20-\xFF]/g, "?")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function truncate(value: string, max: number) {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function latin1Bytes(value: string) {
  return Uint8Array.from(Array.from(value, (character) => character.charCodeAt(0) & 0xff));
}

function makePdf(lines: PdfLine[]) {
  const pageWidth = 842;
  const pageHeight = 595;
  const linesPerPage = 29;
  const pages: PdfLine[][] = [];
  for (let index = 0; index < lines.length; index += linesPerPage) pages.push(lines.slice(index, index + linesPerPage));
  const fontRegularId = 3 + pages.length * 2;
  const fontBoldId = fontRegularId + 1;
  const objects: string[] = [];
  objects[1] = `<< /Type /Catalog /Pages 2 0 R >>`;
  const pageIds = pages.map((_, index) => 3 + index * 2);
  objects[2] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;

  pages.forEach((pageLines, pageIndex) => {
    const pageId = 3 + pageIndex * 2;
    const contentId = pageId + 1;
    const commands = pageLines.map((line, lineIndex) => {
      const y = pageHeight - 44 - lineIndex * 17;
      const font = line.bold ? "F2" : "F1";
      const size = line.size ?? 9;
      const color = line.color === "yellow" ? "0.90 0.62 0" : line.color === "muted" ? "0.38 0.40 0.44" : "0.08 0.09 0.11";
      return `BT /${font} ${size} Tf ${color} rg 42 ${y} Td (${pdfText(line.text)}) Tj ET`;
    });
    commands.push(`BT /F1 8 Tf 0.45 0.47 0.50 rg 760 22 Td (${pageIndex + 1}/${pages.length}) Tj ET`);
    const stream = commands.join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`;
  });
  objects[fontRegularId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>`;
  objects[fontBoldId] = `<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>`;

  let pdf = "%PDF-1.4\n%âãÏÓ\n";
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = pdf.length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, "0")} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return latin1Bytes(pdf);
}

export function exportRankingPdf(ranking: Ranking) {
  const lines: PdfLine[] = [
    { text: "RANKING BR · GPV ASSOCIADOS", bold: true, size: 17, color: "yellow" },
    { text: ranking.label, bold: true, size: 14 },
    { text: `Período: ${formatDate(ranking.periodStart)} a ${formatDate(ranking.periodEnd)} · Responsável: ${ranking.createdByName || "Não informado"}`, color: "muted" },
    { text: `Veículos ativos: ${ranking.totalVehicles} · Executivos: ${ranking.totalExecutives} · Previsão total: ${formatCurrency(ranking.totalRevenue)}` },
    { text: "" },
    { text: "RANKING DE EXECUTIVOS", bold: true, size: 12 },
    { text: "POS.  EXECUTIVO                     EQUIPE                    PLACAS    PREVISÃO        T. MÉDIO", bold: true, size: 8 },
    ...ranking.entries.map((entry) => ({ text: `${String(entry.position).padStart(2, "0")}º   ${truncate(entry.name, 28).padEnd(29)} ${truncate(entry.team, 23).padEnd(24)} ${String(entry.plates).padStart(5)}     ${formatCurrency(entry.revenue).padStart(14)}  ${formatCurrency(entry.averageTicket).padStart(12)}`, size: 8 })),
    { text: "" },
    { text: "RANKING DE EQUIPES", bold: true, size: 12 },
    { text: "POS.  EQUIPE                         PARTIC.   PLACAS    PREVISÃO        T. MÉDIO", bold: true, size: 8 },
    ...(ranking.teamEntries ?? []).map((entry) => ({ text: `${String(entry.position).padStart(2, "0")}º   ${truncate(entry.team, 30).padEnd(31)} ${String(entry.members).padStart(5)}     ${String(entry.plates).padStart(5)}     ${formatCurrency(entry.revenue).padStart(14)}  ${formatCurrency(entry.averageTicket).padStart(12)}`, size: 8 })),
  ];
  downloadBlob([makePdf(lines)], "application/pdf", `ranking-br-${safeFileName(ranking.label)}.pdf`);
}
