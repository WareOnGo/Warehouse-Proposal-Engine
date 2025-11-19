# Postman Test Examples - Warehouse PPT Service

## Base URL
```
http://localhost:3001
```

---

## 1. Health Check

### GET /health

**Description:** Check if the server and database connection are healthy.

**Request:**
```
GET http://localhost:3001/health
```

**Expected Response (200 OK):**
```json
{
  "status": "ok",
  "message": "Server and database connection are healthy."
}
```

**Expected Response (503 Service Unavailable):**
```json
{
  "status": "error",
  "message": "Server is running, but database connection is unhealthy."
}
```

---

## 2. Get Warehouses

### GET /api/warehouses

**Description:** Retrieve warehouse data by IDs.

**Query Parameters:**
- `ids` (required): Comma-separated warehouse IDs

**Request Example 1 - Single Warehouse:**
```
GET http://localhost:3001/api/warehouses?ids=1
```

**Request Example 2 - Multiple Warehouses:**
```
GET http://localhost:3001/api/warehouses?ids=1,2,3
```

**Expected Response (200 OK):**
```json
[
  {
    "id": 1,
    "address": "123 Industrial Area, City Name",
    "googleLocation": "https://maps.google.com/?q=28.7041,77.1025",
    "totalSpaceSqft": [10000, 15000],
    "warehouseType": "RCC Structure",
    "clearHeightFt": "30 ft",
    "ratePerSqft": "28",
    "photos": "https://example.com/photo1.jpg,https://example.com/photo2.jpg",
    "otherSpecifications": "Loading dock, 24/7 Security",
    "WarehouseData": {
      "landType": "Industrial",
      "fireSafetyMeasures": "Sprinklers, Fire Extinguishers",
      "powerKva": "500 KVA"
    }
  }
]
```

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid or no Warehouse IDs provided."
}
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Warehouses with IDs 999 not found."
}
```

---

## 3. Generate Standard Presentation

### POST /api/generate-ppt

**Description:** Generate a standard PowerPoint presentation with selected images.

**Headers:**
```
Content-Type: application/json
```

**Request Body Example 1 - Single Warehouse with Custom Details:**
```json
{
  "ids": "1",
  "selectedImages": {
    "1": [
      "https://example.com/warehouse1-photo1.jpg",
      "https://example.com/warehouse1-photo2.jpg"
    ]
  },
  "customDetails": {
    "companyName": "ABC Logistics",
    "employeeName": "John Doe"
  }
}
```

**Request Body Example 2 - Multiple Warehouses:**
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
    "companyName": "XYZ Warehousing",
    "employeeName": "Jane Smith"
  }
}
```

**Request Body Example 3 - Minimal (No Custom Details):**
```json
{
  "ids": "1,2"
}
```

**Expected Response (200 OK):**
- Content-Type: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- Content-Disposition: `attachment; filename="Warehouses_1_2_3.pptx"`
- Body: Binary PowerPoint file

**Expected Response (400 Bad Request):**
```json
{
  "error": "Invalid or no Warehouse IDs provided."
}
```

**Expected Response (404 Not Found):**
```json
{
  "error": "Warehouses with IDs 1, 2, 3 not found."
}
```

**Expected Response (500 Internal Server Error):**
```json
{
  "error": "An internal server error occurred during PPT generation."
}
```

---

## 4. Generate Detailed Presentation (NEW)

### POST /api/generate-detailed-ppt

**Description:** Generate a detailed PowerPoint presentation with geospatial data, distance highlights, technical details, commercials, satellite images, and photo slides.

**Headers:**
```
Content-Type: application/json
```

**Timeout:** 5 minutes (300 seconds) - Extended timeout for geospatial API calls

### Request Body Examples

#### Example 1 - Single Warehouse with Complete Data
```json
{
  "ids": "1",
  "customDetails": {
    "companyName": "Premium Logistics Solutions",
    "employeeName": "Sarah Johnson"
  }
}
```

#### Example 2 - Multiple Warehouses
```json
{
  "ids": "1,2,3,4,5",
  "customDetails": {
    "companyName": "Global Warehousing Corp",
    "employeeName": "Michael Chen"
  }
}
```

#### Example 3 - Minimal Request (No Custom Details)
```json
{
  "ids": "1"
}
```

#### Example 4 - Large Batch (Testing Timeout Handling)
```json
{
  "ids": "1,2,3,4,5,6,7,8,9,10",
  "customDetails": {
    "companyName": "Enterprise Logistics",
    "employeeName": "David Williams"
  }
}
```

#### Example 5 - With Empty Custom Details
```json
{
  "ids": "2,3",
  "customDetails": {}
}
```

### Expected Response (200 OK)

