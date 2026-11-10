# agent.md — pdf-ep

Guide for any AI agent (or human) continuing work on **pdf-ep**, a single-page, browser-only PDF editor and JPEG/JFIF-to-PDF tool.

- **Repo files:** `index.html` (the whole app), `README.md`, `agent.md`, and icon files: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` (yellow circle with a dark “p”, matching the header logo; keep all in the repo root)
- **Hosting:** GitHub Pages (root of `main`). The older Claude artifact is https://claude.ai/artifact/Q6rkHeQVdmL2xzNHotqfx6
- **Source file:** `index.html` (previously `index.html`)
- **Status:** everything below was built iteratively and **never tested in a real browser by the agent**. Treat all behavior as unverified until the owner confirms it.

---

## 1. What the product does today

| Feature | Notes |
|---|---|
| Add PDFs and JPEG/JFIF images | Click the yellow circle (home), or the dashed **pdf · jpg** square tile after the last page (Grid view, and the left thumbnail grid in Document view); drag files onto the circle or the tile |
| Merge | Every PDF page and image becomes a page card; all are exported in one PDF |
| Reorder | Drag the ⠿ handle (pointer events, works on touch) |
| Delete / rotate / blank page | Per-card buttons; dashed **blank** square tile after the last page adds a blank page |
| Views | **Grid** (thumbnails) and **Document view** (large portrait pages stacked, like Word). Document view has a **left thumbnail grid** (`#side`, sticky): drag its ⠿ handle to reorder, click a thumbnail to jump to that page, the current page is outlined |
| Whiteout | **Whiteout** button (header) turns on a mode in Document view: drag on a page to draw a rectangle that covers an area with white (watermarks, dirt on white areas). × on a rectangle removes it. Cover only: on export a white box is drawn over the PDF page (original content stays underneath, so it is not secure redaction); on JPEG pages the box is burned into the pixels |
| Image page size | Page fits image / A4 / Legal 8.5 × 13 in, plus 9-position placement for A4/Legal |
| Download | **Download PDF** (all pages → `edited.pdf`) |
| New | **New** button (far right of the header) clears all pages and returns to the yellow-circle home screen. If there are unsaved changes (`sig()` differs from `savedSig`, set after a successful download/split) the first click turns the button into “Discard pages?” for 4 s and a second click confirms. No `confirm()` dialog (may be blocked in the sandbox) |
| Word (.docx) | **Word** button (header) opens a panel: mode select, optional page range (same syntax as Custom split), **Download Word** → `converted.docx`. **Editable text** is offered only when pages have a real text layer (`pdfHasText`, ≥ 8 characters); scanned/JPEG pages are placed as images in the same file; blank pages stay blank. If no page has text, only **Pages as images** is available. See section 6 |
| Custom split | Ranges like `1-2, 3, 4, 5-6` → one PDF per range, bundled as `split-pdfs.zip` (single range → plain PDF) |

PDF pages keep their original size; the size/placement options apply to images only.

## 2. Constraints

On GitHub Pages the only real limit is keeping it a single self-contained file. The rules below also keep it working as a Claude artifact.

- **One self-contained `.html` file.** No remote images, no `fetch` to other sites.
- **External scripts only from** `cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, `code.jquery.com`. External CSS only from Google Fonts. Pin **exact versions** at least 14 days old. Scripts only, so libraries must work as a plain `<script>` (UMD).
- **Downloads go through `saveFile(filename, blob)`** in `index.html`: it uses the Claude `downloads` capability when `window.claude` exists (artifact), otherwise a normal `<a download>` blob link (GitHub Pages). Never call `dl.save` directly.
- *(Artifact-only notes)* the `downloads` capability:`const dl = await claude.use('downloads'); await dl.save({filename, data})`. The viewer sees a confirmation. Allowed extensions include `pdf zip docx pptx xlsx csv txt json md html svg png jpg`. It is declared with `capabilities: {downloads: true}` when publishing (omitting `capabilities` on republish keeps it).
- **No `window.storage`, no Claude API calls** (they do not exist on published pages). Browser storage works but is per-viewer and optional.
- **Typography:** use ’ “ ” in visible text; keep straight quotes in code.
- Page must be responsive and respect light/dark mode (CSS variables on `:root`).

## 3. Libraries in use

| Library | Version | Purpose |
|---|---|---|
| pdf-lib | 1.17.1 | Build/export PDFs, copy pages between PDFs, rotate, embed JPEG |
| pdf.js (`pdfjsLib`) | 3.11.174 | Render page thumbnails and large Document-view pages |
| pdf.js worker | 3.11.174 | Loaded as a plain script so pdf.js can use the “fake worker” (cross-origin Workers are blocked) |
| JSZip | 3.10.1 | Bundle split PDFs into a zip |
| Montserrat | Google Fonts | UI font (fallback: system-ui) |

If thumbnails ever fail, pages still work: the card falls back to a “PDF p.N” label and export is unaffected (pdf-lib does the real work).

## 4. Code map (all inside `index.html`)

**State**
- `pages[]` is the single source of truth, in export order. Item shapes:
  - Image: `{kind:'img', url (JPEG data URL), w, h, name}`
  - PDF page: `{kind:'pdf', src:{bytes, doc (pdf-lib), pj (pdf.js doc)}, idx, rot, thumb, big, bigRot, ar, name}`
  - Blank: `{kind:'blank'}`
- JFIF files often arrive with a wrong MIME type, so image data URLs are forced to `data:image/jpeg;base64,…`.
- Image rotation is **baked into pixels** via canvas; PDF rotation is a `rot` value applied with `setRotation` on export.

**Key functions**
- `addFiles(files)` first sorts the batch by filename (natural numeric order), then reads PDFs (pdf-lib + pdf.js) and JPEG/JFIF files into `pages`.
- `render()` rebuilds the card list, then calls `layout()`.
- `layout()` shows/hides hero, work area and header tools, toggles `body.has`, and triggers the first-file animation.
- `flyTo(from, big)` animation: a clone of the yellow circle shrinks into the logo, the headline clone slides off the right edge, then `#work` glides in from the left and `#tools` fades in. Skipped when the user prefers reduced motion.
- `bigOf(p)` renders a ~1000px page for Document view (queued sequentially via `bigQ`, cached on the page object).
- `build(list = pages)` returns PDF bytes via pdf-lib (used by both Download and Split).
- `parseRanges(text, n)` parses split ranges and returns an error string on bad input.
- `showView()` handles hash routing: default view is the editor; `#about` is an intentionally **empty** view.

