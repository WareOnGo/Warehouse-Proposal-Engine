require('dotenv').config();
const fs = require('fs');
const warehouseService = require('../src/services/warehouseService');
const { createPptBufferV2 } = require('../src/services/pptServiceV2');

(async () => {
    const ids = (process.argv[2] || '1,2,3').split(',').map((s) => parseInt(s.trim(), 10));
    const warehouses = await warehouseService.findWarehousesByIds(ids);
    console.log('got warehouses:', warehouses.length);
    const selectedImages = {};
    for (const w of warehouses) {
        if (typeof w.photos === 'string' && w.photos.trim()) {
            selectedImages[w.id] = w.photos.split(',').map((u) => u.trim()).filter(Boolean);
        }
    }
    const buffer = await createPptBufferV2(warehouses, selectedImages, {
        clientName: 'Preview Client', pocName: 'POC', pocContact: '+91 9999999999',
    });
    fs.writeFileSync('preview-out/preview.pptx', buffer);
    console.log('wrote pptx', buffer.length);
    process.exit(0);
})().catch((e) => { console.error('ERROR:', e.message); process.exit(1); });
