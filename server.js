const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const PptxGenJS = require('pptxgenjs');

// Import your exact slide generation functions
const { generateTitleSlide } = require('./ppt-slides/titleSlide');
const { generateMainSlide } = require('./ppt-slides/mainSlide');
const { generateContactSlide } = require('./ppt-slides/contactSlide');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Configure CORS
const allowedOrigins = [
    'https://your-frontend-name.onrender.com', // Your deployed frontend URL
    'null'                                     // For local file access
];
const corsOptions = { origin: allowedOrigins };
app.use(cors(corsOptions));
app.use(express.json());


// Helper function to parse IDs
const parseIds = (idString) => {
    if (!idString) return [];
    return idString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
};


// API Route for FETCHING JSON DATA
app.get('/api/warehouses', async (req, res) => {
    const warehouseIds = parseIds(req.query.ids);
    if (warehouseIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    try {
        const warehouses = await prisma.warehouse.findMany({
            where: { id: { in: warehouseIds } },
        });
        if (!warehouses || warehouses.length === 0) {
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        res.json(warehouses);
    } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
});


// API Route for PPT Generation (CHANGED to POST)
app.post('/api/generate-ppt', async (req, res) => {
    // Get data from the request body
    const { ids, selectedImages = {}, customDetails = {} } = req.body;
    const warehouseIds = parseIds(ids);

    if (warehouseIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }

    try {
        const warehouses = await prisma.warehouse.findMany({
            where: { id: { in: warehouseIds } },
        });
        if (!warehouses || warehouses.length === 0) {
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }

        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_WIDE';

        // Use your slide functions, passing customDetails
        generateTitleSlide(pptx, warehouses[0], customDetails);
        for (const warehouse of warehouses) {
            const selectedWarehouseImages = selectedImages[warehouse.id] || [];
            generateMainSlide(pptx, warehouse, selectedWarehouseImages);
        }
        generateContactSlide(pptx, customDetails);

        const buffer = await pptx.write('base64').then(base64 => Buffer.from(base64, 'base64'));

        res.setHeader('Content-Disposition', `attachment; filename="Warehouses_${warehouseIds.join('_')}.pptx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.send(buffer);

    } catch (error) {
        console.error('Failed to generate PPT:', error);
        res.status(500).json({ error: 'An internal server error occurred during PPT generation.' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});