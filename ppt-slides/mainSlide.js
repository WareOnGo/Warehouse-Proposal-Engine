function generateMainSlide(pptx, warehouse) {
    const mainSlide = pptx.addSlide();
    mainSlide.background = { color: 'FFFFFF' };
    mainSlide.addShape(pptx.shapes.RECTANGLE, { x: 0.0, y: 0.0, w: 3.5, h: '100%', fill: { color: 'F0F0F0' } });
    mainSlide.addImage({
        path: 'https://media.discordapp.net/attachments/407948468284424192/1410203672947982347/6918ae2a-ec3a-4f83-b202-6a58c5290975.png?ex=68b02a03&is=68aed883&hm=b0b5d0d4e9a9c606e953904cbd92d4fd2971bb27578fe43ddebb438243fd2ea2&=&format=webp&quality=lossless',
        x: 12.35, y: 0, w: 1.0, h: 1.0,
    });
    // 1. Build an array of text objects. Use '\n' for line breaks.
    // 1. Build an array of text objects with corrected line breaks.
    const detailsArray = [
        // --- Main Title ---
        { text: `Option #${warehouse.id}`, options: { fontSize: 14, bold: true } },
        { text: `\n${warehouse.city}, ${warehouse.state}`, options: { fontSize: 18, bold: true } },
        { text: '\n\n' }, // Explicit spacer
    ];

    // --- Build each section's text block ---

    // Location Details
    const locationLines = [`Address: ${warehouse.address}`];
    if (warehouse.zone) locationLines.push(`Zone: ${warehouse.zone}`);
    if (warehouse.postalCode) locationLines.push(`Postal Code: ${warehouse.postalCode}`);
    if (warehouse.googleLocation) locationLines.push(`Location Link`);

    // Specifications
    const specsLines = [
        `Warehouse Type: ${warehouse.warehouseType}`,
        `Total Space: ${warehouse.totalSpaceSqft.join(', ')} sqft`
    ];
    if (warehouse.offeredSpaceSqft) specsLines.push(`Offered Space: ${warehouse.offeredSpaceSqft}`);
    if (warehouse.numberOfDocks) specsLines.push(`# of Docks: ${warehouse.numberOfDocks}`);
    if (warehouse.clearHeightFt) specsLines.push(`Clear Height: ${warehouse.clearHeightFt}`);

    // Commercials
    const commercialsLines = [`Rate: Rs. ${warehouse.ratePerSqft}/sft`];
    if (warehouse.availability) commercialsLines.push(`Availability: ${warehouse.availability}`);
    
    // Additional Info
    const additionalLines = [`Compliances: ${warehouse.compliances}`];
    if (warehouse.otherSpecifications) additionalLines.push(`Other Specs: ${warehouse.otherSpecifications}`);

    // --- Add the formatted blocks to the main array ---
    
    detailsArray.push({ text: 'Location Details', options: { fontSize: 11, bold: true, underline: true } });
    detailsArray.push({ text: '\n' + locationLines.join('\n'), options: { fontSize: 10, hyperlink: warehouse.googleLocation ? { url: warehouse.googleLocation, tooltip: 'Open Google Maps' } : undefined } });
    detailsArray.push({ text: '\n\n' });

    detailsArray.push({ text: 'Specifications', options: { fontSize: 11, bold: true, underline: true } });
    detailsArray.push({ text: '\n' + specsLines.join('\n'), options: { fontSize: 10 } });
    detailsArray.push({ text: '\n\n' });

    detailsArray.push({ text: 'Commercials', options: { fontSize: 11, bold: true, underline: true } });
    detailsArray.push({ text: '\n' + commercialsLines.join('\n'), options: { fontSize: 10, bold: true } });
    detailsArray.push({ text: '\n\n' });

    detailsArray.push({ text: 'Additional Info', options: { fontSize: 11, bold: true, underline: true } });
    detailsArray.push({ text: '\n' + additionalLines.join('\n'), options: { fontSize: 10 } });

    // Add the entire array to a single text box.
    mainSlide.addText(detailsArray, {
        x: 0.3, y: 0.5, w: 3.0, h: '90%',
        lineSpacing: 17 // Final adjustment for a clean, compact look
    });

    const photoUrls = (warehouse.photos && warehouse.photos.length > 0) ? warehouse.photos.split(',').map(url => url.trim()) : [];
    
    // Adjusted sizes for slightly larger images
    const imageSize = 2.8; // Increased from 2.5
    const startX = 4.5;    // Adjusted to start slightly more to the left
    const startY = 0.8;    // Adjusted to start slightly higher
    const padding = 0.15;  // Slightly reduced padding between images

    const imagePositions = [
        { x: startX, y: startY },
        { x: startX + imageSize + padding, y: startY },
        { x: startX, y: startY + imageSize + padding },
        { x: startX + imageSize + padding, y: startY + imageSize + padding }
    ];

    for (let i = 0; i < 4; i++) {
        const pos = imagePositions[i];
        if (photoUrls[i]) {
            mainSlide.addImage({
                path: photoUrls[i],
                x: pos.x,
                y: pos.y,
                w: imageSize,
                h: imageSize,
                sizing: { type: 'cover', w: imageSize, h: imageSize }
            });
        } else {
            // Add a grey placeholder box if no image is available
            mainSlide.addShape(pptx.shapes.RECTANGLE, {
                x: pos.x,
                y: pos.y,
                w: imageSize,
                h: imageSize,
                fill: { color: 'E0E0E0' }
            });
        }
    }
}

module.exports = { generateMainSlide };