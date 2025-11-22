# Warehouse PPT Service - API Documentation

## Overview

The Warehouse PPT Service is a Node.js/Express API that generates PowerPoint presentations from warehouse data stored in a PostgreSQL database. It provides two types of presentations:

1. **Standard Presentation** - Basic warehouse information with selected images
2. **Detailed Presentation** - Comprehensive warehouse data with geospatial information, distance highlights, technical details, commercials, satellite imagery, and photo galleries

## Base URL

```
http://localhost:3001
```

## Authentication

Currently, no authentication is required. The API is designed for internal use.

---

## Endpoints

### 1. Health Check

Check the health status of the server and database connection.

**Endpoint:** `GET /health`

**Response Codes:**
- `200 OK` - Server and database are healthy
- `503 Service Unavailable` - Database connection failed

**Response Body (Success):**
```json
{
  "status": "ok",
  "message": "Server and database connection are healthy."
}
```

**Response Body (Error):**
```json
{
  "status": "error",
  "message": "Server is running, but database connection is unhealthy."
}
```

---

### 2. Get Warehouses

Retrieve warehouse data by IDs.

**Endpoint:** `GET /api/warehouses`

**Query Parameters:**

| Parameter | Type   | Required | Description                          |
|-----------|--------|----------|--------------------------------------|
| ids       | string | Yes      | Comma-separated warehouse IDs (e.g., "1,2,3") |

**Response Codes:**
- `200 OK` - Warehouses found and returned
- `400 Bad Request` - Invalid or missing warehouse IDs
- `404 Not Found` - No warehouses found with provided IDs
- `500 Internal Server Error` - Database or server error

**Response Body (Success):**
```json
[
  {
    "id": 1,
    "address": "123 Industrial Area, City Name, State 12345",
    "googleLocation": "https://maps.google.com/?q=28.7041,77.1025",
    "totalSpaceSqft": [10000, 15000, 20000],
    "warehouseType": "RCC Structure",
    "clearHeightFt": "30 ft",
    "ratePerSqft": "28",
    "photos": "https://example.com/photo1.jpg,https://example.com/photo2.jpg",
    "otherSpecifications": "Loading dock, 24/7 Security, CCTV",
    "WarehouseData": {
      "landType": "Industrial",
      "fireSafetyMeasures": "Sprinklers, Fire Extinguishers, Fire Alarm",
      "powerKva": "500 KVA"
    }
  }
]
```

**Example Request:**
```
GET /api/warehouses?ids=1,2,3
```

---

### 3. Generate Standard Presentation

Generate a standard PowerPoint presentation with basic warehouse information and selected images.

**Endpoint:** `POST /api/generate-ppt`

**Request Headers:**
```
Content-Type: application/json
```

**Request Body:**

| Field          | Type   | Required | Description                                    |
|----------------|--------|----------|------------------------------------------------|
| ids            | string | Yes      | Comma-separated warehouse IDs                  |
| selectedImages | object | No       | Map of warehouse ID to array of image URLs     |
| customDetails  | object | No       | Custom details for title and contact slides    |

**customDetails Object:**

| Field        | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| companyName  | string | No       | Company name for title slide   |
| employeeName | string | No       | Employee name for contact slide|

**Request Body Example:**
```json
{
  "ids": "1,2,3",
  "selectedImages": {
    "1": [
      "https://example.com/warehouse1-photo1.jpg",
      "https://example.com/warehouse1-photo2.jpg"
    ],
    "2": [
      "https://example.com/warehouse2-photo1.jpg"
    ],
    "3": []
  },
  "customDetails": {
    "companyName": "ABC Logistics",
    "employeeName": "John Doe"
  }
}
```

**Response Codes:**
- `200 OK` - Presentation generated successfully
- `400 Bad Request` - Invalid or missing warehouse IDs
- `404 Not Found` - Warehouses not found
- `500 Internal Server Error` - PPT generation failed

**Response Headers (Success):**
```
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="Warehouses_1_2_3.pptx"
```

