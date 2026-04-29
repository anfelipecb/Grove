"use client";

import { useState } from "react";
import { MessageSquareText, Send } from "lucide-react";

type ChatMessage = { role: "user" | "assistant"; content: string };

export function MyceliumChat({
  communityId,
  communityName,
}: {
  communityId?: string;
  communityName: string;
}) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `I'm Mycelium. Ask what needs doing in ${communityName}, or how to re-engage after a rough week. I won't diagnose—I'll keep things concrete.`,
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [safety, setSafety] = useState<string | null>(null);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");
    setSafety(null);
    const nextMessages = [...messages, { role: "user" as const, content: text }];
    setMessages(nextMessages);
    setLoading(true);
    const res = await fetch("/api/ai/mycelium-chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: nextMessages,
        communityId: communityId ?? undefined,
      }),
    });
    const payload = (await res.json()) as { reply?: string; safety?: boolean; message?: string };
    setLoading(false);
    if (payload.safety) {
      setSafety(payload.message ?? "Please reach out to local crisis resources if you need immediate help.");
      return;
    }
    setMessages((m) => [...m, { role: "assistant", content: payload.reply ?? "No response." }]);
  }

  return (
    <div className="flex h-full min-h-[380px] flex-col">
      <div className="mb-2 flex items-center gap-2 text-moss">
        <MessageSquareText className="h-4 w-4" aria-hidden="true" />
        <h2 className="text-xs font-semibold uppercase tracking-wide text-stone-700">Mycelium</h2>
      </div>
      {safety ? (
        <p className="mb-2 rounded-md border border-clay bg-clay/10 p-3 text-sm text-bark">{safety}</p>
      ) : null}
      <div className="flex-1 space-y-3 overflow-y-auto rounded-md border border-stone-200 bg-stone-50/80 p-3 text-sm">
        {messages.map((m, i) => (
          <div
            key={`${i}-${m.role}`}
            className={`max-w-[95%] rounded-md px-3 py-2 leading-6 ${
              m.role === "user" ? "ml-auto bg-moss text-white" : "bg-white text-stone-800 shadow-sm"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading ? <p className="text-xs text-stone-500">Thinking…</p> : null}
      </div>
      <div className="mt-3 flex gap-2">
        <input
          className="min-w-0 flex-1 rounded-md border border-stone-300 bg-white px-3 py-2 text-sm outline-none ring-moss/20 focus:border-moss focus:ring-4"
          placeholder="What should we tackle next?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void send();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void send()}
          disabled={loading}
          className="inline-flex shrink-0 items-center justify-center gap-1 rounded-md bg-bark px-3 py-2 text-white transition hover:bg-moss disabled:opacity-50"
        >
          <Send className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
