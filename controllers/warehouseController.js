const warehouseService = require('../services/warehouseService');
const pptService = require('../services/pptService');

// Helper function to parse IDs from a comma-separated string
const parseIds = (idString) => {
    if (!idString) return [];
    return idString.split(',').map(id => parseInt(id.trim())).filter(id => !isNaN(id) && id > 0);
};

// Controller for the /health endpoint
const checkHealth = async (req, res) => {
    try {
        await warehouseService.checkDbConnection();
        res.status(200).json({ status: 'ok', message: 'Server and database connection are healthy.' });
    } catch (error) {
        console.error('Health check failed:', error);
        res.status(503).json({ status: 'error', message: 'Server is running, but database connection is unhealthy.'});
    }
};

// Controller for the GET /api/warehouses endpoint
const getWarehouses = async (req, res) => {
    const warehouseIds = parseIds(req.query.ids);
    if (warehouseIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    try {
        const warehouses = await warehouseService.findWarehousesByIds(warehouseIds);
        if (!warehouses || warehouses.length === 0) {
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        res.json(warehouses);
    } catch (error) {
        console.error('Failed to fetch warehouses:', error);
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Controller for the POST /api/generate-ppt endpoint
const generatePresentation = async (req, res) => {
    const { ids, selectedImages = {}, customDetails = {} } = req.body;
    const warehouseIds = parseIds(ids);
    if (warehouseIds.length === 0) {
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    try {
        const warehouses = await warehouseService.findWarehousesByIds(warehouseIds);
        if (!warehouses || warehouses.length === 0) {
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        
        // Call the PPT service to get the presentation buffer
        const buffer = await pptService.createPptBuffer(warehouses, selectedImages, customDetails);

        res.setHeader('Content-Disposition', `attachment; filename="Warehouses_${warehouseIds.join('_')}.pptx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.send(buffer);
    } catch (error) {
        console.error('Failed to generate PPT:', error);
        res.status(500).json({ error: 'An internal server error occurred during PPT generation.' });
    }
};

module.exports = {
    checkHealth,
    getWarehouses,
    generatePresentation
};
