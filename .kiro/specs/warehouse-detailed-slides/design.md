# Design Document: Detailed Warehouse Slides

## Overview

This feature adds a new endpoint `/api/generate-detailed-ppt` that generates comprehensive warehouse presentations with technical specifications, distance highlights, commercial details, satellite imagery, and all available warehouse photos. The system integrates with OpenStreetMap's free services for geospatial calculations and imagery retrieval.

The detailed presentation maintains the same structure as the standard presentation (title, index, warehouse details, contact) but replaces the main warehouse slides with detailed slides containing:
1. A comprehensive information table with distance highlights, technical details, and commercials
2. A satellite image of the warehouse location
3. Dynamic photo slides displaying all available warehouse images

## Architecture

### High-Level Flow

```
Client Request (warehouse IDs + customDetails)
    ↓
Controller: validateRequest()
    ↓
Service: fetchWarehouseData()
    ↓
Service: enrichWithGeospatialData() → OpenStreetMap APIs
    ↓
Service: generateDetailedPresentation()
    ├─→ generateTitleSlide() [existing]
    ├─→ generateIndexSlide() [existing]
    ├─→ generateDetailedSlide() [new] → for each warehouse
    │   ├─→ calculateDistances() → Nominatim + Overpass API
    │   ├─→ fetchSatelliteImage() → OSM Static Map
    │   └─→ renderDetailsTable()
    ├─→ generatePhotoSlides() [new] → for each warehouse
    │   └─→ dynamicImageLayout()
    └─→ generateContactSlide() [existing]
    ↓
Return: PowerPoint buffer
```

### Component Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    warehouseController.js                    │
│  - generateDetailedPresentation()                            │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   detailedPptService.js (NEW)                │
│  - createDetailedPptBuffer()                                 │
│  - enrichWarehouseWithGeospatialData()                       │
└────────────┬───────────────────────────┬────────────────────┘
             │                           │
             ↓                           ↓
┌────────────────────────┐   ┌──────────────────────────────┐
│  geospatialService.js  │   │  ppt-slides/detailedSlide.js │
│  (NEW)                 │   │  (NEW)                       │
│  - extractCoordinates()│   │  - generateDetailedSlide()   │
│  - calculateDistance() │   │  - generatePhotoSlides()     │
│  - findNearestPOI()    │   └──────────────────────────────┘
│  - fetchSatelliteMap() │
└────────────┬───────────┘
             │
             ↓
┌────────────────────────────────────────────────────────────┐
│              OpenStreetMap Services (External)              │
│  - Nominatim API (geocoding/reverse geocoding)             │
│  - Overpass API (POI queries)                              │
│  - Static Map Tiles (satellite imagery)                    │
└────────────────────────────────────────────────────────────┘
```

## Components and Interfaces

### 1. Controller Layer

**File:** `controllers/warehouseController.js`

**New Function:** `generateDetailedPresentation(req, res)`

```javascript
// Request body structure
{
  ids: "1,2,3",  // comma-separated warehouse IDs
  customDetails: {
    companyName: "ABC Logistics",
    employeeName: "John Doe"
  }
}

// Response: PowerPoint file buffer
// Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

**Responsibilities:**
- Validate request parameters (warehouse IDs, customDetails)
- Parse comma-separated IDs
- Call detailedPptService to generate presentation
- Set appropriate response headers
- Handle errors and return appropriate HTTP status codes

### 2. Service Layer - Detailed PPT Service

**File:** `services/detailedPptService.js` (NEW)

**Main Function:** `createDetailedPptBuffer(warehouses, customDetails)`

**Key Functions:**
- `enrichWarehouseWithGeospatialData(warehouse)` - Extracts coordinates and calculates distances
- `parsePhotos(photosString)` - Parses and validates photo URLs from database
- `createDetailedPptBuffer(warehouses, customDetails)` - Orchestrates presentation generation

