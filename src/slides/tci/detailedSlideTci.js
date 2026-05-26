const axios = require('axios');
const { COLORS, FONT } = require('./themeTci');
const { addOptionSlideChrome } = require('./chromeTci');

const MAX_CELL_CHARS = 110;
const clamp = (s) => {
    if (s == null) return '';
    const str = String(s);
    return str.length <= MAX_CELL_CHARS ? str : str.slice(0, MAX_CELL_CHARS - 1).trimEnd() + '…';
};

const IMAGE_EXT_RE = /\.(jpe?g|png|gif|webp|bmp)(?:$|\?)/i;
const isImageUrl = (url) => typeof url === 'string' && IMAGE_EXT_RE.test(url);

const fetchImage = async (url) => {
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const mime = url.toLowerCase().includes('.png') ? 'image/png' : 'image/jpeg';
    return `data:${mime};base64,${Buffer.from(response.data).toString('base64')}`;
};

const addImageOrPlaceholder = async (pptx, slide, url, box) => {
    if (!url) {
        slide.addShape('rect', { ...box, fill: { color: 'EFEFEF' }, line: { color: 'D0D0D0', width: 0.5 } });
        return;
    }
    try {
        const data = await fetchImage(url);
        slide.addImage({ data, ...box, sizing: { type: 'cover', w: box.w, h: box.h } });
    } catch (_) {
        slide.addShape('rect', { ...box, fill: { color: 'EFEFEF' }, line: { color: 'D0D0D0', width: 0.5 } });
    }
};

// Photo column on the right matches the source template's split: table fills
// the left half, two large photos stack vertically on the right.
const PHOTO_REGION = { x: 5.30, y: 1.25, w: 4.45, h: 5.85 };
const GAP = 0.12;

const photoLayouts = {
    1: () => [{ ...PHOTO_REGION }],
    2: () => {
        const h = (PHOTO_REGION.h - GAP) / 2;
        return [
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y, w: PHOTO_REGION.w, h },
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y + h + GAP, w: PHOTO_REGION.w, h },
        ];
    },
    3: () => {
        const topH = (PHOTO_REGION.h - GAP) * 0.55;
        const botH = PHOTO_REGION.h - topH - GAP;
        const botW = (PHOTO_REGION.w - GAP) / 2;
        return [
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y, w: PHOTO_REGION.w, h: topH },
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y + topH + GAP, w: botW, h: botH },
            { x: PHOTO_REGION.x + botW + GAP, y: PHOTO_REGION.y + topH + GAP, w: botW, h: botH },
        ];
    },
    4: () => {
        const w = (PHOTO_REGION.w - GAP) / 2;
        const h = (PHOTO_REGION.h - GAP) / 2;
        return [
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y, w, h },
            { x: PHOTO_REGION.x + w + GAP, y: PHOTO_REGION.y, w, h },
            { x: PHOTO_REGION.x, y: PHOTO_REGION.y + h + GAP, w, h },
            { x: PHOTO_REGION.x + w + GAP, y: PHOTO_REGION.y + h + GAP, w, h },
        ];
    },
};

const layoutPhotos = async (pptx, slide, photos) => {
    if (photos.length === 0) {
        slide.addText('Photos not available.\nCan be provided upon request.', {
            ...PHOTO_REGION,
            fontFace: FONT, fontSize: 16, color: '808080', align: 'center', valign: 'middle',
        });
        return;
    }
    const boxes = photoLayouts[Math.min(photos.length, 4)]();
    await Promise.all(photos.slice(0, 4).map((url, i) => addImageOrPlaceholder(pptx, slide, url, boxes[i])));
};

