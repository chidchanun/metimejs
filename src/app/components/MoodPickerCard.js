"use client";

import { useState } from "react";

const MOODS = [
  { value: "very_good", emoji: "😊", text: "วันนี้ดีดี๊" },
  { value: "neutral",   emoji: "🙂", text: "ก็เรื่อยๆ นะ เฉยๆ" },
  { value: "uncomfortable", emoji: "😕", text: "รู้สึกไม่ค่อยสบายใจ" },
  { value: "very_bad",  emoji: "😭", text: "แย่มากๆ" },
];

/**
 * ใช้ในโมดัล: แสดงรายการอารมณ์ + ปุ่มบันทึก
 * onSubmit(mood) -> ให้ parent จัดการบันทึก/ปิดโมดัล
 */
export default function MoodPickerCard({ onSubmit }) {
  const [selected, setSelected] = useState(null);

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-medium">วันนี้คุณรู้สึกอย่างไร?</div>
        <div className="text-slate-500 text-sm">เลือกอารมณ์ของคุณวันนี้</div>
      </div>

      <div className="space-y-3">
        {MOODS.map((m) => (
          <button
            key={m.value}
            type="button"
            onClick={() => setSelected(m.value)}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border transition
              ${selected === m.value ? "border-sky-600 ring-2 ring-sky-200" : "border-slate-200 hover:bg-slate-50"}`}
          >
            <span className="text-2xl">{m.emoji}</span>
            <span className="text-base font-medium text-slate-700">{m.text}</span>
          </button>
        ))}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={() => selected && onSubmit?.(selected)}
          disabled={!selected}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
        >
          บันทึกความรู้สึก
        </button>
      </div>
    </div>
  );
}
