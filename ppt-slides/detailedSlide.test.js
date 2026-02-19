const PptxGenJS = require('pptxgenjs');
const { generateDetailedSlide, generatePhotoSlides } = require('./detailedSlide');

describe('DetailedSlide - Slide Rendering', () => {
  let pptx;

  beforeEach(() => {
    pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
  });

  test('should generate detailed slide with complete warehouse data', async () => {
    const warehouse = {
      id: 1,
      address: '123 Test Street, Test City, Test State 12345',
      googleLocation: 'https://maps.google.com/?q=28.7041,77.1025',
      totalSpaceSqft: [10000, 15000],
      warehouseType: 'RCC Structure',
      clearHeightFt: '25 ft',
      ratePerSqft: '25',
      photos: 'https://example.com/photo1.jpg',
      otherSpecifications: 'Loading dock, Security',
      WarehouseData: {
        landType: 'Industrial',
        fireSafetyMeasures: 'Sprinklers, Fire Extinguishers',
        powerKva: '500 KVA'
      },
      geospatial: {
        latitude: 28.7041,
        longitude: 77.1025,
        nearestAirport: { name: 'IGI Airport', distance: 15.2 },
        nearestHighway: { name: 'NH-48', distance: 2.5 },
        nearestRailway: { name: 'New Delhi Railway Station', distance: 8.3 },
        satelliteImage: null // Skip image download in test
      },
      validPhotos: []
    };

    await generateDetailedSlide(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(1);
    const slide = pptx.slides[0];
    expect(slide).toBeDefined();
  });

  test('should generate detailed slide with missing geospatial data', async () => {
    const warehouse = {
      id: 2,
      address: '456 Another Street, Another City',
      totalSpaceSqft: [5000],
      warehouseType: 'Prefab',
      clearHeightFt: '20 ft',
      ratePerSqft: '20',
      WarehouseData: {},
      geospatial: {
        latitude: null,
        longitude: null,
        nearestAirport: null,
        nearestHighway: null,
        nearestRailway: null,
        satelliteImage: null
      },
      validPhotos: []
    };

    await generateDetailedSlide(pptx, warehouse, 2);

    expect(pptx.slides).toHaveLength(1);
    const slide = pptx.slides[0];
    expect(slide).toBeDefined();
  });

  test('should generate detailed slide with missing optional fields', async () => {
    const warehouse = {
      id: 3,
      address: '789 Minimal Street',
      totalSpaceSqft: [8000],
      warehouseType: 'RCC',
      geospatial: {
        latitude: 28.7041,
        longitude: 77.1025,
        nearestAirport: { name: 'Airport', distance: 10.0 },
        nearestHighway: null,
        nearestRailway: null,
        satelliteImage: null
      },
      validPhotos: []
    };

    await generateDetailedSlide(pptx, warehouse, 3);

    expect(pptx.slides).toHaveLength(1);
    const slide = pptx.slides[0];
    expect(slide).toBeDefined();
  });

  test('should handle warehouse with no WarehouseData object', async () => {
    const warehouse = {
      id: 4,
      address: 'No Data Street',
      totalSpaceSqft: [3000],
      warehouseType: 'Basic',
      geospatial: {
        latitude: null,
        longitude: null,
        nearestAirport: null,
        nearestHighway: null,
        nearestRailway: null,
        satelliteImage: null
      },
      validPhotos: []
    };

    await generateDetailedSlide(pptx, warehouse, 4);

    expect(pptx.slides).toHaveLength(1);
  });

  test('should handle warehouse with empty geospatial object', async () => {
    const warehouse = {
      id: 5,
      address: 'Empty Geospatial Street',
      totalSpaceSqft: [2000],
      warehouseType: 'Standard',
      geospatial: {},
      validPhotos: []
    };

    await generateDetailedSlide(pptx, warehouse, 5);

    expect(pptx.slides).toHaveLength(1);
  });
});

describe('DetailedSlide - Photo Slides Generation', () => {
  let pptx;

  beforeEach(() => {
    pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';
  });

  test('should not generate photo slides with 0 photos', async () => {
    const warehouse = {
      id: 1,
      validPhotos: []
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(0);
  });

  test('should generate 1 slide with 1 photo', async () => {
    const warehouse = {
      id: 2,
      validPhotos: ['https://via.placeholder.com/800x600']
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(1);
  });

  test('should generate 1 slide with 2 photos', async () => {
    const warehouse = {
      id: 3,
      validPhotos: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600'
      ]
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(1);
  });

  test('should generate 1 slide with 3 photos', async () => {
    const warehouse = {
      id: 4,
      validPhotos: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600'
      ]
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(1);
  });

  test('should generate 1 slide with 4 photos', async () => {
    const warehouse = {
      id: 5,
      validPhotos: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600'
      ]
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(1);
  });

  test('should generate 2 slides with 5 photos', async () => {
    const warehouse = {
      id: 6,
      validPhotos: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600'
      ]
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(2);
  });

  test('should generate 2 slides with 8 photos', async () => {
    const warehouse = {
      id: 7,
      validPhotos: [
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600',
        'https://via.placeholder.com/800x600'
      ]
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(2);
  });

  test('should generate 3 slides with 10 photos', async () => {
    const warehouse = {
      id: 8,
      validPhotos: Array(10).fill('https://via.placeholder.com/800x600')
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(3);
  });

  test('should handle invalid image URLs gracefully', async () => {
    const warehouse = {
      id: 9,
      validPhotos: [
        'https://invalid-domain-that-does-not-exist-12345.com/photo.jpg',
        'https://invalid-domain-that-does-not-exist-12345.com/photo2.jpg'
      ]
    };

    // Should not throw error, but create placeholder rectangles
    await expect(generatePhotoSlides(pptx, warehouse, 1)).resolves.not.toThrow();
    expect(pptx.slides).toHaveLength(1);
  });

  test('should handle warehouse without validPhotos property', async () => {
    const warehouse = {
      id: 10
    };

    await generatePhotoSlides(pptx, warehouse, 1);

    expect(pptx.slides).toHaveLength(0);
  });
});
