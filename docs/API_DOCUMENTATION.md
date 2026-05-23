# Warehouse Proposal Engine API Documentation

Last updated: 2026-04-05  
Scope: Current behavior implemented in `server.js`, `routes/warehouseRoutes.js`, `controllers/warehouseController.js`, and related services.

## Quick Facts

- Base URL (local): `http://localhost:3001`
- Auth: none
- Content type for PPT endpoints: binary `.pptx`
- Global server timeout: 10 minutes
- Detailed PPT route timeout middleware: 10 minutes
- CORS allowed origins:
  - `'null'` (local file usage)
  - `process.env.FRONTEND_URLS` (comma-separated, preferred)
  - `process.env.FRONTEND_URL` (single origin, backward compatibility)
  - `process.env.LOCAL_FRONTEND_URL` (optional local dev origin)

## Environment Variables

Required:

```bash
DATABASE_URL=postgresql://...
```

Optional but important:

```bash
PORT=3001
FRONTEND_URLS=http://localhost:5173,https://your-frontend-domain.com
FRONTEND_URL=https://your-frontend-domain.com
LOCAL_FRONTEND_URL=http://localhost:5173
MAPBOX_ACCESS_TOKEN=pk....
DEBUG=true
```

Notes:

- `MAPBOX_ACCESS_TOKEN` is required for satellite images and geocoding fallback in detailed PPT flow.
- If `MAPBOX_ACCESS_TOKEN` is missing, detailed PPT still generates, but map/geospatial visuals may degrade to placeholders/N/A.

## API Index

1. `GET /health`
2. `GET /api/warehouses?ids=...`
3. `POST /api/generate-ppt`
4. `POST /api/generate-detailed-ppt`

---

## 1) Health Check

### Request

`GET /health`

### Success Response

`200 OK`

```json
{
  "status": "ok",
  "message": "Server and database connection are healthy."
}
```

### Error Response

`503 Service Unavailable`

```json
{
  "status": "error",
  "message": "Server is running, but database connection is unhealthy."
}
```

---

## 2) Get Warehouses

### Request

`GET /api/warehouses?ids=1,2,3`

### Query Parameters

| Name | Type | Required | Description |
|---|---|---|---|
| `ids` | `string` | Yes | Comma-separated IDs. Parsed as positive integers only. |

### ID Parsing Rules (Important)

- IDs are parsed from comma-separated string.
- Invalid entries are silently dropped.
  - Example: `ids=1,abc,-4,5` becomes `[1,5]`.
- If the parsed result is empty, API returns `400`.

### Success Response

`200 OK`

Returns an array of found warehouses in the same order as requested IDs (for found IDs).

```json
[
  {
    "id": 1,
    "warehouseType": "RCC",
    "address": "Some address",
    "googleLocation": "https://maps.google.com/...",
    "city": "Pune",
    "state": "Maharashtra",
    "postalCode": "411001",
    "zone": "West",
    "contactPerson": "Name",
    "contactNumber": "9999999999",
    "totalSpaceSqft": [12000, 18000],
    "offeredSpaceSqft": "12000",
    "numberOfDocks": "6",
    "clearHeightFt": "30",
    "compliances": "FM2, Fire NOC",
    "otherSpecifications": "...",
    "ratePerSqft": "28",
    "availability": "Immediate",
    "uploadedBy": "ops@...",
    "isBroker": "false",
    "photos": "https://...jpg,https://...jpg",
    "createdAt": "2026-01-01T10:00:00.000Z",
    "statusUpdatedAt": "2026-01-02T10:00:00.000Z",
    "visibility": false,
    "warehouseOwnerType": null
  }
]
```

Important current behavior:

- Relation `WarehouseData` is not included in this endpoint response today.
- If some requested IDs do not exist but at least one does, response is still `200` with only found warehouses.
- `404` happens only when none of the parsed IDs are found.

Note:

- `warehouseService.findWarehousesByIds()` currently does not eager-load Prisma relations (`include` is not used), so related `WarehouseData` is unavailable in fetched payloads unless service code is changed.

### Error Responses

`400 Bad Request`

```json
{ "error": "Invalid or no Warehouse IDs provided." }
```

`404 Not Found`

```json
{ "error": "Warehouses with IDs 1, 2, 3 not found." }
```

`500 Internal Server Error`

```json
{ "error": "An internal server error occurred." }
```

---

## 3) Generate Standard PPT

### Request

`POST /api/generate-ppt`

Headers:

```http
Content-Type: application/json
```

### Request Body Contract

```ts
interface GeneratePptRequest {
  ids: string; // required, comma-separated positive integers
  selectedImages?: Record<string, string[]>; // key = warehouse ID as string
  includeLocation?: boolean; // default false
  customDetails?: StandardCustomDetails;
}

interface StandardCustomDetails {
  // Title slide uses these:
  clientName?: string;
  companyName?: string; // fallback for title
  clientRequirement?: string;

  // Contact slide uses these:
  pocName?: string;
  pocContact?: string;
}
```

### Request Example

