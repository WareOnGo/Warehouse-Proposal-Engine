# Frontend Updates - Presentation Type Selection

## Overview

The frontend has been updated to allow users to choose between **Standard PPT** and **Detailed PPT** generation. The UI and workflow adapt based on the selected presentation type.

## Changes Made

### 1. New Presentation Type Selector (index.html)

Added a radio button selector in the input section:

```html
<div class="presentation-type-selector">
    <label class="presentation-type-label">Presentation Type:</label>
    <div class="radio-group">
        <label class="radio-option">
            <input type="radio" name="ppt-type" value="standard" checked>
            <span class="radio-label">
                <strong>Standard PPT</strong>
                <small>Basic warehouse info with selected images</small>
            </span>
        </label>
        <label class="radio-option">
            <input type="radio" name="ppt-type" value="detailed">
            <span class="radio-label">
                <strong>Detailed PPT</strong>
                <small>Comprehensive data with geospatial info...</small>
            </span>
        </label>
    </div>
</div>
```

**Features:**
- Radio buttons for mutually exclusive selection
- Standard PPT is selected by default
- Clear descriptions for each option
- Visual feedback on selection

### 2. Dynamic Info Banner (index.html)

Added an info banner in the preview section that changes based on selection:

```html
<div id="ppt-type-info" class="info-banner"></div>
```

**Behavior:**
- **Standard PPT:** Blue banner explaining image selection (max 4 per warehouse)
- **Detailed PPT:** Yellow banner explaining all photos will be included automatically

### 3. Conditional Image Selection (app.js)

The image gallery behavior now adapts to the presentation type:

**Standard PPT:**
- Images are selectable (clickable)
- Max 4 images per warehouse
- Blue border on selected images
- Click to toggle selection

**Detailed PPT:**
- Images are preview-only (non-clickable)
- All photos automatically included
- Gray border, slightly transparent
- No selection needed

### 4. Dynamic API Endpoint Selection (app.js)

The confirm button now calls different endpoints based on selection:

**Standard PPT:**
- Endpoint: `/api/generate-ppt`
- Includes: `selectedImages`, full `customDetails`
- Filename: `Warehouses_X_Y_Z.pptx`

**Detailed PPT:**
- Endpoint: `/api/generate-detailed-ppt`
- Includes: `selectedImages`, `companyName` and `employeeName` in customDetails
- Filename: `Detailed_Warehouses_X_Y_Z.pptx`
- Extended timeout handling
- Uses selected images if provided, otherwise uses all available photos

### 5. Updated Status Messages (app.js)

Status messages now reflect the selected presentation type:

**Standard PPT:**
```
"Generating standard presentation, please wait..."
"Success! Your standard presentation download has started."
```

**Detailed PPT:**
```
"Generating detailed presentation with geospatial data, please wait... 
This may take 10-60 seconds per warehouse."
"Success! Your detailed presentation download has started."
```

### 6. New CSS Styles (style.css)

Added comprehensive styling for the new components:

**Presentation Type Selector:**
- Clean, modern radio button design
- Hover effects for better UX
- Selected state with blue accent
- Responsive layout

**Info Banners:**
- `.info-banner.standard` - Blue theme
- `.info-banner.detailed` - Yellow/warning theme
- Clear visual distinction

**Preview Images:**
- `.preview-image` - Non-selectable images for detailed mode
- Gray border, reduced opacity
- Consistent sizing with selectable images

## User Flow

### Standard PPT Flow

1. User selects "Standard PPT" (default)
2. Enters warehouse IDs and clicks "Fetch Details"
3. Sees blue info banner: "Select up to 4 images per warehouse"
4. Clicks images to select them (max 4 per warehouse)
5. Fills in custom details (all fields available)
6. Clicks "Confirm and Generate PPT"
7. Downloads standard presentation (~1-5 seconds)

### Detailed PPT Flow

1. User selects "Detailed PPT"
2. Enters warehouse IDs and clicks "Fetch Details"
3. Sees yellow info banner: "All photos will be included automatically"
4. Views all warehouse photos (non-selectable)
5. Fills in custom details (only company name and employee name used)
6. Clicks "Confirm and Generate PPT"
7. Waits for detailed presentation (~10-60 seconds per warehouse)
8. Downloads detailed presentation with geospatial data

## Key Differences Between Modes

