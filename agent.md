# agent.md — pdf-ep

Guide for any AI agent (or human) continuing work on **pdf-ep**, a single-page, browser-only PDF editor and JPEG/JFIF-to-PDF tool.

- **Repo files:** `index.html` (the whole app), `README.md`, `agent.md`, and `preview.jpg` (1200 × 630 link-preview image, yellow circle with a dark “p” and “less fuss. more pdf.”), and icon files: `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest` (yellow circle with a dark “p”, matching the header logo; keep all in the repo root)
- **Hosting:** GitHub Pages (root of `main`). Live site: https://allan02ace.github.io/pdf-ep/. Current Claude artifact copy: https://claude.ai/artifact/D8fQpDzLAdbQALu4MePvQw (the older one was https://claude.ai/artifact/Q6rkHeQVdmL2xzNHotqfx6)
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
| Paper size | **Paper** select (shown once there are pages): Original / A4 / Letter 8.5 × 11 in / Legal 8.5 × 13 in / A3 / A5. Applies to **every** page: JPEG pages are fitted with a 24 pt margin, **PDF pages are scaled to fit the sheet** (no margin; landscape pages get a landscape sheet; rotation and whiteout carried over), blank pages use the size (A4 when Original). Plus 9-position **Place** select for JPEG and PDF pages whenever the size is not Original |
| Download | **Download PDF** (all pages → `edited.pdf`). While building, the button turns pale cream and a yellow fill with moving white diagonal stripes sweeps left to right with real per-page progress; the label reads “Building… 45%”, then “Saving…”, then “Done” for 1.2 s. See section 4b |
| New | **New** button (far right of the header) clears all pages and returns to the yellow-circle home screen. If there are unsaved changes (`sig()` differs from `savedSig`, set after a successful download/split) the first click turns the button into “Discard pages?” for 4 s and a second click confirms. No `confirm()` dialog (may be blocked in the sandbox) |
| Word (.docx) | **Word** button (header) opens a panel: mode select, optional page range (same syntax as Custom split), **Download Word** → `converted.docx`. Three modes: **Editable text** and **Look-alike (keeps page layout)** are offered only when pages have a real text layer (`pdfHasText`, ≥ 8 characters); **Pages as images** always. Scanned/JPEG pages are placed as images in the same file; blank pages stay blank. If no page has text, only **Pages as images** is available. See section 6 |
| Markup | **Markup** button (header, Document view): opens a tool bar under the header. Tools: Highlight, Underline, Strikethrough (drag over text), Draw (freehand), Text (click or drag a box, then type), Comment (yellow box with border), Sticky note (icon, click it to open/edit the note), Undo. Six colours; Text/Comment also have font (Sans/Serif/Mono), size in pt, B and I. Click a text/comment box to select it: ✥ moves, ◢ edge handle resizes the width, × deletes; changing font/size/colour in the bar restyles the selected box. Items export onto the finished pages (highlight is multiply-blended, sticky notes also get a real PDF text annotation). Rotating a page moves the items with it. Editing the page’s existing text is not possible; cover it with **Whiteout** and add a text box. Not built yet: image resize/crop/replace |
| Custom split | Ranges like `1-2, 3, 4, 5-6` → one PDF per range, bundled as `split-pdfs.zip` (single range → plain PDF) |
| Home / About | Header nav on the right: **HOME** and **ABOUT US** (the current one is highlighted). **About** shows the same yellow circle at exactly the same position as home, with a dark head-and-shoulders silhouette (narrow shoulders, body running down to the bottom of the window) and the headline “less fuss. / more pdf.”. Nothing on About is clickable and files dropped on its circle are ignored. Going between Home and About is animated, see section 4b |

With Paper set to Original, PDF pages keep their original size and the Place select is hidden.

## 2. Constraints

On GitHub Pages the only real limit is keeping it a single self-contained file. The rules below also keep it working as a Claude artifact.

