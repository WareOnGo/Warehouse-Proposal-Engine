const axios = require('axios');
const { logError, logWarn, logInfo } = require('../utils/logger');

/**
 * Retry helper function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {number} maxRetries - Maximum number of retries (default: 2)
 * @param {number} baseDelay - Base delay in ms (default: 1000)
 * @returns {Promise} Result of the function or null on failure
 */
async function retryWithBackoff(fn, maxRetries = 2, baseDelay = 1000) {
  let lastError;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (attempt < maxRetries) {
        const delay = baseDelay * Math.pow(2, attempt); // Exponential backoff
        logWarn('geospatialService', 'retryWithBackoff', `Attempt ${attempt + 1} failed, retrying in ${delay}ms`, {
          error: error.message,
          attempt: attempt + 1,
          maxRetries: maxRetries + 1
        });
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  // All retries failed
  logError('geospatialService', 'retryWithBackoff', 'All retry attempts failed', {
    error: lastError?.message,
    attempts: maxRetries + 1
  });
  return null;
}

// Rate limiter class for API throttling
class RateLimiter {
  constructor(requestsPerSecond) {
    this.delay = 1000 / requestsPerSecond;
    this.lastRequest = 0;
  }

  async throttle() {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequest;
    if (timeSinceLastRequest < this.delay) {
      await new Promise(resolve =>
        setTimeout(resolve, this.delay - timeSinceLastRequest)
      );
    }
    this.lastRequest = Date.now();
  }
}

// In-memory cache with TTL
class Cache {
  constructor(ttl = 5 * 60 * 1000) {
    this.cache = new Map();
    this.ttl = ttl;
  }

  get(key) {
    const item = this.cache.get(key);
    if (item && Date.now() - item.timestamp < this.ttl) {
      return item.value;
    }
    this.cache.delete(key);
    return null;
  }

  set(key, value) {
    this.cache.set(key, { value, timestamp: Date.now() });
  }
}

// Initialize rate limiter and cache
const rateLimiter = new RateLimiter(1); // 1 request per second
const cache = new Cache();

// Configure axios instance with relaxed timeouts
const axiosInstance = axios.create({
  timeout: 60000, // 60 seconds
  headers: {
    'User-Agent': 'WarehousePPTGenerator/1.0'
  }
});

/**
 * Extract coordinates from Google Maps URL or coordinate string
 * @param {string} googleLocation - Google Maps URL or coordinate string
 * @returns {Promise<{latitude: number, longitude: number} | null>}
 */
async function extractCoordinates(googleLocation) {
  if (!googleLocation || typeof googleLocation !== 'string') {
    return null;
  }

  try {
    // Pattern 1: ?q= parameter
    const qMatch = googleLocation.match(/[?&]q=(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/);
    if (qMatch) {
      return {
        latitude: parseFloat(qMatch[1]),
        longitude: parseFloat(qMatch[2])
      };
    }

    // Pattern 2: /@lat,lon format
    const atMatch = googleLocation.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (atMatch) {
      return {
        latitude: parseFloat(atMatch[1]),
        longitude: parseFloat(atMatch[2])
      };
    }

    // Pattern 2.5: Google Maps data parameters !3d(lat)!4d(lon)
    const dataMatch = googleLocation.match(/!3d(-?\d+\.?\d*)!4d(-?\d+\.?\d*)/);
    if (dataMatch) {
      return {
        latitude: parseFloat(dataMatch[1]),
        longitude: parseFloat(dataMatch[2])
      };
    }

    // Pattern 3: /place/lat,lon format
    const placeMatch = googleLocation.match(/\/place\/(-?\d+\.?\d*),(-?\d+\.?\d*)/);
    if (placeMatch) {
      return {
        latitude: parseFloat(placeMatch[1]),
        longitude: parseFloat(placeMatch[2])
      };
    }

    // Pattern 4: Direct coordinates
    const coordMatch = googleLocation.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordMatch) {
      return {
        latitude: parseFloat(coordMatch[1]),
        longitude: parseFloat(coordMatch[2])
      };
    }

    // Pattern 5: Shortened goo.gl URLs - follow redirect to get full URL
    if (googleLocation.includes('goo.gl') || googleLocation.includes('maps.app.goo.gl')) {
      try {
        const response = await axiosInstance.get(googleLocation, {
          maxRedirects: 5,
          validateStatus: (status) => status >= 200 && status < 400,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
          }
        });
        
        // Try multiple ways to get the final URL
        const finalUrl = response.request?.res?.responseUrl || 
                        response.request?.path || 
                        response.headers?.location ||
                        response.config?.url || 
                        googleLocation;
        
        logInfo('geospatialService', 'extractCoordinates', 'Resolved shortened URL', {
          originalUrl: googleLocation,
          finalUrl: finalUrl
        });
        
        if (finalUrl !== googleLocation) {
          return extractCoordinates(finalUrl);
        }
      } catch (error) {
        logError('geospatialService', 'extractCoordinates', 'Failed to resolve shortened URL', {
          url: googleLocation,
          error: error.message,
          errorCode: error.code
        });
        return null;
      }
    }

    return null;
  } catch (error) {
    logError('geospatialService', 'extractCoordinates', 'Error extracting coordinates', {
      googleLocation,
      error: error.message
    });
    return null;
  }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in kilometers rounded to 1 decimal place
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return Math.round(distance * 10) / 10; // Round to 1 decimal place
}

