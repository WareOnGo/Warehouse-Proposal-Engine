# `POST /api/generate-ppt-v2`

Generates a v2 warehouse proposal deck (`.pptx`) for one or more warehouse IDs.

The v2 deck differs from `/api/generate-ppt` in layout (sidebar tables, photo grid, fixed cover hero) and in how photo URLs are sanitised before they hit the slides.

## Request

- **Method:** `POST`
- **Path:** `/api/generate-ppt-v2`
- **Content-Type:** `application/json`
- **Timeout:** 10 minutes (extended middleware) — large decks with many remote images can take a while.

### Body

```jsonc
{
  "ids": "298,299,569,1638",            // comma-separated warehouse IDs, or array of numbers
  "selectedImages": {                    // optional — defaults to {}
    "298": ["https://.../a.jpg"],
    "299": ["https://.../a.jpg", "https://.../b.jpg"],
    "569": ["https://.../a.jpg", "https://.../b.jpg", "https://.../c.jpg"],
    "1638": ["https://.../a.jpg", "https://.../b.jpg", "https://.../c.jpg", "https://.../d.jpg"]
  },
  "customDetails": {                     // optional — defaults to {}
    "clientName": "Acme Logistics Pvt Ltd",
    "pocName": "Rajesh Kumar",
    "pocContact": "+91 98765 43210",

    "commercials": true,                 // optional — defaults to true
    "mapsLocation": true,                // optional — defaults to true
    "pocSlide": true                     // optional — defaults to true
  }
}
```

| Field | Type | Notes |
|---|---|---|
| `ids` | `string \| number[]` | Comma-separated string or array. Non-positive / non-integer entries are dropped. |
| `selectedImages` | `Record<warehouseId, string[]>` | URLs per warehouse. Non-image extensions (`.mp4`, `.mov`, etc.) are filtered out before layout. Max 4 images used per warehouse. |
| `customDetails.clientName` | `string` | Shown on the cover slide. Falls back to `"Client Name"`. |
| `customDetails.pocName` | `string` | Shown on the contact slide. Falls back to `"Dhaval Gupta"`. |
| `customDetails.pocContact` | `string` | Shown on the contact slide. Falls back to `"+91 8318825478"`. |
| `customDetails.commercials` | `boolean` | Defaults to `true`. When `false`, the **Rent per sq.ft (INR)** cell on every detail slide reads `"Available on Demand"` instead of the real rate. |
| `customDetails.mapsLocation` | `boolean` | Defaults to `true`. When `false`, the **Google Maps** row on every detail slide reads `"Available on Demand"` instead of a coordinate link. |
| `customDetails.pocSlide` | `boolean` | Defaults to `true`. When `false`, the final WareOnGo POC / contact slide is omitted from the deck. |

> **Flag semantics:** all three flags default to `true`, so existing callers that omit them get the full, unredacted deck. Only an explicit `false` redacts content. Any value other than `false` (including `true`, `undefined`, or the field being absent) is treated as enabled.

### Behaviour worth knowing

- **Cover hero is static.** The right-half image on the title slide always uses the bundled asset (`assets/cover-hero.jpg`). It does not pick up `selectedImages` or the first warehouse's photo.
- **Photo URLs are filtered.** Any URL that doesn't end in `.jpg / .jpeg / .png / .gif / .webp / .bmp` (with optional query string) is dropped before counting and layout, so a mixed image+video list won't produce a blank tile.
- **Photo count drives the layout.** 1 photo → single landscape; 2 photos → side-by-side landscape tiles; 3 photos → 1 wide on top + 2 below; 4 photos → 2×2 grid. Anything beyond 4 is sliced off.
- **Warehouse order is preserved** from the order given in `ids`.
- **Redaction flags apply to the whole deck.** `commercials` and `mapsLocation` redact the corresponding field on *every* detail slide (they are deck-level, not per-warehouse). `pocSlide` toggles only the final contact slide; the rest of the deck is unchanged.

## Responses

### 200 OK

- **Content-Type:** `application/vnd.openxmlformats-officedocument.presentationml.presentation`
- **Body:** binary `.pptx`. Slide order is: cover → index → one detail slide per warehouse → contact. The trailing contact slide is omitted when `customDetails.pocSlide` is `false`.

### 400 Bad Request

```json
{ "error": "Invalid or no Warehouse IDs provided." }
```

Returned when `ids` is missing or parses to an empty list.

### 404 Not Found

```json
{ "error": "Warehouses with IDs 1,2,3 not found." }
```

Returned when none of the supplied IDs match a row in the `warehouse` table.

### 500 Internal Server Error

```json
{ "error": "An internal server error occurred during v2 PPT generation." }
```

## Examples

### curl

```bash
curl -X POST http://localhost:3000/api/generate-ppt-v2 \
  -H "Content-Type: application/json" \
  -o proposal.pptx \
  -d '{
    "ids": "298,299,569,1638",
    "customDetails": {
      "clientName": "Acme Logistics Pvt Ltd",
      "pocName": "Rajesh Kumar",
      "pocContact": "+91 98765 43210"
    }
  }'
```

### Node (axios)

```js
const fs = require('fs');
const axios = require('axios');

const res = await axios.post(
  'http://localhost:3000/api/generate-ppt-v2',
  {
    ids: [298, 299, 569, 1638],
    selectedImages: {
      298: ['https://.../a.jpg'],
    },
    customDetails: {
      clientName: 'Acme Logistics Pvt Ltd',
      pocName: 'Rajesh Kumar',
      pocContact: '+91 98765 43210',
    },
  },
  { responseType: 'arraybuffer', timeout: 600000 }
);
fs.writeFileSync('proposal.pptx', res.data);
```

### Redacted deck (flags off)

Hide rent, the maps link, and the POC slide — useful for early-stage shares:

```bash
curl -X POST http://localhost:3000/api/generate-ppt-v2 \
  -H "Content-Type: application/json" \
  -o proposal.pptx \
  -d '{
    "ids": "298,299,569",
    "customDetails": {
      "clientName": "Acme Logistics Pvt Ltd",
      "commercials": false,
      "mapsLocation": false,
      "pocSlide": false
    }
  }'
```

## Local preview

To render the same deck without hitting the HTTP endpoint:

```bash
node scripts/preview-v2.js 298,299,569,1638 \
  --client "Acme Logistics Pvt Ltd" \
  --poc "Rajesh Kumar" \
  --contact "+91 98765 43210"
```

Generates a `.pptx`, converts it to PDF via LibreOffice, rasterises to PNG, and serves a thumbnail page at `http://localhost:4900`.

The redaction flags map to CLI switches (each present switch turns the corresponding flag off):

```bash
node scripts/preview-v2.js 298,299,569 \
  --no-commercials \   # rent → "Available on Demand"
  --no-maps \          # Google Maps → "Available on Demand"
  --no-poc             # drop the final POC slide
```
