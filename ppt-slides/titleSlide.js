function generateTitleSlide(pptx, warehouse) {
    const titleSlide = pptx.addSlide();
    titleSlide.background = { color: 'FFFFFF' };

    titleSlide.addImage({
        path: 'https://media.discordapp.net/attachments/407948468284424192/1410203672947982347/6918ae2a-ec3a-4f83-b202-6a58c5290975.png?ex=68b02a03&is=68aed883&hm=b0b5d0d4e9a9c606e953904cbd92d4fd2971bb27578fe43ddebb438243fd2ea2&=&format=webp&quality=lossless',
        x: 5.35, // Manually centered
        y: 1.8,
        w: 2.0,
        h: 2.0,
    });

    titleSlide.addText('Warehouse options for Client Name', { x: 0.5, y: 4.2, w: '90%', h: 0.5, fontFace: 'Arial', fontSize: 24, bold: true, align: 'center', color: '000000' });

    const totalSpace = warehouse.totalSpaceSqft && warehouse.totalSpaceSqft.length > 0 ? `${warehouse.totalSpaceSqft.join(', ')} sft` : 'N/A sft';
    titleSlide.addText(`${warehouse.city || 'Area'}, ${warehouse.state || 'City Name'} - ${totalSpace}`, { x: 0.5, y: 4.7, w: '90%', h: 0.5, fontFace: 'Arial', fontSize: 18, bold: true, align: 'center', color: '000000' });
}

module.exports = { generateTitleSlide };