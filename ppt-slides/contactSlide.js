function generateContactSlide(pptx, warehouse) {
    const lastSlide = pptx.addSlide();
    lastSlide.background = { color: 'FFFFFF' };

    lastSlide.addText('For more details regarding these warehouses (or) to schedule site visits, please contact –', { x: 0.5, y: 2.4, w: '90%', h: 0.5, align: 'center', fontSize: 16, color: '363636' });

    lastSlide.addText([
        { text: 'Dhaval Gupta', options: { color: '0077CC', bold: true } },
        { text: ' | ', options: { color: '363636' } },
        { text: '+91 83188 25478', options: { color: '0077CC', bold: true } }
    ], { x: 0.5, y: 2.8, w: '90%', h: 0.5, align: 'center', fontSize: 22 });
}

module.exports = { generateContactSlide };