- **One self-contained `.html` file.** No remote images, no `fetch` to other sites.
- **External scripts only from** `cdnjs.cloudflare.com`, `cdn.jsdelivr.net/npm/`, `cdn.tailwindcss.com`, `code.jquery.com`. External CSS only from Google Fonts. Pin **exact versions** at least 14 days old. Scripts only, so libraries must work as a plain `<script>` (UMD).
- **Downloads go through `saveFile(filename, blob)`** in `index.html`: it uses the Claude `downloads` capability when `window.claude` exists (artifact), otherwise a normal `<a download>` blob link (GitHub Pages). Never call `dl.save` directly.
- *(Artifact-only notes)* the `downloads` capability:`const dl = await claude.use('downloads'); await dl.save({filename, data})`. The viewer sees a confirmation. Allowed extensions include `pdf zip docx pptx xlsx csv txt json md html svg png jpg`. It is declared with `capabilities: {downloads: true}` when publishing (omitting `capabilities` on republish keeps it).
- **No `window.storage`, no Claude API calls** (they do not exist on published pages). Browser storage works but is per-viewer and optional.
- **Link previews:** the `<head>` has `description`, Open Graph and Twitter meta tags that point at `https://allan02ace.github.io/pdf-ep/` and `preview.jpg`. They only matter on GitHub Pages. If the features change, update all three descriptions (`description`, `og:description`, `twitter:description`) and `preview.jpg`.
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
- `build(list = pages)` returns PDF bytes via pdf-lib (used by both Download and Split). When Paper is not Original, each PDF page is copied, rotated, whiteout-painted, then `embedPage` (cropbox) and drawn with `drawPage` onto a new sheet from `SIZES` (a4, a3, a5, letter, long); the temporary copy is removed. The rotation offsets (`ox`, `oy`) were checked in Node at 0/90/180/270 degrees.
- `parseRanges(text, n)` parses split ranges and returns an error string on bad input.
- `showView()` handles hash routing: default view is the editor (`#editor` or no hash); `#about` is the circle + silhouette + “less fuss. more pdf.” view. It sets `body.abt` on About, hides the `.opt` labels and `#add`, and calls `fitSil()`.

**Markup (code between `// ==== markup-start ====` and `// ==== markup-end ====`)**
- Items live on the page object as `p.an = [...]`, 0..1 of the page as displayed (after rotation), like `p.wo`. Types: `hl/ul/st {x,y,w,h,c}`, `free {pts,wd,c,x,y,w,h}`, `txt/cmt {x,y,w,h,s,fs,font,b,i,c}` (`fs` and `w` are fractions of the page width, so size scales with the page; `h` is measured from the textarea), `note {x,y,s}` (x,y = centre).
- `mk` holds tool, colours, font settings, the selected item and the undo list. `markOn`, `setTool`, `annDown` (pointer on a page), `mkEl`/`paintAN` (the `.an` overlay inside each `.box`, Document view only), `dragIt` (move/resize), `rotAN` (called from `rotate()`; text keeps its physical size and stays upright). Text size on screen uses `cqw` units (the `.box` is a size container).
- Export: `build()` calls `drawAnn(out,page,p,M,fc)` after each finished page, where `M={P:(u,v)=>PDF point, W,H displayed page size in pt, tr text rotation}`; there is one mapper per case (PDF page at original size incl. page /Rotate, resized PDF page, JPEG page, blank page). Standard fonts only (WinAnsi; other characters become “?”). Text wraps with the font metrics, so line breaks can differ slightly from the screen.
- Tested in headless Chrome with the CDN scripts swapped for local copies: every tool, font change, rotation, export at Original/A4/Letter, output rendered with pdftoppm. Not tested with touch input or in Word.
- Limits: underline/strikethrough are plain rectangles drawn at the bottom/middle, so after rotating a page they no longer follow the text (redraw them); the Markup items are not shown in Grid view or the thumbnails; Word export ignores them.

**Whiteout and sidebar**
- Whiteout rects live on the page object as `p.wo = [{x,y,w,h}]`, 0..1, relative to the page **as displayed** (after rotation). `rotWO(p)` re-maps them on every 90° rotation. `whiteRects(pg,p)` converts them to PDF coordinates (cropbox + total rotation) in `build()`; `flatImg(p)` burns them into JPEG pages.
- `paintWO`, `woDown` draw/edit rects (pointer events on `.box`, only while `body.wom` and Document view). `buildSide()` builds the left thumbnail grid; `sortable(el)` is the shared drag-to-reorder for both `#list` and `#side` (the dragged card lifts with a shadow; `flip()` slides the other cards to their new spots, skipped for reduced motion); `watchCur()` outlines the page in view.

