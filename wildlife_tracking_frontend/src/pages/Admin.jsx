import React from "react";
import Layout from "../components/Layout";

/**
 * PUBLIC_INTERFACE
 * Admin page - placeholder, admin only
 */
export default function Admin() {
  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Admin</h1>
        <div className="card p-4 text-gray-600">Admin tools will be available here.</div>
      </div>
    </Layout>
  );
}
