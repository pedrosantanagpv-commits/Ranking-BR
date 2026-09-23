import type { ParsedReport, ReportRow } from "./types";

export function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toUpperCase();
}

function parseCurrency(value: string) {
  const cleaned = value.replace(/[^0-9,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

function parseBrazilianDate(value: string) {
  const match = value.trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) return "";
  const [, day, month, year] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function countBy(rows: ReportRow[], select: (row: ReportRow) => string) {
  return rows.reduce<Record<string, number>>((result, row) => {
    const key = select(row) || "NÃO INFORMADO";
    result[key] = (result[key] ?? 0) + 1;
    return result;
  }, {});
}

async function hashFile(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function parseManagementReport(file: File): Promise<ParsedReport> {
  const [buffer, fileHash] = await Promise.all([file.arrayBuffer(), hashFile(file)]);
  const html = new TextDecoder("windows-1252").decode(buffer);

  if (!/<table[\s>]/i.test(html)) {
    throw new Error("Este arquivo não segue o layout Gestão Adesão exportado pelo sistema.");
  }

  const documentNode = new DOMParser().parseFromString(html, "text/html");
  const tables = Array.from(documentNode.querySelectorAll("table"));
  const reportTable = tables.find((table) => {
    const text = normalizeText(table.textContent ?? "");
    return text.includes("VOLUNTARIO") && text.includes("CHASSI") && text.includes("DATA CONTRATO");
  });

  if (!reportTable) {
    throw new Error("Não encontrei as colunas Voluntário, Chassi e Data Contrato no relatório.");
  }

  const tableRows = Array.from(reportTable.querySelectorAll("tr"));
  const headerIndex = tableRows.findIndex((row) => {
    const cells = Array.from(row.querySelectorAll("th,td")).map((cell) => normalizeText(cell.textContent ?? ""));
    return cells.includes("NOME") && cells.includes("VOLUNTARIO") && cells.includes("CHASSI");
  });

  if (headerIndex < 0) throw new Error("O cabeçalho do relatório Gestão Adesão não foi reconhecido.");

  const headers = Array.from(tableRows[headerIndex].querySelectorAll("th,td")).map((cell) => normalizeText(cell.textContent ?? ""));
  const column = (label: string) => headers.indexOf(normalizeText(label));
  const indexes = {
    nome: column("Nome"),
    placa: column("Placa"),
    tipoVeiculo: column("Tipo Veículo"),
    cooperativa: column("Cooperativa"),
    executivo: column("Voluntário"),
    situacao: column("Situação Veículo"),
    data: column("Data Contrato"),
    tipoAdesao: column("Tipo Adesão"),
    previsao: headers.findIndex((header) => header.startsWith("VALOR PREVISAO RATEIO")),
    chassi: column("Chassi"),
  };

  if (Object.values(indexes).some((index) => index < 0)) {
    throw new Error("O layout do relatório mudou e uma ou mais colunas obrigatórias não foram encontradas.");
  }

  const rawRows = tableRows.slice(headerIndex + 1).flatMap<ReportRow>((row) => {
    const cells = Array.from(row.querySelectorAll("td")).map((cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim());
    if (cells.length < headers.length) return [];
    const executivo = cells[indexes.executivo];
    const chassi = cells[indexes.chassi];
    if (!executivo || !chassi) return [];
    const situacao = cells[indexes.situacao];
    const tipoAdesao = cells[indexes.tipoAdesao];
    return [{
      nomeAssociado: cells[indexes.nome],
      placa: cells[indexes.placa],
      tipoVeiculo: cells[indexes.tipoVeiculo],
      cooperativa: cells[indexes.cooperativa],
      executivo,
      executivoNormalizado: normalizeText(executivo),
      situacao,
      situacaoNormalizada: normalizeText(situacao),
      dataContrato: parseBrazilianDate(cells[indexes.data]),
      tipoAdesao,
      tipoAdesaoNormalizado: normalizeText(tipoAdesao),
      previsao: parseCurrency(cells[indexes.previsao]),
      chassi: normalizeText(chassi),
    }];
  });

  const uniqueRows = new Map<string, ReportRow>();
  rawRows.forEach((row) => uniqueRows.set(row.chassi || normalizeText(row.placa), row));
  const rows = Array.from(uniqueRows.values());
  const dates = rows.map((row) => row.dataContrato).filter(Boolean).sort();

  if (!rows.length || !dates.length) throw new Error("O relatório não contém registros válidos para processamento.");

  const metadataText = tables.map((table) => table.textContent ?? "").join(" ").replace(/\s+/g, " ");
  const metadataMatch = metadataText.match(/Usuário:\s*(\d{2}\/\d{2}\/\d{4})-(\d{2}:\d{2}:\d{2})-(.+?)\s*$/i);

  return {
    fileName: file.name,
    fileHash,
    rows,
    totalRows: rows.length,
    duplicateRows: rawRows.length - rows.length,
    missingPlates: rows.filter((row) => !row.placa).length,
    periodStart: dates[0],
    periodEnd: dates[dates.length - 1],
    generatedAt: metadataMatch ? `${parseBrazilianDate(metadataMatch[1])}T${metadataMatch[2]}` : undefined,
    generatedBy: metadataMatch?.[3]?.trim(),
    statusCounts: countBy(rows, (row) => row.situacao),
    adhesionCounts: countBy(rows, (row) => row.tipoAdesao),
    vehicleTypeCounts: countBy(rows, (row) => row.tipoVeiculo),
  };
}
