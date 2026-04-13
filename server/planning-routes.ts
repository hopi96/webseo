import { Router, Request, Response } from "express";
import multer from "multer";
import { getSupabaseAdmin } from "./supabase-service";
import { parseEditorialPlanningCsv } from "./editorial-planning-import";
import { contentGeneratorService } from "./content-generator-service";

const router = Router();

const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isCsv =
      file.mimetype.includes("csv") ||
      file.originalname.toLowerCase().endsWith(".csv") ||
      file.mimetype === "application/vnd.ms-excel";
    if (!isCsv) return cb(new Error("Le fichier doit etre un CSV."));
    cb(null, true);
  }
});

function normalizeUrl(value: string): string {
  return value.trim();
}

function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function parseMonthInt(month: string | undefined): number | null {
  if (!month) return null;
  const parsed = Number(month);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 12) return null;
  return parsed;
}

function buildDedupKey(publicationDateIso: string | null, title: string, fallbackId: number): string {
  const dateKey = publicationDateIso ? publicationDateIso.slice(0, 10) : "no-date";
  const titleKey = normalizeText(title) || `item-${fallbackId}`;
  return `${dateKey}|${titleKey}`;
}

function parseDateInputToIso(dateValue: string | null | undefined): string | null {
  if (!dateValue) return null;
  const trimmed = String(dateValue).trim();
  if (!trimmed) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return new Date(`${trimmed}T00:00:00.000Z`).toISOString();
  }
  const d = new Date(trimmed);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

const CONTENT_TYPE_ALLOWED = new Set([
  "newsletter", "tiktok", "instagram", "xtwitter", "youtube",
  "facebook", "linkedin", "blog", "google my business", "pinterest"
]);

const WORKFLOW_STATUS_ALLOWED = new Set(["todo", "ready", "scheduled", "published", "other"]);

const TARGET_EDITORIAL_STATUS_MAP: Record<string, string> = {
  "en attente": "en attente",
  "a reviser": "\u00E0 r\u00E9viser",
  "valide": "valid\u00E9",
  "publie": "publi\u00E9",
};

function normalizeTargetEditorialStatus(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = normalizeText(value);
  return TARGET_EDITORIAL_STATUS_MAP[normalized] || null;
}

function inferWorkflowStatusFromTargetStatus(targetStatus: string | null | undefined): "published" | "scheduled" {
  const normalizedTarget = normalizeTargetEditorialStatus(targetStatus || "");
  return normalizedTarget === "publi\u00E9" ? "published" : "scheduled";
}