**Layout**
- Sticky `<header>`: logo (`pdf-ep.` with a yellow circle that appears behind the “p” once files are loaded); `#tools` = **Download PDF** (fixed) + separator + `#tmid` (Custom split, Document/Grid view, Whiteout, and the Paper / Place selects (`syncOpts()`: Paper whenever pages exist, Place only when there is a PDF or JPEG page and Paper is not Original); this part scrolls sideways on phones). The Paper select shows whenever pages exist; on the right `.right` = **New** (yellow outline, hidden until pages exist) + `nav` (**HOME** and **ABOUT US**; hidden under 720 px once files are loaded). Tiles are made by `mkTile()`; they have no `_p`, so `sortable()` ignores them. `#split`, `#wordp` and `#markp` (Markup tools) panels sit under the header and are mutually exclusive.
- Hero: yellow circle `#drop` (a **+** and `.pdf · .jpg · .jpeg · .jfif`) with the headline `pdf / editor / pro.` to its right (overlapping by `-75px`; stacked and centered under 720px). On `#about` the hero is shown too (`layout()` keeps it visible there even with pages loaded) with `less fuss. / more pdf.`; `showView()` gives `#big` the width of the home headline (`em`, measured while the home text is set) so the circle never moves between the two views.
- `[hidden]{display:none!important}` is global, so use the `hidden` attribute for toggling.

## 4b. Motion, views and small rules (all in `index.html`)

- **Download fill:** CSS `button.go.busy` (pale cream base `#fff1c2`, `::before` is the fill: `background-color:var(--yellow)` plus a white diagonal stripe gradient, width `calc(var(--f)*100%)`, stripes animated by `@keyframes gostripes`). JS: `fillOn(btn,label)`, `fillSet(btn,fraction,label)`, `fillOff(btn,ok)`. `build(list,prog)` calls `prog(done,total)` after each page and yields to the browser at most every 60 ms so the fill repaints. The busy button keeps full opacity and dark text (`button.go.busy:disabled`), its width is locked while busy. Custom split and Word do not use the fill.
- **First file (home → editor):** `flyTo()` as before. **New (editor → home):** `flyBack(reset)`: a yellow circle grows from the header circle over the whole screen (520 ms), the pages are cleared while it covers everything, then it settles into the home circle (650 ms) while the headline slides in from the right. The real home circle stays under the traveling one the whole time (no flash); only its text fades in afterwards. `flying` blocks repeat clicks.
- **Home ↔ About:** `navGo()` (on `hashchange`) plays the old headline lines sliding up and fading (staggered), the figure sinking (or the **+** fading), then `showView()`, then `navIn()`: new lines slide up, the figure rises (or the **+** fades in). The circle does not move or pulse (the pulse was tried and removed). Clicking during an animation cancels it and jumps to the final state. If the target is the editor with pages loaded, the pages (`#work`) glide in from the left and `#tools` fades in (same motion as the first-file intro). Reduced motion: everything cuts instantly.
- **Silhouette:** inline SVG `#sil` inside `#drop`, only shown with `body.abt`. One shared path `#silp` (torso, neck, head, tousled hair) is drawn twice: dark `#1d1d1b` clipped to the circle, and `var(--text)` clipped to everything outside the circle (so it stays visible in dark mode). `fitSil()` sets the viewBox height and path so the body runs to the bottom of the window (on screens ≤ 720 px it stops just under the circle so the headline below stays readable); it runs on `showView` and `resize`. The two `.sg` groups are what the rise/sink animation moves.
- **No stray scroll shifts:** `html{scrollbar-gutter:stable;overflow-x:clip}` and `body{overflow-x:clip}`, so the sliding headline cannot widen the page (that caused a visible nudge of the logo and ABOUT US at the end of the New animation).
- **Text is not selectable** (`body{user-select:none}`); inputs and textareas (`input,textarea`) stay selectable so Markup text, comments, notes and the range fields still work.
- **Offline build (GitHub Pages):** libraries and the font are **local**. `index.html` loads `vendor/pdf-lib.min.js`, `vendor/pdf.min.js`, `vendor/pdf.worker.min.js`, `vendor/jszip.min.js` (the exact cdnjs/npm files: pdf-lib 1.17.1, pdf.js 3.11.174, JSZip 3.10.1; their SHA-384 hashes were checked against cdnjs and the `integrity="sha384-…"` attributes are kept) and Montserrat 500/800 from `vendor/fonts/` (via `@font-face`, no Google Fonts). `pdfjsLib.GlobalWorkerOptions.workerSrc` points at `vendor/pdf.worker.min.js`.
- **Service worker `sw.js`:** registered from `index.html` (https only). It caches the page, icons, manifest, `vendor/` files and fonts on the first visit. Pages are network-first (new deploys show up when online, the saved copy is used offline); `vendor/` is cache-first; everything else is stale-while-revalidate. **Bump `CACHE` in `sw.js` when a `vendor/` file changes**, and add new files to `CORE`. Tested in headless Chromium: 14 files cached, reload with the network off still loads all libraries and the font, no errors.
- **Changing a library version:** replace the file in `vendor/`, recompute its hash (PowerShell: `"sha384-"+[Convert]::ToBase64String([Security.Cryptography.SHA384]::Create().ComputeHash([IO.File]::ReadAllBytes($f)))`), update `integrity` in `index.html`, and bump `CACHE`. A wrong hash makes the browser refuse the file and the `libFail()` banner shows.
- **Claude artifact copy:** published pages cannot load local files. For the artifact, use a copy of `index.html` with the four `vendor/…` script URLs swapped back to `https://cdnjs.cloudflare.com/ajax/libs/<lib>/<version>/<file>`, the same `workerSrc` URL, the Google Fonts `<link>` instead of the `@font-face` block, and no service worker registration.
- **Library load check:** `libCheck()` (and `libFail()` via `onerror` on each CDN script) shows the `#libwarn` banner with a Reload button when pdf-lib, pdf.js or JSZip is missing, saying which abilities are lost (build/download PDFs, preview/convert pages, Word/zip files); `addFiles()` stops early with the banner if pdf-lib is missing. **Not done yet:** Subresource Integrity (`integrity="sha384-…"` + `crossorigin="anonymous"`) on the four CDN scripts. Compute each hash from the exact cdnjs file (`curl -s URL | openssl dgst -sha384 -binary | openssl base64 -A`) and never guess one: a wrong hash makes the browser refuse the script and the app stops working.
- Tested in headless Chrome (CDN scripts blocked, so only JPEG pages could be loaded): About/Home texts and circle position at 3 window widths, silhouette in light and dark, nav highlight, pages gliding back in, rapid toggling without errors. **Not tested on a real phone, with touch, or with PDF pages through these animations.**

