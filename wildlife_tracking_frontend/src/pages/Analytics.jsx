import React, { useMemo, useState } from "react";
import Layout from "../components/Layout";
import MapContainer from "../components/map/MapContainer";
import { lastHoursRange } from "../services/telemetry";
import { analyticsApi } from "../services/analytics";

/**
 * PUBLIC_INTERFACE
 * Analytics page - Integrates movement prediction, home range, and classification.
 */
export default function Analytics() {
  const [animalId, setAnimalId] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [images, setImages] = useState([{ id: "img-1", url: "" }]);
  const [imgResults, setImgResults] = useState([]);
  const [imgBusy, setImgBusy] = useState(false);

  const range = useMemo(() => lastHoursRange(24), []);

  const addImageRow = () => setImages((arr) => [...arr, { id: `img-${arr.length + 1}`, url: "" }]);
  const updateImageUrl = (idx, url) => setImages((arr) => arr.map((it, i) => (i === idx ? { ...it, url } : it)));
  const removeImageRow = (idx) => setImages((arr) => arr.filter((_, i) => i !== idx));

  const runImageClassification = async () => {
    const payload = images.filter((i) => i.url);
    if (!payload.length) { alert("Please add at least one image URL"); return; }
    setImgBusy(true);
    try {
      const results = await analyticsApi.classifyImages(payload);
      setImgResults(results);
    } catch (e) {
      alert(e?.message || "Failed to classify images");
    } finally {
      setImgBusy(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">Analytics</h1>

        {/* Filters */}
        <div className="card p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs text-gray-600 mb-1">Animal ID</label>
              <input className="w-full border rounded-md p-2" value={animalId} onChange={(e) => setAnimalId(e.target.value)} placeholder="e.g., 101" />
            </div>
            <div>
              <label className="block text-xs text-gray-600 mb-1">Device ID</label>
              <input className="w-full border rounded-md p-2" value={deviceId} onChange={(e) => setDeviceId(e.target.value)} placeholder="e.g., collar-42" />
            </div>
            <div className="text-sm text-gray-500 flex items-end">
              Range: {new Date(range.start).toLocaleString()} → {new Date(range.end).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Map with analytics controls are inside MapContainer */}
        <MapContainer
          animalId={animalId || undefined}
          deviceId={deviceId || undefined}
          defaultHours={24}
          showClusters={true}
          showHeatmap={true}
        />

        {/* Image Classification */}
        <div className="card p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-semibold">Image Classification</h3>
            <button className="px-3 py-1 rounded-md border text-sm" onClick={runImageClassification} disabled={imgBusy}>
              {imgBusy ? "Classifying..." : "Run Classification"}
            </button>
          </div>
          <div className="space-y-2">
            {images.map((img, idx) => (
              <div key={img.id} className="flex items-center gap-2">
                <input
                  className="flex-1 border rounded-md p-2 text-sm"
                  placeholder="Image URL"
                  value={img.url}
                  onChange={(e) => updateImageUrl(idx, e.target.value)}
                />
                <button className="px-2 py-1 rounded-md border text-sm" onClick={() => removeImageRow(idx)}>Remove</button>
              </div>
            ))}
          </div>
          <div className="mt-2">
            <button className="px-2 py-1 rounded-md border text-sm" onClick={addImageRow}>Add Image</button>
          </div>

          {/* Results */}
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Results</h4>
            {imgResults.length === 0 ? (
              <div className="text-sm text-gray-600">No results yet.</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {imgResults.map((r, i) => (
                  <div key={`${r.id || i}`} className="border rounded-md p-3">
                    <div className="text-sm"><span className="font-medium">URL:</span> {r.url || "—"}</div>
                    <div className="text-sm"><span className="font-medium">Label:</span> {r.label || "—"}</div>
                    <div className="text-sm"><span className="font-medium">Confidence:</span> {typeof r.confidence === "number" ? r.confidence.toFixed(2) : r.confidence ?? "—"}</div>
                    {r.preview && <img alt="preview" src={r.preview} className="mt-2 rounded-md max-h-40 object-cover" />}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
