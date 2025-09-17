import React from "react";
import Layout from "../components/Layout";
import DeviceForm from "../components/forms/DeviceForm";

/**
 * PUBLIC_INTERFACE
 * Devices page - list and CRUD placeholder
 */
export default function Devices() {
  const handleSave = (data) => {
    // TODO: integrate API
    console.log("save device", data);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Devices</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <h3 className="text-lg font-semibold mb-2">Devices List</h3>
            <div className="text-gray-600">No data yet.</div>
          </div>
          <DeviceForm onSubmit={handleSave} />
        </div>
      </div>
    </Layout>
  );
}
