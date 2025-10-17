const fs = require('fs');

// Ler o arquivo GeoJSON
const geoData = JSON.parse(fs.readFileSync('./br.json', 'utf8'));

// Encontrar o Paraná
const parana = geoData.features.find(feature => feature.properties.id === 'BRPR');

if (parana) {
  console.log('Paraná encontrado!');
  console.log('Tipo de geometria:', parana.geometry.type);
  
  // Extrair coordenadas
  let coordinates;
  if (parana.geometry.type === 'Polygon') {
    coordinates = parana.geometry.coordinates[0]; // Primeiro anel (exterior)
  } else if (parana.geometry.type === 'MultiPolygon') {
    coordinates = parana.geometry.coordinates[0][0]; // Primeiro polígono, primeiro anel
  }
  
  console.log('Número de coordenadas:', coordinates.length);
  console.log('Primeiras 5 coordenadas:');
  coordinates.slice(0, 5).forEach((coord, i) => {
    console.log(`${i + 1}: [${coord[0]}, ${coord[1]}]`);
  });
  
  // Salvar coordenadas em arquivo
  fs.writeFileSync('./parana-coordinates.json', JSON.stringify(coordinates, null, 2));
  console.log('Coordenadas salvas em parana-coordinates.json');
} else {
  console.log('Paraná não encontrado!');
}
