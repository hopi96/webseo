import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";

type ParsedRow = {
  publicationDateIso: string;
  title: string;
  contentText: string;
  status: string;
};

type DbInsertRow = {
  site_id: number;
  content_type: string;
  content_text: string;
  has_image: boolean;
  image_url: null;
  image_source: null;
  status: string;
  publication_date: string;
};

function parseArgs(argv: string[]): Record<string, string | boolean> {
  const result: Record<string, string | boolean> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      result[key] = true;
      continue;
    }
    result[key] = next;
    i += 1;
  }
  return result;
}

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
      if (char === "\r" && content[i + 1] === "\n") {
        i += 1;
      }
      currentRow.push(currentCell);
      currentCell = "";
      if (currentRow.some((c) => c.trim().length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      continue;
    }

    currentCell += char;
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    if (currentRow.some((c) => c.trim().length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

function getField(row: Record<string, string>, key: string | undefined): string {
  if (!key) return "";
  return (row[key] ?? "").trim();
}

function parsePublicationDate(dayField: string, year: number): string | null {
  const match = dayField.match(/(\d{1,2})\s*\/\s*(\d{1,2})/);
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);

  if (!Number.isInteger(day) || !Number.isInteger(month) || day < 1 || day > 31 || month < 1 || month > 12) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0)).toISOString();
}

function mapStatus(statusRaw: string): string {
  const normalized = normalizeText(statusRaw);

  if (normalized.includes("publie")) return "publié";
  if (normalized.includes("program") || normalized.includes("pret")) return "validé";
  if (normalized.includes("reviser")) return "à réviser";
  if (normalized.includes("valide")) return "validé";

  return "en attente";
}

function buildContentText(params: {
  title: string;
  keyword: string;
  theme: string;
  objective: string;
  brief: string;
  briefUrl: string;
  sourceUrl: string;
}): string {
  const lines: string[] = [];
  lines.push(`Titre: ${params.title}`);
  if (params.keyword) lines.push(`Mot-clé principal: ${params.keyword}`);
  if (params.theme) lines.push(`Thème: ${params.theme}`);
  if (params.objective) lines.push(`Objectif: ${params.objective}`);
  if (params.brief) lines.push(`Brief: ${params.brief}`);
  if (params.briefUrl) lines.push(`URL brief Semrank: ${params.briefUrl}`);
  if (params.sourceUrl) lines.push(`URL: ${params.sourceUrl}`);
  return lines.join("\n");
}