**Interface:**
```javascript
// Input: Array of warehouse objects from database
// Output: Promise<Buffer> - PowerPoint file buffer

// Enriched warehouse object structure
{
  ...warehouseData,
  geospatial: {
    latitude: 28.7041,
    longitude: 77.1025,
    nearestAirport: { name: "IGI Airport", distance: 15.2 },
    nearestHighway: { name: "NH-48", distance: 2.5 },
    nearestRailway: { name: "New Delhi Railway Station", distance: 8.3 },
    satelliteImageUrl: "https://..."
  },
  validPhotos: ["url1", "url2", ...]
}
```

### 3. Service Layer - Geospatial Service

**File:** `services/geospatialService.js` (NEW)

**Key Functions:**

**`extractCoordinates(googleLocation)`**
- Parses Google Maps URL or coordinates string (async function)
- Returns `{ latitude, longitude }` or `null`
- Handles multiple URL formats:
  - `https://maps.google.com/?q=28.7041,77.1025`
  - `https://www.google.com/maps/place/.../@28.7041,77.1025`
  - `https://maps.app.goo.gl/xxxxx` (follows HTTP redirects to resolve)
  - Direct coordinates: `"28.7041, 77.1025"`
- For shortened URLs (goo.gl), follows redirects to get full URL then extracts coordinates

**`findNearestAirport(lat, lon)`**
- Uses Overpass API to query airports within 100km radius
- Query: `[out:json];node["aeroway"="aerodrome"](around:100000,${lat},${lon});out;`
- Calculates distances using Haversine formula
- Returns `{ name, distance }` or `null`

**`findNearestHighway(lat, lon)`**
- Uses Overpass API to query national highways within 50km
- Query: `[out:json];way["highway"~"motorway|trunk"]["ref"~"NH"](around:50000,${lat},${lon});out;`
- Returns `{ name, distance }` or `null`

**`findNearestRailwayStation(lat, lon)`**
- Uses Overpass API to query railway stations within 50km
- Query: `[out:json];node["railway"="station"](around:50000,${lat},${lon});out;`
- Returns `{ name, distance }` or `null`

**`calculateDistance(lat1, lon1, lat2, lon2)`**
- Implements Haversine formula for distance calculation
- Returns distance in kilometers (rounded to 1 decimal place)

**`fetchSatelliteImageUrl(lat, lon, zoom = 15)`**
- Constructs static map URL using OSM tile servers
- Uses satellite/aerial imagery tiles from providers like Esri World Imagery
- Format: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
- Converts lat/lon to tile coordinates
- Returns tile URL or null on error

**API Rate Limiting & Error Handling:**
- Implements exponential backoff for failed requests
- Caches results temporarily (in-memory, 5-minute TTL)
- Returns `null` for failed operations (graceful degradation)
- Logs all API errors with context

### 4. Presentation Layer - Detailed Slide

**File:** `ppt-slides/detailedSlide.js` (NEW)

**Function:** `generateDetailedSlide(pptx, warehouse, optionIndex)`

