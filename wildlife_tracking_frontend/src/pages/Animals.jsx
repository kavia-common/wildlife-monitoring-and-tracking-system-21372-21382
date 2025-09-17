import React from "react";
import Layout from "../components/Layout";
import AnimalForm from "../components/forms/AnimalForm";

/**
 * PUBLIC_INTERFACE
 * Animals page - list and CRUD placeholder
 */
export default function Animals() {
  const handleSave = (data) => {
    // TODO: integrate API
    console.log("save animal", data);
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Animals</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card p-4">
            <h3 className="text-lg font-semibold mb-2">Animals List</h3>
            <div className="text-gray-600">No data yet.</div>
          </div>
          <AnimalForm onSubmit={handleSave} />
        </div>
      </div>
    </Layout>
  );
}
