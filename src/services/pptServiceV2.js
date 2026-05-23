const PptxGenJS = require('pptxgenjs');

const { generateTitleSlideV2 } = require('../slides/v2/titleSlideV2');
const { generateIndexSlideV2 } = require('../slides/v2/indexSlideV2');
const { generateDetailedSlideV2 } = require('../slides/v2/detailedSlideV2');
const { generateContactSlideV2 } = require('../slides/v2/contactSlideV2');

const createPptBufferV2 = async (warehouses, selectedImages = {}, customDetails = {}) => {
    const pptx = new PptxGenJS();
    pptx.layout = 'LAYOUT_16x9';

    await generateTitleSlideV2(pptx, warehouses, customDetails);
    generateIndexSlideV2(pptx, warehouses);

    for (let i = 0; i < warehouses.length; i++) {
        const w = warehouses[i];
        const photos = selectedImages[w.id] || [];
        await generateDetailedSlideV2(pptx, w, photos, i + 1);
    }

    generateContactSlideV2(pptx, customDetails);

    return pptx.write({ outputType: 'nodebuffer' });
};

module.exports = { createPptBufferV2 };
