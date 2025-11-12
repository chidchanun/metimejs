"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoSend, IoArrowDownCircleOutline } from "react-icons/io5";

export default function ChatComponent() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const chatRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  useEffect(() => {
    ws.current = new WebSocket("ws://localhost:8080");
    ws.current.onopen = () => console.log("Connected to WS server");

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "chat") {
        setMessages((prev) => [...prev, { message: data.message, role: data.role || "ai" }]);
      } else if (data.type === "error") {
        setMessages((prev) => [...prev, { message: `${data.message}`, role: "system" }]);
      }
    };

    ws.current.onclose = () => console.log("Disconnected");
    return () => ws.current.close();
  }, []);

  const handleSend = () => {
    if (!input.trim()) return;
    const msg = input.trim();
    setMessages((prev) => [...prev, { message: msg, role: "student" }]);
    setInput("");
    ws.current.send(JSON.stringify({ type: "chat", message: msg }));
  };

  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div className="flex flex-col h-full">
      {/* พื้นที่ข้อความ */}
      <div
        ref={chatRef}
        onScroll={() => {
          const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
          setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
        }}
        className="flex-1 overflow-y-auto flex flex-col gap-2 p-2"
      >
        {messages.map((m, i) => (
          <ChatMessage key={i} message={m.message} role={m.role} />
        ))}
      </div>

      {/* ปุ่ม scroll ลงล่าง */}
      {showScrollButton && (
        <button
          onClick={() =>
            chatRef.current.scrollTo({
              top: chatRef.current.scrollHeight,
              behavior: "smooth",
            })
          }
          className="absolute bottom-24 right-6 sm:right-8 p-2 bg-gray-200 hover:bg-gray-300 rounded-full shadow-md transition"
        >
          <IoArrowDownCircleOutline className="w-6 h-6 text-gray-700" />
        </button>
      )}

      {/* กล่องพิมพ์ข้อความ */}
      <div className="flex items-end gap-2 mt-2 border-t border-gray-200 pt-2">
        <textarea
          rows={1}
          placeholder="พิมพ์ข้อความ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <button
          onClick={handleSend}
          className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
        >
          <IoSend className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
