// server.js
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

// --- NEW: CORS Configuration using Environment Variable ---
const allowedOrigins = [
    'null' // Always allow local file access for development
];

// Add the production frontend URL from environment variables if it exists
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}

const corsOptions = {
    origin: allowedOrigins
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());


// ... (The rest of your server.js file remains exactly the same)


// Helper function to parse IDs from a comma-separated string
const parseIds = (idString) => {
    if (!idString) return [];
    return idString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
};

app.get('/health', async (req, res) => {
    try {
        // 1. Check database connection with a lightweight query
        await prisma.$queryRaw`SELECT 1`;
        
        // 2. If the query succeeds, everything is healthy
        res.status(200).json({ 
            status: 'ok', 
            message: 'Server and database connection are healthy.' 
        });
    } catch (error) {
        // 3. If the query fails, the database connection is down
        console.error('Health check failed:', error);
        res.status(503).json({ 
            status: 'error', 
            message: 'Server is running, but database connection is unhealthy.'
        });
    }
});

// API Route for FETCHING JSON DATA for multiple warehouses
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

// API Route for PPT Generation for multiple warehouses
app.post('/api/generate-ppt', async (req, res) => {
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