async function createContentFromPlanningItem(itemId: number, dryRun: boolean) {
  const sb = getSupabaseAdmin();
  const { data: item, error: itemError } = await sb
    .from("editorial_calendar_items")
    .select(`
      id, site_id, publication_date, title, content_seed, primary_keyword,
      brief_url, brief_text, source_url, topic, objective,
      content_type, target_editorial_status, workflow_status
    `)
    .eq("id", itemId)
    .single();

  if (itemError) throw itemError;
  if (!item) {
    const notFound = new Error("Ligne planning introuvable.");
    (notFound as any).statusCode = 404;
    throw notFound;
  }

  const { data: existingContent, error: existingError } = await sb
    .from("editorial_contents")
    .select("id, site_id, content_type, status, publication_date")
    .eq("source_calendar_item_id", itemId)
    .maybeSingle();

  if (existingError) throw existingError;
  if (existingContent) {
    return { success: true, created: false, itemId, content: existingContent };
  }

  const publicationDate = item.publication_date || new Date().toISOString();
  const platform = String(item.content_type || "blog").toLowerCase();
  const theme = String(item.title || "").trim() || String(item.content_seed || "").trim();
  if (!theme) {
    const badInput = new Error("Ligne planning sans titre exploitable.");
    (badInput as any).statusCode = 400;
    throw badInput;
  }

  const context = [
    `Titre de reference: ${item.title || "-"}`,
    item.primary_keyword ? `Mot-cle principal: ${item.primary_keyword}` : "",
    item.topic ? `Theme: ${item.topic}` : "",
    item.objective ? `Objectif: ${item.objective}` : "",
    item.brief_text ? `Brief editorial a suivre:\n${item.brief_text}` : "",
    item.brief_url ? `URL brief: ${item.brief_url}` : "",
    item.source_url ? `URL source: ${item.source_url}` : "",
    item.content_seed ? `Contenu seed: ${item.content_seed}` : ""
  ].filter(Boolean).join("\n\n");

  if (dryRun) {
    return {
      success: true,
      dryRun: true,
      created: false,
      itemId,
      generation: {
        siteId: item.site_id,
        platform,
        theme,
        publicationDate,
        contextPreview: context.slice(0, 1200)
      }
    };
  }

  // Goes through ContentGeneratorService to apply prompt system for blog/site.
  const generated = await contentGeneratorService.generateContent({
    siteId: item.site_id,
    platform,
    theme,
    context,
    publicationDate
  });

  if (!generated.id) {
    throw new Error("Generation IA terminee sans identifiant de contenu.");
  }

  const finalEditorialStatus = normalizeTargetEditorialStatus(item.target_editorial_status) || "en attente";
  const { data: content, error: contentUpdateError } = await sb
    .from("editorial_contents")
    .update({
      source_calendar_item_id: item.id,
      status: finalEditorialStatus
    })
    .eq("id", generated.id)
    .select("id, site_id, content_type, status, publication_date")
    .single();

  if (contentUpdateError) throw contentUpdateError;

  const nextWorkflowStatus = inferWorkflowStatusFromTargetStatus(finalEditorialStatus);
  const { error: workflowError } = await sb
    .from("editorial_calendar_items")
    .update({ workflow_status: nextWorkflowStatus })
    .eq("id", item.id);

  if (workflowError) throw workflowError;

  return { success: true, created: true, itemId, content };
}

async function fetchExistingValuesInChunks<T extends string>(options: {
  table: string;
  selectColumn: string;
  filterColumn: string;
  siteId: number;
  values: T[];
  chunkSize?: number;
}): Promise<Set<string>> {
  const { table, selectColumn, filterColumn, siteId, values, chunkSize = 25 } = options;
  const sb = getSupabaseAdmin();
  const found = new Set<string>();
  if (values.length === 0) return found;

  for (let i = 0; i < values.length; i += chunkSize) {
    const chunk = values.slice(i, i + chunkSize);
    const { data, error } = await sb
      .from(table)
      .select(selectColumn)
      .eq("site_id", siteId)
      .in(filterColumn, chunk);

    if (error) throw error;

    for (const row of data || []) {
      const value = String((row as any)[selectColumn] || "").trim();
      if (value) found.add(value);
    }
  }

  return found;
}

router.get("/calendars", async (req: Request, res: Response) => {
  try {
    const siteId = Number(req.query.siteId);
    if (!Number.isInteger(siteId) || siteId <= 0) {
      return res.status(400).json({ message: "siteId est requis." });
    }

    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("editorial_calendars")
      .select("id, name, period_start, period_end, source_type, source_file_name, total_rows, created_at")
      .eq("site_id", siteId)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) throw error;
    res.json(data || []);
  } catch (error: any) {
    console.error("❌ Erreur GET /api/planning/calendars:", error);
    if (String(error?.message || "").includes("editorial_calendars")) {
      return res.status(500).json({
        message: "Table de planning absente. Appliquez la migration 010_add_editorial_planning.sql"
      });
    }
    res.status(500).json({ message: error.message || "Impossible de recuperer les calendriers" });
  }
});

