import React from "react";
import Layout from "../components/Layout";
import MapPlaceholder from "../components/map/MapPlaceholder";

/**
 * PUBLIC_INTERFACE
 * Dashboard page - shows map and quick stats
 */
export default function Dashboard() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <MapPlaceholder />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {["Tracked Animals", "Active Devices", "Recent Alerts", "Telemetry Events"].map((label) => (
            <div key={label} className="card p-4">
              <div className="text-sm text-gray-500">{label}</div>
              <div className="mt-2 text-2xl font-semibold">—</div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
