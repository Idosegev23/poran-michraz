# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Hebrew (RTL) web app for Poran Shrem that analyzes Israeli tender documents (מכרזים). Users upload PDF/Word files, Claude extracts ~30 structured fields (deadlines, bonds, eligibility, fees, red flags, Go/No-Go recommendation), and results are shown in a table, exportable to PDF/Excel, shareable via link, and stored as history. All UI text, prompts, and error messages are in Hebrew; the app root is `<html lang="he" dir="rtl">`.

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # next build --webpack — the --webpack flag is required (webpack externals in next.config.ts handle puppeteer/chromium/nodemailer)
npm run lint     # eslint
```

There are no tests. Deployed on Vercel (project `poran-michraz`); `vercel.json` sets per-route `maxDuration` (800s for analyze — the Pro-plan max, needed because Opus 5 thinks by default; 120s for export-pdf) and memory.

Required env vars (`.env.local`): `ANTHROPIC_API_KEY`, `BLOB_READ_WRITE_TOKEN`, and optionally `GMAIL_USER` / `GMAIL_APP_PASSWORD` / `ALERT_EMAIL` for error alert emails.

## Architecture

### Analysis pipeline (the core flow)

1. **Client-side Blob upload** — [FileUpload.tsx](src/components/FileUpload.tsx) uploads files directly to Vercel Blob via `upload()` from `@vercel/blob/client`, tokenized by [upload-token/route.ts](src/app/api/upload-token/route.ts). This bypasses Vercel's 4.5MB function payload limit (files up to 50MB). It then POSTs the blob URLs as JSON to `/api/analyze`. (A legacy multipart/form-data path still exists in the analyze route.)
2. **SSE streaming + polling recovery** — [analyze/route.ts](src/app/api/analyze/route.ts) responds with a Server-Sent-Events stream (`start` with the analysis id, `progress`, `heartbeat` every 3s, then a single `result` or `error` event). Analyses run 5+ minutes, so the stream is hardened against proxy buffering/idle timeouts (padding comment on open, `X-Accel-Buffering: no`, 200ms flush pause before close). Delivery does NOT depend on the stream surviving: the result is saved to `history/{id}.json` *before* the `result` event is sent, and if the stream dies the client polls `/api/history/{id}` (up to 14 min from analysis start) before showing an error — the Vercel function keeps running after a client disconnect. The client-side SSE parser in FileUpload.tsx must handle events chunked across reads. Source blobs are deleted after analysis.
3. **Parsing** — [parseDocument.ts](src/lib/parseDocument.ts): `pdf-parse` (imported via `pdf-parse/lib/pdf-parse.js` to dodge its test-file loading bug) for PDFs, `mammoth` for Word. Multiple files are concatenated with `===== מסמך: name =====` separators.
4. **Claude analysis** — [claudeAnalyzer.ts](src/lib/claudeAnalyzer.ts) is the heart of the app: a large Hebrew system+user prompt instructing extraction of every field as a **flat JSON of string-only values**. Documents are truncated at 800K chars. Uses the streaming API (`client.messages.stream`) to avoid long-request timeouts. After the response it runs, in order: Hebrew gershayim preprocessing, three-stage JSON parsing (raw → brace-extract → character-level repair that escapes unescaped inner quotes), day-of-week correction against Asia/Jerusalem (`fixDatesInIsraelTimezone`), and critical-field validation (log warnings only).
5. **Persistence** — the result is saved (awaited, before the `result` event) to Vercel Blob at `history/{id}.json`. Vercel Blob is the *only* datastore: `history/` and `shares/` JSON blobs, listed/fetched by the `history` and `share` API routes. There is no database.

### The Hebrew-quotes problem

Hebrew abbreviations (ש"ח, מע"מ, שכ"ט) contain `"` which breaks JSON. This is handled in three layers: the prompt tells Claude to use U+05F4 (״), a preprocessing pass converts known abbreviations and any `hebrew"hebrew` pattern, and the repair parser escapes surviving quotes. Keep all three in sync when touching prompt or parsing code.

### Adding/changing an analysis field

Requires coordinated edits in: the JSON field spec in the `USER_PROMPT` of [claudeAnalyzer.ts](src/lib/claudeAnalyzer.ts), the `TenderAnalysis` interface and `FIELD_LABELS`/`DATE_LABELS` in [types.ts](src/lib/types.ts), and the renderers — [ResultsTable.tsx](src/components/ResultsTable.tsx), [export-pdf/route.ts](src/app/api/export-pdf/route.ts) (which slices `FIELD_LABELS` entries by index into sections, so field *order* matters), and [ExportButtons.tsx](src/components/ExportButtons.tsx) (Excel via exceljs). All field values must remain plain strings (except the nested `relevantDates` object).

### PDF export

[export-pdf/route.ts](src/app/api/export-pdf/route.ts) builds an HTML report and renders it with [pdf.ts](src/lib/pdf.ts): puppeteer-core + `@sparticuz/chromium` on Vercel, local Chrome at hardcoded platform paths in dev. These packages are declared in `serverExternalPackages` and webpack externals in [next.config.ts](next.config.ts) — don't import them in client code.

### Pages

- `/` — upload + results ([page.tsx](src/app/page.tsx))
- `/history` — list of past analyses from Blob
- `/compare` — side-by-side comparison of selected history items
- `/analysis/shared?id=...` — read-only shared view (resolves id against share then history endpoints)

### Error alerting

Server errors in the analyze route trigger a fire-and-forget Hebrew HTML email via [alertEmail.ts](src/lib/alertEmail.ts) (nodemailer + Gmail, loaded with dynamic `require` for Vercel compatibility). It silently no-ops if the Gmail env vars are unset — never let it block or crash the main flow.
