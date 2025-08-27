function generateMainSlide(pptx, warehouse) {
    const mainSlide = pptx.addSlide();
    mainSlide.background = { color: 'FFFFFF' };
    mainSlide.addShape(pptx.shapes.RECTANGLE, { x: 0.0, y: 0.0, w: 3.5, h: '100%', fill: { color: 'F0F0F0' } });
    mainSlide.addImage({
        path: 'https://media.discordapp.net/attachments/407948468284424192/1410203672947982347/6918ae2a-ec3a-4f83-b202-6a58c5290975.png?ex=68b02a03&is=68aed883&hm=b0b5d0d4e9a9c606e953904cbd92d4fd2971bb27578fe43ddebb438243fd2ea2&=&format=webp&quality=lossless',
        x: 8.8, y: 0.15, w: 1.0, h: 1.0,
    });

    // Add Text to the Grey Sidebar
    let textY = 0.5;
    mainSlide.addText(`Option #${warehouse.id}`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 14, bold: true });
    textY += 0.5;
    mainSlide.addText(`${warehouse.city}, ${warehouse.state}`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 18, bold: true });
    textY += 1.0;
    mainSlide.addText(`Total Area - ${warehouse.totalSpaceSqft.join(', ')} sqft`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.3;
    mainSlide.addText('For Client - Client Name', { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.6;
    mainSlide.addText(`${warehouse.numberOfDocks || 'N/A'} docks, XYZ ft plinth`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.3;
    mainSlide.addText(`${warehouse.clearHeightFt || 'N/A'} clear height`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.3;
    mainSlide.addText('RCC facility', { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.3;
    mainSlide.addText('Parking+Access for 40ft trucks', { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.3;
    mainSlide.addText(`Fire NOC - ${warehouse.compliances.includes('Fire NOC') ? 'Available' : 'NA'}`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11 });
    textY += 0.6;
    mainSlide.addText(`Rs. ${warehouse.ratePerSqft}/sft`, { x: 0.3, y: textY, w: 3.0, fontFace: 'Arial', fontSize: 11, bold: true });

    // Add Image Grid to the Right Side
    const photoUrls = (warehouse.photos && warehouse.photos.length > 0) ? warehouse.photos.split(',').map(url => url.trim()) : [];
    const imageSize = 2.5; const startX = 4.0; const startY = 0.5; const padding = 0.2;
    const imagePositions = [
        { x: startX, y: startY }, { x: startX + imageSize + padding, y: startY },
        { x: startX, y: startY + imageSize + padding }, { x: startX + imageSize + padding, y: startY + imageSize + padding }
    ];
    for (let i = 0; i < 4; i++) {
        const pos = imagePositions[i];
        if (photoUrls[i]) {
            mainSlide.addImage({ path: photoUrls[i], x: pos.x, y: pos.y, w: imageSize, h: imageSize, sizing: { type: 'cover', w: imageSize, h: imageSize } });
        } else {
            mainSlide.addShape(pptx.shapes.RECTANGLE, { x: pos.x, y: pos.y, w: imageSize, h: imageSize, fill: { color: 'E0E0E0' } });
        }
    }
}

module.exports = { generateMainSlide };