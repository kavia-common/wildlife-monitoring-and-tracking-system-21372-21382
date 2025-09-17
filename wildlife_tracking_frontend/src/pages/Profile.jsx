import React from "react";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";

/**
 * PUBLIC_INTERFACE
 * Profile page - shows current user info
 */
export default function Profile() {
  const { user } = useAuth();

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Profile</h1>
        <div className="card p-4">
          <div className="text-gray-700">
            <div><span className="font-semibold">Name:</span> {user?.name}</div>
            <div><span className="font-semibold">Email:</span> {user?.email}</div>
            <div><span className="font-semibold">Role:</span> {user?.role}</div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
