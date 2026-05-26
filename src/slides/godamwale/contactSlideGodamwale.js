const { COLORS, FONT } = require('./themeGodamwale');
const { addContentHeader, addWatermark, addBottomBar } = require('./chromeGodamwale');

function generateContactSlideGodamwale(pptx, customDetails) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.bg };

    const pocName = customDetails.pocName || 'Dhaval Gupta';
    const pocContact = customDetails.pocContact || '+91 8318825478';

    slide.addText('For more details (or) to schedule a site visit, please contact –', {
        x: 0.375, y: 2.25, w: 9.0, h: 0.375,
        fontFace: FONT, fontSize: 12, color: COLORS.navy, align: 'center',
    });

    slide.addText(
        [
            { text: pocName, options: { bold: true } },
            { text: '   |   ', options: {} },
            { text: pocContact, options: { bold: true } },
        ],
        {
            x: 0.375, y: 2.625, w: 9.0, h: 0.375,
            fontFace: FONT, fontSize: 17, color: COLORS.navy, align: 'center',
        }
    );

    slide.addText('www.wareongo.com', {
        x: 0.385, y: 3.046, w: 9.0, h: 0.375,
        fontFace: FONT, fontSize: 17, bold: true, color: COLORS.navy, align: 'center',
    });

    addContentHeader(slide);
    addWatermark(slide);
    addBottomBar(slide);
}

module.exports = { generateContactSlideGodamwale };
