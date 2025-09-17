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
      <main className="mx-auto max-w-7xl p-4 sm:p-6 lg:p-8">
        {/* subtle forest gradient strip */}
        <div className="rounded-2xl bg-gradient-to-r from-forest-50 to-earth-50 p-3 mb-4 border border-stone-200/60"></div>
        {children}
      </main>
    </div>
  );
}