function extractTitleFromContentText(contentText: string): string {
  const lines = contentText.split("\n").map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return "";

  const titleLine = lines.find((line) => line.toLowerCase().startsWith("titre:"));
  if (titleLine) return titleLine.slice(6).trim();

  if (lines[0].startsWith("#")) return lines[0].replace(/^#+\s*/, "").trim();

  return lines[0];
}

function buildDedupKey(publicationDateIso: string, title: string): string {
  return `${publicationDateIso.slice(0, 10)}|${normalizeText(title)}`;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePathArg = typeof args.file === "string" ? args.file : "";
  const siteIdArg = typeof args["site-id"] === "string" ? args["site-id"] : "";
  const yearArg = typeof args.year === "string" ? args.year : "";
  const typeContent = typeof args.type === "string" ? args.type : "blog";
  const dryRun = Boolean(args["dry-run"]);

  if (!filePathArg || !siteIdArg) {
    console.error("Usage: tsx scripts/import-editorial-csv.ts --file <path_csv> --site-id <id> [--year 2026] [--type blog] [--dry-run]");
    process.exit(1);
  }

  const siteId = Number(siteIdArg);
  if (!Number.isInteger(siteId) || siteId <= 0) {
    console.error(`site-id invalide: ${siteIdArg}`);
    process.exit(1);
  }

  const now = new Date();
  const year = yearArg ? Number(yearArg) : now.getFullYear();
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error(`Année invalide: ${yearArg}`);
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePathArg);
  if (!fs.existsSync(resolvedPath)) {
    console.error(`Fichier introuvable: ${resolvedPath}`);
    process.exit(1);
  }

  dotenv.config({ path: path.join(process.cwd(), ".env") });
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Variables manquantes: SUPABASE_URL (ou VITE_SUPABASE_URL) et SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const rawCsv = fs.readFileSync(resolvedPath, "utf8");
  const table = parseCsv(rawCsv);
  if (table.length < 2) {
    console.error("CSV vide ou invalide.");
    process.exit(1);
  }

  const headers = table[0].map((h) => stripBom(h.trim()));
  const normalizedHeaderMap = new Map(headers.map((h) => [normalizeKey(h), h]));

  const findHeader = (predicate: (k: string) => boolean): string | undefined => {
    for (const [normalized, original] of normalizedHeaderMap.entries()) {
      if (predicate(normalized)) return original;
    }
    return undefined;
  };

  const colJour = findHeader((k) => k === "jour");
  const colTheme = findHeader((k) => k.includes("theme"));
  const colObjectif = findHeader((k) => k.includes("objectif"));
  const colTitre = findHeader((k) => k.includes("titre") && k.includes("sujet"));
  const colKeyword = findHeader((k) => k.includes("motcle"));
  const colBriefUrl = findHeader((k) => k.includes("urlbrief"));
  const colBrief = findHeader((k) => k === "brief");
  const colStatus = findHeader((k) => k.includes("status"));
  const colUrl = findHeader((k) => k === "url");

  if (!colJour || !colTitre) {
    console.error("Colonnes requises non trouvées (au minimum 'Jour' et 'Titre de l'article / Sujet').");
    process.exit(1);
  }

  const dataRows = table.slice(1).map((cells) => {
    const row: Record<string, string> = {};
    headers.forEach((header, i) => {
      row[header] = cells[i] ?? "";
    });
    return row;
  });

  const parsedRows: ParsedRow[] = [];
  let skippedNoDate = 0;
  let skippedNoTitle = 0;

  for (const row of dataRows) {
    const dayField = getField(row, colJour);
    const title = getField(row, colTitre);
    const publicationDateIso = parsePublicationDate(dayField, year);

    if (!title) {
      skippedNoTitle += 1;
      continue;
    }
    if (!publicationDateIso) {
      skippedNoDate += 1;
      continue;
    }

    const parsed: ParsedRow = {
      publicationDateIso,
      title,
      status: mapStatus(getField(row, colStatus)),
      contentText: buildContentText({
        title,
        keyword: getField(row, colKeyword),
        theme: getField(row, colTheme),
        objective: getField(row, colObjectif),
        brief: getField(row, colBrief),
        briefUrl: getField(row, colBriefUrl),
        sourceUrl: getField(row, colUrl)
      })
    };

    parsedRows.push(parsed);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const periodStart = `${year}-01-01T00:00:00.000Z`;
  const periodEnd = `${year}-12-31T23:59:59.999Z`;

  const { data: existingRows, error: existingError } = await supabase
    .from("editorial_contents")
    .select("publication_date, content_text")
    .eq("site_id", siteId)
    .gte("publication_date", periodStart)
    .lte("publication_date", periodEnd);

  if (existingError) {
    console.error("Erreur lecture contenus existants:", existingError.message);
    process.exit(1);
  }

  const existingKeys = new Set<string>();
  for (const row of existingRows || []) {
    const title = extractTitleFromContentText(row.content_text || "");
    if (!title || !row.publication_date) continue;
    existingKeys.add(buildDedupKey(row.publication_date, title));
  }

  const seenInBatch = new Set<string>();
  const toInsert: DbInsertRow[] = [];
  let skippedDuplicates = 0;

  for (const row of parsedRows) {
    const key = buildDedupKey(row.publicationDateIso, row.title);
    if (existingKeys.has(key) || seenInBatch.has(key)) {
      skippedDuplicates += 1;
      continue;
    }

    seenInBatch.add(key);
    toInsert.push({
      site_id: siteId,
      content_type: typeContent,
      content_text: row.contentText,
      has_image: false,
      image_url: null,
      image_source: null,
      status: row.status,
      publication_date: row.publicationDateIso
    });
  }

  console.log(`Fichier: ${resolvedPath}`);
  console.log(`Site: ${siteId}`);
  console.log(`Année: ${year}`);
  console.log(`Type contenu: ${typeContent}`);
  console.log(`Lignes CSV lues: ${dataRows.length}`);
  console.log(`Lignes valides: ${parsedRows.length}`);
  console.log(`Ignorées (date invalide): ${skippedNoDate}`);
  console.log(`Ignorées (titre vide): ${skippedNoTitle}`);
  console.log(`Ignorées (doublons): ${skippedDuplicates}`);
  console.log(`À insérer: ${toInsert.length}`);

  if (toInsert.length > 0) {
    console.log("Aperçu (5 premières lignes):");
    toInsert.slice(0, 5).forEach((row, idx) => {
      const firstLine = row.content_text.split("\n")[0];
      console.log(`${idx + 1}. ${row.publication_date.slice(0, 10)} | ${row.status} | ${firstLine}`);
    });
  }

  if (dryRun) {
    console.log("Mode dry-run: aucune insertion effectuée.");
    return;
  }

  if (toInsert.length === 0) {
    console.log("Aucune nouvelle ligne à insérer.");
    return;
  }

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize);
    const { error } = await supabase.from("editorial_contents").insert(batch);
    if (error) {
      console.error(`Erreur insertion batch ${i / batchSize + 1}:`, error.message);
      process.exit(1);
    }
    inserted += batch.length;
    console.log(`Batch ${Math.floor(i / batchSize) + 1}: ${batch.length} lignes insérées.`);
  }

  console.log(`Import terminé: ${inserted} ligne(s) insérée(s).`);
}

main().catch((error) => {
  console.error("Erreur inattendue:", error);
  process.exit(1);
});
