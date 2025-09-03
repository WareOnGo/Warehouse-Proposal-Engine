// ppt-slides/titleSlide.js
function generateTitleSlide(pptx, warehouse, customDetails) {
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: 'FFFFFF' };

    titleSlide.addImage({
        path: 'https://pub-94c0eb3cd2df4e71a1b6f5b73273bc71.r2.dev/Screenshot%202025-08-27%20153449.png',
        x: 5.35, y: 1.8, w: 2.0, h: 2.0,
    });

    // Use client name from form, or a default
    const clientName = customDetails.clientName || 'Client Name';
    titleSlide.addText(`Warehouse options for ${clientName}`, { x: 0.5, y: 4.2, w: '90%', h: 0.5, fontFace: 'Arial', fontSize: 24, bold: true, align: 'center', color: '000000' });

    // Use client requirement from form, or a default
    const clientRequirement = customDetails.clientRequirement || `${warehouse.city || 'Area'}, ${warehouse.state || 'City Name'} - N/A sqft`;
    titleSlide.addText(clientRequirement, { x: 0.5, y: 4.7, w: '90%', h: 0.5, fontFace: 'Arial', fontSize: 18, bold: true, align: 'center', color: '000000' });
}

module.exports = { generateTitleSlide };