| Feature | Standard PPT | Detailed PPT |
|---------|-------------|--------------|
| Image Selection | Manual (max 4) | Automatic (all) |
| Images Clickable | Yes | No |
| Custom Details Used | All fields | Company & Employee only |
| Generation Time | 1-5 seconds | 10-60 seconds per warehouse |
| Content | Basic info + selected images | Comprehensive with geospatial data |
| API Endpoint | `/api/generate-ppt` | `/api/generate-detailed-ppt` |
| Filename Prefix | `Warehouses_` | `Detailed_Warehouses_` |

## Technical Implementation Details

### JavaScript Functions

**`getSelectedPptType()`**
```javascript
function getSelectedPptType() {
    const selectedRadio = document.querySelector('input[name="ppt-type"]:checked');
    return selectedRadio ? selectedRadio.value : 'standard';
}
```

**Dynamic Image Class Assignment**
```javascript
if (selectedPptType === 'detailed') {
    img.className = 'preview-image';
} else {
    img.className = 'selectable-image';
    // Add click listener for selection
}
```

**Conditional API Call**
```javascript
if (selectedPptType === 'detailed') {
    endpoint = `${API_BASE_URL}/api/generate-detailed-ppt`;
    requestBody = {
        ids: currentWarehouseIds,
        customDetails: {
            companyName: clientNameInput.value.trim(),
            employeeName: pocNameInput.value.trim()
        }
    };
} else {
    endpoint = `${API_BASE_URL}/api/generate-ppt`;
    requestBody = {
        ids: currentWarehouseIds,
        selectedImages: selectedImages,
        customDetails: { /* all fields */ }
    };
}
```

## Browser Compatibility

The updated frontend uses modern CSS features:
- `:has()` pseudo-class for radio button styling
- Flexbox for layouts
- CSS transitions for smooth interactions

**Supported Browsers:**
- Chrome 105+
- Firefox 121+
- Safari 15.4+
- Edge 105+

**Fallback:** Older browsers will still function but may not show the selected radio button border styling.

## Mobile Responsiveness

The presentation type selector is fully responsive:
- Radio buttons stack vertically on mobile
- Touch-friendly tap targets
- Readable font sizes on small screens
- Info banners adapt to screen width

## Testing Checklist

- [ ] Standard PPT selection works (default)
- [ ] Detailed PPT selection works
- [ ] Info banner updates correctly
- [ ] Images are selectable in standard mode
- [ ] Images are non-selectable in detailed mode
- [ ] Standard PPT generates with selected images
- [ ] Detailed PPT generates with all photos
- [ ] Status messages are appropriate for each type
- [ ] Filenames are correct for each type
- [ ] Mobile layout works correctly
- [ ] Radio button styling works in supported browsers

## Future Enhancements

Potential improvements for future versions:

1. **Progress Indicator:** Show progress bar for detailed PPT generation
2. **Warehouse Count Warning:** Alert if selecting 10+ warehouses for detailed PPT
3. **Preview Mode:** Show sample slides before generating
4. **Batch Processing:** Queue multiple presentations
5. **Save Preferences:** Remember user's preferred PPT type
6. **Estimated Time:** Show estimated generation time based on warehouse count

## Troubleshooting

**Issue:** Images not showing as selectable in standard mode
- **Solution:** Check that `selectedPptType` is correctly set to 'standard'

**Issue:** Detailed PPT taking too long
- **Solution:** Reduce number of warehouses (recommend max 10)

**Issue:** Radio buttons not styled correctly
- **Solution:** Update browser to support `:has()` pseudo-class

**Issue:** Wrong API endpoint called
- **Solution:** Verify `getSelectedPptType()` returns correct value

## Files Modified

1. **frontend/index.html**
   - Added presentation type selector
   - Added info banner element
   - Added instruction visibility control

2. **frontend/app.js**
   - Added `getSelectedPptType()` function
   - Updated fetch logic to track selected type
   - Added conditional image class assignment
   - Updated confirm button to call correct endpoint
   - Added dynamic status messages

3. **frontend/style.css**
   - Added `.presentation-type-selector` styles
   - Added `.radio-group` and `.radio-option` styles
   - Added `.info-banner` styles (standard and detailed)
   - Added `.preview-image` styles
   - Updated mobile responsiveness

## Summary

The frontend now provides a seamless way for users to choose between standard and detailed presentations. The UI adapts intelligently based on the selection, hiding/showing relevant controls and providing clear feedback about what to expect. The implementation maintains backward compatibility with the existing standard PPT flow while adding powerful new detailed PPT capabilities.
