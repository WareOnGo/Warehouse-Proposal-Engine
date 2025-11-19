# Implementation Plan

- [x] 1. Create geospatial service for OpenStreetMap integration
- [x] 1.1 Implement coordinate extraction from Google Maps URLs
  - Create `services/geospatialService.js` with `extractCoordinates()` function
  - Handle standard Google Maps URL formats (?q=, /@)
  - Handle shortened goo.gl URLs by following HTTP redirects
  - Handle direct coordinate strings
  - Return `{ latitude, longitude }` or `null` for invalid inputs
  - _Requirements: 1.2, 5.1_

- [x] 1.2 Implement Haversine distance calculation
  - Add `calculateDistance(lat1, lon1, lat2, lon2)` function to geospatialService
  - Use Haversine formula for accurate distance calculation
  - Return distance in kilometers rounded to 1 decimal place
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 1.3 Implement nearest airport finder using Overpass API
  - Add `findNearestAirport(lat, lon)` function to geospatialService
  - Query Overpass API for aerodromes within 100km radius
  - Calculate distances to all results and find nearest
  - Return `{ name, distance }` or `null` on error
  - Implement rate limiting (1 request/second)
  - _Requirements: 2.1, 7.1_

- [x] 1.4 Implement nearest highway finder using Overpass API
  - Add `findNearestHighway(lat, lon)` function to geospatialService
  - Query Overpass API for national highways within 50km radius
  - Calculate distances and find nearest
  - Return `{ name, distance }` or `null` on error
  - _Requirements: 2.2, 7.1_

- [x] 1.5 Implement nearest railway station finder using Overpass API
  - Add `findNearestRailwayStation(lat, lon)` function to geospatialService
  - Query Overpass API for railway stations within 50km radius
  - Calculate distances and find nearest
  - Return `{ name, distance }` or `null` on error
  - _Requirements: 2.3, 7.1_

- [x] 1.6 Implement satellite image URL generator
  - Add `fetchSatelliteImageUrl(lat, lon, zoom)` function to geospatialService
  - Convert lat/lon to tile coordinates for zoom level 15
  - Construct Esri World Imagery tile URL
  - Return tile URL or null on error
  - _Requirements: 5.1, 5.2, 5.5_

- [x] 1.7 Add error handling and rate limiting infrastructure
  - Implement RateLimiter class for API throttling
  - Add in-memory cache with 5-minute TTL
  - Configure axios instance with timeout and User-Agent header
  - Add comprehensive error logging for all API calls
  - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 2. Create detailed PPT service
- [x] 2.1 Implement photo URL parser
  - Create `services/detailedPptService.js` with `parsePhotos()` function
  - Parse comma-separated or JSON array photo URLs from database
  - Validate URLs and filter out invalid entries
  - Return array of valid photo URLs
  - _Requirements: 6.1, 6.4_

- [x] 2.2 Implement warehouse geospatial enrichment
  - Add `enrichWarehouseWithGeospatialData(warehouse)` function to detailedPptService
  - Extract coordinates from warehouse.googleLocation using geospatialService
  - Fetch nearest airport, highway, and railway station in parallel using Promise.all()
  - Fetch satellite image URL
  - Return enriched warehouse object with geospatial data
  - Handle missing coordinates gracefully (return null values)
  - _Requirements: 1.2, 1.3, 2.1, 2.2, 2.3, 2.5, 5.1, 7.3_

- [x] 2.3 Implement main detailed PPT buffer creation function
  - Add `createDetailedPptBuffer(warehouses, customDetails)` function to detailedPptService
  - Initialize PptxGenJS with widescreen layout
  - Generate title slide using existing generateTitleSlide()
  - Generate index slide using existing generateIndexSlide()
  - Loop through warehouses and enrich with geospatial data
  - Generate detailed slide for each warehouse
  - Generate photo slides for each warehouse
  - Generate contact slide using existing generateContactSlide()
  - Return presentation buffer
  - _Requirements: 1.1, 1.4, 9.1, 9.2, 9.3, 9.5_

