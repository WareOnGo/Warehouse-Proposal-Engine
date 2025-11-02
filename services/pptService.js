const PptxGenJS = require('pptxgenjs');

// Note the relative path to your existing slide generation functions
const { generateTitleSlide } = require('../ppt-slides/titleSlide');
const { generateIndexSlide } = require('../ppt-slides/indexSlide');
const { generateMainSlide } = require('../ppt-slides/mainSlide');
const { generateContactSlide } = require('../ppt-slides/contactSlide');

// Creates the complete presentation and returns it as a buffer
const createPptBuffer = async (warehouses, selectedImages, customDetails) => {
    let pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_WIDE';

    generateTitleSlide(pptx, warehouses[0], customDetails);

    // Generate index slide after title slide and before warehouse detail slides
    generateIndexSlide(pptx, warehouses);

    // Use a for...of loop to properly handle async operations in generateMainSlide
    let optionCounter = 1;
    for (const warehouse of warehouses) {
        const selectedWarehouseImages = selectedImages[warehouse.id] || [];
        await generateMainSlide(pptx, warehouse, selectedWarehouseImages, optionCounter);
        optionCounter++;
    }

    generateContactSlide(pptx, customDetails);

    // Generate and return the file buffer
    return await pptx.write('base64').then(base64 => Buffer.from(base64, 'base64'));
};

module.exports = {
    createPptBuffer
};
