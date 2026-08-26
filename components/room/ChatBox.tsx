"use client";

import { useEffect, useRef, useState } from "react";
import { SyncDB } from "@/lib/syncEngine";
import { useAuth } from "@/contexts/AuthContext";
import { sound } from "@/lib/sound";
import type { ChatMessage } from "@/types/room";

interface ChatBoxProps {
  roomId: string;
  currentUid: string;
}

const QUICK_EMOJIS = ["🔥", "👏", "😂", "😮", "💯", "🤝", "🏆", "😎"];

export function ChatBox({ roomId, currentUid }: ChatBoxProps) {
  const { profile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsub = SyncDB.subscribe(`rooms/${roomId}/chat`, (data) => {
      if (!data || typeof data !== "object") {
        setMessages([]);
        return;
      }
      const msgs: ChatMessage[] = Object.values(data as Record<string, ChatMessage>);
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    });

    return () => unsub();
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (customText?: string) => {
    const msgText = (customText || text).trim();
    if (!msgText) return;

    sound.playMessage();
    const msgId = `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newMsg: ChatMessage = {
      uid: currentUid,
      name: profile?.displayName || "لاعب",
      text: msgText,
      avatar: profile?.photoURL || "👤",
      timestamp: Date.now(),
    };

    await SyncDB.update(`rooms/${roomId}/chat`, {
      [msgId]: newMsg,
    });

    if (!customText) {
      setText("");
    }
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl border border-white/20 bg-white/80 shadow-xl backdrop-blur-sm dark:bg-zinc-900/80">
      <div className="border-b border-zinc-100 px-5 py-4 dark:border-zinc-800">
        <span className="text-sm font-extrabold text-zinc-800 dark:text-zinc-200">
          💬 المحادثة المباشرة
        </span>
      </div>

      {/* Messages Stream */}
      <div className="flex h-64 flex-col gap-2.5 overflow-y-auto p-4 sm:h-72">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center text-center">
            <span className="text-3xl opacity-60">👋</span>
            <p className="mt-1 text-xs font-bold text-zinc-400">لا توجد رسائل بعد. رحب باللاعبين!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.uid === currentUid;
            return (
              <div
                key={i}
                className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : "flex-row"}`}
              >
                <span className="text-lg">{msg.avatar || "👤"}</span>
                <div
                  className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-xs font-bold shadow-sm ${
                    isMe
                      ? "gradient-primary text-white"
                      : "bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
                  }`}
                >
                  {!isMe && (
                    <span className="mb-0.5 block text-[10px] opacity-70 text-orange-700 dark:text-orange-300">
                      {msg.name}
                    </span>
                  )}
                  <span>{msg.text}</span>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick Emojis Strip */}
      <div className="flex items-center gap-1 overflow-x-auto border-t border-zinc-100 bg-zinc-50/50 px-3 py-1.5 dark:border-zinc-800 dark:bg-zinc-900/50">
        {QUICK_EMOJIS.map((emoji) => (
          <button
            key={emoji}
            onClick={() => send(emoji)}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-sm hover:bg-white transition-transform active:scale-125 dark:hover:bg-zinc-800"
          >
            {emoji}
          </button>
        ))}
      </div>

      {/* Input Form */}
      <div className="flex gap-2 border-t border-zinc-100 p-3 dark:border-zinc-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب رسالة سريعة..."
          className="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-bold text-zinc-900 transition-all focus:border-orange-500 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
          dir="rtl"
        />
        <button
          onClick={() => send()}
          disabled={!text.trim()}
          className="gradient-primary shrink-0 rounded-xl px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-orange-500/20 transition-all hover:brightness-110 active:scale-95 disabled:opacity-50"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