- [x] 3. Create detailed slide generation module
- [x] 3.1 Implement detailed slide layout and structure
  - Create `ppt-slides/detailedSlide.js` with `generateDetailedSlide()` function
  - Set up slide with white background
  - Add slide title: "Option X - [Warehouse Address]"
  - Define layout areas for distance highlights, address, technical details, commercials, and satellite image
  - _Requirements: 1.1, 3.4_

- [x] 3.2 Implement distance highlights section rendering
  - Add distance highlights table to left side of slide
  - Display nearest airport distance or "N/A"
  - Display nearest highway distance or "N/A"
  - Display nearest railway station distance or "N/A"
  - Display approach road width as "TBD"
  - Format distances with "km" unit
  - _Requirements: 2.1, 2.2, 2.3, 2.4, 3.5_

- [x] 3.3 Implement address section rendering
  - Add detailed address section below distance highlights
  - Display full address from warehouse.address field
  - Format with appropriate font size and wrapping
  - _Requirements: 3.2_

- [x] 3.4 Implement technical details section rendering
  - Add technical details table below address section
  - Display carpet area from totalSpaceSqft (join array with commas)
  - Display land type from WarehouseData.landType or "N/A"
  - Display construction type from warehouseType
  - Display side height from clearHeightFt or "N/A"
  - Display centre height as "TBD" (blank for now)
  - Display dimensions as "TBD"
  - Display flooring type as "TBD"
  - Display load bearing capacity as "TBD"
  - Display dock height as "TBD"
  - Display dock shutter dimensions as "TBD"
  - Display emergency exit doors as "TBD"
  - Display fire fighting systems from WarehouseData.fireSafetyMeasures or "N/A"
  - Display power from WarehouseData.powerKva or "N/A"
  - Display other amenities from otherSpecifications or "N/A"
  - _Requirements: 3.1, 3.3, 3.5_

- [x] 3.5 Implement commercials section rendering
  - Add commercials table below technical details
  - Display rent per sqft from ratePerSqft with "₹" symbol
  - Display deposit as "TBD"
  - Display lock-in as "TBD"
  - Display escalation as "5% YoY" (hard-coded)
  - Display notice period as "TBD"
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

- [x] 3.6 Implement satellite image embedding
  - Add satellite image to right side of slide
  - Download image from satelliteImageUrl using axios
  - Convert to base64 data URL
  - Embed image with appropriate sizing (maintain aspect ratio)
  - Display placeholder rectangle if image fails to load
  - Log errors for failed image downloads
  - _Requirements: 5.1, 5.2, 5.3, 5.4_

- [x] 4. Create photo slides generation module
- [x] 4.1 Implement dynamic photo layout logic
  - Add `generatePhotoSlides(pptx, warehouse, optionIndex)` function to detailedSlide.js
  - Parse valid photos from warehouse.validPhotos array
  - Group photos into batches of 4
  - Determine layout based on batch size (1, 2, 3, or 4 images)
  - Create slides for each batch
  - Add slide headers: "Option X - Photos (Page Y of Z)"
  - _Requirements: 6.2, 6.3, 6.5_

- [x] 4.2 Implement single image layout
  - For batches with 1 image, create large centered layout (7" x 5.5")
  - Use 'contain' sizing to prevent distortion
  - Center image on slide
  - _Requirements: 6.2, 6.5_

- [x] 4.3 Implement two-image layout
  - For batches with 2 images, create side-by-side layout (4" x 5" each)
  - Center images horizontally and vertically
  - Add 0.2" padding between images
  - Use 'contain' sizing
  - _Requirements: 6.2, 6.5_

- [x] 4.4 Implement three-image layout
  - For batches with 3 images, create layout with one large top image (6" x 3.5") and two smaller bottom images (2.9" x 2" each)
  - Position images with appropriate padding
  - Use 'contain' sizing
  - _Requirements: 6.2, 6.5_

