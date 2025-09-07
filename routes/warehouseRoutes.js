const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');

// Define all the application routes
router.get('/health', warehouseController.checkHealth);
router.get('/api/warehouses', warehouseController.getWarehouses);
router.post('/api/generate-ppt', warehouseController.generatePresentation);

module.exports = router;