**Slide Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  Option X - [Warehouse Address]                         │
│                                                          │
│  ┌──────────────────────┐  ┌────────────────────────┐  │
│  │ Distance Highlights  │  │                        │  │
│  │ • Airport: X km      │  │   Satellite Image      │  │
│  │ • Highway: X km      │  │   (from OSM)           │  │
│  │ • Railway: X km      │  │                        │  │
│  │ • Road Width: TBD    │  │                        │  │
│  ├──────────────────────┤  └────────────────────────┘  │
│  │ Address              │                              │
│  │ [Full address]       │                              │
│  ├──────────────────────┤                              │
│  │ Technical Details    │                              │
│  │ • Carpet Area: X     │                              │
│  │ • Land Type: X       │                              │
│  │ • Construction: X    │                              │
│  │ • Side Height: X     │                              │
│  │ • Fire Safety: X     │                              │
│  │ • Power: X           │                              │
│  │ • Amenities: X       │                              │
│  ├──────────────────────┤                              │
│  │ Commercials          │                              │
│  │ • Rent/sqft: ₹X      │                              │
│  │ • Escalation: 5% YoY │                              │
│  └──────────────────────┘                              │
└─────────────────────────────────────────────────────────┘
```

**Responsibilities:**
- Render distance highlights section with calculated distances
- Display detailed address
- Create technical details table with database values
- Create commercials table with pricing information
- Embed satellite image from OSM
- Handle missing data gracefully (display "N/A" or "TBD")

### 5. Presentation Layer - Photo Slides

**File:** `ppt-slides/detailedSlide.js` (same file)

**Function:** `generatePhotoSlides(pptx, warehouse, optionIndex)`

**Dynamic Layout Logic:**
- Parses all valid photo URLs from warehouse.photos
- Groups photos into batches of 4
- For each batch, determines optimal layout:
  - 1 image: Large centered image (7" x 5.5")
  - 2 images: Side-by-side (4" x 5" each)
  - 3 images: One large top (6" x 3.5"), two smaller bottom (2.9" x 2" each)
  - 4 images: 2x2 grid (4" x 2.8" each)
- Creates additional slides for batches beyond the first
- Adds slide header: "Option X - Photos (Page Y of Z)"

**Image Handling:**
- Downloads images using axios with arraybuffer response type
- Converts to base64 data URLs
- Implements error handling for failed downloads
- Displays gray placeholder rectangles for failed images
- Uses 'contain' sizing to prevent distortion

## Data Models

### Database Schema Extensions

**WarehouseData Table** (existing, needs new column):
```prisma
model WarehouseData {
  id                  Int     @id @default(autoincrement())
  latitude            Float?
  longitude           Float?
  centreHeight        String? // NEW COLUMN - currently blank
  // ... existing fields
}
```

### Runtime Data Structures

**EnrichedWarehouse:**
```typescript
interface EnrichedWarehouse {
  // All existing Warehouse fields
  id: number;
  address: string;
  googleLocation: string;
  totalSpaceSqft: number[];
  warehouseType: string;
  clearHeightFt: string;
  ratePerSqft: string;
  photos: string;
  // ... other fields
  
  // New enriched fields
  geospatial: {
    latitude: number | null;
    longitude: number | null;
    nearestAirport: POIInfo | null;
    nearestHighway: POIInfo | null;
    nearestRailway: POIInfo | null;
    satelliteImageUrl: string | null;
  };
  validPhotos: string[];
}

interface POIInfo {
  name: string;
  distance: number; // in kilometers
}
```

## Error Handling

### Error Categories and Responses

**1. Request Validation Errors (400)**
- Missing or invalid warehouse IDs
- Invalid customDetails format
- Response: `{ error: "Invalid or no Warehouse IDs provided." }`

**2. Resource Not Found (404)**
- Warehouse IDs not found in database
- Response: `{ error: "Warehouses with IDs X, Y not found." }`

**3. External API Failures (Graceful Degradation)**
- OpenStreetMap API timeout/failure
- Invalid geospatial coordinates
- Image download failures
- **Action:** Log error, display "N/A" in presentation, continue processing
- **No HTTP error returned** - partial presentation generated

**4. Internal Server Errors (500)**
- Database connection failures
- PowerPoint generation failures
- Unexpected exceptions
- Response: `{ error: "An internal server error occurred during detailed PPT generation." }`

### Logging Strategy

```javascript
// Error log format
{
  timestamp: "2025-11-18T10:30:00Z",
  level: "ERROR",
  component: "geospatialService",
  function: "findNearestAirport",
  warehouseId: 123,
  message: "Overpass API timeout",
  details: { lat: 28.7041, lon: 77.1025, timeout: 5000 }
}
```

**Log Levels:**
- ERROR: API failures, invalid data, exceptions
- WARN: Missing optional data, fallback to defaults
- INFO: Successful API calls, processing milestones
- DEBUG: Detailed request/response data (development only)

## Testing Strategy

### Unit Tests

**geospatialService.js:**
- `extractCoordinates()` with various URL formats
- `calculateDistance()` with known coordinate pairs
- `findNearestAirport/Highway/Railway()` with mocked Overpass responses
- Error handling for invalid coordinates

**detailedPptService.js:**
- `parsePhotos()` with valid/invalid URL strings
- `enrichWarehouseWithGeospatialData()` with complete/partial data
- Error handling for missing geospatial data

**detailedSlide.js:**
- Table rendering with complete data
- Table rendering with missing fields (N/A display)
- Photo layout logic for 1, 2, 3, 4+ images

### Integration Tests

**End-to-End Presentation Generation:**
- Single warehouse with complete data
- Multiple warehouses (2-3)
- Warehouse with missing geospatial data
- Warehouse with no photos
- Warehouse with 10+ photos (multiple photo slides)

**External API Integration:**
- Mock OpenStreetMap API responses
- Test timeout handling
- Test rate limiting scenarios
- Test graceful degradation

### Manual Testing Checklist

- [ ] Generate presentation with valid warehouse IDs
- [ ] Verify distance calculations accuracy (spot check with Google Maps)
- [ ] Verify satellite image displays correctly
- [ ] Test with warehouse missing googleLocation
- [ ] Test with warehouse having 0, 1, 2, 3, 4, 8 photos
- [ ] Test with multiple warehouses (3+)
- [ ] Verify title and contact slides use customDetails
- [ ] Test with invalid image URLs
- [ ] Verify presentation doesn't timeout with 5+ warehouses

## OpenStreetMap Integration Details

### APIs Used (All Free, No API Keys Required)

**1. Nominatim API**
- Purpose: Reverse geocoding, address lookup
- Endpoint: `https://nominatim.openstreetmap.org/`
- Rate Limit: 1 request/second
- Usage Policy: Must include User-Agent header
- Example: `https://nominatim.openstreetmap.org/reverse?lat=28.7041&lon=77.1025&format=json`

