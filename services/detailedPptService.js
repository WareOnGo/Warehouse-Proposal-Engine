const PptxGenJS = require('pptxgenjs');
const geospatialService = require('./geospatialService');
const { generateTitleSlide } = require('../ppt-slides/titleSlide');
const { generateIndexSlide } = require('../ppt-slides/indexSlide');
const { generateContactSlide } = require('../ppt-slides/contactSlide');
const { logError, logWarn, logInfo } = require('../utils/logger');

// Import detailed slide generation functions (will be created in task 3)
let generateDetailedSlide, generatePhotoSlides;
try {
  const detailedSlideModule = require('../ppt-slides/detailedSlide');
  generateDetailedSlide = detailedSlideModule.generateDetailedSlide;
  generatePhotoSlides = detailedSlideModule.generatePhotoSlides;
} catch (error) {
  // Module not yet created - will be implemented in task 3
  console.warn('detailedSlide module not yet available');
}

/**
 * Parse photo URLs from database field
 * Handles comma-separated strings or JSON arrays
 * @param {string|Array} photosString - Photos field from database
 * @returns {Array<string>} Array of valid photo URLs
 */
function parsePhotos(photosString) {
  if (!photosString) {
    return [];
  }

  let photoUrls = [];

  try {
    // If it's already an array, use it directly
    if (Array.isArray(photosString)) {
      photoUrls = photosString;
    }
    // Try parsing as JSON array
    else if (typeof photosString === 'string' && photosString.trim().startsWith('[')) {
      photoUrls = JSON.parse(photosString);
    }
    // Parse as comma-separated string
    else if (typeof photosString === 'string') {
      photoUrls = photosString.split(',').map(url => url.trim());
    }
  } catch (error) {
    logError('detailedPptService', 'parsePhotos', 'Error parsing photos', {
      error: error.message,
      photosString: typeof photosString === 'string' ? photosString.substring(0, 100) : photosString
    });
    // If JSON parsing fails, try comma-separated
    if (typeof photosString === 'string') {
      photoUrls = photosString.split(',').map(url => url.trim());
    }
  }

  // Validate URLs and filter out invalid entries
  const validUrls = photoUrls.filter(url => {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const trimmedUrl = url.trim();
    
    // Check if it's a valid URL format
    try {
      // Basic URL validation - must start with http:// or https://
      if (trimmedUrl.startsWith('http://') || trimmedUrl.startsWith('https://')) {
        new URL(trimmedUrl); // This will throw if invalid
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  });

  return validUrls;
}

/**
 * Enrich warehouse with geospatial data
 * @param {Object} warehouse - Warehouse object from database
 * @returns {Promise<Object>} Enriched warehouse object with geospatial data
 */
async function enrichWarehouseWithGeospatialData(warehouse) {
  const enrichedWarehouse = {
    ...warehouse,
    geospatial: {
      latitude: null,
      longitude: null,
      nearestAirport: null,
      nearestHighway: null,
      nearestRailway: null,
      satelliteImageUrl: null
    },
    validPhotos: parsePhotos(warehouse.photos)
  };

  try {
    logInfo('detailedPptService', 'enrichWarehouseWithGeospatialData', 'Starting geospatial enrichment', {
      warehouseId: warehouse.id,
      googleLocation: warehouse.googleLocation
    });

    // Extract coordinates from googleLocation
    const coordinates = await geospatialService.extractCoordinates(warehouse.googleLocation);
    
    if (!coordinates) {
      logWarn('detailedPptService', 'enrichWarehouseWithGeospatialData', 'No coordinates found for warehouse', {
        warehouseId: warehouse.id,
        googleLocation: warehouse.googleLocation
      });
      return enrichedWarehouse;
    }

    logInfo('detailedPptService', 'enrichWarehouseWithGeospatialData', 'Coordinates extracted successfully', {
      warehouseId: warehouse.id,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude
    });

    enrichedWarehouse.geospatial.latitude = coordinates.latitude;
    enrichedWarehouse.geospatial.longitude = coordinates.longitude;

    // Fetch geospatial data in parallel
    const [nearestAirport, nearestHighway, nearestRailway] = await Promise.all([
      geospatialService.findNearestAirport(coordinates.latitude, coordinates.longitude),
      geospatialService.findNearestHighway(coordinates.latitude, coordinates.longitude),
      geospatialService.findNearestRailwayStation(coordinates.latitude, coordinates.longitude)
    ]);

    enrichedWarehouse.geospatial.nearestAirport = nearestAirport;
    enrichedWarehouse.geospatial.nearestHighway = nearestHighway;
    enrichedWarehouse.geospatial.nearestRailway = nearestRailway;

    logInfo('detailedPptService', 'enrichWarehouseWithGeospatialData', 'Geospatial data fetched', {
      warehouseId: warehouse.id,
      hasAirport: !!nearestAirport,
      hasHighway: !!nearestHighway,
      hasRailway: !!nearestRailway
    });

    // Fetch satellite image URL
    enrichedWarehouse.geospatial.satelliteImageUrl = geospatialService.fetchSatelliteImageUrl(
      coordinates.latitude,
      coordinates.longitude
    );

    logInfo('detailedPptService', 'enrichWarehouseWithGeospatialData', 'Satellite image URL generated', {
      warehouseId: warehouse.id,
      satelliteImageUrl: enrichedWarehouse.geospatial.satelliteImageUrl
    });

  } catch (error) {
    logError('detailedPptService', 'enrichWarehouseWithGeospatialData', 'Error enriching warehouse with geospatial data', {
      warehouseId: warehouse.id,
      error: error.message,
      stack: error.stack
    });
  }

  return enrichedWarehouse;
}

/**
 * Create detailed PPT buffer with enriched warehouse data
 * @param {Array} warehouses - Array of warehouse objects from database
 * @param {Object} customDetails - Custom details for title and contact slides
 * @returns {Promise<Buffer>} PowerPoint file buffer
 */
async function createDetailedPptBuffer(warehouses, customDetails) {
  // Initialize PptxGenJS with widescreen layout
  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_WIDE';

  // Generate title slide using existing function
  if (warehouses.length > 0) {
    generateTitleSlide(pptx, warehouses[0], customDetails);
  }

  // Generate index slide using existing function
  generateIndexSlide(pptx, warehouses);

  // Loop through warehouses and enrich with geospatial data
  let optionIndex = 1;
  for (const warehouse of warehouses) {
    logInfo('detailedPptService', 'createDetailedPptBuffer', 'Processing warehouse', {
      warehouseId: warehouse.id,
      optionIndex
    });
    
    // Enrich warehouse with geospatial data
    const enrichedWarehouse = await enrichWarehouseWithGeospatialData(warehouse);

    // Generate detailed slide for this warehouse
    if (generateDetailedSlide) {
      await generateDetailedSlide(pptx, enrichedWarehouse, optionIndex);
    } else {
      logWarn('detailedPptService', 'createDetailedPptBuffer', 'Skipping detailed slide - module not available', {
        warehouseId: warehouse.id
      });
    }

    // Generate photo slides for this warehouse
    if (generatePhotoSlides && enrichedWarehouse.validPhotos.length > 0) {
      await generatePhotoSlides(pptx, enrichedWarehouse, optionIndex);
    } else if (enrichedWarehouse.validPhotos.length > 0) {
      logWarn('detailedPptService', 'createDetailedPptBuffer', 'Skipping photo slides - module not available', {
        warehouseId: warehouse.id,
        photoCount: enrichedWarehouse.validPhotos.length
      });
    }

    optionIndex++;
  }

  // Generate contact slide using existing function
  generateContactSlide(pptx, customDetails);

  // Generate and return the file buffer
  return await pptx.write('base64').then(base64 => Buffer.from(base64, 'base64'));
}

module.exports = {
  parsePhotos,
  enrichWarehouseWithGeospatialData,
  createDetailedPptBuffer
};