async function generateDetailedSlideTci(pptx, warehouse, selectedPhotoUrls, optionIndex) {
    const slide = pptx.addSlide();
    slide.background = { color: COLORS.bg };

    slide.addText(`${optionIndex}. Option ${optionIndex} – Property Details & Photos`, {
        x: 0.32, y: 0.38, w: 7.0, h: 0.55,
        fontFace: FONT, fontSize: 22, bold: true, color: COLORS.text,
    });

    addOptionSlideChrome(slide);

    const projectName = warehouse.projectName
        || [warehouse.city, warehouse.state].filter(Boolean).join(', ')
        || warehouse.address
        || `Property ${warehouse.id}`;

    const wd = warehouse.WarehouseData || {};
    const yn = (v) => (v ? 'Yes' : 'No');
    const lat = wd.latitude, lng = wd.longitude;
    const hasCoords = typeof lat === 'number' && typeof lng === 'number';
    const mapsUrl = warehouse.googleLocation
        || (hasCoords ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}` : null);
    const coordsText = hasCoords ? `${lat}, ${lng}` : (warehouse.googleLocation ? 'See link' : 'Available on demand');

    const area = Array.isArray(warehouse.totalSpaceSqft) && warehouse.totalSpaceSqft.length
        ? `Offered area – ${warehouse.totalSpaceSqft.join(', ')} sq. ft.`
        : (warehouse.offeredSpaceSqft || 'N/A');

    // Header rows reproduce the source's dark navy "Project name" band plus
    // the white "Building Structural Details" sub-header.
    const headerCellOpts = {
        bold: true, color: COLORS.textInverse, fill: { color: COLORS.headerBg },
        fontFace: FONT, fontSize: 12, valign: 'middle', margin: 0.06,
    };
    const subHeaderOpts = {
        bold: true, color: COLORS.text, fontFace: FONT, fontSize: 11,
        valign: 'middle', margin: 0.06,
    };
    const labelOpts = {
        color: COLORS.text, fontFace: FONT, fontSize: 10,
        valign: 'middle', margin: 0.06,
    };
    const valueOpts = {
        color: COLORS.text, fontFace: FONT, fontSize: 10,
        valign: 'middle', margin: 0.06,
    };

    const cells = [
        [
            { text: 'Project name', options: headerCellOpts },
            { text: projectName, options: headerCellOpts },
        ],
        [
            { text: 'Building Structural Details', options: { ...subHeaderOpts, colspan: 2 } },
        ],
        ['Type of Option', warehouse.warehouseType || 'Ready To Move – PEB Structure'],
        ['Google Coordinates', mapsUrl
            ? { text: coordsText, options: { ...valueOpts, hyperlink: { url: mapsUrl }, color: COLORS.hyperlink, underline: { style: 'sng' } } }
            : coordsText],
        ['Status of Land', wd.landType ? `${wd.landType} CLU` : 'Approved For warehousing'],
        ['Area details', area],
        ['Rental per sq. ft.', warehouse.ratePerSqft != null ? `${warehouse.ratePerSqft} INR + GST` : 'On request'],
        ['Eaves Height', warehouse.clearHeightFt ? `${warehouse.clearHeightFt} Meter` : 'N/A'],
        ['Type Of Flooring', warehouse.flooringType || 'N/A'],
        ['Floor Load Capacity', warehouse.floorStrengthPerSqm || 'N/A'],
        ['No. of docks', warehouse.numberOfDocks ? `${warehouse.numberOfDocks} Nos` : 'N/A'],
        ['Canopy details', warehouse.canopyDetails || 'Running Canopy'],
        ['Ventilation details', warehouse.ventilationDetails || 'Ridge vents'],
        ['Insulation details', warehouse.insulationDetails || 'Available'],
        ['Electrical workload', warehouse.electricalLoad || 'Load – Available'],
        ['Toilets', warehouse.toilets || 'Available'],
        ['Building Stability Certificate', warehouse.stabilityCertificate || 'Will be available'],
        ['Fire safety details', wd.fireSafetyMeasures
            || (wd.fireNocAvailable
                ? 'Hydrant Available and Sprinklers will be installed at additional cost'
                : 'Hydrant Available and Sprinklers will be installed at additional cost')],
        ['Handover timeline', warehouse.availability || 'Immediate'],
    ].map((row, i) => {
        if (i < 2) return row; // header rows already shaped
        const [label, value] = row;
        const valueCell = (value && typeof value === 'object' && value.options)
            ? value
            : { text: clamp(value ?? 'N/A'), options: valueOpts };
        return [{ text: label, options: labelOpts }, valueCell];
    });

    slide.addTable(cells, {
        x: 0.20, y: 1.30, w: 4.95,
        colW: [1.85, 3.10],
        rowH: 0.27,
        border: { type: 'solid', pt: 0.5, color: COLORS.border },
    });

    const imagePhotos = (selectedPhotoUrls || []).filter(isImageUrl).slice(0, 4);
    await layoutPhotos(pptx, slide, imagePhotos);
}

module.exports = { generateDetailedSlideTci };