- [x] 4.5 Implement four-image layout
  - For batches with 4 images, create 2x2 grid layout (4" x 2.8" each)
  - Position images in grid with 0.2" padding
  - Use 'contain' sizing
  - _Requirements: 6.2, 6.5_

- [x] 4.6 Implement image download and error handling
  - Download images using axios with arraybuffer response type
  - Convert to base64 data URLs
  - Detect image type (PNG/JPEG) from URL
  - Display gray placeholder rectangles for failed downloads
  - Log errors for failed image downloads
  - Skip invalid or inaccessible images
  - _Requirements: 6.4, 7.2_

- [x] 5. Add controller endpoint for detailed presentations
- [x] 5.1 Implement generateDetailedPresentation controller function
  - Add `generateDetailedPresentation(req, res)` to warehouseController.js
  - Parse warehouse IDs from request body (ids field)
  - Extract customDetails from request body
  - Validate warehouse IDs (must be positive integers)
  - Fetch warehouses from database using warehouseService
  - Return 404 if warehouses not found
  - Call detailedPptService.createDetailedPptBuffer()
  - Set response headers (Content-Disposition, Content-Type)
  - Send presentation buffer
  - Handle errors and return appropriate status codes
  - _Requirements: 1.1, 1.4, 8.1, 8.2, 9.4_

- [x] 5.2 Add route for detailed presentation endpoint
  - Add POST route `/api/generate-detailed-ppt` in routes file
  - Map route to generateDetailedPresentation controller
  - Configure extended timeout (5 minutes) for this endpoint
  - _Requirements: 1.5, 8.5_

- [x] 6. Add database migration for centre height column
- [x] 6.1 Create and run Prisma migration
  - Add `centreHeight String?` column to WarehouseData model in schema.prisma
  - Generate migration using `npx prisma migrate dev`
  - Run migration to update database schema
  - _Requirements: 3.1_

- [x] 7. Configure server timeout and error handling
- [x] 7.1 Update server timeout configuration
  - Configure Express server timeout to 5 minutes for detailed PPT endpoint
  - Set request and response timeout in middleware
  - _Requirements: 1.5, 8.5_

- [x] 7.2 Add comprehensive error logging
  - Add structured error logging for all external API calls
  - Log warehouse ID, function name, and error details
  - Use appropriate log levels (ERROR, WARN, INFO)
  - _Requirements: 7.1, 7.5_

- [x] 8. Testing and validation
- [x] 8.1 Test coordinate extraction with various URL formats
  - Test standard Google Maps URLs
  - Test shortened goo.gl URLs
  - Test direct coordinate strings
  - Test invalid inputs
  - _Requirements: 1.2_

- [x] 8.2 Test distance calculations
  - Verify Haversine formula accuracy with known coordinates
  - Test edge cases (same location, antipodal points)
  - _Requirements: 2.1, 2.2, 2.3_

- [x] 8.3 Test OpenStreetMap API integration
  - Test nearest airport finder with real coordinates
  - Test nearest highway finder with real coordinates
  - Test nearest railway station finder with real coordinates
  - Test satellite image URL generation
  - Verify rate limiting works correctly
  - _Requirements: 2.1, 2.2, 2.3, 5.1_

- [x] 8.4 Test detailed slide rendering
  - Test with complete warehouse data
  - Test with missing geospatial data
  - Test with missing optional fields
  - Verify "N/A" and "TBD" display correctly
  - _Requirements: 3.1, 3.5, 4.3_

- [x] 8.5 Test photo slide generation
  - Test with 0 photos
  - Test with 1, 2, 3, 4 photos
  - Test with 8+ photos (multiple slides)
  - Test with invalid image URLs
  - _Requirements: 6.1, 6.2, 6.3, 6.4_

- [x] 8.6 End-to-end integration testing
  - Test single warehouse presentation generation
  - Test multiple warehouses (3+) presentation generation
  - Test with customDetails (company name, employee name)
  - Verify title, index, and contact slides are included
  - Test timeout handling with 5+ warehouses
  - _Requirements: 1.1, 8.1, 8.2, 8.4, 9.1, 9.2, 9.3, 9.5_
