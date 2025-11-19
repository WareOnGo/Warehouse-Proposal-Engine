const geospatialService = require('./geospatialService');

// These tests make real API calls to OpenStreetMap services
// They may be slower and could fail if the API is unavailable
describe('GeospatialService - OpenStreetMap API Integration', () => {
  // Increase timeout for API calls
  jest.setTimeout(30000);

  test('should find nearest airport with real coordinates (New Delhi)', async () => {
    const lat = 28.7041;
    const lon = 77.1025;

    const result = await geospatialService.findNearestAirport(lat, lon);

    // Should find an airport near New Delhi
    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('distance');
      expect(typeof result.name).toBe('string');
      expect(typeof result.distance).toBe('number');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.distance).toBeLessThan(100); // Should be within 100km
    }
  });

  test('should find nearest highway with real coordinates (New Delhi)', async () => {
    const lat = 28.7041;
    const lon = 77.1025;

    const result = await geospatialService.findNearestHighway(lat, lon);

    // Should find a highway near New Delhi
    // Note: This might return null if no NH highways are found in the area
    if (result) {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('distance');
      expect(typeof result.name).toBe('string');
      expect(typeof result.distance).toBe('number');
      expect(result.distance).toBeGreaterThan(0);
    }
  });

  test('should find nearest railway station with real coordinates (New Delhi)', async () => {
    const lat = 28.7041;
    const lon = 77.1025;

    const result = await geospatialService.findNearestRailwayStation(lat, lon);

    // Should find a railway station near New Delhi
    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty('name');
      expect(result).toHaveProperty('distance');
      expect(typeof result.name).toBe('string');
      expect(typeof result.distance).toBe('number');
      expect(result.distance).toBeGreaterThan(0);
      expect(result.distance).toBeLessThan(50); // Should be within 50km
    }
  });

  test('should generate satellite image URL for real coordinates', () => {
    const lat = 28.7041;
    const lon = 77.1025;

    const url = geospatialService.fetchSatelliteImageUrl(lat, lon, 15);

    expect(url).not.toBeNull();
    expect(url).toContain('arcgisonline.com');
    expect(url).toContain('/tile/15/');
    
    // Verify URL structure
    const urlPattern = /https:\/\/server\.arcgisonline\.com\/ArcGIS\/rest\/services\/World_Imagery\/MapServer\/tile\/\d+\/\d+\/\d+/;
    expect(url).toMatch(urlPattern);
  });

  test('should handle coordinates in remote location (Antarctica)', async () => {
    const lat = -75.0;
    const lon = 0.0;

    const airport = await geospatialService.findNearestAirport(lat, lon);
    const highway = await geospatialService.findNearestHighway(lat, lon);
    const railway = await geospatialService.findNearestRailwayStation(lat, lon);

    // Antarctica likely has no nearby infrastructure
    // These should return null or very distant results
    if (airport) {
      expect(airport.distance).toBeGreaterThan(100);
    }
    // Highway and railway are likely null
  });

  test('should respect rate limiting between API calls', async () => {
    const lat = 28.7041;
    const lon = 77.1025;

    const startTime = Date.now();

    // Make 3 sequential API calls
    await geospatialService.findNearestAirport(lat, lon);
    await geospatialService.findNearestHighway(lat, lon);
    await geospatialService.findNearestRailwayStation(lat, lon);

    const endTime = Date.now();
    const duration = endTime - startTime;

    // With 1 request/second rate limiting, 3 calls should take at least 2 seconds
    // (first call immediate, then 1s delay, then 1s delay)
    expect(duration).toBeGreaterThan(2000);
  });

  test('should cache results for repeated queries', async () => {
    const lat = 28.7041;
    const lon = 77.1025;

    // First call - should hit API
    const startTime1 = Date.now();
    const result1 = await geospatialService.findNearestAirport(lat, lon);
    const duration1 = Date.now() - startTime1;

    // Second call - should use cache
    const startTime2 = Date.now();
    const result2 = await geospatialService.findNearestAirport(lat, lon);
    const duration2 = Date.now() - startTime2;

    // Results should be the same
    expect(result1).toEqual(result2);

    // Cached call should be much faster (< 100ms vs potentially seconds)
    expect(duration2).toBeLessThan(100);
  });

  test('should handle API errors gracefully', async () => {
    // Use invalid coordinates that might cause issues
    const lat = 999; // Invalid latitude
    const lon = 999; // Invalid longitude

    const result = await geospatialService.findNearestAirport(lat, lon);

    // Should return null instead of throwing error
    expect(result).toBeNull();
  });

  test('should find different airports for different cities', async () => {
    // New Delhi
    const delhi = await geospatialService.findNearestAirport(28.7041, 77.1025);
    
    // Mumbai
    const mumbai = await geospatialService.findNearestAirport(19.0760, 72.8777);

    // Both should find airports
    expect(delhi).not.toBeNull();
    expect(mumbai).not.toBeNull();

    // They should be different airports
    if (delhi && mumbai) {
      expect(delhi.name).not.toBe(mumbai.name);
    }
  });
});
