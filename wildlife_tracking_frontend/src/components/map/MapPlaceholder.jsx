import React from "react";

/**
 * PUBLIC_INTERFACE
 * MapPlaceholder - Placeholder for Leaflet/Mapbox map
 */
export default function MapPlaceholder() {
  return (
    <div className="card p-4 h-80 flex items-center justify-center bg-gradient-to-br from-blue-50 to-gray-50">
      <div className="text-center">
        <div className="text-6xl mb-2">🗺️</div>
        <p className="text-gray-700">Map will render here (Leaflet/Mapbox)</p>
      </div>
    </div>
  );
}
