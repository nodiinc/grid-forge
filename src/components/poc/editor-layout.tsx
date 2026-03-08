"use client";

import React, { useEffect, useState } from "react";
import ChatPanel from "./chat-panel";
import PreviewPanel from "./preview-panel";
import TagPanel from "./tag-panel";

const DEFAULT_SLUG = "screen";

export default function EditorLayout() {
  const [slug, setSlug] = useState<string | null>(null);
  const [version, setVersion] = useState(0);
  const [showTags, setShowTags] = useState(true);

  // On mount, check if a previously generated bundle exists
  useEffect(() => {
    fetch(`/api/poc/bundle/${DEFAULT_SLUG}`, { method: "HEAD" })
      .then((res) => {
        if (res.ok) {
          setSlug(DEFAULT_SLUG);
          setVersion(1);
        }
      })
      .catch(() => {});
  }, []);

  const handleScreenGenerated = (newSlug: string) => {
    setSlug(newSlug);
    setVersion((v) => v + 1);
  };

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Left: Chat */}
      <div className="w-80 shrink-0">
        <ChatPanel onScreenGenerated={handleScreenGenerated} />
      </div>

      {/* Center: Preview */}
      <div className="flex-1 min-w-0">
        <PreviewPanel slug={slug} version={version} />
      </div>

      {/* Right: Tags */}
      {showTags && (
        <div className="w-72 shrink-0">
          <TagPanel />
        </div>
      )}

      {/* Tag panel toggle */}
      <button
        onClick={() => setShowTags((v) => !v)}
        className="fixed top-2 right-2 z-50 bg-gray-800 border border-gray-600 rounded px-2 py-1 text-xs hover:bg-gray-700"
        title={showTags ? "Hide tags" : "Show tags"}
      >
        {showTags ? "Tags >" : "< Tags"}
      </button>
    </div>
  );
}
