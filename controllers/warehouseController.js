const warehouseService = require('../services/warehouseService');
const pptService = require('../services/pptService');
const detailedPptService = require('../services/detailedPptService');
const { logError, logWarn, logInfo } = require('../utils/logger');

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
        logError('warehouseController', 'checkHealth', 'Health check failed', {
            error: error.message,
            stack: error.stack
        });
        res.status(503).json({ status: 'error', message: 'Server is running, but database connection is unhealthy.'});
    }
};

// Controller for the GET /api/warehouses endpoint
const getWarehouses = async (req, res) => {
    const warehouseIds = parseIds(req.query.ids);
    if (warehouseIds.length === 0) {
        logWarn('warehouseController', 'getWarehouses', 'Invalid or no warehouse IDs provided', {
            queryIds: req.query.ids
        });
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    try {
        const warehouses = await warehouseService.findWarehousesByIds(warehouseIds);
        if (!warehouses || warehouses.length === 0) {
            logWarn('warehouseController', 'getWarehouses', 'Warehouses not found', {
                warehouseIds
            });
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        res.json(warehouses);
    } catch (error) {
        logError('warehouseController', 'getWarehouses', 'Failed to fetch warehouses', {
            warehouseIds,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An internal server error occurred.' });
    }
};

// Controller for the POST /api/generate-ppt endpoint
const generatePresentation = async (req, res) => {
    const { ids, selectedImages = {}, customDetails = {} } = req.body;
    const warehouseIds = parseIds(ids);
    if (warehouseIds.length === 0) {
        logWarn('warehouseController', 'generatePresentation', 'Invalid or no warehouse IDs provided', {
            bodyIds: ids
        });
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    try {
        const warehouses = await warehouseService.findWarehousesByIds(warehouseIds);
        if (!warehouses || warehouses.length === 0) {
            logWarn('warehouseController', 'generatePresentation', 'Warehouses not found', {
                warehouseIds
            });
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        
        logInfo('warehouseController', 'generatePresentation', 'Generating presentation', {
            warehouseIds,
            warehouseCount: warehouses.length
        });
        
        // Call the PPT service to get the presentation buffer
        const buffer = await pptService.createPptBuffer(warehouses, selectedImages, customDetails);

        res.setHeader('Content-Disposition', `attachment; filename="Warehouses_${warehouseIds.join('_')}.pptx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        res.send(buffer);
    } catch (error) {
        logError('warehouseController', 'generatePresentation', 'Failed to generate PPT', {
            warehouseIds,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An internal server error occurred during PPT generation.' });
    }
};

// Controller for the POST /api/generate-detailed-ppt endpoint
const generateDetailedPresentation = async (req, res) => {
    const { ids, customDetails = {} } = req.body;
    const warehouseIds = parseIds(ids);
    
    // Validate warehouse IDs (must be positive integers)
    if (warehouseIds.length === 0) {
        logWarn('warehouseController', 'generateDetailedPresentation', 'Invalid or no warehouse IDs provided', {
            bodyIds: ids
        });
        return res.status(400).json({ error: 'Invalid or no Warehouse IDs provided.' });
    }
    
    try {
        // Fetch warehouses from database using warehouseService
        const warehouses = await warehouseService.findWarehousesByIds(warehouseIds);
        
        // Return 404 if warehouses not found
        if (!warehouses || warehouses.length === 0) {
            logWarn('warehouseController', 'generateDetailedPresentation', 'Warehouses not found', {
                warehouseIds
            });
            return res.status(404).json({ error: `Warehouses with IDs ${warehouseIds.join(', ')} not found.` });
        }
        
        logInfo('warehouseController', 'generateDetailedPresentation', 'Generating detailed presentation', {
            warehouseIds,
            warehouseCount: warehouses.length
        });
        
        // Call detailedPptService.createDetailedPptBuffer()
        const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

        logInfo('warehouseController', 'generateDetailedPresentation', 'Successfully generated detailed presentation', {
            warehouseIds,
            bufferSize: buffer.length
        });

        // Set response headers (Content-Disposition, Content-Type)
        res.setHeader('Content-Disposition', `attachment; filename="Detailed_Warehouses_${warehouseIds.join('_')}.pptx"`);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.presentationml.presentation');
        
        // Send presentation buffer
        res.send(buffer);
    } catch (error) {
        // Handle errors and return appropriate status codes
        logError('warehouseController', 'generateDetailedPresentation', 'Failed to generate detailed PPT', {
            warehouseIds,
            error: error.message,
            stack: error.stack
        });
        res.status(500).json({ error: 'An internal server error occurred during detailed PPT generation.' });
    }
};

module.exports = {
    checkHealth,
    getWarehouses,
    generatePresentation,
    generateDetailedPresentation
};
