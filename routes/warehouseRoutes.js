const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// Middleware to configure extended timeout (10 minutes) for detailed presentation endpoint
const extendedTimeoutMiddleware = (req, res, next) => {
    req.setTimeout(600000); // 10 minutes
    res.setTimeout(600000); // 10 minutes
    next();
};

// Define all the application routes
router.get('/health', warehouseController.checkHealth);
router.get('/api/warehouses', warehouseController.getWarehouses);
router.post('/api/generate-ppt', warehouseController.generatePresentation);

// Add POST route for detailed presentation endpoint with extended timeout
router.post('/api/generate-detailed-ppt', extendedTimeoutMiddleware, warehouseController.generateDetailedPresentation);

module.exports = router;
