// ppt-slides/mainSlide.js
const axios = require('axios');

async function generateMainSlide(pptx, warehouse, selectedPhotoUrls, optionIndex) {
    const mainSlide = pptx.addSlide();
    mainSlide.background = { color: 'FFFFFF' };

    // --- Left Sidebar ---
    mainSlide.addShape(pptx.shapes.RECTANGLE, { x: 0.0, y: 0.0, w: 3.5, h: '100%', fill: { color: 'F2F2F2' } });

    // --- All table and text logic remains the same ---
    let textY = 0.7;
    mainSlide.addText(`Option ${optionIndex}`, { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 18, bold: true });
    textY += 0.5;
    const tableOptions = { x: 0.2, w: 3.1, border: { type: 'solid', pt: 1, color: 'CCCCCC' }, fill: { color: 'E9E9E9' }, fontSize: 9, colW: [1.3, 1.8], margin: 0.1, valign: 'middle' };
    mainSlide.addText('Property Information', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const propInfoData = [[{ text: 'Warehouse ID', options: { bold: true } }, `${warehouse.id}`], [{ text: 'Address', options: { bold: true } }, warehouse.address]];
    mainSlide.addTable(propInfoData, { ...tableOptions, y: textY, rowH: 0.4 });
    textY += (propInfoData.length * 0.4) + 0.3;
    mainSlide.addText('Specifications', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const specsData = [[{ text: 'Carpet Area', options: { bold: true } }, `${warehouse.totalSpaceSqft.join(', ')} sqft`], [{ text: 'Warehouse Type', options: { bold: true } }, warehouse.warehouseType || 'N/A'], [{ text: 'Number of Docks', options: { bold: true } }, warehouse.numberOfDocks || 'N/A'], [{ text: 'Clear Height', options: { bold: true } }, warehouse.clearHeightFt || 'N/A'], [{ text: 'Compliances', options: { bold: true } }, warehouse.compliances || 'N/A'], [{ text: 'Other Specifications', options: { bold: true } }, warehouse.otherSpecifications || 'N/A']];
    mainSlide.addTable(specsData, { ...tableOptions, y: textY, rowH: 0.35 });
    textY += (specsData.length * 0.35) + 0.3;
    mainSlide.addText('Commercials', { x: 0.2, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, color: '0077CC', bold: true });
    textY += 0.25;
    const commercialsData = [[{ text: 'Rent per sq.ft (INR)', options: { bold: true } }, warehouse.ratePerSqft || 'N/A'], [{ text: 'Security Deposit', options: { bold: true } }, 'Available on Request'], [{ text: 'Availability', options: { bold: true } }, warehouse.availability || 'N/A']];
    mainSlide.addTable(commercialsData, { ...tableOptions, y: textY, rowH: 0.35 });


    // --- DYNAMIC IMAGE GRID ---
    const photoUrls = selectedPhotoUrls || [];

    // Common offsets for 1, 2, and 3 image cases
    const offsetX = 1.0; // 1 inch right
    const offsetY = 1.0; // 1 inch down

    // Helper function to add an image and catch errors
    const addImageToSlide = async (url, options) => {
        try {
            const response = await axios.get(url, { responseType: 'arraybuffer' });
            // Detect image type from URL or use generic image type
            const imageType = url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
            const base64Image = `data:${imageType};base64,${Buffer.from(response.data).toString('base64')}`;
            await mainSlide.addImage({ data: base64Image, ...options });
        } catch (err) {
            console.error(`\nFailed to download image: ${url}`);
            mainSlide.addShape(pptx.shapes.RECTANGLE, { ...options, fill: { color: 'E0E0E0' } });
        }
    };

    switch (photoUrls.length) {
        case 1:
            // Layout for 1 image: Large, moved right and down
            await addImageToSlide(photoUrls[0], { x: 3.9 + offsetX, y: offsetY, w: 7.0, h: 5.5, sizing: { type: 'cover', w: 7.0, h: 5.5 } });
            break;

        case 2:
            // CORRECTED: Two slightly taller rectangular images, side-by-side.
            const twoImgWidth = 4.0;  // Slightly narrower
            const twoImgHeight = 5; // Slightly taller
            const twoImgPadding = 0.2;

            // Calculate starting X to center the two images horizontally
            const totalWidthTwoImages = (twoImgWidth * 2) + twoImgPadding;
            const availableSpaceX = 13.33 - (4.4 + offsetX); // Using full widescreen width
            const startXTwoImages = 3.5 + offsetX + (availableSpaceX - totalWidthTwoImages) / 2;

            // Calculate starting Y to center the images vertically
            const availableSpaceY = 5.625; // Full slide height
            const startYTwoImages = (offsetY - 0.05) + (availableSpaceY - twoImgHeight) / 2;

            await addImageToSlide(photoUrls[0], {
                x: startXTwoImages,
                y: startYTwoImages,
                w: twoImgWidth,
                h: twoImgHeight,
                sizing: { type: 'cover', w: twoImgWidth, h: twoImgHeight }
            });
            await addImageToSlide(photoUrls[1], {
                x: startXTwoImages + twoImgWidth + twoImgPadding,
                y: startYTwoImages,
                w: twoImgWidth,
                h: twoImgHeight,
                sizing: { type: 'cover', w: twoImgWidth, h: twoImgHeight }
            });
            break;
        case 3:
            // Layout for 3 images: Larger, bottom images taller, shifted 1 inch left.
            const threeImgW = 6.0;
            const threeImgTopH = 3.5;    // Adjusted top height to accommodate taller bottom images
            const threeImgBotH = 2.0;    // Increased from 1.4 for taller bottom images
            const threeImgPadding = 0.2;
            const threeImgBotW = (threeImgW - threeImgPadding) / 2;

            // Adjust offsetX for a 1-inch left shift
            const currentOffsetX = 1.5; // Assuming offsetX is 1.0 from previous instruction
            const newOffsetX = currentOffsetX - 1.0; // Shift 1 inch left

            await addImageToSlide(photoUrls[0], {
                x: 4.8 + newOffsetX,
                y: -0.1 + offsetY,
                w: threeImgW,
                h: threeImgTopH,
                sizing: { type: 'contain', w: threeImgW, h: threeImgTopH }
            });
            await addImageToSlide(photoUrls[1], {
                x: 4.8 + newOffsetX,
                y: -0.1 + offsetY + threeImgTopH + threeImgPadding,
                w: threeImgBotW,
                h: threeImgBotH,
                sizing: { type: 'contain', w: threeImgBotW, h: threeImgBotH }
            });
            await addImageToSlide(photoUrls[2], {
                x: 4.8 + newOffsetX + threeImgBotW + threeImgPadding,
                y: -0.1 + offsetY + threeImgTopH + threeImgPadding,
                w: threeImgBotW,
                h: threeImgBotH,
                sizing: { type: 'contain', w: threeImgBotW, h: threeImgBotH }
            });
            break;

        case 0:
            // Unchanged position from previous stable state
            mainSlide.addText('Photos not available.\nCan be provided upon request/during site visit.', { x: 5.0, y: 2.7, w: 5.5, h: 1.5, align: 'center', valign: 'middle', fontSize: 14, color: '808080' });
            break;

        default: // This handles 4 or more images by displaying the first 4.
            // Layout for 4 images: Using 'contain' to prevent any stretching.
            const fourImgWidth = 4;
            const fourImgHeight = 2.8;
            const startX_four = 4.3;
            const startY_four = 0.85;
            const padding_four = 0.2;

            const imagePositions = [
                { x: startX_four, y: startY_four },
                { x: startX_four + fourImgWidth + padding_four, y: startY_four },
                { x: startX_four, y: startY_four + fourImgHeight + padding_four },
                { x: startX_four + fourImgWidth + padding_four, y: startY_four + fourImgHeight + padding_four }
            ];

            for (let i = 0; i < 4; i++) {
                if (photoUrls[i]) {
                    await addImageToSlide(photoUrls[i], {
                        x: imagePositions[i].x,
                        y: imagePositions[i].y,
                        w: fourImgWidth,
                        h: fourImgHeight,
                        // THIS IS THE FIX: Changed 'cover' to 'contain'
                        sizing: { type: 'contain', w: fourImgWidth, h: fourImgHeight }
                    });
                } else {
                    mainSlide.addShape(pptx.shapes.RECTANGLE, {
                        x: imagePositions[i].x,
                        y: imagePositions[i].y,
                        w: fourImgWidth,
                        h: fourImgHeight,
                        fill: { color: 'E0E0E0' }
                    });
                }
            }
            break;
    }
}

module.exports = { generateMainSlide };