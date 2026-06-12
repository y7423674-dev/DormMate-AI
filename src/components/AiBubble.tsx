"use client";

import { useState, useRef, useEffect } from "react";
import { useDorm } from "@/app/DormProvider";

type ChatMsg = {
  role: "user" | "ai";
  text: string;
  time: string;
};

export default function AiBubble() {
  const { session, sendAiMessage } = useDorm();
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  async function handleSend() {
    if (!input.trim() || !session) return;
    const now = new Date().toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [...prev, { role: "user", text: input, time: now }]);
    setThinking(true);
    const userInput = input;
    setInput("");

    const reply = await sendAiMessage(userInput);
    setMessages((prev) => [
      ...prev,
      { role: "ai", text: reply || "处理失败，请稍后再试。", time: now },
    ]);
    setThinking(false);
  }

  return (
    <>
      {/* Floating AI Badge */}
      <button
        onClick={() => setOpen(true)}
        className="absolute bottom-[86px] right-4 z-30 cursor-pointer rounded-full bg-[#20251E] px-4 py-2 text-sm font-extrabold text-white shadow-[0_16px_34px_rgba(32,37,30,0.24)] transition hover:bg-[#30372D]"
      >
        ◉ AI
      </button>

      {/* Chat Panel Overlay */}
      {open && (
        <div className="absolute inset-0 z-40 flex flex-col justify-end">
          <div className="absolute inset-0 bg-[rgba(32,33,28,0.28)] backdrop-blur-[2px]" onClick={() => setOpen(false)} />
          <div className="relative mx-auto w-full rounded-t-[32px] border border-white/75 bg-white/82 shadow-[0_-24px_60px_rgba(82,94,72,0.2)] backdrop-blur-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[#E3E8DD] px-4 py-3">
              <span className="text-base font-extrabold text-[#1F241E]">AI 助手</span>
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-2 py-1 text-lg font-bold text-[#6F766A] transition hover:bg-[#EEF5E8] hover:text-[#1F241E]"
              >
                ✕
              </button>
            </div>

            {/* Chat History */}
            <div ref={scrollRef} className="overflow-y-auto max-h-[300px] px-4 py-3 space-y-3">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-[#20251E] text-white"
                      : "bg-[#EEF5E8] text-[#303229]"
                  }`}>
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    <p className={`mt-1 text-xs ${msg.role === "user" ? "text-[#D7D3C8]" : "text-[#77786C]"}`}>{msg.time}</p>
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex justify-start">
                  <div className="animate-pulse rounded-[18px] bg-[#EEF5E8] p-3 text-sm text-[#77786C]">
                    思考中...
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="flex gap-2 border-t border-[#E3E8DD] px-4 py-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !thinking && handleSend()}
                placeholder="输入宿舍事务..."
                className="input-default flex-1"
                disabled={thinking}
              />
              <button onClick={handleSend} disabled={thinking} className="btn-dark px-4 text-sm">
                发送
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
