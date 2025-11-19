# Requirements Document

## Introduction

This feature extends the existing warehouse presentation generation system to create detailed warehouse slides. The system will generate comprehensive presentations containing technical specifications, distance highlights, commercial details, and all available warehouse images. The feature leverages OpenStreetMap for geospatial operations and automatically calculates distances to key infrastructure points.

## Glossary

- **Presentation System**: The existing PowerPoint generation system that creates warehouse presentations
- **Detailed Slide Endpoint**: A new API endpoint that generates comprehensive warehouse presentations with technical and distance information
- **OpenStreetMap (OSM)**: A free, open-source mapping service used for geospatial calculations and satellite imagery
- **Distance Highlights**: Calculated distances from a warehouse to nearby infrastructure (airports, highways, railway stations)
- **Technical Details Section**: A tabular presentation of warehouse specifications including dimensions, construction type, and amenities
- **Commercials Section**: A tabular presentation of pricing and lease terms
- **Image Layout System**: A dynamic slide generation system that arranges warehouse photos in optimal layouts (1-4 images per slide)
- **Geospatial Data**: Longitude and latitude coordinates extracted from the googleLocation field in the database

## Requirements

### Requirement 1

**User Story:** As a warehouse sales representative, I want to generate detailed presentations with comprehensive technical specifications, so that I can provide complete information to potential clients.

#### Acceptance Criteria

1. WHEN the user sends warehouse IDs to the detailed slides endpoint, THE Presentation System SHALL generate a presentation containing distance highlights, technical details, commercials, and all available warehouse images for each requested warehouse
2. THE Presentation System SHALL extract longitude and latitude from the googleLocation field in the database for geospatial calculations
3. THE Presentation System SHALL use OpenStreetMap for all distance calculations and satellite imagery retrieval
4. THE Presentation System SHALL support multiple warehouse IDs in a single request
5. THE Presentation System SHALL not timeout during processing, regardless of the number of warehouses or external API calls required

### Requirement 2

**User Story:** As a warehouse sales representative, I want distance information automatically calculated and displayed, so that clients can evaluate location convenience without manual research.

#### Acceptance Criteria

1. THE Presentation System SHALL calculate the distance from the warehouse to the nearest airport using the warehouse's geospatial data and OpenStreetMap services
2. THE Presentation System SHALL calculate the distance from the warehouse to the nearest national highway using the warehouse's geospatial data and OpenStreetMap services
3. THE Presentation System SHALL calculate the distance from the warehouse to the nearest railway station using the warehouse's geospatial data and OpenStreetMap services
4. THE Presentation System SHALL display all calculated distances in the distance highlights section of the detailed slide
5. IF geospatial data is unavailable for a warehouse, THEN THE Presentation System SHALL display "N/A" for distance calculations and log a warning

### Requirement 3

**User Story:** As a warehouse sales representative, I want technical specifications displayed in a clear tabular format, so that clients can quickly review warehouse capabilities.

#### Acceptance Criteria

1. THE Presentation System SHALL display the following technical details in a table: carpet area (from totalAreaOffered), land type, construction type (from warehouseType), side height (from clearHeight), fire fighting systems (from fireSafetyMeasures), power, and other amenities (from otherSpecifications)
2. THE Presentation System SHALL display the detailed address from the address column in the database
3. THE Presentation System SHALL leave the following fields blank: land area, centre height, dimensions, flooring type, load bearing capacity, dock height from floor, dock shutter dimensions, and emergency exit doors
4. THE Presentation System SHALL format the technical details table with clear labels and values for readability
5. THE Presentation System SHALL handle missing database values gracefully by displaying "N/A" or leaving cells empty

### Requirement 4

**User Story:** As a warehouse sales representative, I want commercial terms displayed clearly, so that clients understand pricing and lease conditions.

#### Acceptance Criteria

