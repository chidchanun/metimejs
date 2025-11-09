"use client";
import { useState } from "react";

const MOODS = [
  { id: 1, emoji: "😊", text: "วันนี้ดีดี๊" },
  { id: 2, emoji: "🙂", text: "ก็เรื่อยๆ นะ เฉยๆ" },
  { id: 3, emoji: "😕", text: "รู้สึกไม่ค่อยสบายใจ" },
  { id: 4, emoji: "😭", text: "แย่มากๆ" },
];

export default function MoodPickerCard({ onSubmit }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-medium text-black">วันนี้คุณรู้สึกอย่างไร?</div>
        <div className="text-slate-500 text-sm">เลือกอารมณ์ของคุณวันนี้</div>
      </div>

      <div className="space-y-3">
        {MOODS.map((m) => (
          <button
            key={m.id}                         // ✅ key ถูก
            type="button"
            onClick={() => setSelected(m.id)}  // ✅ เก็บ id
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border transition
              ${selected === m.id ? "border-sky-600 ring-2 ring-sky-200" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-base font-medium text-slate-700">{m.text}</span>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => selected && onSubmit?.(selected)} // ✅ ส่ง id ไปเป็น emotion_id
          disabled={!selected}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
        >
          บันทึกความรู้สึก
        </button>
      </div>
    </div>
  );
}