**Whiteout and sidebar**
- Whiteout rects live on the page object as `p.wo = [{x,y,w,h}]`, 0..1, relative to the page **as displayed** (after rotation). `rotWO(p)` re-maps them on every 90° rotation. `whiteRects(pg,p)` converts them to PDF coordinates (cropbox + total rotation) in `build()`; `flatImg(p)` burns them into JPEG pages.
- `paintWO`, `woDown` draw/edit rects (pointer events on `.box`, only while `body.wom` and Document view). `buildSide()` builds the left thumbnail grid; `sortable(el)` is the shared drag-to-reorder for both `#list` and `#side` (the dragged card lifts with a shadow; `flip()` slides the other cards to their new spots, skipped for reduced motion); `watchCur()` outlines the page in view.

**Layout**
- Sticky `<header>`: logo (`pdf-ep.` with a yellow circle that appears behind the “p” once files are loaded); `#tools` = **Download PDF** (fixed) + separator + `#tmid` (Custom split, Document/Grid view, Whiteout, and the image size/placement selects, which only show when there are JPEG pages via `syncOpts()`; this part scrolls sideways on phones); on the right `.right` = **New** (yellow outline, hidden until pages exist) + `nav` (only “ABOUT US”). Tiles are made by `mkTile()`; they have no `_p`, so `sortable()` ignores them. `#split` panel sits under the header.
- Hero: yellow circle `#drop` (a **+** and `.pdf · .jpg · .jpeg · .jfif`) with the headline `pdf / editor / pro.` to its right (overlapping by `-75px`; stacked and centered under 720px).
- `[hidden]{display:none!important}` is global, so use the `hidden` attribute for toggling.

## 5. Editing workflow for agents

1. For small changes, use the Artifact tool with `action: "edit"`, the artifact URL and `old_str/new_str` pairs (each `old_str` copied exactly from the current file, appearing once).
2. For large rewrites, edit `/mnt/user-data/outputs/jpeg-to-pdf.html` and publish with `url` set to the artifact link (do not create a second artifact).
3. Before touching anything that needs `window.claude.*`, call the Artifact tool with `action: "capabilities"` first.
4. Keep the owner’s preferences: **minimal, text-only look, no instructional copy** on the landing page, no extra highlighting, headline overlaps the circle slightly. Ask before adding explanatory text.

## 6. PDF to Word (built) and next formats

**Built (code between `// ==== word-start ====` and `// ==== word-end ====` in `index.html`):**
- `convertWord(mode, idxList, progress)` walks the chosen pages in screen order. `mode==='text'` and the page has text (`pdfHasText`, cached on `p.hasText`) → `pageText(p)` + `groupText(items,W,H)`; otherwise `pageJpeg(p)` (pdf.js render at 1400 px wide, or the JPEG with whiteouts burned in); blank → blank section.
- `groupText` groups text items into lines (by baseline), lines into paragraphs (line gap < 1.6× font size, bullets/tab rows start their own), guesses headings (≥ 1.25× the body size → bold) and centered lines, turns wide gaps into tabs (pdf.js reports them as wide whitespace items), and derives page margins from where the text sits. Text under a whiteout box is dropped.
- `makeDocx(parts)` writes the `.docx` zip by hand with JSZip (no extra library): one Word section per page, page size = source page size (images capped at 1500 pt, JPEG pages scaled to 842 pt), image pages have zero margins and the picture at 98.5% to avoid a spill-over blank page.
- Tested outside the browser with pdfjs-dist + JSZip on a generated PDF: opens in python-docx and LibreOffice with the expected page count. **Not tested in a real browser**, and image rendering (`pageJpeg`) was only checked by logic.
- Honest limits (also true for users): editable mode keeps text, headings, tabs and rough margins only. Tables, columns, images and exact fonts are lost. OCR is out of scope (scanned pages become images). Word/Excel/PowerPoint → PDF is not feasible in the browser; do not promise it.

**Still open (later):** PowerPoint (one slide per page image; confirm a UMD library on cdnjs first) and Excel (obvious tables only, experimental). Hybrid Word mode (page image + text) is optional.

## 7. Known gaps and risks

- No automated tests; **nothing has been verified in a browser yet**.
- pdf.js “fake worker” fallback is assumed to work under the page’s content-security policy; if not, thumbnails and Document view will fall back to labels.
- Very large PDFs (hundreds of pages) may be slow: thumbnails and Document-view renders are sequential and held in memory as data URLs.
- Encrypted PDFs are loaded with `ignoreEncryption`, which may produce unreadable pages.
- The `#about` view is intentionally empty; do not fill it without being asked.
- The old three-label home design was removed; the editor design is now the home page.
