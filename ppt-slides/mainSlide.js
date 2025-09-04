// ppt-slides/mainSlide.js
const axios = require('axios');

async function generateMainSlide(pptx, warehouse, selectedPhotoUrls) {
    const mainSlide = pptx.addSlide();
    mainSlide.background = { color: 'FFFFFF' };

    // --- Left Sidebar ---
    mainSlide.addShape(pptx.shapes.RECTANGLE, { x: 0.0, y: 0.0, w: 3.5, h: '100%', fill: { color: 'F2F2F2' } });

    let textY = 0.7;

    // --- Warehouse ID on Top ---
    mainSlide.addText(`${warehouse.id}`, { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 18, bold: true });
    textY += 0.5;

    // --- Common Table Options ---
    const tableOptions = {
        x: 0.2,
        w: 3.1,
        border: { type: 'solid', pt: 1, color: 'CCCCCC' },
        fill: { color: 'E9E9E9' },
        fontSize: 9,
        colW: [1.3, 1.8],
        margin: 0.1,
        valign: 'middle'
    };

    // --- Property Information Table ---
    mainSlide.addText('Property Information', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const propInfoData = [
        [{ text: 'Warehouse ID', options: { bold: true } }, `${warehouse.id}`],
        [{ text: 'Address', options: { bold: true } }, warehouse.address]
    ];
    mainSlide.addTable(propInfoData, { ...tableOptions, y: textY, rowH: 0.4 });
    textY += (propInfoData.length * 0.4) + 0.3;

    // --- Specifications Table ---
    mainSlide.addText('Specifications', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const specsData = [
        [{ text: 'Carpet Area', options: { bold: true } }, `${warehouse.totalSpaceSqft.join(', ')} sqft`],
        [{ text: 'Warehouse Type', options: { bold: true } }, warehouse.warehouseType || 'N/A'],
        [{ text: 'Number of Docks', options: { bold: true } }, warehouse.numberOfDocks || 'N/A'],
        [{ text: 'Clear Height', options: { bold: true } }, warehouse.clearHeightFt || 'N/A'],
        [{ text: 'Compliances', options: { bold: true } }, warehouse.compliances || 'N/A'],
        [{ text: 'Other Specifications', options: { bold: true } }, warehouse.otherSpecifications || 'N/A']
    ];
    mainSlide.addTable(specsData, { ...tableOptions, y: textY, rowH: 0.35 });
    textY += (specsData.length * 0.35) + 0.3;

    // --- Commercials Table ---
    mainSlide.addText('Commercials', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const commercialsData = [
        [{ text: 'Rent per sq.ft (INR)', options: { bold: true } }, warehouse.ratePerSqft || 'N/A'],
        [{ text: 'Security Deposit', options: { bold: true } }, '10k'],
        [{ text: 'Availability', options: { bold: true } }, warehouse.availability || 'N/A']
    ];
    mainSlide.addTable(commercialsData, { ...tableOptions, y: textY, rowH: 0.35 });

    // --- Image Grid (Slightly Bigger, Adjusted Padding, Moved Right) ---
    const photoUrls = selectedPhotoUrls || [];
    if (photoUrls.length > 0) {
        const imageSize = 3.0; // Slightly bigger (was 2.8)
        const startX = 5.0; // Moved 0.5 inches to the right (was 4.5)
        const startY = 0.8;
        const padding = 0.2; // Adjusted padding (was 0.15)
        const imagePositions = [
            { x: startX, y: startY }, { x: startX + imageSize + padding, y: startY },
            { x: startX, y: startY + imageSize + padding }, { x: startX + imageSize + padding, y: startY + imageSize + padding }
        ];
        for (let i = 0; i < 4; i++) {
            const pos = imagePositions[i];
            if (photoUrls[i]) {
                try {
                    const response = await axios.get(photoUrls[i], { responseType: 'arraybuffer' });
                    const base64Image = `data:image/png;base64,${Buffer.from(response.data, 'binary').toString('base64')}`;
                    await mainSlide.addImage({
                        data: base64Image, x: pos.x, y: pos.y, w: imageSize, h: imageSize,
                        sizing: { type: 'cover', w: imageSize, h: imageSize }
                    });
                } catch (err) {
                    console.error(`\nFailed to download image: ${photoUrls[i]}`);
                    mainSlide.addShape(pptx.shapes.RECTANGLE, {
                        x: pos.x, y: pos.y, w: imageSize, h: imageSize,
                        fill: { color: 'E0E0E0' }
                    });
                }
            } else {
                mainSlide.addShape(pptx.shapes.RECTANGLE, {
                    x: pos.x, y: pos.y, w: imageSize, h: imageSize,
                    fill: { color: 'E0E0E0' }
                });
            }
        }
    } else {
        mainSlide.addText(
            'Photos not available.\nCan be provided upon request/during site visit.',
            { x: 5.0, y: 2.7, w: 5.5, h: 1.5, align: 'center', valign: 'middle', fontSize: 14, color: '808080' }
        );
    }
}

module.exports = { generateMainSlide };