function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Find nearest airport using Nominatim API (more reliable than Overpass)
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{name: string, distance: number} | null>}
 */
async function findNearestAirport(lat, lon) {
  const cacheKey = `airport:${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await retryWithBackoff(async () => {
    await rateLimiter.throttle();

    // Use Nominatim reverse geocoding to search for airports
    // Search within ~100km radius
    const response = await axiosInstance.get(
      'https://nominatim.openstreetmap.org/search',
      {
        params: {
          q: 'airport',
          format: 'json',
          limit: 10,
          viewbox: `${lon - 1},${lat - 1},${lon + 1},${lat + 1}`,
          bounded: 1
        },
        headers: {
          'User-Agent': 'WarehousePPTGenerator/1.0'
        },
        timeout: 15000
      }
    );

    if (!response.data || response.data.length === 0) {
      // Fallback: try wider search without bounds
      const fallbackResponse = await axiosInstance.get(
        'https://nominatim.openstreetmap.org/search',
        {
          params: {
            q: `airport near ${lat},${lon}`,
            format: 'json',
            limit: 5
          },
          headers: {
            'User-Agent': 'WarehousePPTGenerator/1.0'
          },
          timeout: 15000
        }
      );

      if (!fallbackResponse.data || fallbackResponse.data.length === 0) {
        logWarn('geospatialService', 'findNearestAirport', 'No airports found near coordinates', {
          lat,
          lon
        });
        cache.set(cacheKey, null);
        return null;
      }

      response.data = fallbackResponse.data;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const place of response.data) {
      if (place.lat && place.lon) {
        const placeLat = parseFloat(place.lat);
        const placeLon = parseFloat(place.lon);
        const distance = calculateDistance(lat, lon, placeLat, placeLon);
        
        if (distance < minDistance && distance < 200) { // Within 200km
          minDistance = distance;
          nearest = {
            name: place.display_name?.split(',')[0] || 'Airport',
            distance: distance
          };
        }
      }
    }

    cache.set(cacheKey, nearest);
    return nearest;
  });

  if (result === null) {
    cache.set(cacheKey, null);
  }
  
  return result;
}

/**
 * Find nearest highway (National or State) using Overpass API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{name: string, distance: number} | null>}
 */
async function findNearestHighway(lat, lon) {
  const cacheKey = `highway:${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await retryWithBackoff(async () => {
    await rateLimiter.throttle();

    // Search for National Highways (NH) and State Highways (SH) within 100km
    // Using ref tag to identify NH and SH roads
    const query = `
      [out:json][timeout:60];
      (
        way["highway"~"motorway|trunk|primary"]["ref"~"NH"](around:100000,${lat},${lon});
        way["highway"~"motorway|trunk|primary"]["ref"~"SH"](around:100000,${lat},${lon});
        way["highway"~"motorway|trunk"]["name"~"National Highway"](around:100000,${lat},${lon});
        way["highway"~"motorway|trunk"]["name"~"State Highway"](around:100000,${lat},${lon});
      );
      out center 20;
    `;

    const response = await axiosInstance.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { 
        headers: { 'Content-Type': 'text/plain' },
        timeout: 90000 // 90 seconds
      }
    );

    if (!response.data || !response.data.elements || response.data.elements.length === 0) {
      logWarn('geospatialService', 'findNearestHighway', 'No highways found near coordinates', {
        lat,
        lon
      });
      cache.set(cacheKey, null);
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const element of response.data.elements) {
      let centerLat, centerLon;
      
      if (element.center) {
        centerLat = element.center.lat;
        centerLon = element.center.lon;
      } else if (element.bounds) {
        centerLat = (element.bounds.minlat + element.bounds.maxlat) / 2;
        centerLon = (element.bounds.minlon + element.bounds.maxlon) / 2;
      }
      
      if (centerLat && centerLon) {
        const distance = calculateDistance(lat, lon, centerLat, centerLon);
        
        if (distance < minDistance) {
          minDistance = distance;
          
          // Extract highway name/ref
          let highwayName = 'Highway';
          if (element.tags?.ref) {
            highwayName = element.tags.ref;
          } else if (element.tags?.name) {
            // Extract NH/SH number from name if present
            const match = element.tags.name.match(/(NH|SH)[\s-]*(\d+)/i);
            if (match) {
              highwayName = `${match[1].toUpperCase()}-${match[2]}`;
            } else {
              highwayName = element.tags.name;
            }
          }
          
          nearest = {
            name: highwayName,
            distance: distance
          };
        }
      }
    }

    if (nearest) {
      logInfo('geospatialService', 'findNearestHighway', 'Found nearest highway', {
        lat,
        lon,
        highway: nearest.name,
        distance: nearest.distance
      });
    }

    cache.set(cacheKey, nearest);
    return nearest;
  });

  if (result === null) {
    cache.set(cacheKey, null);
  }
  
  return result;
}

