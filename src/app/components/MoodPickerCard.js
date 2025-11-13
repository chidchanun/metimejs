"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const MOODS = [
  { id: 1, emoji: "😊", text: "วันนี้ดีดี๊" },
  { id: 2, emoji: "🙂", text: "ก็เรื่อยๆ นะ เฉยๆ" },
  { id: 3, emoji: "😕", text: "รู้สึกไม่ค่อยสบายใจ" },
  { id: 4, emoji: "😭", text: "แย่มากๆ" },
];

export default function MoodPickerCard({ onSubmit }) {
  const [selected, setSelected] = useState();
  const [emotion, setEmotion] = useState({});
  const [tokenValue, setTokenValue] = useState();
  const router = useRouter();

  useEffect(() => {
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="));

    const token = decodeURIComponent(tokenCookie.split("=")[1]);
    setTokenValue(token);

    async function resEmotion() {
      const resEmotion = await fetch("/api/v1/emotion", { method: "GET" });
      const Emotion = await resEmotion.json();
      setEmotion(Emotion);
    }

    resEmotion();
  }, []);

  async function handleSaveEmotion() {
    const sendEmotion = await fetch("/api/v1/emotion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenValue,
        emotion_id: selected,
      }),
    });

    if (sendEmotion.status === 400 || sendEmotion.status === 500) {
      return;
    }

    if (typeof onSubmit === "function") {
      onSubmit(selected);
    }

    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div>
        <div className="text-lg font-medium text-black">วันนี้คุณรู้สึกอย่างไร?</div>
        <div className="text-slate-500 text-sm">เลือกอารมณ์ของคุณวันนี้</div>
      </div>

      <div className="space-y-3">
        {emotion.result?.map((m) => {
          // 🔍 หา emoji จากตาราง MOODS
          const moodDef = MOODS.find((x) => x.id === m.emotion_id);

          return (
            <button
              key={m.emotion_id}
              type="button"
              onClick={() => setSelected(m.emotion_id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl bg-white border transition
              ${
                selected === m.emotion_id
                  ? "border-sky-600 ring-2 ring-sky-200"
                  : "border-slate-200 hover:bg-slate-50"
              }`}
            >
              <div className="flex items-center gap-3">
                {/* 😊 emoji แสดงตรงนี้ */}
                {moodDef && (
                  <span className="text-2xl">{moodDef.emoji}</span>
                )}

                <span className="text-base font-medium text-slate-700">
                  {m.emotion_name}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      <div className="pt-2">
        <button
          type="button"
          onClick={handleSaveEmotion}
          disabled={!selected}
          className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-50"
        >
          บันทึกความรู้สึก
        </button>
      </div>
    </div>
  );
}
