"use client";

import { useEffect, useRef, useState } from "react";
import { ref, push, onValue, off } from "firebase/database";
import { getFirebaseRTDB } from "@/lib/firebase";
import type { ChatMessage } from "@/types/room";

interface ChatBoxProps {
  roomId: string;
  currentUid: string;
}

export function ChatBox({ roomId, currentUid }: ChatBoxProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const chatRef = ref(getFirebaseRTDB(), `rooms/${roomId}/chat`);

    const unsubscribe = onValue(chatRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setMessages([]);
        return;
      }
      const msgs: ChatMessage[] = Object.values(data);
      setMessages(msgs.sort((a, b) => a.timestamp - b.timestamp));
    });

    return () => off(chatRef, "value", unsubscribe);
  }, [roomId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!text.trim()) return;

    await push(ref(getFirebaseRTDB(), `rooms/${roomId}/chat`), {
      uid: currentUid,
      text: text.trim(),
      timestamp: Date.now(),
    });

    setText("");
  };

  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <div className="border-b border-zinc-200 px-4 py-2 dark:border-zinc-800">
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          المحادثة
        </span>
      </div>

      <div className="flex h-48 flex-col gap-1 overflow-y-auto p-3">
        {messages.length === 0 && (
          <p className="text-center text-xs text-zinc-400">لا توجد رسائل</p>
        )}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-xs ${
              msg.uid === "system"
                ? "text-center text-zinc-400"
                : msg.uid === currentUid
                ? "text-left"
                : "text-right"
            }`}
          >
            {msg.uid !== "system" && msg.uid !== currentUid && (
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {msg.text.split(":")[0]}:{" "}
              </span>
            )}
            <span className="text-zinc-700 dark:text-zinc-300">
              {msg.uid === "system"
                ? msg.text
                : msg.uid === currentUid
                ? msg.text
                : msg.text.includes(":")
                ? msg.text.split(":").slice(1).join(":")
                : msg.text}
            </span>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <div className="flex gap-2 border-t border-zinc-200 p-3 dark:border-zinc-800">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
          placeholder="اكتب رسالة..."
          className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800"
        />
        <button
          onClick={send}
          className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm text-white hover:bg-emerald-700"
        >
          إرسال
        </button>
      </div>
    </div>
  );
}
