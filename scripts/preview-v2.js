#!/usr/bin/env node
/*
 * Local-only preview tool. Not committed.
 *
 *   node scripts/preview-v2.js <id1,id2,...> [--client "Acme Corp"] [--poc "Name"] [--contact "+91 ..."] [--port 4900] [--no-open]
 *
 * Generates a v2 .pptx for the given warehouse IDs, converts it to PNGs via
 * LibreOffice + pdftoppm, and serves a thumbnail page at http://localhost:<port>.
 */
require('dotenv').config();
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const http = require('http');

const execFileP = promisify(execFile);

const warehouseService = require('../src/services/warehouseService');
const { createPptBufferV2 } = require('../src/services/pptServiceV2');

const args = process.argv.slice(2);
const idsArg = args.find((a) => !a.startsWith('--')) || '';
const flag = (name, def = null) => {
    const i = args.indexOf(`--${name}`);
    if (i === -1) return def;
    const next = args[i + 1];
    return next && !next.startsWith('--') ? next : true;
};
const ids = idsArg.split(',').map((s) => parseInt(s.trim(), 10)).filter((n) => Number.isInteger(n) && n > 0);

if (ids.length === 0) {
    console.error('Usage: node scripts/preview-v2.js <id1,id2,...> [--client "Name"] [--port 4900] [--no-open]');
    process.exit(1);
}

const clientName = flag('client') || 'Preview Client';
const pocName = flag('poc') || 'Preview POC';
const pocContact = flag('contact') || '+91 9999999999';
const port = parseInt(flag('port') || '4900', 10);
const shouldOpen = flag('no-open') !== true;

const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'wog-preview-'));
const pptxPath = path.join(workDir, 'preview.pptx');
const pdfPath = path.join(workDir, 'preview.pdf');

(async () => {
    console.log(`→ Fetching warehouses ${ids.join(', ')}`);
    const warehouses = await warehouseService.findWarehousesByIds(ids);
    if (warehouses.length === 0) {
        console.error('No warehouses found for those IDs.');
        process.exit(2);
    }
    console.log(`  got ${warehouses.length} of ${ids.length}`);

    const selectedImages = {};
    for (const w of warehouses) {
        if (typeof w.photos === 'string' && w.photos.trim()) {
            selectedImages[w.id] = w.photos.split(',').map((u) => u.trim()).filter(Boolean);
        }
    }

    console.log('→ Generating v2 .pptx');
    const buffer = await createPptBufferV2(warehouses, selectedImages, {
        clientName,
        pocName,
        pocContact,
    });
    fs.writeFileSync(pptxPath, buffer);
    console.log(`  ${pptxPath} (${buffer.length} bytes)`);

    console.log('→ Converting to PDF via LibreOffice (headless)');
    await execFileP('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', workDir, pptxPath], { timeout: 120000 });
    if (!fs.existsSync(pdfPath)) throw new Error('LibreOffice did not produce a PDF');

    console.log('→ Rasterizing PDF to PNG (pdftoppm, 120 dpi)');
    await execFileP('pdftoppm', ['-png', '-r', '120', pdfPath, path.join(workDir, 'slide')], { timeout: 60000 });

    const slides = fs.readdirSync(workDir)
        .filter((f) => /^slide-\d+\.png$/.test(f))
        .sort();
    console.log(`  ${slides.length} slide PNG(s)`);

    const html = renderHtml({ ids, clientName, warehouses, slides });

    const server = http.createServer((req, res) => {
        const url = decodeURIComponent(req.url || '/');
        if (url === '/' || url === '/index.html') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(html);
            return;
        }
        if (url === '/preview.pptx') {
            res.writeHead(200, { 'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation' });
            fs.createReadStream(pptxPath).pipe(res);
            return;
        }
        const m = url.match(/^\/(slide-\d+\.png)$/);
        if (m) {
            const p = path.join(workDir, m[1]);
            if (fs.existsSync(p)) {
                res.writeHead(200, { 'Content-Type': 'image/png' });
                fs.createReadStream(p).pipe(res);
                return;
            }
        }
        res.writeHead(404); res.end('not found');
    });

    server.listen(port, () => {
        const url = `http://localhost:${port}`;
        console.log(`\n  Preview ready: ${url}`);
        console.log(`  Files: ${workDir}\n  Ctrl-C to stop.\n`);
        if (shouldOpen) {
            execFile('xdg-open', [url], () => {});
        }
    });
})().catch((err) => {
    console.error(err);
    process.exit(1);
});

function renderHtml({ ids, clientName, warehouses, slides }) {
    const items = slides
        .map((file, i) => `
            <figure>
                <figcaption>Slide ${i + 1}</figcaption>
                <img src="/${file}" alt="Slide ${i + 1}" loading="lazy" />
            </figure>`)
        .join('\n');
    return `<!doctype html><html lang="en"><head>
<meta charset="utf-8"><title>v2 Preview: ${ids.join(', ')}</title>
<style>
  body { font: 14px -apple-system, system-ui, sans-serif; background: #1a1a1a; color: #e8e8e8; margin: 0; padding: 24px; }
  header { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 16px; }
  h1 { margin: 0; font-size: 18px; font-weight: 600; }
  .meta { color: #888; font-size: 13px; }
  a { color: #6cb6ff; }
  main { display: grid; grid-template-columns: 1fr; gap: 24px; max-width: 1280px; margin: 0 auto; }
  figure { margin: 0; background: #fff; box-shadow: 0 8px 32px rgba(0,0,0,0.4); border-radius: 4px; overflow: hidden; }
  figcaption { padding: 6px 12px; background: #222; color: #aaa; font-size: 12px; }
  img { display: block; width: 100%; height: auto; }
</style></head><body>
<header>
  <h1>v2 Preview — IDs ${ids.join(', ')} — client "${clientName}"</h1>
  <div class="meta">${warehouses.length} warehouse(s) · <a href="/preview.pptx">download .pptx</a> · refresh page after editing slide code &amp; re-running the script</div>
</header>
<main>${items}</main>
</body></html>`;
}
