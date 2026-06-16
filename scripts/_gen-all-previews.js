require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const warehouseService = require('../src/services/warehouseService');
const { createPptBufferV2 } = require('../src/services/pptServiceV2');
const { createPptBufferGodamwale } = require('../src/services/pptServiceGodamwale');
const { createPptBufferTci } = require('../src/services/pptServiceTci');

const OUT = path.join(__dirname, '..', 'preview-out');
const IDS = [1694, 552, 1691, 1692]; // one of each photo-count (1/2/3/4)

const VARIANTS = [
    { name: 'v2', build: createPptBufferV2 },
    { name: 'gw', build: createPptBufferGodamwale },
    { name: 'tci', build: createPptBufferTci },
];

(async () => {
    const warehouses = await warehouseService.findWarehousesByIds(IDS);
    console.log(`fetched ${warehouses.length}/${IDS.length} warehouses`);
    const selectedImages = {};
    for (const w of warehouses) {
        if (typeof w.photos === 'string' && w.photos.trim()) {
            selectedImages[w.id] = w.photos.split(',').map((u) => u.trim()).filter(Boolean);
        }
    }
    const customDetails = { clientName: 'Preview Client', pocName: 'POC', pocContact: '+91 9999999999' };

    for (const v of VARIANTS) {
        console.log(`\n=== ${v.name} ===`);
        const buffer = await v.build(warehouses, selectedImages, customDetails);
        const pptxPath = path.join(OUT, `${v.name}.pptx`);
        fs.writeFileSync(pptxPath, buffer);
        execFileSync('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', OUT, pptxPath], { timeout: 180000 });
        fs.readdirSync(OUT).filter((f) => f.startsWith(`${v.name}-slide-`)).forEach((f) => fs.unlinkSync(path.join(OUT, f)));
        execFileSync('pdftoppm', ['-png', '-r', '120', path.join(OUT, `${v.name}.pdf`), path.join(OUT, `${v.name}-slide`)], { timeout: 120000 });
        const pngs = fs.readdirSync(OUT).filter((f) => new RegExp(`^${v.name}-slide-\\d+\\.png$`).test(f)).sort();
        console.log(`  ${v.name}: ${pngs.length} slides -> ${pngs.join(', ')}`);
    }
    process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message, e.stack); process.exit(1); });
