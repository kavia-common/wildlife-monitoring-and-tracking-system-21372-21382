import React from "react";

/**
 * PUBLIC_INTERFACE
 * AnimalCard - Stylized wildlife-themed card for animals (sloth bears by default).
 * Props:
 * - animal: { id, name, species, tagId, imageUrl?, status?, lastSeen? }
 * - onTrack?: (animal) => void
 * - onDetails?: (animal) => void
 */
export default function AnimalCard({ animal, onTrack, onDetails }) {
  const {
    id,
    name = "Unnamed",
    species = "Sloth Bear",
    tagId = "—",
    imageUrl = `https://images.unsplash.com/photo-1535221898318-55b8f37a7f93?q=80&w=1600&auto=format&fit=crop`, // earthy forest/bear vibe
    status = "online",
    lastSeen = "—",
  } = animal || {};

  const statusColor =
    status === "online"
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : status === "idle"
      ? "bg-amber-100 text-amber-700 border-amber-200"
      : "bg-stone-100 text-stone-700 border-stone-200";

  return (
    <div className="group relative overflow-hidden rounded-2xl shadow-sm border border-stone-200 bg-gradient-to-br from-emerald-50 to-stone-50 hover:shadow-md transition">
      <div className="aspect-[16/10] w-full overflow-hidden">
        <img
          src={imageUrl}
          alt={`${name} - ${species}`}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          loading="lazy"
        />
      </div>
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-semibold text-stone-900 tracking-tight">
              {name}
            </h3>
            <p className="text-sm text-stone-600">{species}</p>
            <p className="mt-1 text-xs text-stone-500">Tag: {tagId}</p>
          </div>
          <span className={`px-2 py-0.5 rounded text-xs border ${statusColor}`}>
            {status}
          </span>
        </div>

        <div className="mt-3 flex items-center justify-between text-xs text-stone-600">
          <span className="flex items-center gap-1">
            <span className="inline-block h-2 w-2 rounded-full bg-emerald-600" />
            Last seen: {lastSeen}
          </span>
          <span className="text-stone-500">ID: {id ?? "—"}</span>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            className="inline-flex items-center gap-2 rounded-md bg-emerald-600 px-3 py-1.5 text-white text-sm shadow hover:bg-emerald-700 transition"
            onClick={() => onTrack?.(animal)}
            title="Track on map"
          >
            🧭 Track
          </button>
          <button
            className="inline-flex items-center gap-2 rounded-md border border-stone-300 bg-white px-3 py-1.5 text-stone-700 text-sm hover:bg-stone-50 transition"
            onClick={() => onDetails?.(animal)}
            title="View details"
          >
            🔎 Details
          </button>
        </div>
      </div>

      {/* Subtle overlay gradient for depth */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/5 via-transparent to-transparent" />
    </div>
  );
}
