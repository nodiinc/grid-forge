"use client";

import React, { useEffect, useRef, useState } from "react";

let _msgSeq = 0;
function msgId() {
  return `msg-${Date.now()}-${++_msgSeq}`;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "status";
  content: string;
}

interface ChatPanelProps {
  onScreenGenerated: (slug: string) => void;
}

const CHAT_STORAGE_KEY = "gridforge-poc-chat";
const SLUG_STORAGE_KEY = "gridforge-poc-slug";

function loadStoredMessages(): ChatMessage[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ChatMessage[];
    return parsed.filter((m) => m.role !== "status");
  } catch {
    return [];
  }
}

function loadStoredSlug(): string {
  if (typeof window === "undefined") return "screen";
  return window.localStorage.getItem(SLUG_STORAGE_KEY) || "screen";
}

export default function ChatPanel({ onScreenGenerated }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [images, setImages] = useState<Array<{ data: string; mimeType: string }>>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentSlug, setCurrentSlug] = useState("screen");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const hydrated = useRef(false);

  // Restore from localStorage after hydration
  useEffect(() => {
    const stored = loadStoredMessages();
    if (stored.length > 0) setMessages(stored);
    const storedSlug = loadStoredSlug();
    if (storedSlug !== "screen") setCurrentSlug(storedSlug);
    hydrated.current = true;
  }, []);

  // Persist messages and slug to localStorage
  useEffect(() => {
    if (!hydrated.current) return;
    const toSave = messages.filter((m) => m.role !== "status");
    try { window.localStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(toSave)); } catch {}
  }, [messages]);

  useEffect(() => {
    if (!hydrated.current) return;
    try { window.localStorage.setItem(SLUG_STORAGE_KEY, currentSlug); } catch {}
  }, [currentSlug]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("image/")) continue;
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setImages((prev) => [...prev, { data: base64, mimeType: file.type }]);
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  };

  const removeImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isGenerating) return;

    const userMessage = input.trim();
    setInput("");
    const userImages = [...images];
    setImages([]);

    const userMsg: ChatMessage = {
      id: msgId(),
      role: "user",
      content: userImages.length > 0
        ? `${userMessage} [${userImages.length}개 이미지 첨부]`
        : userMessage,
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsGenerating(true);

    // Build conversation history for context
    const history = messages
      .filter((m) => m.role !== "status")
      .map((m) => ({ role: m.role as "user" | "assistant", content: m.content }));

    try {
      const res = await fetch("/api/poc/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          images: userImages.length > 0 ? userImages : undefined,
          history: history.length > 0 ? history : undefined,
          slug: currentSlug,
        }),
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response body");

      const decoder = new TextDecoder();
      let buffer = "";
      let assistantText = "";
      let assistantMsgId = msgId();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith("event: ")) {
            const eventType = line.slice(7);
            const nextLine = lines[i + 1];
            if (!nextLine?.startsWith("data: ")) continue;
            i++; // skip the data line

            const data = JSON.parse(nextLine.slice(6));

            if (eventType === "status") {
              setMessages((prev) => [
                ...prev.filter((m) => m.role !== "status"),
                { id: msgId(), role: "status", content: data.message },
              ]);
            } else if (eventType === "delta") {
              assistantText += data.text;
              setMessages((prev) => {
                const filtered = prev.filter((m) => m.id !== assistantMsgId && m.role !== "status");
                return [
                  ...filtered,
                  { id: assistantMsgId, role: "assistant", content: assistantText },
                ];
              });
            } else if (eventType === "done") {
              const slug = data.slug || currentSlug;
              setCurrentSlug(slug);
              onScreenGenerated(slug);

              // Clean up status messages
              setMessages((prev) => prev.filter((m) => m.role !== "status"));
            } else if (eventType === "error") {
              setMessages((prev) => [
                ...prev.filter((m) => m.role !== "status"),
                { id: msgId(), role: "assistant", content: `Error: ${data.message}` },
              ]);
            }
          }
        }
      }
    } catch (exc) {
      const msg = exc instanceof Error ? exc.message : String(exc);
      setMessages((prev) => [
        ...prev.filter((m) => m.role !== "status"),
        { id: msgId(), role: "assistant", content: `Connection error: ${msg}` },
      ]);
    } finally {
      setIsGenerating(false);
      scrollToBottom();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 border-r border-gray-700">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-sm">AI Chat</h2>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              className="text-xs text-gray-500 hover:text-gray-300"
              title="Clear chat"
            >
              Clear
            </button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Slug:</label>
          <input
            type="text"
            value={currentSlug}
            onChange={(e) => setCurrentSlug(e.target.value.replace(/[^a-z0-9-]/g, ""))}
            className="bg-gray-800 border border-gray-600 rounded px-2 py-0.5 text-xs w-24"
          />
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-8">
            <p className="text-sm">SCADA 화면을 요청하세요</p>
            <p className="text-xs mt-2 text-gray-600">예: &quot;수배전반 단선도 만들어줘&quot;</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`text-sm rounded-lg px-3 py-2 ${
              msg.role === "user"
                ? "bg-blue-600/20 text-blue-100 ml-8"
                : msg.role === "status"
                  ? "bg-yellow-600/10 text-yellow-300 text-xs italic"
                  : "bg-gray-800 text-gray-200 mr-8"
            }`}
          >
            <pre className="whitespace-pre-wrap font-sans">{msg.content}</pre>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Image previews */}
      {images.length > 0 && (
        <div className="px-4 py-2 border-t border-gray-700 flex gap-2 overflow-x-auto">
          {images.map((img, i) => (
            <div key={i} className="relative shrink-0">
              <img
                src={`data:${img.mimeType};base64,${img.data}`}
                alt={`upload-${i}`}
                className="h-12 w-12 object-cover rounded border border-gray-600"
              />
              <button
                onClick={() => removeImage(i)}
                className="absolute -top-1 -right-1 bg-red-600 rounded-full w-4 h-4 text-xs flex items-center justify-center"
              >
                x
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-3 border-t border-gray-700">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1.5 bg-gray-700 hover:bg-gray-600 rounded text-sm shrink-0"
            title="Image upload"
          >
            +
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageUpload}
            className="hidden"
          />
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isGenerating ? "Generating..." : "SCADA request..."}
            disabled={isGenerating}
            className="flex-1 bg-gray-800 border border-gray-600 rounded px-3 py-1.5 text-sm placeholder-gray-500 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={isGenerating || !input.trim()}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded text-sm shrink-0"
          >
            {isGenerating ? "..." : "Send"}
          </button>
        </div>
      </form>
    </div>
  );
}