**Response Body (Success):**
Binary PowerPoint file (.pptx)

**Presentation Contents:**
1. Title slide with company name
2. Index slide listing all warehouses
3. Individual slides for each warehouse with selected images
4. Contact slide with employee information

**Performance:**
- Typical response time: 1-5 seconds
- Depends on number of warehouses and images

---

### 4. Generate Detailed Presentation (NEW)

Generate a comprehensive PowerPoint presentation with geospatial data, distance highlights, technical specifications, commercials, satellite imagery, and photo galleries.

**Endpoint:** `POST /api/generate-detailed-ppt`

**Request Headers:**
```
Content-Type: application/json
```

**Timeout Configuration:**
- Server timeout: 5 minutes (300 seconds)
- Recommended client timeout: 5 minutes

**Request Body:**

| Field          | Type   | Required | Description                                    |
|----------------|--------|----------|------------------------------------------------|
| ids            | string | Yes      | Comma-separated warehouse IDs                  |
| selectedImages | object | No       | Map of warehouse ID to array of image URLs     |
| customDetails  | object | No       | Custom details for title and contact slides    |

**customDetails Object:**

| Field        | Type   | Required | Description                    |
|--------------|--------|----------|--------------------------------|
| companyName  | string | No       | Company name for title slide   |
| employeeName | string | No       | Employee name for contact slide|

**Request Body Example:**
```json
{
  "ids": "1,2,3",
  "selectedImages": {
    "1": [
      "https://example.com/warehouse1-photo1.jpg",
      "https://example.com/warehouse1-photo2.jpg"
    ],
    "2": [
      "https://example.com/warehouse2-photo1.jpg"
    ],
    "3": []
  },
  "customDetails": {
    "companyName": "Premium Logistics Solutions",
    "employeeName": "Sarah Johnson"
  }
}
```

**Response Codes:**
- `200 OK` - Detailed presentation generated successfully
- `400 Bad Request` - Invalid or missing warehouse IDs
- `404 Not Found` - Warehouses not found
- `500 Internal Server Error` - PPT generation failed

**Response Headers (Success):**
```
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
Content-Disposition: attachment; filename="Detailed_Warehouses_1_2_3.pptx"
```

**Response Body (Success):**
Binary PowerPoint file (.pptx)

**Presentation Contents:**

1. **Title Slide**
   - Company name (from customDetails)
   - Warehouse count
   - Generation date

2. **Index Slide**
   - List of all warehouses with addresses
   - Option numbers

3. **For Each Warehouse:**

   a. **Detailed Information Slide**
   - **Distance Highlights Section:**
     - Nearest Airport (name and distance in km)
     - Nearest Highway (name and distance in km)
     - Nearest Railway Station (name and distance in km)
     - Approach Road Width (TBD)
   
   - **Address Section:**
     - Full warehouse address
   
   - **Technical Details Section:**
     - Carpet Area (sqft)
     - Land Type
     - Construction Type
     - Side Height
     - Centre Height (TBD)
     - Dimensions (TBD)
     - Flooring Type (TBD)
     - Load Bearing Capacity (TBD)
     - Dock Height from Floor (TBD)
     - Dock Shutter Dimensions (TBD)
     - Emergency Exit Doors (TBD)
     - Fire Fighting Systems
     - Power (KVA)
     - Other Amenities
   
   - **Commercials Section:**
     - Rent per sqft (₹)
     - Deposit (TBD)
     - Lock-in (TBD)
     - Escalation (5% YoY)
     - Notice Period (TBD)
   
   - **Satellite Image:**
     - High-resolution satellite imagery from Esri World Imagery
     - Displayed on right side of slide
     - Zoom level: 15
     - Placeholder shown if image unavailable

   b. **Photo Slides** (if photos available)
   - Dynamic layouts based on photo count:
     - 1 photo: Large centered image
     - 2 photos: Side-by-side layout
     - 3 photos: One large top, two smaller bottom
     - 4 photos: 2x2 grid
     - 5+ photos: Multiple slides (4 photos per slide)
   - Page numbers for multi-page photo sections
   - Gray placeholders for failed image downloads

