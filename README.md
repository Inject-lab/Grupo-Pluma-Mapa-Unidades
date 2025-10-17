# Grupo Pluma Mapa

Aplicação web para visualização de unidades, cidades de investimento e planejamento de rotas no estado do Paraná, com persistência local de dados (IndexedDB/Dexie) e visualização em mapa (Leaflet).

## Funcionalidades

- Visualização de unidades no mapa, com cores por empresa (`PLUMA`, `BELLO`, `LEVO`).
- Destaque de cidades de investimento com marcadores dinâmicos (reduzem de tamanho em zoom alto para evitar sobreposição).
- Planejamento de rotas:
  - Preferência por rotas via OSRM (rede viária real).
  - Fallback automático Haversine (linha reta) quando OSRM falhar.
  - Desenho da rota em azul (OSRM) ou verde tracejado (Haversine), com ajuste automático do mapa para englobar toda a rota.
- Persistência local (IndexedDB/Dexie) de:
  - Unidades (com coordenadas, dados da empresa, endereço).
  - Rotas calculadas (pontos, geometria, tipo, distância e duração).
  - Cidades de investimento selecionadas.
  - Desenhos e catálogos (CNPJs).
- Migração automática do `localStorage` para IndexedDB na primeira execução.
- Interface responsiva com tema claro/escuro.

## Requisitos

- Node.js 18+ e npm.
- OS: Windows, macOS ou Linux (desenvolvimento local usa `npm`).
