const express = require('express');
const { PrismaClient } = require('@prisma/client');
const cors = require('cors');
const PptxGenJS = require('pptxgenjs');

// Import the slide generation functions
const { generateTitleSlide } = require('./ppt-slides/titleSlide');
const { generateMainSlide } = require('./ppt-slides/mainSlide');
const { generateContactSlide } = require('./ppt-slides/contactSlide');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Route for PPT Generation ---
app.get('/api/generate-ppt/:id', async (req, res) => {
    const warehouseId = parseInt(req.params.id);

    if (isNaN(warehouseId)) {
        return res.status(400).json({ error: 'Invalid Warehouse ID.' });
    }

    try {
        // 1. Fetch Warehouse Data
        const warehouse = await prisma.warehouse.findUnique({
            where: { id: warehouseId },
        });

        if (!warehouse) {
            return res.status(404).json({ error: `Warehouse with ID ${warehouseId} not found.` });
        }

        // 2. Create Presentation
        let pptx = new PptxGenJS();
        pptx.layout = 'LAYOUT_WIDE';

        // 3. Generate each slide by calling the imported functions
        generateTitleSlide(pptx, warehouse);
        generateMainSlide(pptx, warehouse);
        generateContactSlide(pptx, warehouse);

        // 4. Generate and Send the File
        res.setHeader('Content-Disposition', `attachment; filename="Warehouse_${warehouseId}.pptx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        const base64_data = await pptx.write('base64');
        const buffer = Buffer.from(base64_data, 'base64');
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