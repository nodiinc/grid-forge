"use client";

import React, { useRef } from "react";
import * as jsxRuntime from "react/jsx-runtime";
import * as recharts from "recharts";
import { useSimTags } from "./use-sim-tags";

interface ScreenRendererProps {
  slug: string | null;
  version: number;
}

export default function ScreenRenderer({ slug, version }: ScreenRendererProps) {
  const { tags, setTags, queryChart } = useSimTags();
  const componentRef = useRef<React.ComponentType<Record<string, unknown>> | null>(null);
  const loadedVersionRef = useRef<string>("");
  const screenStateRef = useRef<Record<string, unknown>>({});
  const [, forceUpdate] = React.useState(0);

  const screenState = {
    state: screenStateRef.current,
    setState: (patch: Record<string, unknown>) => {
      screenStateRef.current = { ...screenStateRef.current, ...patch };
      forceUpdate((n) => n + 1);
    },
  };

  const chartData = {
    query: queryChart,
  };

  // Load bundle when slug/version changes
  const versionKey = `${slug}-${version}`;
  if (slug && versionKey !== loadedVersionRef.current) {
    loadedVersionRef.current = versionKey;

    // Set globals for shims
    (globalThis as Record<string, unknown>).__React = React;
    (globalThis as Record<string, unknown>).__ReactJSXRuntime = jsxRuntime;
    (globalThis as Record<string, unknown>).__recharts = recharts;

    // Fetch and execute bundle
    fetch(`/api/poc/bundle/${slug}?v=${version}`)
      .then((res) => {
        if (!res.ok) throw new Error(`Bundle not found: ${slug}`);
        return res.text();
      })
      .then((code) => {
        // Execute bundle via script-like evaluation.
        // The esbuild footer appends `globalThis.ScreenModule = ScreenModule;`
        // so the module is available after execution.
        // NOTE: Dynamic code execution is intentional here — the bundle is
        // AST-validated and esbuild-compiled server-side before reaching the client.
        const executor = Function(code);  // eslint-disable-line no-new-func
        executor();
        const mod = (globalThis as Record<string, unknown>).ScreenModule as Record<string, unknown>;
        if (mod?.default) {
          componentRef.current = mod.default as React.ComponentType<Record<string, unknown>>;
          forceUpdate((n) => n + 1);
        }
      })
      .catch((err) => {
        console.error("Bundle load error:", err);
        componentRef.current = null;
        forceUpdate((n) => n + 1);
      });
  }

  const Component = componentRef.current;

  if (!slug) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        <div className="text-center">
          <div className="text-4xl mb-4">⚡</div>
          <p className="text-lg">AI에게 SCADA 화면을 요청하세요</p>
          <p className="text-sm mt-2 text-gray-600">예: &quot;수배전반 단선도 만들어줘&quot;</p>
        </div>
      </div>
    );
  }

  if (!Component) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400">
        <div className="text-center">
          <div className="animate-spin text-3xl mb-4">⚙️</div>
          <p>화면 로드 중...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-auto bg-gray-900">
      <Component
        tags={tags}
        setTags={setTags}
        alarms={{ active: [], history: [] }}
        chartData={chartData}
        screenState={screenState}
        userSettings={{ theme: "dark" }}
        assets={[]}
        navigate={(screenSlug: string) => console.log("Navigate:", screenSlug)}
      />
    </div>
  );
}
