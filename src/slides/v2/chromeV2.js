const { COLORS, FONT, LOGO_PATH, formatDate } = require('./themeV2');

function addFooter(slide, opts = {}) {
    // Default: right-aligned in the photos column (detail / index / contact slides).
    // `variant: 'cover'` left-aligns it under the title block so it lines up
    // with the divider rule and "City · N Properties" line on the title slide,
    // instead of disappearing into the dark photo panel on the right.
    const isCover = opts.variant === 'cover';
    slide.addText(
        `Prepared by WareOnGo  |  Dated ${formatDate()}  |  Confidential`,
        isCover
            ? { x: 0.55, y: 5.345, w: 4.8, h: 0.28, fontFace: FONT, fontSize: 8.5, color: COLORS.navy, align: 'left' }
            : { x: 5.0, y: 5.345, w: 4.8, h: 0.28, fontFace: FONT, fontSize: 8.5, color: COLORS.navy, align: 'right' }
    );
}

function addTopRightLogo(slide) {
    slide.addImage({ path: LOGO_PATH, x: 9.55, y: 0.05, w: 0.4, h: 0.4 });
}

module.exports = { addFooter, addTopRightLogo };