4. **Contact Slide**
   - Employee name (from customDetails)
   - Contact information

**Geospatial Data Processing:**

The endpoint automatically enriches warehouse data with geospatial information:

1. **Coordinate Extraction:**
   - Parses Google Maps URLs (various formats)
   - Supports direct coordinate strings
   - Handles shortened URLs (goo.gl)

2. **Distance Calculations:**
   - Uses Haversine formula for accurate distances
   - Rounded to 1 decimal place
   - Distances in kilometers

3. **OpenStreetMap API Integration:**
   - Finds nearest airports (within 100km radius)
   - Finds nearest highways (within 50km radius, NH roads only)
   - Finds nearest railway stations (within 50km radius)
   - Rate limited to 1 request/second
   - Results cached for 5 minutes

4. **Satellite Imagery:**
   - Fetches from Esri World Imagery tile service
   - Automatically calculates tile coordinates
   - Embeds image directly in presentation

**Data Handling:**

- **Missing Coordinates:** Displays "N/A" for geospatial data
- **API Failures:** Shows "N/A" instead of crashing
- **Missing Fields:** Displays "TBD" for unavailable data
- **Invalid Photos:** Shows gray placeholder rectangles
- **Empty Photo URLs:** No photo slides generated

**Performance:**

- **Single Warehouse:** ~10-15 seconds
  - Coordinate extraction: < 1 second
  - Geospatial API calls: ~3-5 seconds (with rate limiting)
  - Satellite image fetch: ~2-3 seconds
  - Photo downloads: ~2-5 seconds per photo
  - PPT generation: ~1-2 seconds

- **Multiple Warehouses:** ~10-15 seconds per warehouse
  - 3 warehouses: ~30-45 seconds
  - 5 warehouses: ~50-75 seconds
  - 10 warehouses: ~100-150 seconds

- **Caching Benefits:**
  - Repeated queries for same location: < 1 second
  - Cache TTL: 5 minutes

**Error Handling:**

The endpoint implements comprehensive error handling:

1. **Validation Errors (400):**
   - Empty or missing `ids` field
   - Invalid ID format (non-numeric)
   - Negative warehouse IDs

2. **Not Found Errors (404):**
   - Warehouse IDs don't exist in database

3. **Server Errors (500):**
   - Database connection failures
   - OpenStreetMap API errors (logged, continues with N/A)
   - Image download failures (logged, shows placeholder)
   - PPT generation errors

**Logging:**

All operations are logged with structured JSON logs:
- INFO: Processing start/completion
- WARN: Missing data, API failures
- ERROR: Critical failures with stack traces

---

## Data Models

### Warehouse Object

```typescript
{
  id: number;
  address: string;
  googleLocation: string | null;
  totalSpaceSqft: number[] | number;
  warehouseType: string;
  clearHeightFt: string;
  ratePerSqft: string;
  photos: string | null;
  otherSpecifications: string | null;
  WarehouseData: {
    landType: string | null;
    fireSafetyMeasures: string | null;
    powerKva: string | null;
  } | null;
}
```

### Enriched Warehouse Object (Detailed PPT)

```typescript
{
  ...Warehouse,
  geospatial: {
    latitude: number | null;
    longitude: number | null;
    nearestAirport: {
      name: string;
      distance: number; // km, rounded to 1 decimal
    } | null;
    nearestHighway: {
      name: string;
      distance: number; // km, rounded to 1 decimal
    } | null;
    nearestRailway: {
      name: string;
      distance: number; // km, rounded to 1 decimal
    } | null;
    satelliteImageUrl: string | null;
  };
  validPhotos: string[]; // Array of valid photo URLs
}
```

---

## Error Responses

### 400 Bad Request

```json
{
  "error": "Invalid or no Warehouse IDs provided."
}
```

**Causes:**
- Missing `ids` field
- Empty `ids` string
- Invalid ID format (non-numeric)
- Negative IDs

### 404 Not Found

