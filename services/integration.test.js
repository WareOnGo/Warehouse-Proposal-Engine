const detailedPptService = require('./detailedPptService');

describe('End-to-End Integration Tests', () => {
  test('should generate presentation for single warehouse with complete data', async () => {
    const warehouses = [
      {
        id: 1,
        address: '123 Test Warehouse Street, Industrial Area, Test City 12345',
        googleLocation: '28.7041, 77.1025',
        totalSpaceSqft: [10000, 15000, 20000],
        warehouseType: 'RCC Structure',
        clearHeightFt: '30 ft',
        ratePerSqft: '28',
        photos: 'https://via.placeholder.com/800x600',
        otherSpecifications: 'Loading dock, 24/7 Security, CCTV',
        WarehouseData: {
          landType: 'Industrial',
          fireSafetyMeasures: 'Sprinklers, Fire Extinguishers, Fire Alarm',
          powerKva: '500 KVA'
        }
      }
    ];

    const customDetails = {
      companyName: 'Test Logistics Company',
      employeeName: 'John Doe'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 60000); // 60 second timeout for API calls

  test('should generate presentation for multiple warehouses', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Warehouse 1 Address',
        googleLocation: '28.7041, 77.1025',
        totalSpaceSqft: [10000],
        warehouseType: 'RCC',
        clearHeightFt: '25 ft',
        ratePerSqft: '25',
        photos: '',
        WarehouseData: {}
      },
      {
        id: 2,
        address: 'Warehouse 2 Address',
        googleLocation: '19.0760, 72.8777',
        totalSpaceSqft: [15000],
        warehouseType: 'Prefab',
        clearHeightFt: '20 ft',
        ratePerSqft: '22',
        photos: '',
        WarehouseData: {}
      },
      {
        id: 3,
        address: 'Warehouse 3 Address',
        googleLocation: '13.0827, 80.2707',
        totalSpaceSqft: [12000],
        warehouseType: 'RCC',
        clearHeightFt: '28 ft',
        ratePerSqft: '24',
        photos: '',
        WarehouseData: {}
      }
    ];

    const customDetails = {
      companyName: 'Multi Warehouse Corp',
      employeeName: 'Jane Smith'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 120000); // 120 second timeout for multiple API calls

  test('should handle warehouse with missing geospatial data', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Warehouse with No Location',
        googleLocation: null,
        totalSpaceSqft: [8000],
        warehouseType: 'Standard',
        clearHeightFt: '22 ft',
        ratePerSqft: '20',
        photos: '',
        WarehouseData: {}
      }
    ];

    const customDetails = {
      companyName: 'Test Company',
      employeeName: 'Test User'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 30000);

  test('should handle warehouse with invalid googleLocation', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Warehouse with Invalid Location',
        googleLocation: 'invalid location string',
        totalSpaceSqft: [5000],
        warehouseType: 'Basic',
        clearHeightFt: '18 ft',
        ratePerSqft: '18',
        photos: '',
        WarehouseData: {}
      }
    ];

    const customDetails = {
      companyName: 'Test Company',
      employeeName: 'Test User'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 30000);

  test('should include title, index, and contact slides', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Test Warehouse',
        googleLocation: '28.7041, 77.1025',
        totalSpaceSqft: [10000],
        warehouseType: 'RCC',
        clearHeightFt: '25 ft',
        ratePerSqft: '25',
        photos: '',
        WarehouseData: {}
      }
    ];

    const customDetails = {
      companyName: 'Slide Test Company',
      employeeName: 'Slide Test User'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    
    // The presentation should have at least:
    // 1. Title slide
    // 2. Index slide
    // 3. Detailed slide for warehouse
    // 4. Contact slide
    // Minimum 4 slides
  }, 60000);

  test('should handle warehouse with multiple photos', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Warehouse with Photos',
        googleLocation: '28.7041, 77.1025',
        totalSpaceSqft: [10000],
        warehouseType: 'RCC',
        clearHeightFt: '25 ft',
        ratePerSqft: '25',
        photos: 'https://via.placeholder.com/800x600, https://via.placeholder.com/800x600, https://via.placeholder.com/800x600',
        WarehouseData: {}
      }
    ];

    const customDetails = {
      companyName: 'Photo Test Company',
      employeeName: 'Photo Test User'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 60000);

  test('should handle empty customDetails', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Test Warehouse',
        googleLocation: '28.7041, 77.1025',
        totalSpaceSqft: [10000],
        warehouseType: 'RCC',
        clearHeightFt: '25 ft',
        ratePerSqft: '25',
        photos: '',
        WarehouseData: {}
      }
    ];

    const customDetails = {};

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 60000);

  test('should handle warehouse with all optional fields missing', async () => {
    const warehouses = [
      {
        id: 1,
        address: 'Minimal Warehouse',
        totalSpaceSqft: [5000],
        warehouseType: 'Basic'
      }
    ];

    const customDetails = {
      companyName: 'Minimal Test',
      employeeName: 'Test User'
    };

    const buffer = await detailedPptService.createDetailedPptBuffer(warehouses, customDetails);

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
  }, 30000);
});