router.get("/items", async (req: Request, res: Response) => {
  try {
    const siteId = Number(req.query.siteId);
    const calendarId = req.query.calendarId ? Number(req.query.calendarId) : null;
    const workflowStatus = String(req.query.workflowStatus || "").trim();
    const month = parseMonthInt(String(req.query.month || ""));
    const search = String(req.query.search || "").toLowerCase().trim();
    const limit = Math.min(Math.max(Number(req.query.limit || 500), 1), 2000);

    if (!Number.isInteger(siteId) || siteId <= 0) {
      return res.status(400).json({ message: "siteId est requis." });
    }

    const sb = getSupabaseAdmin();
    let query = sb
      .from("editorial_calendar_items")
      .select(`
        id, calendar_id, row_number, publication_date, month_label, day_label,
        title, primary_keyword, brief_url, brief_text, content_seed,
        raw_status, workflow_status, target_editorial_status, source_url,
        topic, objective, content_type, created_at
      `)
      .eq("site_id", siteId)
      .order("publication_date", { ascending: true })
      .limit(limit);

    if (Number.isInteger(calendarId) && (calendarId as number) > 0) {
      query = query.eq("calendar_id", calendarId as number);
    }
    if (workflowStatus) {
      query = query.eq("workflow_status", workflowStatus);
    }

    const { data, error } = await query;
    if (error) throw error;

    const filtered = (data || []).filter((item: any) => {
      if (month && item.publication_date) {
        const d = new Date(item.publication_date);
        if (Number.isNaN(d.getTime()) || d.getUTCMonth() + 1 !== month) return false;
      }

      if (search) {
        const haystack = [
          item.title,
          item.primary_keyword,
          item.content_seed,
          item.source_url,
          item.raw_status,
          item.brief_text
        ].join(" ").toLowerCase();
        if (!haystack.includes(search)) return false;
      }

      return true;
    });

    // Fetch which items already have editorial content created
    const itemIds = filtered.map((item: any) => item.id);
    const contentExistsSet = new Set<number>();
    if (itemIds.length > 0) {
      // Query in chunks of 50 to avoid URL length issues
      for (let i = 0; i < itemIds.length; i += 50) {
        const chunk = itemIds.slice(i, i + 50);
        const { data: existingContents, error: existingContentsError } = await sb
          .from("editorial_contents")
          .select("source_calendar_item_id")
          .in("source_calendar_item_id", chunk);
        if (existingContentsError) throw existingContentsError;
        if (existingContents) {
          for (const row of existingContents) {
            if (row.source_calendar_item_id) {
              contentExistsSet.add(row.source_calendar_item_id);
            }
          }
        }
      }
    }

    const enriched = filtered.map((item: any) => ({
      ...item,
      has_content: contentExistsSet.has(item.id)
    }));

    res.json(enriched);
  } catch (error: any) {
    console.error("❌ Erreur GET /api/planning/items:", error);
    if (String(error?.message || "").includes("editorial_calendar_items")) {
      return res.status(500).json({
        message: "Table de planning absente. Appliquez la migration 010_add_editorial_planning.sql"
      });
    }
    res.status(500).json({ message: error.message || "Impossible de recuperer les lignes de planning" });
  }
});

