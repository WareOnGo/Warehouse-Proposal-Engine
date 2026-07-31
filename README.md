# Warehouse Proposal Engine

A Node.js service that turns warehouse records in the WareOnGo PostgreSQL database into ready-to-send PowerPoint (`.pptx`) proposal decks. Callers pass warehouse IDs, optionally the photo URLs to include and some client/POC details, and get a binary `.pptx` back.

The repo also contains a small static frontend used internally for the standard/detailed flows, and local preview tooling for iterating on slide layouts without an HTTP client.

## Deck variants

Every deck is built with `pptxgenjs` from per-variant slide modules under `src/slides/`. Each variant has its own endpoint and its own theme, layout and slide order:

| Variant | Endpoint | Slide size | Slide order |
|---|---|---|---|
| **Standard** | `POST /api/generate-ppt` | 16:9 wide | title → index → one slide per warehouse → WareOnGo contact |
| **Detailed** | `POST /api/generate-detailed-ppt` | 16:9 wide | title → per warehouse: location slide (only when coordinates resolve) + technical slide + photo slides → contact |
| **V2** | `POST /api/generate-ppt-v2` | 16:9 | cover → index → one detail slide per warehouse → POC slide (omittable) |
| **Godamwale** | `POST /api/generate-ppt-godamwale` | 16:9 | title → index → one detail slide per warehouse (no contact slide) |
| **TCI** | `POST /api/generate-ppt-tci` | 4:3 | title → one detail slide per warehouse → thank-you |

Variant-specific behaviour worth knowing:

* **Standard** takes an `includeLocation` boolean. When true, a "Google Maps" row is added to Property Information and Security Deposit is dropped from Commercials.
* **Detailed** enriches each warehouse via `geospatialService`: coordinates are extracted from `googleLocation`, then nearest airport (Nominatim), nearest NH/SH highway and nearest railway station (Overpass) plus a Mapbox satellite image are fetched in parallel. Photo slides are emitted in batches of 4. This is the slow path — 10–60s per warehouse is normal.
* **V2** supports three deck-level redaction flags in `customDetails`, all defaulting to `true` (see `docs/GENERATE_PPT_V2.md`): `commercials: false` replaces the rent value with "Available on Demand", `mapsLocation: false` does the same for the Google Maps row, and `pocSlide: false` drops the trailing POC slide.
* **Godamwale** is a rebrand of the V2 layout — black-on-white with red brand accents, Godamwale logo/chrome.
* **TCI** mirrors a client-supplied 4:3 template (Calibri, yellow/navy accents) and is the only endpoint that tolerates a missing/empty `ids`: with no IDs it renders three built-in placeholder warehouses so the layout can be reviewed without live data. It also falls back to the warehouse's own `photos` column when `selectedImages` has no entry for that ID.

## How image handling works

Photos live as comma-separated URLs on the `Warehouse.photos` column (or come in explicitly via `selectedImages`). `src/utils/image.js` downloads each one, then:

* Reads EXIF `Orientation` straight from the JPEG APP1 segment and, only when the tag calls for rotation (2–8), re-encodes via `sharp` so the pixels are upright — PowerPoint and LibreOffice both ignore the EXIF tag, which is why phone/field uploads used to render sideways. `sharp` is loaded lazily and its absence is tolerated: the raw bytes are embedded instead.
* Decodes real pixel dimensions from the file header (PNG/GIF/WebP/JPEG) so `pptxgenjs`'s `sizing.cover` crop maths gets the true source aspect ratio instead of stretching.
* Embeds the result as a base64 data URI, so the generated deck has no external image references.

Non-image URLs (`.mp4`, `.mov`, …) are filtered out before layout so a mixed media list can't produce blank tiles.

## Technology stack

* **Runtime:** Node.js 18 (Alpine in the container image), Express 4
* **Data:** Prisma 6 against Supabase/PostgreSQL — `Warehouse` plus its `WarehouseData` relation (lat/long, power, fire NOC, land type, …)
* **Decks:** `pptxgenjs`, `sharp` (EXIF normalisation), `axios`
* **Geo/imagery:** Mapbox Static Images + Geocoding, OpenStreetMap Nominatim & Overpass
* **Tests:** Jest
* **Frontend:** static HTML/CSS/vanilla JS
* **Deploy:** Docker → Amazon ECR → AWS App Runner, via GitHub Actions

## Setup

```bash
git clone https://github.com/WareOnGo/Warehouse-Proposal-Engine.git
cd Warehouse-Proposal-Engine
npm install
npx prisma generate
```

Create a `.env` in the repo root:

```env
# Required — Supabase/Postgres connection string
DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres"

# Required for the detailed deck (satellite images + geocoding fallback).
# Without it the detailed deck still generates, but map visuals degrade to N/A.
MAPBOX_ACCESS_TOKEN="pk...."

# CORS. FRONTEND_URLS (comma-separated) is preferred; the other two are
# additive conveniences kept for backward compatibility. 'null' origin is
# always allowed so the frontend can be opened as a local file.
FRONTEND_URLS="http://localhost:5173,https://your-frontend.example.com"
FRONTEND_URL="https://your-frontend.example.com"
LOCAL_FRONTEND_URL="http://localhost:5173"

# Optional
PORT=3002          # default 3002
DEBUG=true         # enables logDebug output
```