/**
 * Find nearest railway station using Overpass API
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<{name: string, distance: number} | null>}
 */
async function findNearestRailwayStation(lat, lon) {
  const cacheKey = `railway:${lat},${lon}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const result = await retryWithBackoff(async () => {
    await rateLimiter.throttle();

    // Simplified query - search for railway stations within 100km
    const query = `
      [out:json][timeout:60];
      node["railway"="station"](around:100000,${lat},${lon});
      out 10;
    `;

    const response = await axiosInstance.post(
      'https://overpass-api.de/api/interpreter',
      query,
      { 
        headers: { 'Content-Type': 'text/plain' },
        timeout: 90000 // 90 seconds
      }
    );

    if (!response.data || !response.data.elements || response.data.elements.length === 0) {
      logWarn('geospatialService', 'findNearestRailwayStation', 'No railway stations found near coordinates', {
        lat,
        lon
      });
      cache.set(cacheKey, null);
      return null;
    }

    let nearest = null;
    let minDistance = Infinity;

    for (const element of response.data.elements) {
      if (element.lat && element.lon) {
        const distance = calculateDistance(lat, lon, element.lat, element.lon);
        if (distance < minDistance) {
          minDistance = distance;
          nearest = {
            name: element.tags?.name || 'Railway Station',
            distance: distance
          };
        }
      }
    }

    cache.set(cacheKey, nearest);
    return nearest;
  });

  if (result === null) {
    cache.set(cacheKey, null);
  }
  
  return result;
}

/**
 * Generate satellite image URL from coordinates
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level (default: 15)
 * @returns {string | null} Tile URL or null on error
 */
function fetchSatelliteImageUrl(lat, lon, zoom = 15) {
  try {
    // Validate coordinates
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      logWarn('geospatialService', 'fetchSatelliteImageUrl', 'Invalid coordinates provided', {
        lat,
        lon
      });
      return null;
    }

    // Convert lat/lon to tile coordinates
    const n = Math.pow(2, zoom);
    const xtile = Math.floor((lon + 180) / 360 * n);
    const ytile = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);

    // Construct Esri World Imagery tile URL
    const tileUrl = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${zoom}/${ytile}/${xtile}`;
    
    logInfo('geospatialService', 'fetchSatelliteImageUrl', 'Generated satellite image URL', {
      lat,
      lon,
      zoom,
      xtile,
      ytile,
      url: tileUrl
    });
    
    return tileUrl;
  } catch (error) {
    logError('geospatialService', 'fetchSatelliteImageUrl', 'Error generating satellite image URL', {
      lat,
      lon,
      zoom,
      error: error.message,
      stack: error.stack
    });
    return null;
  }
}

module.exports = {
  extractCoordinates,
  calculateDistance,
  findNearestAirport,
  findNearestHighway,
  findNearestRailwayStation,
  fetchSatelliteImageUrl
};
