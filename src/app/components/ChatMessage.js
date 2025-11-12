"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoSend, IoArrowDownCircleOutline } from "react-icons/io5";

export default function TestChat() {
  const [messages, setMessages] = useState([
    { message: "ทดสอบข้อความจากนักเรียน", role: "student" },
    { message: "สวัสดี! ฉันคือ AI ผู้ช่วยของคุณ 😊", role: "ai" },
  ]);
  const [input, setInput] = useState("");

  const chatRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages((prev) => [...prev, { message: input, role: "student" }]);
    setInput("");

    // จำลองข้อความจาก AI
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { message: "นี่คือข้อความตอบกลับจาก AI 🚀", role: "ai" },
      ]);
    }, 800);
  };

  // เลื่อนอัตโนมัติไปล่างสุดเมื่อมีข้อความใหม่
  useEffect(() => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  // ตรวจจับว่าผู้ใช้เลื่อนขึ้น -> แสดงปุ่ม scroll ลงล่าง
  const handleScroll = () => {
    if (!chatRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
    setShowScrollButton(scrollTop + clientHeight < scrollHeight - 100);
  };

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTo({
        top: chatRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="flex justify-center bg-slate-50 w-screen h-screen p-10">
      <div className="relative flex rounded-2xl shadow-xl w-1/2 p-10 flex-col gap-4 bg-white">
        {/* Header */}
        <div className="text-black text-4xl font-bold rounded-2xl w-full">
          Chat
        </div>
        <div className="w-full bg-gray-400 h-0.5 opacity-35"></div>

        {/* Chat box */}
        <div
          ref={chatRef}
          onScroll={handleScroll}
          className="flex flex-col w-full h-full overflow-y-auto gap-2 pr-2 scroll-smooth"
        >
          {messages.map((m, i) => (
            <ChatMessage key={i} message={m.message} role={m.role} />
          ))}
        </div>

        {/* ปุ่ม scroll ลงล่างสุด */}
        {showScrollButton && (
          <button
            onClick={scrollToBottom}
            className="absolute bottom-24 right-12 p-2 bg-gray-200 hover:bg-gray-300 rounded-full shadow-md transition"
          >
            <IoArrowDownCircleOutline className="w-6 h-6 text-gray-700" />
          </button>
        )}

        {/* Typing area */}
        <div className="flex items-end gap-2 mt-4">
          <textarea
            rows={1}
            placeholder="พิมพ์ข้อความ..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), handleSend())}
            className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-400 overflow-y-auto max-h-40"
          />
          <button
            onClick={handleSend}
            className="p-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
          >
            <IoSend className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