## 5. Editing workflow for agents

1. For small changes, use the Artifact tool with `action: "edit"`, the artifact URL and `old_str/new_str` pairs (each `old_str` copied exactly from the current file, appearing once).
2. For large rewrites, edit `/mnt/user-data/outputs/jpeg-to-pdf.html` and publish with `url` set to the artifact link (do not create a second artifact).
3. Before touching anything that needs `window.claude.*`, call the Artifact tool with `action: "capabilities"` first.
4. Keep the owner’s preferences: **minimal, text-only look, no instructional copy** on the landing page, no extra highlighting, headline overlaps the circle slightly. Ask before adding explanatory text.

## 6. PDF to Word (built) and next formats

**Built (code between `// ==== word-start ====` and `// ==== word-end ====` in `index.html`):**
- `convertWord(mode, idxList, progress)` walks the chosen pages in screen order. `mode==='text'` and the page has text (`pdfHasText`, cached on `p.hasText`) → `pageText(p)` + `groupText(items,W,H)`; `mode==='hybrid'` and text → `pageHybrid(p)`; otherwise `pageJpeg(p)` (pdf.js render at 1400 px wide, or the JPEG with whiteouts burned in); blank → blank section.
- `groupText` groups text items into lines (by baseline), lines into paragraphs (line gap < 1.6× font size, bullets/tab rows start their own), guesses headings (≥ 1.25× the body size → bold) and centered lines, turns wide gaps into tabs (pdf.js reports them as wide whitespace items), and derives page margins from where the text sits. Text under a whiteout box is dropped.
- `makeDocx(parts)` writes the `.docx` zip by hand with JSZip (no extra library): one Word section per page, page size = source page size (images capped at 1500 pt, JPEG pages scaled to 842 pt), image pages have zero margins and the picture at 98.5% to avoid a spill-over blank page.
- **Look-alike mode (`pageHybrid`)**: renders the page twice with pdf.js (normal, and with `fillText`/`strokeText` turned off on the canvas context so the text is not drawn). Per text line (`hLines`: one line box per row segment, split at wide gaps) it takes the text colour from the pixel that differs most between the two renders, the font family from pdf.js (`serif` → Times New Roman, `monospace` → Courier New, else Arial), bold/italic runs from the font object (`pg.commonObjs`, needs the page drawn once first), and a character spacing that makes the width match the original (`measureText`). `makeDocx` writes one absolutely placed frame (`w:framePr`, page-anchored) per line and the text-free picture as a `behindDoc` anchored image. If fewer than 60% of the lines changed between the two renders (text could not be removed, e.g. Type3 fonts), it falls back to the **full** picture plus text frames made invisible with `w14:textFill` alpha 0 (Word hides it, LibreOffice ignores the alpha and shows the text doubled).
- **Tables (Look-alike mode)**: `pageRules` → `pdfRules` walks the pdf.js operator list (both the 3.x `[ops, coords]` and the newer flat-path layouts) tracking the transform matrix, and collects horizontal/vertical ruled lines (stroked paths, rectangle edges, thin filled rectangles). `findGrids` merges the lines, groups the ones that cross into a grid, builds the cell matrix and merges cells that have no border between them (`gridSpan`/`vMerge`). `rebuildTables` assigns each text line to a cell; a grid with no text is ignored. `eraseRules` paints the ruled lines out of the text-free picture, and `wTable` writes a floating (page-anchored) fixed-layout Word table with exact column widths, row heights and per-cell borders. Text lines are also split at vertical rules (`hLines` `cuts`). Tables only apply when the text really was removed from the picture (`clean`); in the fallback case everything stays picture + hidden text.
- Tested outside the browser with pdfjs-dist 3.11.174 and 6.x + JSZip on a generated 4×3 table: both find 5 horizontal and 4 vertical rules and the 4×3 grid; python-docx reads it as a real table (Apple/3/1.50 in row 2) and LibreOffice renders it. Pixel erasing (`eraseRules`) and colour sampling run only in a browser and are untested.
- Tested outside the browser with pdfjs-dist + JSZip on a generated PDF: opens in python-docx and LibreOffice with the expected page count. Look-alike output (positions, colours, bold/italic/serif runs, 2-page count) was checked in LibreOffice with a synthetic text-free picture. **Not tested in a real browser or in Word**; the canvas text-removal step and colour sampling in `pageHybrid` only run in a browser.
- Honest limits (also true for users): editable mode keeps text, headings, tabs and rough margins only. Tables, columns, images and exact fonts are lost. Look-alike keeps the look and now rebuilds ruled tables as real Word tables; borderless tables (aligned text without lines), nested tables, dashed/curved rules and table shading are not detected, and images stay in the picture; only three font families are used, underline/strikethrough are not detected as styling, and editing a word does not change the picture behind it in the fallback case. OCR is out of scope (scanned pages become images). Word/Excel/PowerPoint → PDF is not feasible in the browser; do not promise it.

**Still open (later):** PowerPoint (one slide per page image; confirm a UMD library on cdnjs first) and Excel (obvious tables only, experimental). Better font mapping, borderless-table detection and table shading for Look-alike are optional. Editable-text mode does not build tables.

## 7. Known gaps and risks

- No automated tests; **nothing has been verified in a browser yet**.
- pdf.js “fake worker” fallback is assumed to work under the page’s content-security policy; if not, thumbnails and Document view will fall back to labels.
- Very large PDFs (hundreds of pages) may be slow: thumbnails and Document-view renders are sequential and held in memory as data URLs.
- Encrypted PDFs are loaded with `ignoreEncryption`, which may produce unreadable pages.
- The About view is only the circle, the silhouette and the two headline lines. Do not add text or buttons without being asked.
- The old three-label home design was removed; the editor design is now the home page.