**2. Overpass API**
- Purpose: Query POIs (airports, highways, railway stations)
- Endpoint: `https://overpass-api.de/api/interpreter`
- Rate Limit: Reasonable use (no strict limit)
- Query Language: Overpass QL
- Example Query:
```
[out:json];
node["aeroway"="aerodrome"](around:100000,28.7041,77.1025);
out body;
```

**3. Tile Servers for Satellite Imagery**
- **Esri World Imagery** (Free for non-commercial use):
  - `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}`
  - Zoom levels: 0-19
  - No API key required
- **Alternative:** OpenStreetMap standard tiles (fallback)
  - `https://tile.openstreetmap.org/{z}/{x}/{y}.png`

### Rate Limiting Strategy

```javascript
// Simple rate limiter implementation
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

// Usage: await rateLimiter.throttle() before each API call
```

### Coordinate Extraction Patterns

```javascript
// Google Maps URL patterns to handle:
// 1. https://maps.google.com/?q=28.7041,77.1025
// 2. https://www.google.com/maps/place/.../@28.7041,77.1025,17z/...
// 3. https://www.google.com/maps?q=28.7041,77.1025
// 4. Direct coordinates: "28.7041, 77.1025"
// 5. Shortened URLs: https://maps.app.goo.gl/cGzHow8M1ytUaSwp8 (requires HTTP redirect follow)
// 6. Plus codes: "8FRV+XY New Delhi" (requires Nominatim lookup)

async function extractCoordinates(googleLocation) {
  if (!googleLocation) return null;
  
  // Pattern 1: ?q= parameter
  const qMatch = googleLocation.match(/[?&]q=(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lon: parseFloat(qMatch[2]) };
  
  // Pattern 2: /@lat,lon format
  const atMatch = googleLocation.match(/@(-?\d+\.?\d*),(-?\d+\.?\d*)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lon: parseFloat(atMatch[2]) };
  
  // Pattern 3: Direct coordinates
  const coordMatch = googleLocation.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
  if (coordMatch) return { lat: parseFloat(coordMatch[1]), lon: parseFloat(coordMatch[2]) };
  
  // Pattern 4: Shortened goo.gl URLs - follow redirect to get full URL
  if (googleLocation.includes('goo.gl') || googleLocation.includes('maps.app.goo.gl')) {
    try {
      const response = await axios.get(googleLocation, {
        maxRedirects: 5,
        validateStatus: (status) => status >= 200 && status < 400
      });
      // Recursively extract from the final URL
      return extractCoordinates(response.request.res.responseUrl || response.config.url);
    } catch (error) {
      console.error('Failed to resolve shortened URL:', error.message);
      return null;
    }
  }
  
  return null;
}
```

