import React from "react";
import NavBar from "./NavBar";

/**
 * PUBLIC_INTERFACE
 * Layout - Wraps pages with NavBar and a container.
 */
export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <NavBar />
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  );
}