1. THE Presentation System SHALL display rent per square foot from the ratePerSqft database column
2. THE Presentation System SHALL hard-code escalation as "5% YoY" for all warehouses
3. THE Presentation System SHALL leave the following commercial fields blank: deposit, lock-in period, and notice period
4. THE Presentation System SHALL format the commercials section in a table alongside the technical details
5. THE Presentation System SHALL display all monetary values with appropriate currency formatting

### Requirement 5

**User Story:** As a warehouse sales representative, I want satellite imagery of each warehouse location included, so that clients can visualize the property and surrounding area.

#### Acceptance Criteria

1. THE Presentation System SHALL retrieve a satellite image of the warehouse location from OpenStreetMap using the warehouse's geospatial coordinates
2. THE Presentation System SHALL display the satellite image on the same slide as the distance highlights and technical details
3. THE Presentation System SHALL size and position the satellite image appropriately to maintain slide readability
4. IF satellite imagery cannot be retrieved, THEN THE Presentation System SHALL display a placeholder or omit the image and log a warning
5. THE Presentation System SHALL use free OpenStreetMap tile services without requiring API keys or paid subscriptions

### Requirement 6

**User Story:** As a warehouse sales representative, I want all available warehouse photos automatically included in the presentation, so that clients can see comprehensive visual documentation.

#### Acceptance Criteria

1. THE Presentation System SHALL parse all valid image URLs from the photos field in the database
2. THE Presentation System SHALL generate slides with dynamic layouts supporting 1, 2, 3, or 4 images per slide
3. WHEN a warehouse has more than 4 images, THE Presentation System SHALL create additional slides to display all images
4. THE Presentation System SHALL validate image URLs and skip invalid or inaccessible images
5. THE Presentation System SHALL maintain consistent image sizing and spacing across all layout configurations

### Requirement 7

**User Story:** As a system administrator, I want comprehensive error handling for external API calls, so that presentation generation remains reliable even when external services are unavailable.

#### Acceptance Criteria

1. IF an OpenStreetMap API call fails, THEN THE Presentation System SHALL log the error, display "N/A" for the affected data, and continue processing
2. IF an image URL is invalid or inaccessible, THEN THE Presentation System SHALL skip that image and continue with remaining images
3. IF geospatial coordinates are missing or invalid, THEN THE Presentation System SHALL skip distance calculations and satellite imagery for that warehouse
4. THE Presentation System SHALL return a partial presentation with available data rather than failing completely when some data is unavailable
5. THE Presentation System SHALL log all errors with sufficient detail for debugging while maintaining user-friendly error messages

### Requirement 8

**User Story:** As a warehouse sales representative, I want to generate presentations for multiple warehouses simultaneously, so that I can efficiently prepare materials for multiple clients.

#### Acceptance Criteria

1. THE Detailed Slide Endpoint SHALL accept a comma-separated list of warehouse IDs
2. THE Presentation System SHALL generate a single presentation file containing detailed slides for all requested warehouses
3. THE Presentation System SHALL process warehouses sequentially to manage external API rate limits
4. THE Presentation System SHALL maintain consistent slide ordering and formatting across all warehouses in the presentation
5. THE Presentation System SHALL set appropriate HTTP timeout configurations to prevent server timeouts during multi-warehouse processing

### Requirement 9

**User Story:** As a warehouse sales representative, I want the detailed presentation to include the same title, index, and contact slides as the standard presentation, so that branding and structure remain consistent across all presentation types.

#### Acceptance Criteria

1. THE Presentation System SHALL generate a title slide using the existing generateTitleSlide function with customDetails containing company name and employee name
2. THE Presentation System SHALL generate an index slide using the existing generateIndexSlide function listing all warehouses in the presentation
3. THE Presentation System SHALL generate a contact slide using the existing generateContactSlide function with customDetails at the end of the presentation
4. THE Detailed Slide Endpoint SHALL accept customDetails in the request body containing companyName and employeeName fields
5. THE Presentation System SHALL maintain the slide order: title slide, index slide, detailed warehouse slides for each warehouse, contact slide