router.post("/import", async (req: Request, res: Response) => {
  csvUpload.single("file")(req, res, async (uploadErr: any) => {
    try {
      const reqAny = req as any;
      if (uploadErr) {
        return res.status(400).json({ message: uploadErr.message || "Erreur upload fichier" });
      }

      const siteId = Number(req.body.siteId);
      const year = req.body.year ? Number(req.body.year) : new Date().getFullYear();
      const dryRun = req.body.dryRun === true || req.body.dryRun === "true";
      const contentType = String(req.body.contentType || "blog");
      const calendarNameRaw = String(req.body.calendarName || "").trim();

      if (!Number.isInteger(siteId) || siteId <= 0) {
        return res.status(400).json({ message: "siteId est requis." });
      }
      if (!Number.isInteger(year) || year < 2000 || year > 2100) {
        return res.status(400).json({ message: "Annee invalide." });
      }
      if (!reqAny.file || !reqAny.file.buffer) {
        return res.status(400).json({ message: "Fichier CSV manquant." });
      }

      const csvContent = reqAny.file.buffer.toString("utf8");
      const parsed = parseEditorialPlanningCsv(csvContent, year);

      if (parsed.rows.length === 0) {
        return res.status(400).json({
          message: "Aucune ligne exploitable trouvee dans le CSV.",
          details: { totalRows: parsed.totalRows, skippedRows: parsed.skippedRows }
        });
      }

      const sb = getSupabaseAdmin();
      const sourceUrls = Array.from(
        new Set(parsed.rows.map((r) => normalizeUrl(r.sourceUrl)).filter((u) => u.length > 0))
      );
      const dedupKeys = Array.from(new Set(parsed.rows.map((r) => r.dedupKey)));

      const existingUrlSet = await fetchExistingValuesInChunks({
        table: "editorial_calendar_items",
        selectColumn: "source_url",
        filterColumn: "source_url",
        siteId,
        values: sourceUrls,
        chunkSize: 20
      });

      const existingDedupSet = await fetchExistingValuesInChunks({
        table: "editorial_calendar_items",
        selectColumn: "dedup_key",
        filterColumn: "dedup_key",
        siteId,
        values: dedupKeys,
        chunkSize: 60
      });

      const inFileUrlSet = new Set<string>();
      const inFileDedupSet = new Set<string>();
      const validRows: typeof parsed.rows = [];
      let duplicates = 0;

      for (const row of parsed.rows) {
        const sourceUrl = normalizeUrl(row.sourceUrl);
        const duplicateFromUrl = sourceUrl
          ? existingUrlSet.has(sourceUrl) || inFileUrlSet.has(sourceUrl)
          : false;
        const duplicateFromDedup = existingDedupSet.has(row.dedupKey) || inFileDedupSet.has(row.dedupKey);

        if (duplicateFromUrl || duplicateFromDedup) {
          duplicates += 1;
          continue;
        }

        if (sourceUrl) inFileUrlSet.add(sourceUrl);
        inFileDedupSet.add(row.dedupKey);
        validRows.push(row);
      }

      const preview = validRows.slice(0, 12).map((row) => ({
        rowNumber: row.rowNumber,
        publicationDate: row.publicationDateIso ? row.publicationDateIso.slice(0, 10) : null,
        title: row.title,
        keyword: row.primaryKeyword,
        workflowStatus: row.workflowStatus,
        targetEditorialStatus: row.targetEditorialStatus,
        sourceUrl: row.sourceUrl || null
      }));

      const publicationDates = validRows
        .map((r) => r.publicationDateIso)
        .filter((d): d is string => Boolean(d))
        .sort();
      const periodStart = publicationDates.length > 0 ? publicationDates[0].slice(0, 10) : null;
      const periodEnd = publicationDates.length > 0 ? publicationDates[publicationDates.length - 1].slice(0, 10) : null;

      if (dryRun) {
        return res.json({
          success: true,
          dryRun: true,
          totalRows: parsed.totalRows,
          parsedRows: parsed.rows.length,
          skippedRows: parsed.skippedRows,
          duplicateRows: duplicates,
          rowsToImport: validRows.length,
          periodStart,
          periodEnd,
          preview
        });
      }

      if (validRows.length === 0) {
        return res.json({
          success: true,
          dryRun: false,
          totalRows: parsed.totalRows,
          parsedRows: parsed.rows.length,
          skippedRows: parsed.skippedRows,
          duplicateRows: duplicates,
          rowsImported: 0,
          calendar: null,
          message: "Aucune nouvelle ligne a importer (toutes les lignes sont deja presentes)."
        });
      }

      const inferredCalendarName = calendarNameRaw || `Import CSV ${new Date().toLocaleString("fr-FR")}`;
      const { data: calendar, error: calendarError } = await sb
        .from("editorial_calendars")
        .insert({
          site_id: siteId,
          name: inferredCalendarName,
          period_start: periodStart,
          period_end: periodEnd,
          source_type: "csv",
          source_file_name: reqAny.file.originalname || null,
          total_rows: validRows.length
        })
        .select("id, name, period_start, period_end, total_rows, source_file_name, created_at")
        .single();

      if (calendarError) throw calendarError;

      const rowsToInsert = validRows.map((row) => ({
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
      for (let i = 0; i < rowsToInsert.length; i += BATCH_SIZE) {
        const batch = rowsToInsert.slice(i, i + BATCH_SIZE);
        const { error: insertError } = await sb.from("editorial_calendar_items").insert(batch);
        if (insertError) throw insertError;
      }

      res.status(201).json({
        success: true,
        dryRun: false,
        totalRows: parsed.totalRows,
        parsedRows: parsed.rows.length,
        skippedRows: parsed.skippedRows,
        duplicateRows: duplicates,
        rowsImported: validRows.length,
        calendar
      });
    } catch (error: any) {
      console.error("❌ Erreur POST /api/planning/import:", error);
      if (String(error?.message || "").includes("editorial_calendar")) {
        return res.status(500).json({
          message: "Tables planning absentes. Appliquez la migration 010_add_editorial_planning.sql"
        });
      }
      res.status(500).json({ message: error.message || "Impossible d'importer le planning CSV" });
    }
  });
});

router.put("/items/:id", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ message: "ID de ligne invalide." });
    }

    const sb = getSupabaseAdmin();
    const { data: current, error: currentError } = await sb
      .from("editorial_calendar_items")
      .select("id, site_id, publication_date, title")
      .eq("id", itemId)
      .single();

    if (currentError) throw currentError;
    if (!current) return res.status(404).json({ message: "Ligne planning introuvable." });

    const body: any = req.body || {};
    const fieldsToUpdate: Record<string, any> = {};

    const nullableTextFields = [
      "month_label", "day_label", "primary_keyword", "brief_url", "brief_text",
      "content_seed", "raw_status", "source_url", "topic", "objective"
    ];

    for (const field of nullableTextFields) {
      if (body[field] !== undefined) {
        const value = String(body[field] ?? "").trim();
        fieldsToUpdate[field] = value.length > 0 ? value : null;
      }
    }

    if (body.title !== undefined) {
      const title = String(body.title || "").trim();
      if (!title) return res.status(400).json({ message: "Le titre est obligatoire." });
      fieldsToUpdate.title = title;
    }

    if (body.content_type !== undefined) {
      const ct = String(body.content_type || "").trim().toLowerCase();
      if (!CONTENT_TYPE_ALLOWED.has(ct)) return res.status(400).json({ message: "content_type invalide." });
      fieldsToUpdate.content_type = ct;
    }

    if (body.workflow_status !== undefined) {
      const value = String(body.workflow_status || "").trim();
      if (!WORKFLOW_STATUS_ALLOWED.has(value)) return res.status(400).json({ message: "workflow_status invalide." });
      fieldsToUpdate.workflow_status = value;
    }

    if (body.target_editorial_status !== undefined) {
      const finalValue = normalizeTargetEditorialStatus(String(body.target_editorial_status || "").trim());
      if (!finalValue) return res.status(400).json({ message: "target_editorial_status invalide." });
      fieldsToUpdate.target_editorial_status = finalValue;
    }

    if (body.publication_date !== undefined) {
      fieldsToUpdate.publication_date = parseDateInputToIso(body.publication_date);
    }

    const nextTitle = fieldsToUpdate.title ?? current.title;
    const nextPublicationDate = fieldsToUpdate.publication_date !== undefined
      ? fieldsToUpdate.publication_date
      : current.publication_date;
    fieldsToUpdate.dedup_key = buildDedupKey(nextPublicationDate, nextTitle, itemId);

    const { data: updated, error: updateError } = await sb
      .from("editorial_calendar_items")
      .update(fieldsToUpdate)
      .eq("id", itemId)
      .select(`
        id, calendar_id, row_number, publication_date, month_label, day_label,
        title, primary_keyword, brief_url, brief_text, content_seed,
        raw_status, workflow_status, target_editorial_status, source_url,
        topic, objective, content_type, created_at
      `)
      .single();

    if (updateError) {
      if (updateError.code === "23505") {
        return res.status(409).json({
          message: "Conflit de doublon (URL ou cle dedup deja existante)."
        });
      }
      throw updateError;
    }

    res.json({ success: true, item: updated });
  } catch (error: any) {
    console.error("Erreur PUT /api/planning/items/:id:", error);
    res.status(500).json({ message: error.message || "Impossible de modifier la ligne planning" });
  }
});

