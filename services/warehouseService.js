const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Fetches multiple warehouses from the database by their IDs
const findWarehousesByIds = async (warehouseIds) => {
    return await prisma.warehouse.findMany({
        where: { id: { in: warehouseIds } },
    });
};

// Performs a simple query to check the database connection status
const checkDbConnection = async () => {
    return await prisma.$queryRaw`SELECT 1`;
};

module.exports = {
    findWarehousesByIds,
    checkDbConnection
};
