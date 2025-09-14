const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const storage = {};
fs.readdirSync(path.join(__dirname, 'json')).forEach((fileName) => {
  storage[fileName.split('.').shift()] = JSON.parse(
    fs.readFileSync(`json/${fileName}`, { encoding: 'utf-8' })
  );
});

exports.handler = async function (event, context) {
  try {
    const query = event.queryStringParameters || {};
    const startX = parseInt(query.startX || '0', 10);
    const startY = parseInt(query.startY || '0', 10);
    const image = query.image;

    let colors;
    let coords;
    if (image) {
      const draw = storage[image];
      colors = draw.colors;
      coords = draw.coords;
    } else {
      // Caso sin imagen
      colors = [];
      coords = [];
    }

    // Aplicar offsets a las coordenadas
    coords = coords.map((val, idx) =>
      idx % 2 === 0 ? val + startX : val + startY
    );

    // Mapa de colores (1-based)
    const colorMap = [
      '#000000',
      '#3c3c3c',
      '#787878',
      '#d2d2d2',
      '#ffffff',
      '#600018',
      '#ed1c24',
      '#ff7f27',
      '#f6aa09',
      '#f9dd3b',
      '#fffabc',
      '#0eb968',
      '#13e67b',
      '#87ff5e',
      '#0c816e',
      '#10aea6',
      '#13e1be',
      '#28509e',
      '#4093e4',
      '#60f7f2',
      '#6b50f6',
      '#99b1fb',
      '#780c99',
      '#aa38b9',
      '#e09ff9',
      '#cb007a',
      '#ec1f80',
      '#f38da9',
      '#684634',
      '#95682a',
      '#f8b277',
    ];

    // Descargar imagen como buffer
    const url = 'https://backend.wplace.live/files/s0/tiles/690/1233.png';
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    const png = PNG.sync.read(Buffer.from(response.data));

    // Función para obtener color HEX determinista en una coord
    function getPixelColor(x, y) {
      const idx = (png.width * y + x) << 2;
      const r = png.data[idx];
      const g = png.data[idx + 1];
      const b = png.data[idx + 2];
      return (
        '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
      );
    }

    // Comparar colores
    const newColors = [];
    const newCoords = [];

    for (let i = 0; i < colors.length; i++) {
      const expectedColor = colorMap[colors[i] - 1].toLowerCase();
      const x = coords[i * 2];
      const y = coords[i * 2 + 1];
      const actualColor = getPixelColor(x, y).toLowerCase();

      if (expectedColor !== actualColor) {
        newColors.push(colors[i]);
        newCoords.push(x, y);
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      },
      body: JSON.stringify({
        colors: newColors,
        coords: newCoords,
      }),
    };
  } catch (err) {
    console.error('Error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: 'Internal server error',
        details: err.message,
      }),
    };
  }
};
