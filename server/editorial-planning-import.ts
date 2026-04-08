export type ParsedPlanningRow = {
  rowNumber: number;
  publicationDateIso: string | null;
  monthLabel: string;
  dayLabel: string;
  title: string;
  primaryKeyword: string;
  briefUrl: string;
  briefText: string;
  contentSeed: string;
  rawStatus: string;
  sourceUrl: string;
  topic: string;
  objective: string;
  workflowStatus: "todo" | "ready" | "scheduled" | "published" | "other";
  targetEditorialStatus: "en attente" | "à réviser" | "validé" | "publié";
  dedupKey: string;
};

function stripBom(value: string): string {
  return value.replace(/^\uFEFF/, "");
}

function normalizeKey(value: string): string {
  return stripBom(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseCsv(content: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < content.length; i += 1) {
    const char = content[i];

    if (char === '"') {
      if (inQuotes && content[i + 1] === '"') {
        currentCell += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      currentRow.push(currentCell);
      currentCell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && content[i + 1] === "\n") i += 1;
      currentRow.push(currentCell);
      currentCell = "";
      if (currentRow.some((c) => c.trim().length > 0)) rows.push(currentRow);
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((c) => c.trim().length > 0)) rows.push(currentRow);
  }

  return rows;
}

function parsePublicationDate(dayField: string, year: number): string | null {
  const match = dayField.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  if (!Number.isInteger(day) || !Number.isInteger(month)) return null;
  if (day < 1 || day > 31 || month < 1 || month > 12) return null;

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

function mapStatuses(rawStatus: string): {
  workflowStatus: ParsedPlanningRow["workflowStatus"];
  targetEditorialStatus: ParsedPlanningRow["targetEditorialStatus"];
} {
  const s = normalizeText(rawStatus);

  if (s.includes("publie")) {
    return { workflowStatus: "published", targetEditorialStatus: "publié" };
  }
  if (s.includes("program")) {
    return { workflowStatus: "scheduled", targetEditorialStatus: "validé" };
  }
  if (s.includes("pret")) {
    return { workflowStatus: "ready", targetEditorialStatus: "à réviser" };
  }
  if (s.includes("autres contenus")) {
    return { workflowStatus: "other", targetEditorialStatus: "en attente" };
  }

  return { workflowStatus: "todo", targetEditorialStatus: "en attente" };
}

function getField(row: Record<string, string>, key: string | undefined): string {
  if (!key) return "";
  return (row[key] ?? "").trim();
}

function buildDedupKey(publicationDateIso: string | null, title: string, rowNumber: number): string {
  const dateKey = publicationDateIso ? publicationDateIso.slice(0, 10) : "no-date";
  const normalizedTitle = normalizeText(title) || `row-${rowNumber}`;
  return `${dateKey}|${normalizedTitle}`;
}

export function parseEditorialPlanningCsv(content: string, year: number): {
  rows: ParsedPlanningRow[];
  totalRows: number;
  skippedRows: number;
} {
  const table = parseCsv(content);
  if (table.length < 2) {
    return { rows: [], totalRows: 0, skippedRows: 0 };
  }

  const headers = table[0].map((h) => stripBom(h.trim()));
  const normalizedHeaderMap = new Map(headers.map((h) => [normalizeKey(h), h]));

  const findHeader = (predicate: (k: string) => boolean): string | undefined => {
    for (const [normalized, original] of Array.from(normalizedHeaderMap.entries())) {
      if (predicate(normalized)) return original;
    }
    return undefined;
  };

  const colMonth = findHeader((k) => k === "mois");
  const colJour = findHeader((k) => k === "jour");
  const colTitle = findHeader((k) => k.includes("titre") && k.includes("sujet"));
  const colKeyword = findHeader((k) => k.includes("motcle"));
  const colBriefUrl = findHeader((k) => k.includes("urlbrief"));
  const colBrief = findHeader((k) => k === "brief");
  const colContent = findHeader((k) => k === "contenu");
  const colStatus = findHeader((k) => k.includes("status"));
  const colUrl = findHeader((k) => k === "url");
  const colTopic = findHeader((k) => k === "theme" || k === "h1");
  const colObjective = findHeader((k) => k === "objectif");

  if (!colJour || !colTitle) {
    return { rows: [], totalRows: table.length - 1, skippedRows: table.length - 1 };
  }

  const dataRows = table.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });

  const parsed: ParsedPlanningRow[] = [];
  let skippedRows = 0;

  dataRows.forEach((raw, idx) => {
    const rowNumber = idx + 2;
    const title = getField(raw, colTitle);
    if (!title) {
      skippedRows += 1;
      return;
    }

    const dayLabel = getField(raw, colJour);
    const publicationDateIso = parsePublicationDate(dayLabel, year);
    const rawStatus = getField(raw, colStatus);
    const statusMapped = mapStatuses(rawStatus);

    parsed.push({
      rowNumber,
      publicationDateIso,
      monthLabel: getField(raw, colMonth),
      dayLabel,
      title,
      primaryKeyword: getField(raw, colKeyword),
      briefUrl: getField(raw, colBriefUrl),
      briefText: getField(raw, colBrief),
      contentSeed: getField(raw, colContent) || title,
      rawStatus,
      sourceUrl: getField(raw, colUrl),
      topic: getField(raw, colTopic),
      objective: getField(raw, colObjective),
      workflowStatus: statusMapped.workflowStatus,
      targetEditorialStatus: statusMapped.targetEditorialStatus,
      dedupKey: buildDedupKey(publicationDateIso, title, rowNumber),
    });
  });

  return {
    rows: parsed,
    totalRows: dataRows.length,
    skippedRows
  };
}
