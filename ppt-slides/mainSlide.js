// ppt-slides/mainSlide.js
function generateMainSlide(pptx, warehouse, selectedPhotoUrls) {
    const mainSlide = pptx.addSlide();
    mainSlide.background = { color: 'FFFFFF' };
    mainSlide.addShape(pptx.shapes.RECTANGLE, { x: 0.0, y: 0.0, w: 3.5, h: '100%', fill: { color: 'F0F0F0' } });
    mainSlide.addImage({
        path: 'https://pub-94c0eb3cd2df4e71a1b6f5b73273bc71.r2.dev/Screenshot%202025-08-27%20153449.png',
        x: 12.35, y: 0, w: 1.0, h: 1.0,
    });
    
    // Text details section remains unchanged
    const detailsArray = [
        { text: `Option #${warehouse.id}`, options: { fontSize: 14, bold: true } },
        { text: `\n${warehouse.city}, ${warehouse.state}`, options: { fontSize: 18, bold: true } },
        { text: '\n\n' },
    ];
    // ... (rest of the text-building logic is the same)
    const locationLines = [`Address: ${warehouse.address}`];
    if (warehouse.zone) locationLines.push(`Zone: ${warehouse.zone}`);
    if (warehouse.postalCode) locationLines.push(`Postal Code: ${warehouse.postalCode}`);
    if (warehouse.googleLocation) locationLines.push(`Location Link`);
    const specsLines = [ `Warehouse Type: ${warehouse.warehouseType}`, `Total Space: ${warehouse.totalSpaceSqft.join(', ')} sqft` ];
    if (warehouse.offeredSpaceSqft) specsLines.push(`Offered Space: ${warehouse.offeredSpaceSqft}`);
    if (warehouse.numberOfDocks) specsLines.push(`# of Docks: ${warehouse.numberOfDocks}`);
    if (warehouse.clearHeightFt) specsLines.push(`Clear Height: ${warehouse.clearHeightFt}`);
    const commercialsLines = [`Rate: Rs. ${warehouse.ratePerSqft}/sft`];
    if (warehouse.availability) commercialsLines.push(`Availability: ${warehouse.availability}`);
    const additionalLines = [`Compliances: ${warehouse.compliances}`];
    if (warehouse.otherSpecifications) additionalLines.push(`Other Specs: ${warehouse.otherSpecifications}`);
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
    mainSlide.addText(detailsArray, { x: 0.3, y: 0.5, w: 3.0, h: '90%', lineSpacing: 17 });

    // --- UPDATED LOGIC: Add Image Grid OR "Not Available" Text ---
    const photoUrls = selectedPhotoUrls || [];

    if (photoUrls.length > 0) {
        // If images are selected, create the grid
        const imageSize = 2.8;
        const startX = 4.5;
        const startY = 0.8;
        const padding = 0.15;

        const imagePositions = [
            { x: startX, y: startY }, { x: startX + imageSize + padding, y: startY },
            { x: startX, y: startY + imageSize + padding }, { x: startX + imageSize + padding, y: startY + imageSize + padding }
        ];

        for (let i = 0; i < 4; i++) {
            const pos = imagePositions[i];
            if (photoUrls[i]) {
                mainSlide.addImage({
                    path: photoUrls[i], x: pos.x, y: pos.y, w: imageSize, h: imageSize,
                    sizing: { type: 'cover', w: imageSize, h: imageSize }
                });
            } else {
                mainSlide.addShape(pptx.shapes.RECTANGLE, {
                    x: pos.x, y: pos.y, w: imageSize, h: imageSize,
                    fill: { color: 'E0E0E0' }
                });
            }
        }
    } else {
        // If NO images are selected, add the text message instead
        mainSlide.addText(
            'Photos not available.\nCan be provided upon request/during site visit.',
            {
                x: 5.0, y: 2.7, w: 5.5, h: 1.5,
                align: 'center', valign: 'middle',
                fontSize: 14, color: '808080'
            }
        );
    }
}

module.exports = { generateMainSlide };