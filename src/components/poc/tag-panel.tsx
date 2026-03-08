"use client";

import React, { useState } from "react";
import { useSimTags } from "@/lib/poc/use-sim-tags";
import { DEFAULT_TAGS } from "@/lib/poc/sim-tags";

export default function TagPanel() {
  const { tags, setTags } = useSimTags();
  const [filter, setFilter] = useState("");

  const filteredTags = DEFAULT_TAGS.filter(
    (cfg) =>
      cfg.tagId.toLowerCase().includes(filter.toLowerCase()) ||
      cfg.label.toLowerCase().includes(filter.toLowerCase()),
  );

  const handleValueChange = (tagId: string, value: string) => {
    const num = parseFloat(value);
    if (!isNaN(num)) {
      setTags({ [tagId]: num });
    }
  };

  const handleToggle = (tagId: string) => {
    const current = tags[tagId]?.v;
    setTags({ [tagId]: current === 1 ? 0 : 1 });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-l border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700">
        <h2 className="font-semibold text-sm mb-2">Simulation Tags</h2>
        <input
          type="text"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          placeholder="Filter..."
          className="w-full bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs placeholder-gray-500"
        />
      </div>

      {/* Tag list */}
      <div className="flex-1 overflow-y-auto">
        <table className="w-full text-xs">
          <thead className="sticky top-0 bg-gray-900">
            <tr className="text-gray-400 border-b border-gray-700">
              <th className="text-left px-3 py-1.5">Tag</th>
              <th className="text-right px-3 py-1.5 w-20">Value</th>
              <th className="text-center px-2 py-1.5 w-12">Q</th>
            </tr>
          </thead>
          <tbody>
            {filteredTags.map((cfg) => {
              const tag = tags[cfg.tagId];
              const value = tag?.v ?? "-";
              const quality = tag?.q ?? "unk";

              return (
                <tr
                  key={cfg.tagId}
                  className="border-b border-gray-800 hover:bg-gray-800/50"
                >
                  <td className="px-3 py-1.5">
                    <div className="font-medium text-gray-200">{cfg.label}</div>
                    <div className="text-gray-500">{cfg.tagId}</div>
                  </td>
                  <td className="text-right px-3 py-1.5">
                    {cfg.dataType === "discrete" ? (
                      <button
                        onClick={() => handleToggle(cfg.tagId)}
                        disabled={!cfg.writable}
                        className={`px-2 py-0.5 rounded text-xs font-mono ${
                          value === 1
                            ? "bg-green-600/30 text-green-300"
                            : "bg-gray-700 text-gray-400"
                        } ${cfg.writable ? "cursor-pointer hover:opacity-80" : "cursor-default"}`}
                      >
                        {value === 1 ? "ON" : "OFF"}
                      </button>
                    ) : cfg.writable ? (
                      <input
                        type="number"
                        value={typeof value === "number" ? value : ""}
                        onChange={(e) => handleValueChange(cfg.tagId, e.target.value)}
                        step={0.1}
                        min={cfg.min}
                        max={cfg.max}
                        className="w-16 bg-gray-800 border border-gray-600 rounded px-1 py-0.5 text-right text-xs"
                      />
                    ) : (
                      <span className="font-mono text-gray-200">
                        {typeof value === "number" ? value.toFixed(1) : value}
                        <span className="text-gray-500 ml-1">{cfg.unit}</span>
                      </span>
                    )}
                  </td>
                  <td className="text-center px-2 py-1.5">
                    <span
                      className={`inline-block w-2 h-2 rounded-full ${
                        quality === "good"
                          ? "bg-green-500"
                          : quality === "bad"
                            ? "bg-red-500"
                            : "bg-gray-500"
                      }`}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
