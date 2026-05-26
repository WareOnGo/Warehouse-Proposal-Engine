require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');
const { promisify } = require('util');
const execFileP = promisify(execFile);
const warehouseService = require('/home/rs0125/dev/wareongo/Warehouse-Proposal-Engine/src/services/warehouseService');
const { createPptBufferTci } = require('/home/rs0125/dev/wareongo/Warehouse-Proposal-Engine/src/services/pptServiceTci');

(async () => {
    // One of each photo-count to exercise all four layouts (1/2/3/4).
    const ids = [1694, 552, 1691, 1692];
    const warehouses = await warehouseService.findWarehousesByIds(ids);
    console.log('got warehouses:', warehouses.length);
    const selectedImages = {};
    for (const w of warehouses) {
        if (typeof w.photos === 'string' && w.photos.trim()) {
            selectedImages[w.id] = w.photos.split(',').map((u) => u.trim()).filter(Boolean);
        }
    }
    const buffer = await createPptBufferTci(warehouses, selectedImages, {
        clientName: 'Preview Client', pocName: 'POC', pocContact: '+91 9999999999',
    });
    const outDir = '/home/rs0125/dev/wareongo/Warehouse-Proposal-Engine/preview-out';
    const pptxPath = path.join(outDir, 'tci-fixed.pptx');
    fs.writeFileSync(pptxPath, buffer);
    console.log('wrote pptx', pptxPath, buffer.length);

    console.log('converting via libreoffice…');
    await execFileP('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', outDir, pptxPath], { timeout: 180000 });
    const pdfPath = path.join(outDir, 'tci-fixed.pdf');
    console.log('rasterizing…');
    await execFileP('pdftoppm', ['-png', '-r', '120', pdfPath, path.join(outDir, 'tci-fixed-slide')], { timeout: 120000 });
    const pngs = fs.readdirSync(outDir).filter(f => /^tci-fixed-slide-\d+\.png$/.test(f)).sort();
    console.log('rendered slides:', pngs.length, pngs.join(', '));
    process.exit(0);
})().catch((e) => { console.error('ERROR:', e); process.exit(1); });