**Headers:**
- Content-Type: `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- Content-Disposition: `attachment; filename="Detailed_Warehouses_1_2_3.pptx"`

**Body:** Binary PowerPoint file containing:
1. Title slide with company name and employee name
2. Index slide listing all warehouses
3. For each warehouse:
   - Detailed slide with:
     - Distance highlights (nearest airport, highway, railway station, approach road width)
     - Address
     - Technical details (carpet area, land type, construction type, heights, dimensions, flooring, load bearing, dock details, fire safety, power, amenities)
     - Commercials (rent per sqft, deposit, lock-in, escalation, notice period)
     - Satellite image (right side)
   - Photo slides (if photos available):
     - Dynamic layouts based on photo count
     - Multiple slides for 5+ photos (4 photos per slide)
4. Contact slide

### Expected Response (400 Bad Request)
```json
{
  "error": "Invalid or no Warehouse IDs provided."
}
```

**Scenarios:**
- Empty `ids` field
- Invalid `ids` format (non-numeric)
- Negative warehouse IDs

### Expected Response (404 Not Found)
```json
{
  "error": "Warehouses with IDs 999, 1000 not found."
}
```

**Scenarios:**
- Warehouse IDs don't exist in database

### Expected Response (500 Internal Server Error)
```json
{
  "error": "An internal server error occurred during detailed PPT generation."
}
```

**Scenarios:**
- Database connection failure
- PPT generation error
- Unexpected server error

---

## Testing Notes

### 1. Response Time Expectations

- **Health Check:** < 100ms
- **Get Warehouses:** < 500ms
- **Generate Standard PPT:** 1-5 seconds (depending on number of warehouses)
- **Generate Detailed PPT:** 10-60 seconds per warehouse (due to geospatial API calls)
  - Single warehouse: ~10-15 seconds
  - 3 warehouses: ~30-45 seconds
  - 5+ warehouses: ~60-120 seconds

### 2. Geospatial Data Behavior

The detailed presentation endpoint makes external API calls to OpenStreetMap:
- **Rate Limiting:** 1 request per second
- **Caching:** Results cached for 5 minutes
- **Graceful Degradation:** If API calls fail, displays "N/A" instead of crashing

### 3. Photo Handling

Photos are automatically parsed from the warehouse `photos` field:
- Supports comma-separated URLs
- Supports JSON array format
- Invalid URLs are filtered out
- Failed image downloads show gray placeholders

### 4. Missing Data Handling

The system gracefully handles missing data:
- Missing geospatial data: Shows "N/A"
- Missing optional fields: Shows "TBD"
- Missing photos: No photo slides generated
- Invalid coordinates: Continues without geospatial data

### 5. Postman Configuration

**For Detailed PPT Endpoint:**
1. Set request timeout to at least 5 minutes
2. In Postman Settings → General → Request timeout in ms: `300000`
3. Save response as binary file to view the PowerPoint

**To Save Response:**
1. Click "Send and Download"
2. Save as `.pptx` file
3. Open in PowerPoint/LibreOffice

---

## Postman Collection JSON

You can import this collection into Postman:

```json
{
  "info": {
    "name": "Warehouse PPT Service",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Health Check",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/health",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["health"]
        }
      }
    },
    {
      "name": "Get Warehouses",
      "request": {
        "method": "GET",
        "header": [],
        "url": {
          "raw": "http://localhost:3001/api/warehouses?ids=1,2,3",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "warehouses"],
          "query": [
            {
              "key": "ids",
              "value": "1,2,3"
            }
          ]
        }
      }
    },
    {
      "name": "Generate Standard PPT",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ids\": \"1,2,3\",\n  \"selectedImages\": {\n    \"1\": [\"https://example.com/photo1.jpg\"],\n    \"2\": [\"https://example.com/photo2.jpg\"],\n    \"3\": []\n  },\n  \"customDetails\": {\n    \"companyName\": \"ABC Logistics\",\n    \"employeeName\": \"John Doe\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/generate-ppt",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "generate-ppt"]
        }
      }
    },
    {
      "name": "Generate Detailed PPT - Single Warehouse",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ids\": \"1\",\n  \"customDetails\": {\n    \"companyName\": \"Premium Logistics\",\n    \"employeeName\": \"Sarah Johnson\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/generate-detailed-ppt",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "generate-detailed-ppt"]
        }
      }
    },
    {
      "name": "Generate Detailed PPT - Multiple Warehouses",
      "request": {
        "method": "POST",
        "header": [
          {
            "key": "Content-Type",
            "value": "application/json"
          }
        ],
        "body": {
          "mode": "raw",
          "raw": "{\n  \"ids\": \"1,2,3,4,5\",\n  \"customDetails\": {\n    \"companyName\": \"Global Warehousing Corp\",\n    \"employeeName\": \"Michael Chen\"\n  }\n}"
        },
        "url": {
          "raw": "http://localhost:3001/api/generate-detailed-ppt",
          "protocol": "http",
          "host": ["localhost"],
          "port": "3001",
          "path": ["api", "generate-detailed-ppt"]
        }
      }
    }
  ]
}
```

---

## cURL Examples

### Health Check
```bash
curl -X GET http://localhost:3001/health
```

### Get Warehouses
```bash
curl -X GET "http://localhost:3001/api/warehouses?ids=1,2,3"
```

### Generate Standard PPT
```bash
curl -X POST http://localhost:3001/api/generate-ppt \
  -H "Content-Type: application/json" \
  -d '{
    "ids": "1,2,3",
    "customDetails": {
      "companyName": "ABC Logistics",
      "employeeName": "John Doe"
    }
  }' \
  --output warehouses.pptx
```

### Generate Detailed PPT
```bash
curl -X POST http://localhost:3001/api/generate-detailed-ppt \
  -H "Content-Type: application/json" \
  -d '{
    "ids": "1,2,3",
    "customDetails": {
      "companyName": "Premium Logistics",
      "employeeName": "Sarah Johnson"
    }
  }' \
  --output detailed_warehouses.pptx \
  --max-time 300
```

Note: The `--max-time 300` flag sets a 5-minute timeout for the detailed PPT endpoint.
