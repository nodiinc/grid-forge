"use client";

import React from "react";
import ScreenRenderer from "@/lib/poc/screen-renderer";

interface PreviewPanelProps {
  slug: string | null;
  version: number;
}

export default function PreviewPanel({ slug, version }: PreviewPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-2 border-b border-gray-700 bg-gray-900 flex items-center justify-between">
        <h2 className="font-semibold text-sm">SCADA Preview</h2>
        {slug && (
          <span className="text-xs text-gray-400 font-mono">
            {slug} v{version}
          </span>
        )}
      </div>

      {/* Render area */}
      <div className="flex-1 overflow-hidden">
        <ScreenRenderer slug={slug} version={version} />
      </div>
    </div>
  );
}
