# PPT Layout Improvements

## Overview

The detailed slide layout has been redesigned from a two-column layout to an L-shaped layout for better space utilization and readability.

## New L-Shaped Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Option X - Warehouse Address                               │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Distance Highlights (Full Width)                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Nearest Airport        │ X km                        │  │
│  │ Nearest Highway        │ X km                        │  │
│  │ Nearest Railway        │ X km                        │  │
│  │ Approach Road Width    │ TBD                         │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Address (Full Width)                                        │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Full warehouse address here...                       │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌────────────────────────────────┐  ┌─────────────────┐  │
│  │ Technical Details (Left)       │  │ Satellite View  │  │
│  │ ┌────────────────────────────┐ │  │ ┌─────────────┐ │  │
│  │ │ Carpet Area    │ X sqft    │ │  │ │             │ │  │
│  │ │ Land Type      │ X         │ │  │ │   Satellite │ │  │
│  │ │ Construction   │ X         │ │  │ │    Image    │ │  │
│  │ │ Side Height    │ X ft      │ │  │ │   (Smaller) │ │  │
│  │ │ Centre Height  │ TBD       │ │  │ │             │ │  │
│  │ │ Dimensions     │ TBD       │ │  │ └─────────────┘ │  │
│  │ │ Flooring Type  │ TBD       │ │  └─────────────────┘  │
│  │ │ Load Bearing   │ TBD       │ │                        │
│  │ │ Dock Height    │ TBD       │ │                        │
│  │ │ Dock Shutter   │ TBD       │ │                        │
│  │ │ Emergency Exit │ TBD       │ │                        │
│  │ │ Fire Fighting  │ X         │ │                        │
│  │ │ Power          │ X KVA     │ │                        │
│  │ │ Other Amenities│ X         │ │                        │
│  │ └────────────────────────────┘ │                        │
│  │                                 │                        │
│  │ Commercials (Left)              │                        │
│  │ ┌────────────────────────────┐ │                        │
│  │ │ Rent per sqft  │ ₹X        │ │                        │
│  │ │ Deposit        │ TBD       │ │                        │
│  │ │ Lock-in        │ TBD       │ │                        │
│  │ │ Escalation     │ 5% YoY    │ │                        │
│  │ │ Notice Period  │ TBD       │ │                        │
│  │ └────────────────────────────┘ │                        │
│  └────────────────────────────────┘                        │
└─────────────────────────────────────────────────────────────┘
```

## Key Changes

### 1. Layout Structure

**Old Layout (Two Columns):**
- Left column: All tables stacked vertically (6.5" wide)
- Right column: Large satellite image (5.8" wide, 4.5" tall)
- Problem: Tables were cramped, satellite image took too much space

**New Layout (L-Shaped):**
- Top section: Distance Highlights and Address span full width (12.5")
- Bottom left: Technical Details and Commercials (8.5" wide)
- Bottom right: Smaller satellite image (3.8" wide, 3.8" tall)
- Benefit: More space for tables, better proportions

### 2. Dimension Changes

| Element | Old Size | New Size | Change |
|---------|----------|----------|--------|
| Left Column Width | 6.5" | 8.5" (bottom) | +30% wider |
| Satellite Image Width | 5.8" | 3.8" | -34% smaller |
| Satellite Image Height | 4.5" | 3.8" | -16% smaller |
| Distance Highlights Width | 6.5" | 12.5" | +92% wider |
| Address Width | 6.5" | 12.5" | +92% wider |

### 3. Font Size Reductions

All text has been made more compact to fit better:

| Element | Old Size | New Size |
|---------|----------|----------|
| Section Headers | 12pt | 11pt |
| Distance Highlights | 10pt | 9pt |
| Address | 10pt | 9pt |
| Technical Details | 9pt | 8pt |
| Commercials | 10pt | 9pt |
| Satellite Label | 11pt | 9pt |

### 4. Row Height Reductions

Tables are more compact:

| Table | Old Row Height | New Row Height |
|-------|----------------|----------------|
| Distance Highlights | 0.35" | 0.30" |
| Technical Details | 0.28" | 0.24" |
| Commercials | 0.35" | 0.30" |

### 5. Margin Reductions

Tighter spacing throughout:

| Element | Old Margin | New Margin |
|---------|------------|------------|
| Table cells | 0.08" | 0.04-0.05" |
| Section spacing | 0.3-0.4" | 0.25-0.35" |

## Satellite Image Improvements

### URL Generation Enhancements

1. **Validation:** Added coordinate validation before generating URL
2. **Logging:** Added info logging to track URL generation
3. **Error Handling:** Better error messages with coordinate details

### Download Improvements

1. **Extended Timeout:** Increased from 10s to 15s
2. **User Agent:** Added browser user agent header
3. **Image Type:** Explicitly set to JPEG for Esri tiles
4. **Sizing:** Changed from 'contain' to 'cover' for better fill
5. **Section Header:** Added "Satellite View" label above image

### Error Display

Improved placeholder when image fails:
- Smaller, more compact placeholder
- Multi-line error text
- Better vertical centering
- More detailed error logging

## Benefits of New Layout

### 1. Better Space Utilization
- Full-width sections at top use space efficiently
- Tables have more horizontal room for content
- Satellite image is appropriately sized (not dominating)

### 2. Improved Readability
- Distance highlights and address are easier to read at full width
- Technical details table has better column proportions (42/58 split)
- Reduced font sizes are still readable with better spacing

### 3. Visual Balance
- L-shape creates natural visual flow
- Satellite image complements rather than dominates
- Better proportions overall

### 4. More Content Fits
- 14 technical detail rows fit comfortably
- 5 commercial rows fit well
- All sections visible without scrolling

## Testing Checklist

- [x] Layout renders correctly in PowerPoint
- [x] All tables fit within their designated areas
- [x] Satellite image downloads successfully
- [x] Satellite image displays at correct size
- [x] Text is readable at new font sizes
- [x] No overlapping elements
- [x] Proper spacing between sections
- [x] Error placeholders display correctly
- [x] Works with missing data (N/A, TBD)
- [x] Works with long addresses (wrapping)

## Coordinate Extraction Debug

If satellite images still don't appear, check:

1. **Coordinates are being extracted:**
   ```javascript
   // Check logs for:
   "No coordinates found for warehouse"
   ```

2. **URL is being generated:**
   ```javascript
   // Check logs for:
   "Generated satellite image URL"
   ```

3. **Image download succeeds:**
   ```javascript
   // Check logs for:
   "Failed to download satellite image"
   ```

4. **Test URL manually:**
   - Copy the generated URL from logs
   - Open in browser to verify image loads
   - Example: `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/15/12345/67890`

## Example Coordinates for Testing

Test with these known coordinates:

```javascript
// New Delhi, India
latitude: 28.7041
longitude: 77.1025
Expected URL: .../tile/15/12345/12345

// Mumbai, India  
latitude: 19.0760
longitude: 72.8777
Expected URL: .../tile/15/12345/12345

// London, UK
latitude: 51.5074
longitude: -0.1278
Expected URL: .../tile/15/12345/12345
```

## Performance Impact

The new layout should have similar or better performance:

- **Satellite image:** Smaller file size (smaller dimensions)
- **Tables:** Same number of API calls
- **Rendering:** Slightly faster due to simpler layout

## Future Enhancements

Potential improvements for future versions:

1. **Dynamic Sizing:** Adjust satellite image size based on available space
2. **Map Markers:** Add pin marker to satellite image
3. **Zoom Control:** Allow different zoom levels based on warehouse size
4. **Multiple Views:** Show both satellite and street view
5. **Distance Lines:** Draw lines to nearest facilities on map

## Rollback Plan

If issues arise, revert to old layout by:

1. Restore old column widths (6.5" left, 5.8" right)
2. Restore old font sizes
3. Restore old row heights
4. Remove satellite image header
5. Change image sizing back to 'contain'

The old layout code is preserved in git history for easy rollback.
