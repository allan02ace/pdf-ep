# pdf-ep

Browser-only PDF editor and JPEG/JFIF-to-PDF tool. Merge, reorder, rotate, delete, add blank pages and split PDFs. Everything runs locally; nothing is uploaded.

## Run it
Open `index.html` in a browser, or host it on GitHub Pages.

## Deploy on GitHub Pages
1. Create a repository and upload every file and the `vendor` folder: `index.html`, `sw.js`, `README.md`, `agent.md`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest`, `preview.jpg` (if you have it) and the whole `vendor/` folder (drag the folder into the upload page).
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<username>.github.io/<repository>/`.

## Libraries (bundled in `vendor/`)
pdf-lib 1.17.1, pdf.js 3.11.174, JSZip 3.10.1 and the Montserrat font are included, so the app needs no internet after it is hosted. `sw.js` also saves everything on the first visit so the app works offline, and it can be installed as an app.

Library licenses: pdf-lib (MIT), pdf.js (Apache 2.0), JSZip (MIT or GPLv3), Montserrat (SIL OFL 1.1, see `vendor/fonts/OFL-montserrat.txt`).
