import fs from "fs";
import path from "path";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { parseEditorialPlanningCsv } from "../server/editorial-planning-import";

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

function normalizeUrl(value: string): string {
  return value.trim();
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const filePath = typeof args.file === "string" ? args.file : "";
  const siteIdStr = typeof args["site-id"] === "string" ? args["site-id"] : "";
  const yearStr = typeof args.year === "string" ? args.year : String(new Date().getFullYear());
  const calendarName = typeof args.name === "string" ? args.name : `Import CSV ${new Date().toLocaleString("fr-FR")}`;
  const dryRun = Boolean(args["dry-run"]);
  const contentType = typeof args.type === "string" ? args.type : "blog";

  if (!filePath || !siteIdStr) {
    console.error("Usage: tsx scripts/import-editorial-csv.ts --file <csv> --site-id <id> [--year 2026] [--name \"Semestre 1\"] [--type blog] [--dry-run]");
    process.exit(1);
  }

  const siteId = Number(siteIdStr);
  const year = Number(yearStr);
  if (!Number.isInteger(siteId) || siteId <= 0) {
    console.error(`site-id invalide: ${siteIdStr}`);
    process.exit(1);
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    console.error(`year invalide: ${yearStr}`);
    process.exit(1);
  }

  const resolvedPath = path.resolve(filePath);
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

  const sb = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  const rawCsv = fs.readFileSync(resolvedPath, "utf8");
  const parsed = parseEditorialPlanningCsv(rawCsv, year);

  if (parsed.rows.length === 0) {
    console.log("Aucune ligne exploitable.");
    process.exit(0);
  }

  const sourceUrls = Array.from(new Set(parsed.rows.map((r) => normalizeUrl(r.sourceUrl)).filter((u) => u.length > 0)));
  const dedupKeys = Array.from(new Set(parsed.rows.map((r) => r.dedupKey)));

  const existingUrlSet = new Set<string>();
  if (sourceUrls.length > 0) {
    const { data, error } = await sb
      .from("editorial_calendar_items")
      .select("source_url")
      .eq("site_id", siteId)
      .in("source_url", sourceUrls);
    if (error) throw error;
    (data || []).forEach((r: any) => existingUrlSet.add(normalizeUrl(r.source_url || "")));
  }

  const existingDedupSet = new Set<string>();
  if (dedupKeys.length > 0) {
    const { data, error } = await sb
      .from("editorial_calendar_items")
      .select("dedup_key")
      .eq("site_id", siteId)
      .in("dedup_key", dedupKeys);
    if (error) throw error;
    (data || []).forEach((r: any) => existingDedupSet.add(r.dedup_key));
  }

  const inFileUrlSet = new Set<string>();
  const inFileDedupSet = new Set<string>();
  const rowsToImport = parsed.rows.filter((row) => {
    const sourceUrl = normalizeUrl(row.sourceUrl);
    const duplicateFromUrl = sourceUrl ? existingUrlSet.has(sourceUrl) || inFileUrlSet.has(sourceUrl) : false;
    const duplicateFromDedup = existingDedupSet.has(row.dedupKey) || inFileDedupSet.has(row.dedupKey);
    if (duplicateFromUrl || duplicateFromDedup) return false;
    if (sourceUrl) inFileUrlSet.add(sourceUrl);
    inFileDedupSet.add(row.dedupKey);
    return true;
  });

  const publicationDates = rowsToImport
    .map((r) => r.publicationDateIso)
    .filter((d): d is string => Boolean(d))
    .sort();
  const periodStart = publicationDates.length ? publicationDates[0].slice(0, 10) : null;
  const periodEnd = publicationDates.length ? publicationDates[publicationDates.length - 1].slice(0, 10) : null;

  console.log(`Fichier: ${resolvedPath}`);
  console.log(`site_id: ${siteId}`);
  console.log(`Lignes CSV: ${parsed.totalRows}`);
  console.log(`Lignes valides: ${parsed.rows.length}`);
  console.log(`Lignes ignorées: ${parsed.skippedRows}`);
  console.log(`Lignes à importer: ${rowsToImport.length}`);
  console.log(`Période: ${periodStart || "N/A"} -> ${periodEnd || "N/A"}`);
  console.log("Aperçu:");
  rowsToImport.slice(0, 5).forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.publicationDateIso?.slice(0, 10) || "N/A"} | ${row.title} | ${row.primaryKeyword}`);
  });

  if (dryRun) {
    console.log("Dry-run: aucune insertion.");
    return;
  }

  const { data: calendar, error: calendarError } = await sb
    .from("editorial_calendars")
    .insert({
      site_id: siteId,
      name: calendarName,
      period_start: periodStart,
      period_end: periodEnd,
      source_type: "csv",
      source_file_name: path.basename(resolvedPath),
      total_rows: rowsToImport.length
    })
    .select("id")
    .single();

  if (calendarError) throw calendarError;

  if (rowsToImport.length > 0) {
    const payload = rowsToImport.map((row) => ({
      calendar_id: calendar.id,
      site_id: siteId,
      row_number: row.rowNumber,
      publication_date: row.publicationDateIso,
      month_label: row.monthLabel || null,
      day_label: row.dayLabel || null,
      title: row.title,
      primary_keyword: row.primaryKeyword || null,
      brief_url: row.briefUrl || null,
      brief_text: row.briefText || null,
      content_seed: row.contentSeed || row.title,
      raw_status: row.rawStatus || null,
      workflow_status: row.workflowStatus,
      target_editorial_status: row.targetEditorialStatus,
      source_url: row.sourceUrl || null,
      topic: row.topic || null,
      objective: row.objective || null,
      content_type: contentType,
      dedup_key: row.dedupKey
    }));

    const BATCH_SIZE = 200;
    for (let i = 0; i < payload.length; i += BATCH_SIZE) {
      const batch = payload.slice(i, i + BATCH_SIZE);
      const { error } = await sb.from("editorial_calendar_items").insert(batch);
      if (error) throw error;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} ligne(s) insérée(s)`);
    }
  }

  console.log(`Import terminé. calendar_id=${calendar.id}`);
}

main().catch((err) => {
  console.error("Erreur import:", err?.message || err);
  process.exit(1);
});