```json
{
  "ids": "1,2",
  "selectedImages": {
    "1": ["https://example.com/1a.jpg", "https://example.com/1b.jpg"],
    "2": ["https://example.com/2a.jpg"]
  },
  "includeLocation": true,
  "customDetails": {
    "clientName": "Acme Logistics",
    "clientRequirement": "Bhiwandi - 50,000 sqft",
    "pocName": "Ravi",
    "pocContact": "+91-9xxxxxxxxx"
  }
}
```

### Success Response

`200 OK`

Headers currently set by backend:

```http
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

Body:

- Binary `.pptx` content.

Important current behavior:

- Backend does not set `Content-Disposition` filename today.
- Frontend should set download filename itself.
- Standard slide images come only from `selectedImages[warehouseId]`; DB `photos` are not auto-used by this endpoint.

### Error Responses

`400 Bad Request`

```json
{ "error": "Invalid or no Warehouse IDs provided." }
```

`404 Not Found`

```json
{ "error": "Warehouses with IDs 1, 2 not found." }
```

`500 Internal Server Error`

```json
{ "error": "An internal server error occurred during PPT generation." }
```

### What `includeLocation` Changes in Slides

- If `includeLocation = true`:
  - Property table includes a Google Maps hyperlink row when `googleLocation` exists.
  - Commercials table removes the `Security Deposit` row.
- If `includeLocation = false`:
  - No Google Maps row.
  - `Security Deposit: Available on Request` row is shown.

---

## 4) Generate Detailed PPT

### Request

`POST /api/generate-detailed-ppt`

Headers:

```http
Content-Type: application/json
```

### Request Body Contract

```ts
interface GenerateDetailedPptRequest {
  ids: string; // required, comma-separated positive integers
  selectedImages?: Record<string, string[]>; // only these are used for photo slides
  customDetails?: DetailedCustomDetails;
}

interface DetailedCustomDetails {
  // Title slide supports both keys:
  clientName?: string;
  companyName?: string;
  clientRequirement?: string;

  // Contact slide currently uses these keys:
  pocName?: string;
  pocContact?: string;

  // These may be sent by clients but are currently not used by slide renderers:
  employeeName?: string;
}
```

### Request Example

```json
{
  "ids": "3,4",
  "selectedImages": {
    "3": ["https://example.com/3a.jpg", "https://example.com/3b.jpg"],
    "4": ["https://example.com/4a.jpg"]
  },
  "customDetails": {
    "companyName": "Global Warehousing",
    "clientRequirement": "NCR / 80,000 sqft",
    "pocName": "Anita",
    "pocContact": "+91-9xxxxxxxxx"
  }
}
```

### Success Response

`200 OK`

Headers currently set by backend:

```http
Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation
```

Body:

- Binary `.pptx` content.

Important current behavior:

- Backend does not set `Content-Disposition` filename today.
- Frontend should set filename locally.
- Photo slides are generated only from `selectedImages[warehouseId]`.
  - If omitted/empty for an ID, no photo slides are generated for that warehouse even if DB has photos.
- Since `WarehouseData` relation is not eagerly loaded in current fetch, technical rows depending on `WarehouseData` fields (for example `landType`, `fireSafetyMeasures`, `powerKva`) often render as `N/A` unless backend query is updated.

### Error Responses

`400 Bad Request`

```json
{ "error": "Invalid or no Warehouse IDs provided." }
```

`404 Not Found`

```json
{ "error": "Warehouses with IDs 3, 4 not found." }
```

`500 Internal Server Error`

```json
{ "error": "An internal server error occurred during detailed PPT generation." }
```

---

## Internal Enrichment Model (Detailed Flow)

This is not returned by API directly, but useful for frontend and AI tooling context.

```ts
interface EnrichedWarehouse {
  // original warehouse fields from DB
  id: number;
  address: string;
  city?: string;
  state?: string;
  googleLocation?: string | null;
  totalSpaceSqft?: number[] | number | null;
  warehouseType?: string | null;
  clearHeightFt?: string | null;
  ratePerSqft?: string | null;
  otherSpecifications?: string | null;
  photos?: string | string[] | null;
  WarehouseData?: {
    landType?: string | null;
    fireSafetyMeasures?: string | null;
    powerKva?: string | null;
  } | null;

  geospatial: {
    latitude: number | null;
    longitude: number | null;
    nearestAirport: { name: string; distance: number } | null;
    nearestHighway: { name: string; distance: number } | null;
    nearestRailway: { name: string; distance: number } | null;
    satelliteImage: { imageBuffer: Buffer; contentType: string } | null;
  };

  validPhotos: string[];
}
```

Geospatial providers and mechanics:

- Coordinate extraction from multiple Google Maps URL patterns and raw coordinate strings.
- Nearest airport: Nominatim.
- Nearest highway and railway: Overpass.
- Satellite image: Mapbox Static Images API.
- API throttling: 1 request/second.
- Retry: exponential backoff (fast-fail profile, fewer retries).
- Cache TTL: 5 minutes in memory.

Current geospatial request limits:

- Default outbound HTTP timeout in geospatial service: 20 seconds.
- Overpass request timeout: 15 seconds (plus Overpass query timeout hint 25s).
- Nominatim request timeout: 7 seconds.
- Mapbox static image timeout: 15 seconds.

---

## Request/Response Classes For Frontend (Copy-Paste Ready)

```ts
export type WarehouseIdCsv = string;