## Performance Considerations

### Timeout Configuration

```javascript
// Express server configuration
app.use('/api/generate-detailed-ppt', (req, res, next) => {
  req.setTimeout(300000); // 5 minutes
  res.setTimeout(300000);
  next();
});

// Axios configuration for external APIs
const axiosInstance = axios.create({
  timeout: 10000, // 10 seconds per API call
  headers: {
    'User-Agent': 'WarehousePPTGenerator/1.0'
  }
});
```

### Caching Strategy

**In-Memory Cache (Simple Implementation):**
```javascript
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function getCached(key) {
  const item = cache.get(key);
  if (item && Date.now() - item.timestamp < CACHE_TTL) {
    return item.value;
  }
  cache.delete(key);
  return null;
}

function setCache(key, value) {
  cache.set(key, { value, timestamp: Date.now() });
}

// Cache keys:
// - `airport:${lat},${lon}` - nearest airport
// - `highway:${lat},${lon}` - nearest highway
// - `railway:${lat},${lon}` - nearest railway station
```

### Optimization Strategies

1. **Parallel Processing:** Fetch distance data for all POI types concurrently using `Promise.all()`
2. **Image Optimization:** Download images in parallel (max 5 concurrent)
3. **Early Validation:** Validate all warehouse IDs before starting geospatial enrichment
4. **Graceful Degradation:** Continue processing even if some external API calls fail
5. **Batch Processing:** Process warehouses sequentially to avoid overwhelming external APIs

## Security Considerations

1. **Input Validation:**
   - Sanitize warehouse IDs (only accept positive integers)
   - Validate customDetails fields (max length, allowed characters)
   - Validate image URLs (whitelist domains if needed)

2. **External API Safety:**
   - Set timeouts on all external requests
   - Validate response data before processing
   - Handle malformed responses gracefully

3. **Resource Limits:**
   - Limit maximum number of warehouses per request (e.g., 10)
   - Limit maximum presentation size (e.g., 50MB)
   - Implement request rate limiting per client

4. **Error Information Disclosure:**
   - Don't expose internal error details to clients
   - Log detailed errors server-side only
   - Return generic error messages to users

## Migration and Deployment

### Database Migration

```sql
-- Add centreHeight column to WarehouseData table
ALTER TABLE "WarehouseData" 
ADD COLUMN "centreHeight" TEXT;
```

### Environment Variables

```env
# .env additions
OSM_USER_AGENT=WarehousePPTGenerator/1.0
OSM_REQUEST_TIMEOUT=10000
DETAILED_PPT_TIMEOUT=300000
MAX_WAREHOUSES_PER_REQUEST=10
```

### Deployment Checklist

- [ ] Run database migration
- [ ] Update environment variables
- [ ] Install new dependencies (axios if not already present)
- [ ] Test with staging database
- [ ] Verify OpenStreetMap API accessibility from server
- [ ] Monitor initial requests for errors
- [ ] Set up logging/monitoring for new endpoint

## Future Enhancements

1. **Database Optimization:**
   - Pre-calculate and store distances in WarehouseData table
   - Add indexes on geospatial columns
   - Implement PostGIS for advanced geospatial queries

2. **Caching Improvements:**
   - Use Redis for distributed caching
   - Cache satellite images locally
   - Implement cache warming for popular warehouses

3. **Feature Additions:**
   - Add distance to major cities
   - Include traffic/accessibility scores
   - Add weather data for warehouse location
   - Support custom distance units (km/miles)

4. **UI Enhancements:**
   - Allow users to select which photos to include
   - Provide preview before generating full presentation
   - Support custom slide templates/themes