```json
{
  "error": "Warehouses with IDs 1, 2, 3 not found."
}
```

**Causes:**
- Warehouse IDs don't exist in database
- All provided IDs are invalid

### 500 Internal Server Error

```json
{
  "error": "An internal server error occurred during detailed PPT generation."
}
```

**Causes:**
- Database connection failure
- Unexpected server error
- PPT generation failure

---

## Rate Limiting

### OpenStreetMap API
- **Rate:** 1 request per second
- **Implementation:** Built-in throttling in geospatialService
- **Caching:** 5-minute TTL to reduce API calls

### Server Limits
- **Max Request Size:** Default Express limit (~100kb)
- **Timeout:** 5 minutes for detailed PPT endpoint
- **Concurrent Requests:** No explicit limit (Node.js default)

---

## Best Practices

### 1. Client Timeout Configuration

For detailed PPT endpoint, configure client timeout to at least 5 minutes:

**Postman:**
```
Settings → General → Request timeout in ms: 300000
```

**cURL:**
```bash
curl --max-time 300 ...
```

**JavaScript (fetch):**
```javascript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 300000);

fetch(url, {
  signal: controller.signal,
  // ... other options
});
```

### 2. Batch Size Recommendations

- **Standard PPT:** Up to 20 warehouses
- **Detailed PPT:** Up to 10 warehouses (to stay within 5-minute timeout)

### 3. Error Handling

Always handle potential errors:

```javascript
try {
  const response = await fetch('/api/generate-detailed-ppt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ids: '1,2,3' })
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('API Error:', error);
    return;
  }
  
  const blob = await response.blob();
  // Handle successful response
} catch (error) {
  console.error('Network Error:', error);
}
```

### 4. Caching Strategy

The detailed PPT endpoint caches geospatial data for 5 minutes. For repeated requests:
- First request: ~10-15 seconds per warehouse
- Cached requests: ~2-3 seconds per warehouse

### 5. Photo URL Requirements

Photo URLs must:
- Start with `http://` or `https://`
- Be valid URLs
- Be publicly accessible
- Return image content (JPEG/PNG)

Invalid URLs are automatically filtered out.

---

## Environment Variables

```bash
# Server Configuration
PORT=3001                    # Server port (default: 3001)
FRONTEND_URL=http://localhost:3000  # CORS allowed origin

# Database Configuration
DATABASE_URL=postgresql://user:password@localhost:5432/warehouse_db

# Logging
LOG_LEVEL=INFO              # Logging level (ERROR, WARN, INFO)
```

---

## CORS Configuration

The API allows requests from:
- `null` (local file access for development)
- Value of `FRONTEND_URL` environment variable

To add additional origins, modify `server.js`:

```javascript
const allowedOrigins = [
  'null',
  process.env.FRONTEND_URL,
  'https://your-domain.com'
];
```

---

## Monitoring and Logging

All API operations are logged with structured JSON format:

```json
{
  "timestamp": "2025-11-18T00:00:00.000Z",
  "level": "INFO",
  "component": "warehouseController",
  "function": "generateDetailedPresentation",
  "message": "Generating detailed presentation",
  "warehouseIds": [1, 2, 3],
  "warehouseCount": 3
}
```

**Log Levels:**
- **ERROR:** Critical failures, exceptions
- **WARN:** Missing data, API failures (non-critical)
- **INFO:** Normal operations, processing status

---

## Version History

### v1.1.0 (Current)
- Added `/api/generate-detailed-ppt` endpoint
- Integrated OpenStreetMap geospatial data
- Added satellite imagery support
- Implemented dynamic photo layouts
- Added comprehensive error handling
- Extended timeout to 5 minutes

### v1.0.0
- Initial release
- `/health` endpoint
- `/api/warehouses` endpoint
- `/api/generate-ppt` endpoint

---

## Support

For issues or questions:
1. Check server logs for detailed error messages
2. Verify database connectivity with `/health` endpoint
3. Test with single warehouse before batch processing
4. Ensure warehouse IDs exist in database

## License

Internal use only.
