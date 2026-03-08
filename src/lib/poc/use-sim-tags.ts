"use client";

import { useRef, useCallback } from "react";
import { useSyncExternalStore } from "react";
import { DEFAULT_TAGS } from "./sim-tags";

interface TagValue {
  v: number | string | boolean;
  q: string;
  t: number;
}

interface TagHistory {
  t: number;
  v: number;
}

const MAX_HISTORY = 300; // 5 minutes at 1/sec

// Singleton sim store (lives across component re-renders)
let tags: Record<string, TagValue> = {};
let history: Record<string, TagHistory[]> = {};
let listeners = new Set<() => void>();
let initialized = false;
let intervalId: ReturnType<typeof setInterval> | null = null;

function notify() {
  // Create new reference to trigger React re-render
  tags = { ...tags };
  for (const listener of listeners) listener();
}

function initStore() {
  if (initialized) return;
  initialized = true;

  // Initialize tags with random values
  for (const cfg of DEFAULT_TAGS) {
    const v =
      cfg.dataType === "discrete"
        ? Math.random() > 0.5 ? 1 : 0
        : parseFloat((cfg.min + Math.random() * (cfg.max - cfg.min)).toFixed(2));

    tags[cfg.tagId] = { v, q: "good", t: Date.now() };
    history[cfg.tagId] = [{ t: Date.now(), v: typeof v === "number" ? v : Number(v) }];
  }

  // Auto-fluctuate every second
  intervalId = setInterval(() => {
    const now = Date.now();

    for (const cfg of DEFAULT_TAGS) {
      const current = tags[cfg.tagId];
      if (!current) continue;

      let newVal: number;
      if (cfg.dataType === "discrete") {
        // Discrete: small chance of flipping
        newVal = Math.random() < 0.02 ? (current.v === 1 ? 0 : 1) : (current.v as number);
      } else {
        // Analog: random walk within range
        const currentNum = current.v as number;
        const range = cfg.max - cfg.min;
        const delta = (Math.random() - 0.5) * range * 0.02;
        newVal = parseFloat(Math.max(cfg.min, Math.min(cfg.max, currentNum + delta)).toFixed(2));
      }

      tags[cfg.tagId] = { v: newVal, q: "good", t: now };

      // Append to history
      const h = history[cfg.tagId] || [];
      h.push({ t: now, v: newVal });
      if (h.length > MAX_HISTORY) h.shift();
      history[cfg.tagId] = h;
    }

    notify();
  }, 1000);
}

function subscribe(listener: () => void) {
  initStore();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot() {
  initStore();
  return tags;
}

const EMPTY_TAGS: Record<string, TagValue> = {};

function getServerSnapshot(): Record<string, TagValue> {
  return EMPTY_TAGS;
}

export function useSimTags() {
  const currentTags = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const setTags = useCallback((pairs: Record<string, number | string | boolean>) => {
    const now = Date.now();
    for (const [tagId, value] of Object.entries(pairs)) {
      tags[tagId] = { v: value, q: "good", t: now };
      const h = history[tagId] || [];
      h.push({ t: now, v: typeof value === "number" ? value : Number(value) });
      if (h.length > MAX_HISTORY) h.shift();
      history[tagId] = h;
    }
    notify();
  }, []);

  const queryChart = useCallback((tagId: string) => {
    return history[tagId] || [];
  }, []);

  return { tags: currentTags, setTags, queryChart };
}
