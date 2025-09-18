const pixels = require('./netlify/functions/pixels.js');

(async () => {
  console.log(
    await pixels.handler({ queryStringParameters: { image: 'macri-boca' } })
  );
})();
