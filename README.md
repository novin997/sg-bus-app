# SG Bus

A clean, ad-free Singapore bus arrival app. Personal learning project.

- **Favourites** home screen: saved stops, optionally filtered to chosen buses (stored in the browser)
- **Stop view**: every bus with next 3 arrivals, crowding, wheelchair access, deck type and destination
- **Stops near me**: GPS + MapLibre map with 3D buildings (zoom 15+), nearest stops list
- Auto-refresh every 30s while visible, plus pull-to-refresh

## Stack

React + Vite + TypeScript, MapLibre GL JS with OpenFreeMap tiles, deployed as a Cloudflare Worker (static assets).

## Data

- Arrivals: [Arrivelah](https://github.com/cheeaun/arrivelah) (no API key). All fetching goes through `src/api/arrivals.ts`.
- Stops: [busrouter.sg](https://github.com/cheeaun/sgbusdata) static data.

Data © LTA, OneMap & OpenStreetMap contributors.

## Commands

```sh
npm install
npm run dev      # local dev server
npm run deploy   # build + deploy to Cloudflare
```
