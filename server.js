const express = require('express');
const cors = require('cors');

// Import the main router
const warehouseRoutes = require('./routes/warehouseRoutes');

const app = express();
const PORT = process.env.PORT || 3001;

// --- CORS Configuration using Environment Variable ---
const allowedOrigins = [
    'null' // Always allow local file access for development
];
if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL);
}
const corsOptions = {
    origin: allowedOrigins
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());

// --- Routes ---
// All API routes are now handled by this router
app.use('/', warehouseRoutes);

// Start Server
const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// Configure server timeout to 10 minutes (600000ms) to support detailed PPT generation
// This ensures the server doesn't timeout before the detailed PPT endpoint completes
// Extended to accommodate slower OpenStreetMap API responses
server.timeout = 600000;
server.keepAliveTimeout = 600000;
server.headersTimeout = 610000; // Slightly higher than keepAliveTimeout
