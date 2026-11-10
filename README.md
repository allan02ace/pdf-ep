# pdf-ep

Browser-only PDF editor and JPEG/JFIF-to-PDF tool. Merge, reorder, rotate, delete, add blank pages and split PDFs. Everything runs locally; nothing is uploaded.

## Run it
Open `index.html` in a browser, or host it on GitHub Pages.

## Deploy on GitHub Pages
1. Create a repository and upload every file: `index.html`, `README.md`, `agent.md`, `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `manifest.webmanifest`.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to *Deploy from a branch*, pick `main` and `/ (root)`, then **Save**.
4. After a minute the site is live at `https://<username>.github.io/<repository>/`.

## Libraries (loaded from cdnjs)
pdf-lib 1.17.1, pdf.js 3.11.174, JSZip 3.10.1. An internet connection is needed on first load.
