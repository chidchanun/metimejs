"use client";
import { useState, useRef, useEffect } from "react";
import ChatMessage from "../components/ChatMessage";
import { IoSend, IoArrowDownCircleOutline } from "react-icons/io5";
import TextareaAutosize from "react-textarea-autosize";

export default function ChatComponent({ role_id, roomId }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const ws = useRef(null);
  const chatRef = useRef(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [chatTeacher, setChatTeacher] = useState(false)
  const WS_URL = "ws://localhost:8082"; // เปลี่ยน URL ตาม server ของคุณ
  const RECONNECT_INTERVAL = 3000; // 3 วินาที

  const connectWS = () => {
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="));

    if (!tokenCookie) {
      router.push("/login");
      return;
    }

    const token = decodeURIComponent(tokenCookie.split("=")[1]);

    // ถ้า ws ยังเปิดอยู่ ให้ return
    if (ws.current && ws.current.readyState === WebSocket.OPEN) return;

    ws.current = new WebSocket(WS_URL);

    ws.current.onopen = () => {
      console.log("✅ Connected to WS server");
      if (role_id === 1) {
        ws.current.send(
          JSON.stringify({
            type: "init",
            role: role_id,
            token,
            ChatTeacher: false,
          })
        );
      } else if (role_id === 2) {
        ws.current.send(
          JSON.stringify({
            type: "init",
            role: role_id,
            token,
            ChatTeacher: true,
            roomId: roomId
          })
        );
      }
    };

    ws.current.onclose = () => {
      console.log("❌ WS disconnected, reconnecting...");
      setTimeout(connectWS, RECONNECT_INTERVAL);
    };

    ws.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === "error_notice") {
          setMessages((prev) => [
            ...prev,
            { message: data.message, role: "system" },
          ]);

          const resRoom = await fetch("api/v1/room/id", {
            method: "POST",
            body: JSON.stringify({ token }),
          });
          const dataDB = await resRoom.json();
          ws.current.send(
            JSON.stringify({
              type: "init",
              role: role_id,
              token,
              ChatTeacher: true,
              roomId: dataDB.row_room[0].room_id,
            })
          );

          return;
        }

        if (data.type === "chat" || data.type === "notice") {
          setMessages((prev) => [
            ...prev,
            {
              message: data.message,
              role: data.role || (data.type === "notice" ? "teacher" : "ai"),
            },
          ]);
        } else if (data.type === "error") {
          setMessages((prev) => [
            ...prev,
            { message: data.message, role: "system" },
          ]);
        } else if (data.type === "init_ok") {
          console.log("✅ Init completed");
        }
      } catch (err) {
        console.error("Invalid WS message:", err);
      }
    };
  };

  useEffect(() => {
    connectWS();
    return () => ws.current?.close();
  }, []);


  const handleSend = () => {
    const msg = input.trim();
    if (!msg) return;
    setMessages((prev) => [...prev, { message: msg, role: "student" }]);
    setInput("");

    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({ type: "chat", message: msg }));
    }
  };

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const myRole = role_id === 1 ? "student" : "teacher"

  return (
    <div className="flex flex-col h-full relative">
      <div
        ref={chatRef}
        onScroll={() => {
          const { scrollTop, scrollHeight, clientHeight } = chatRef.current;
          setShowScrollButton(scrollTop + clientHeight < scrollHeight - 50);
        }}
        className="flex-1 overflow-y-auto flex flex-col gap-2 p-2"
      >
        {messages.map((m, i) => {
          return (
            <ChatMessage
              key={i}
              message={m.message}
              role={m.role}
            />
          );
        })}
      </div>

      {showScrollButton && (
        <button
          onClick={() => chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: "smooth" })}
          className="absolute bottom-24 right-6 sm:right-8 p-2 bg-gray-200 hover:bg-gray-300 rounded-full shadow-md transition"
        >
          <IoArrowDownCircleOutline className="w-6 h-6 text-gray-700" />
        </button>
      )}

      <div className="flex items-end gap-2 mt-2 border-t border-gray-200 pt-2">
        <TextareaAutosize
          minRows={1}
          maxRows={5}
          placeholder="พิมพ์ข้อความ..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          className="flex-1 border border-gray-300 rounded-2xl px-4 py-2 text-base resize-none focus:outline-none focus:ring-2 focus:ring-blue-400"
        />

        <button
          onClick={() => {
            const tokenCookie = document.cookie
              .split("; ")
              .find((row) => row.startsWith("auth_token="));

            if (!tokenCookie) {
              router.push("/login");
              return;
            }

            const token = decodeURIComponent(tokenCookie.split("=")[1]);
            const noticeMessage = "นักเรียนต้องการติดต่อฝ่ายพัฒนา (แจ้งปัญหา)";
            setChatTeacher(true)
            setMessages((prev) => [...prev, { message: noticeMessage, role: "student" }]);
            if (ws.current && ws.current.readyState === WebSocket.OPEN) {
              ws.current.send(JSON.stringify({ type: "init", role: role_id, token: token, ChatTeacher: true }))
              ws.current.send(JSON.stringify({ type: "notice", message: noticeMessage }));
            } else console.warn("⚠️ WS ยังไม่พร้อมส่ง notice");
          }}
          className="p-3 bg-gray-500 text-white rounded-full hover:bg-gray-600 transition"
          title="ติดต่อฝ่ายพัฒนา"
        >
          🧑‍🏫
        </button>

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
