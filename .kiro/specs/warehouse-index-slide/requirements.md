# Requirements Document

## Introduction

This feature adds an index slide to the warehouse presentation system that displays a summary table of all warehouse options in a "SNAP SHOTS" format. The slide will be positioned after the title slide but before the individual warehouse detail slides, providing users with a quick overview of all available options.

## Glossary

- **Presentation_System**: The existing PowerPoint generation system that creates warehouse proposal presentations
- **Index_Slide**: A new slide type that displays a tabular summary of all warehouse options
- **Warehouse_Option**: An individual warehouse listing with associated details like location, rental rate, and area
- **SNAP_SHOTS_Format**: A specific table layout with blue header, red sub-header, and alternating row colors showing warehouse summary data
- **PPT_Service**: The service module responsible for orchestrating slide generation and presentation creation

## Requirements

### Requirement 1

**User Story:** As a user generating warehouse presentations, I want an index slide that shows all warehouse options in a summary table, so that I can quickly compare key details across all options.

#### Acceptance Criteria

1. WHEN the presentation is generated, THE Presentation_System SHALL create an Index_Slide after the title slide and before individual warehouse slides
2. THE Index_Slide SHALL display warehouse data in the SNAP_SHOTS_Format with columns for S.No, Option Name, Location, Quoted Monthly Rental (INR/Sq.ft), and Offered Area (Sq.ft)
3. THE Index_Slide SHALL exclude the Timeline of Handover column from the original format
4. THE Index_Slide SHALL use the wareongo theme styling consistent with existing slides
5. THE Index_Slide SHALL populate data automatically from the warehouse objects passed to the presentation generator

### Requirement 2

**User Story:** As a developer maintaining the presentation system, I want the index slide functionality to be modular and reusable, so that it integrates cleanly with the existing slide generation architecture.

#### Acceptance Criteria

1. THE Presentation_System SHALL implement the Index_Slide as a separate module in the ppt-slides directory
2. THE PPT_Service SHALL call the Index_Slide generation function in the correct sequence within the presentation flow
3. THE Index_Slide SHALL accept warehouse data in the same format as existing slide generators
4. THE Index_Slide SHALL handle cases where warehouse data fields are missing or null
5. THE Presentation_System SHALL maintain backward compatibility with existing presentation generation functionality

### Requirement 3

**User Story:** As a user viewing the presentation, I want the index slide to have clear visual formatting and readable data presentation, so that I can easily scan and compare warehouse options.

#### Acceptance Criteria

1. THE Index_Slide SHALL use a header with "INDEX" title
2. THE Index_Slide SHALL use a BLUE sub-header row with white text for column titles
3. THE Index_Slide SHALL display warehouse options in alternating row colors for better readability
4. THE Index_Slide SHALL format rental rates as "XX/-" where XX is the rate per square foot
5. THE Index_Slide SHALL display area values as comma-separated numbers for multiple areas or single values