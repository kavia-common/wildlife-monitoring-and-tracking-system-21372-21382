Map Components

- MapContainer.jsx: Interactive map built with Leaflet and react-leaflet.
  Features:
  - Telemetry track polyline (from /telemetry filters)
  - Telemetry point markers with popups
  - Marker clustering for latest positions and entities
  - Heatmap layer intensity based on speed
  - Optional entity markers: animals, devices, camera traps (best-effort GET /animals, /devices, /cameras or /camera-traps)

Props:
- animalId?: string|number
- deviceId?: string|number
- defaultHours?: number (minutes range for telemetry, default 24h)
- showHeatmap?: boolean
- showClusters?: boolean
- onMarkerClick?: (item) => void

Integration:
- Imported and used in Dashboard page.
- Styling via Tailwind and Leaflet CSS.
