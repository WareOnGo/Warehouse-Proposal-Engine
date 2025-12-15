const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fetches multiple warehouses from the database by their IDs
// Preserves the order of warehouseIds as provided by the user
const findWarehousesByIds = async (warehouseIds) => {
    const warehouses = await prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } },
    });
    
    // Sort warehouses to match the order of the input warehouseIds array
    const warehouseMap = new Map(warehouses.map(w => [w.id, w]));
    return warehouseIds.map(id => warehouseMap.get(id)).filter(w => w !== undefined);
};

// Performs a simple query to check the database connection status
const checkDbConnection = async () => {
    return await prisma.$queryRaw`SELECT 1`;
};

module.exports = {
    findWarehousesByIds,
    checkDbConnection
};