export interface ApiErrorResponse {
  error: string;
}

export interface HealthOkResponse {
  status: 'ok';
  message: string;
}

export interface HealthFailResponse {
  status: 'error';
  message: string;
}

export interface Warehouse {
  id: number;
  warehouseType: string;
  address: string;
  googleLocation: string | null;
  city: string;
  state: string;
  postalCode: string | null;
  zone: string;
  contactPerson: string;
  contactNumber: string;
  totalSpaceSqft: number[];
  offeredSpaceSqft: string | null;
  numberOfDocks: string | null;
  clearHeightFt: string | null;
  compliances: string;
  otherSpecifications: string | null;
  ratePerSqft: string;
  availability: string | null;
  uploadedBy: string;
  isBroker: string | null;
  photos: string | null;
  createdAt: string | null;
  statusUpdatedAt: string | null;
  visibility: boolean | null;
  warehouseOwnerType: string | null;
}

export interface StandardCustomDetails {
  clientName?: string;
  companyName?: string;
  clientRequirement?: string;
  pocName?: string;
  pocContact?: string;
}

export interface DetailedCustomDetails extends StandardCustomDetails {
  employeeName?: string;
}

export interface GeneratePptRequest {
  ids: WarehouseIdCsv;
  selectedImages?: Record<string, string[]>;
  includeLocation?: boolean;
  customDetails?: StandardCustomDetails;
}

export interface GenerateDetailedPptRequest {
  ids: WarehouseIdCsv;
  selectedImages?: Record<string, string[]>;
  customDetails?: DetailedCustomDetails;
}

// PPT responses are binary blobs (application/vnd.openxmlformats-officedocument.presentationml.presentation)
export type GeneratePptResponse = Blob;
export type GenerateDetailedPptResponse = Blob;
```

---

## Frontend Download Handling (Critical)

Use this pattern for both PPT endpoints.

```ts
function extractFilename(contentDisposition: string | null, fallback: string): string {
  if (!contentDisposition) return fallback;
  const utf8 = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8?.[1]) return decodeURIComponent(utf8[1]);
  const basic = contentDisposition.match(/filename="?([^";]+)"?/i);
  if (basic?.[1]) return basic[1];
  return fallback;
}

export async function downloadPpt(
  endpoint: string,
  body: unknown,
  fallbackFilename: string,
  timeoutMs = 600_000
): Promise<void> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    if (!res.ok) {
      let msg = `HTTP ${res.status}`;
      try {
        const j = await res.json();
        if (j?.error) msg = j.error;
      } catch {
        const t = await res.text();
        if (t) msg = t.slice(0, 240);
      }
      throw new Error(msg);
    }

    const blob = await res.blob();
    const filename = extractFilename(
      res.headers.get('Content-Disposition'),
      fallbackFilename
    );

    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } finally {
    clearTimeout(timer);
  }
}
```

Current backend note:

- Since `Content-Disposition` is currently not set, frontend fallback filename is required.

---

## Frontend Integration Checklist For Another AI

1. Always send `ids` as comma-separated string, not array.
2. Build `selectedImages` as `Record<string, string[]>` keyed by warehouse ID.
3. Standard mode with map links must set `includeLocation: true`.
4. Detailed mode may take long; use client timeout around `600000` ms.
5. Always parse non-2xx responses as JSON error first, then text fallback.
6. Treat PPT endpoints as binary responses (`blob`).
7. Do not rely on server-provided filename today.
8. Handle partial warehouse results from `GET /api/warehouses`.
9. Expect placeholders/N/A in generated PPT when geospatial/image fetch fails.
10. Ensure your frontend origin matches one of `FRONTEND_URLS`/`FRONTEND_URL`/`LOCAL_FRONTEND_URL` (or local file context `null`).

---

## Performance and Reliability Notes

- Standard PPT is usually fast but depends on image URL fetch speed.
- Detailed PPT latency scales with warehouse count and external API/network performance.
- Geospatial services use retries + throttling + in-memory cache (5 min).
- External failures are tolerated with graceful fallback (N/A/placeholder), not hard fail in most cases.

---

## Logging Shape

Backend logs are structured JSON with fields like:

```json
{
  "timestamp": "2026-04-05T12:00:00.000Z",
  "level": "INFO",
  "component": "warehouseController",
  "function": "generateDetailedPresentation",
  "message": "Generating detailed presentation",
  "warehouseIds": [1, 2],
  "warehouseCount": 2
}
```

Use these for debugging integration issues.

---

## Changelog (Docs)

- Corrected timeout values to current 10-minute behavior.
- Added `includeLocation` support details for standard PPT.
- Corrected binary response header expectations (no `Content-Disposition` currently).
- Added frontend-focused request/response classes and download handling.
- Added ID parsing/partial result behavior and integration caveats.
- Updated geospatial provider details to current Mapbox + OSM/Nominatim implementation.
