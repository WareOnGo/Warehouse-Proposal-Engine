# Design Document

## Overview

The warehouse index slide feature adds a summary table slide to the existing PowerPoint presentation system. This slide provides a "SNAP SHOTS" overview of all warehouse options, positioned strategically after the title slide to give users immediate visibility into all available options before diving into detailed individual slides.

## Architecture

### Integration Points

The index slide integrates with the existing presentation architecture through:

1. **PPT Service Integration**: The `pptService.js` will be modified to call the new index slide generator after the title slide and before the warehouse detail slides
2. **Slide Module Pattern**: Following the existing pattern of separate slide modules (`titleSlide.js`, `mainSlide.js`, `contactSlide.js`)
3. **Data Flow**: Uses the same warehouse data array that's already passed to the presentation generator

### Slide Positioning

```
Title Slide → Index Slide → Warehouse Detail Slides → Contact Slide
```

## Components and Interfaces

### New Component: indexSlide.js

**Location**: `ppt-slides/indexSlide.js`

**Function Signature**:
```javascript
function generateIndexSlide(pptx, warehouses)
```

**Parameters**:
- `pptx`: PptxGenJS instance for slide creation
- `warehouses`: Array of warehouse objects from database

**Responsibilities**:
- Create slide with SNAP SHOTS table layout
- Extract and format warehouse data for table display
- Apply wareongo theme styling
- Handle missing or null data gracefully

### Modified Component: pptService.js

**Changes Required**:
- Import the new `generateIndexSlide` function
- Add index slide generation call in the correct sequence
- Maintain existing functionality and parameters

## Data Models

### Input Data Structure

The function will work with the existing warehouse data model from Prisma:

```javascript
{
  id: number,
  address: string,
  city: string,
  state: string,
  totalSpaceSqft: number[],
  ratePerSqft: string,
  // ... other fields
}
```

### Table Data Transformation

The warehouse data will be transformed into table rows:

```javascript
[
  ["S.No", "Option Name", "Location", "Quoted Monthly Rental (INR/Sq.ft)", "Offered Area (Sq.ft)"],
  [1, "Option 1", "City, State", "XX/-", "25,000"],
  // ... additional rows
]
```

### Data Extraction Logic

- **S.No**: Sequential numbering (1, 2, 3, ...)
- **Option Name**: Generated as "Option X" where X is the sequence number
- **Location**: Combination of `city` and `state` fields
- **Quoted Monthly Rental**: `ratePerSqft` formatted as "XX/-"
- **Offered Area**: `totalSpaceSqft` array joined with commas, or single value

## Error Handling

### Missing Data Scenarios

1. **Null/undefined warehouse fields**: Display "N/A" for missing values
2. **Empty totalSpaceSqft array**: Display "N/A" for area
3. **Invalid ratePerSqft**: Display "N/A" for rental rate
4. **Missing city/state**: Use available field or "N/A"

### Graceful Degradation

- If no warehouses provided, create slide with "No options available" message
- If warehouse array is empty, display appropriate placeholder content
- Maintain slide structure even with missing data

## Testing Strategy

### Unit Testing Approach

1. **Data Transformation Tests**:
   - Test warehouse data extraction and formatting
   - Verify handling of missing/null fields
   - Validate table row generation

2. **Integration Tests**:
   - Test slide generation with various warehouse data sets
   - Verify slide positioning in presentation sequence
   - Test with edge cases (empty arrays, null values)

3. **Visual Validation**:
   - Generate sample presentations to verify styling
   - Check table formatting and alignment
   - Validate color scheme matches wareongo theme

### Test Data Sets

- Complete warehouse data (all fields populated)
- Partial warehouse data (some fields missing)
- Edge cases (empty arrays, null values)
- Single warehouse vs multiple warehouses

## Implementation Notes

### Styling Specifications

Based on the provided image reference:

1. **Header Styling**:
   - Blue background (#1f4e79 or similar)
   - White "SNAP SHOTS" text
   - Bold, centered alignment

2. **Sub-header Row**:
   - Red background (#c5504b or similar)
   - White column header text
   - Bold font weight

3. **Data Rows**:
   - Alternating white and light gray backgrounds
   - Black text for data
   - Consistent padding and alignment

4. **Table Structure**:
   - 5 columns as specified (excluding Timeline of Handover)
   - Responsive column widths based on content
   - Proper borders and spacing

### Performance Considerations

- Minimal data processing overhead (simple array transformations)
- No external API calls or heavy computations
- Reuses existing PptxGenJS table generation capabilities
- Maintains existing presentation generation performance