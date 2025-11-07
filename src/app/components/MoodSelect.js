"use client";

import { useState } from "react";

const moods = [
  { value: "very_good", emoji: "😊", text: "วันนี้ดีดี๊" },
  { value: "neutral",   emoji: "🙂", text: "ก็เรื่อยๆ นะ เฉยๆ" },
  { value: "uncomfortable", emoji: "😕", text: "รู้สึกไม่ค่อยสบายใจ" },
  { value: "very_bad",  emoji: "😭", text: "แย่มากๆ" },
];

export default function MoodSelect({ onSubmit }) {
  const [selected, setSelected] = useState(null);

  const handleSave = () => {
    if (!selected) return;
    onSubmit?.(selected);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#7bbdff] p-6">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-semibold text-white">วันนี้คุณรู้สึกอย่างไร?</h1>
        <p className="text-white/90 mt-1">เลือกอารมณ์ของคุณวันนี้</p>
      </div>

      <div className="w-full max-w-md space-y-4">
        {moods.map((m) => (
          <button
            key={m.value}
            onClick={() => setSelected(m.value)}
            className={`w-full flex items-center justify-between px-5 py-4 rounded-2xl shadow-md border bg-white transition
              ${selected === m.value ? "border-sky-600 ring-2 ring-sky-300" : "border-slate-200"}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-lg font-medium text-slate-700">{m.text}</span>
          </button>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={!selected}
        className="mt-8 bg-slate-900 text-white px-6 py-3 rounded-xl shadow hover:opacity-90 disabled:opacity-50"
      >
        บันทึกความรู้สึก
      </button>
    </div>
  );
}