## Running

```bash
npm run dev    # nodemon
npm start      # plain node
npm test       # jest --runInBand
```

The server defaults to **port 3002** and sets a 10-minute global timeout (`server.timeout`, `keepAliveTimeout`, `headersTimeout`) so long detailed/v2 generations aren't cut off; the four heavy PPT routes additionally set a 10-minute per-request timeout.

> Note: `frontend/app.js` hardcodes `API_BASE_URL = 'http://localhost:3001'`. Point it at your actual port (or deployed URL) before using the frontend locally.

Some tests in `tests/geospatialService.integration.test.js` make real calls to OpenStreetMap and can fail when those services are slow or unavailable.

### Frontend

Open `frontend/index.html` in a browser (or serve the folder). It offers a two-step flow — fetch warehouse details and pick images, then fill in client/POC fields and download — and exposes three of the variants: Standard, Standard with Location, and Detailed. **The V2, Godamwale and TCI decks are API-only**; use the preview scripts or an HTTP client for those.

### Local slide previews

`scripts/preview-v2.js` renders a real V2 deck from live warehouse IDs, converts it to PDF via headless LibreOffice, rasterises with `pdftoppm`, and serves thumbnails at `http://localhost:4900`:

```bash
node scripts/preview-v2.js 298,299,569 --client "Acme Logistics" --poc "Name" --contact "+91 …"
node scripts/preview-v2.js 298,299     --no-commercials --no-maps --no-poc   # redaction flags
```

Requires `libreoffice` and `pdftoppm` on PATH. Run `bash scripts/install-montserrat.sh` once — the V2/Godamwale slides request specific Montserrat weights by face name, and LibreOffice silently falls back to a default sans without them. The `scripts/_*.js` files are ad-hoc render helpers (all three variants at once, ID lookups) and write into the gitignored `preview-out/`.

## API

All PPT endpoints accept the same body shape and respond with `Content-Type: application/vnd.openxmlformats-officedocument.presentationml.presentation`:

```json
{
  "ids": "101,102",
  "selectedImages": { "101": ["https://…/a.jpg"], "102": ["https://…/b.jpg"] },
  "customDetails": {
    "clientName": "Client Corp",
    "clientRequirement": "Nelamangala, Bangalore - 100000 sqft",
    "pocName": "Contact Person",
    "pocContact": "+91 1234567890"
  }
}
```

`ids` is a comma-separated string (or array of numbers); non-integer and non-positive entries are dropped, and the order given is preserved in the deck. Errors are `400` for no valid IDs, `404` when none of the IDs exist, `500` on generation failure.

Beyond the five generation endpoints listed above:

* `GET /health` — verifies the DB connection. `200 {status:"ok"}` / `503 {status:"error"}`.
* `GET /api/warehouses?ids=101,102` — the warehouse rows (with `WarehouseData`) used to populate the decks, for previewing before generation.

Full request/response contracts, per-endpoint field tables and examples live in:

* `docs/API_DOCUMENTATION.md` — all seven endpoints
* `docs/GENERATE_PPT_V2.md` — the V2 endpoint and its redaction flags in depth
* `docs/POSTMAN_EXAMPLES.md` — Postman collection and cURL snippets
* `docs/DEPLOYMENT_GUIDE.md` — ECR + App Runner setup walkthrough

## Deployment

Pushes to `main` trigger `.github/workflows/deploy.yml`, which builds the `Dockerfile`, pushes to Amazon ECR as `:latest`, and lets App Runner auto-deploy on the new image. Required GitHub secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ECR_REPOSITORY`.

The container exposes port 3002, runs `npx prisma generate` at build time, and needs `DATABASE_URL`, `MAPBOX_ACCESS_TOKEN` and the CORS variables configured on the App Runner service — plus `PORT` if the service is configured to listen elsewhere. 1 vCPU / 2 GB is the current baseline; image download and re-encoding is the memory-hungry part. (LibreOffice is only needed for the local preview scripts, not by the service.)

## Layout

```
src/
  server.js                 Express app, CORS, 10-minute timeouts
  routes/                   route table + extended-timeout middleware
  controllers/              ID parsing, fetch, dispatch to a ppt service
  services/
    warehouseService.js     Prisma queries (order-preserving)
    pptService.js           standard deck
    detailedPptService.js   detailed deck + geospatial enrichment
    pptServiceV2.js         v2 deck + redaction flags
    pptServiceGodamwale.js  Godamwale-branded deck
    pptServiceTci.js        TCI-branded deck + placeholder warehouses
    geospatialService.js    coordinate extraction, OSM lookups, Mapbox imagery
  slides/                   per-variant slide builders (v2/, godamwale/, tci/)
  utils/                    image normalisation, text formatting, structured logging
assets/                     logos, cover hero, client backdrops
frontend/                   static internal UI
scripts/                    preview + font-install tooling
tests/                      Jest suites
docs/                       API, deployment and endpoint docs
```
