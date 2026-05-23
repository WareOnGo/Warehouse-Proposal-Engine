require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
    const ws = await prisma.warehouse.findMany({ select: { id: true, photos: true, city: true } });
    const buckets = { 1: [], 2: [], 3: [], 4: [] };
    for (const w of ws) {
        if (!w.photos) continue;
        const n = w.photos.split(',').map(s => s.trim()).filter(Boolean).length;
        if (buckets[n] && buckets[n].length < 3) buckets[n].push({ id: w.id, city: w.city, n });
    }
    console.log(JSON.stringify(buckets, null, 2));
    process.exit(0);
})().catch(e => { console.error(e.message); process.exit(1); });
