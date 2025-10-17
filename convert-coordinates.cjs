const fs = require('fs');

// Ler as coordenadas do Paraná
const coordinates = JSON.parse(fs.readFileSync('./parana-coordinates.json', 'utf8'));

// Converter para o formato usado no Map.tsx (lat, lng)
const convertedCoords = coordinates.map(coord => [coord[1], coord[0]]);

// Gerar o código JavaScript para o Map.tsx
const jsCode = `const PR_BORDER_COORDINATES = [
${convertedCoords.map(coord => `  [${coord[0]}, ${coord[1]}]`).join(',\n')}
];`;

// Salvar o código
fs.writeFileSync('./pr-border-coordinates.js', jsCode);

console.log('Coordenadas convertidas e salvas em pr-border-coordinates.js');
console.log(`Total de coordenadas: ${coordinates.length}`);
console.log('Primeiras 3 coordenadas convertidas (lat, lng):');
convertedCoords.slice(0, 3).forEach((coord, i) => {
  console.log(`${i + 1}: [${coord[0]}, ${coord[1]}]`);
});