router.delete("/items/:id", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ message: "ID de ligne invalide." });
    }

    const sb = getSupabaseAdmin();
    const { data: existing, error: checkError } = await sb
      .from("editorial_calendar_items")
      .select("id")
      .eq("id", itemId)
      .maybeSingle();

    if (checkError) throw checkError;
    if (!existing) return res.status(404).json({ message: "Ligne planning introuvable." });

    const { error: deleteError } = await sb
      .from("editorial_calendar_items")
      .delete()
      .eq("id", itemId);

    if (deleteError) throw deleteError;

    res.json({ success: true, deleted: true, id: itemId });
  } catch (error: any) {
    console.error("Erreur DELETE /api/planning/items/:id:", error);
    res.status(500).json({ message: error.message || "Impossible de supprimer la ligne planning" });
  }
});

router.post("/items/delete-batch", async (req: Request, res: Response) => {
  try {
    const idsRaw = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const ids = Array.from(
      new Set(
        idsRaw
          .map((value: any) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      )
    );

    if (ids.length === 0) {
      return res.status(400).json({ message: "Aucune ligne selectionnee." });
    }

    const sb = getSupabaseAdmin();
    const chunkSize = 100;
    for (let i = 0; i < ids.length; i += chunkSize) {
      const chunk = ids.slice(i, i + chunkSize);
      const { error: deleteError } = await sb
        .from("editorial_calendar_items")
        .delete()
        .in("id", chunk);

      if (deleteError) throw deleteError;
    }

    res.json({ success: true, deletedCount: ids.length, ids });
  } catch (error: any) {
    console.error("Erreur POST /api/planning/items/delete-batch:", error);
    res.status(500).json({ message: error.message || "Impossible de supprimer les lignes selectionnees" });
  }
});

router.post("/items/:id/create-content", async (req: Request, res: Response) => {
  try {
    const itemId = Number(req.params.id);
    if (!Number.isInteger(itemId) || itemId <= 0) {
      return res.status(400).json({ message: "ID de ligne invalide." });
    }

    const isDryRun = req.body?.dryRun === true || req.body?.dryRun === "true";
    const result = await createContentFromPlanningItem(itemId, isDryRun);
    const statusCode = result.created ? 201 : 200;
    res.status(statusCode).json(result);
  } catch (error: any) {
    console.error("Erreur POST /api/planning/items/:id/create-content:", error);
    const statusCode = Number(error?.statusCode) || 500;
    res.status(statusCode).json({ message: error.message || "Impossible de creer le contenu depuis la ligne planning" });
  }
});

router.post("/items/create-content-batch", async (req: Request, res: Response) => {
  try {
    const idsRaw = Array.isArray(req.body?.ids) ? req.body.ids : [];
    const ids = Array.from(
      new Set(
        idsRaw
          .map((value: any) => Number(value))
          .filter((value: number) => Number.isInteger(value) && value > 0)
      )
    );

    if (ids.length === 0) {
      return res.status(400).json({ message: "Aucune ligne selectionnee." });
    }
    if (ids.length > 100) {
      return res.status(400).json({ message: "Limite depassee: 100 lignes max par lot." });
    }

    const isDryRun = req.body?.dryRun === true || req.body?.dryRun === "true";
    const results: Array<{
      id: number;
      success: boolean;
      created: boolean;
      content?: any;
      dryRun?: boolean;
      generation?: any;
      error?: string;
    }> = [];

    let createdCount = 0;
    let existingCount = 0;
    let failedCount = 0;

    for (const id of ids) {
      try {
        const result = await createContentFromPlanningItem(id, isDryRun);
        if (result.created) createdCount += 1;
        else existingCount += 1;
        results.push({
          id,
          success: true,
          created: Boolean(result.created),
          content: (result as any).content,
          dryRun: (result as any).dryRun,
          generation: (result as any).generation
        });
      } catch (error: any) {
        failedCount += 1;
        results.push({
          id,
          success: false,
          created: false,
          error: error?.message || "Erreur inconnue"
        });
      }
    }

    res.json({
      success: failedCount === 0,
      dryRun: isDryRun,
      total: ids.length,
      created: createdCount,
      existing: existingCount,
      failed: failedCount,
      results
    });
  } catch (error: any) {
    console.error("Erreur POST /api/planning/items/create-content-batch:", error);
    res.status(500).json({ message: error.message || "Impossible de creer les contenus en lot" });
  }
});

export default router;


