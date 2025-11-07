"use client";

import MoodSelect from "../components/MoodSelect";

export default function MoodPage() {
  const saveMood = async (mood) => {
    // (ตัวอย่าง) เซฟฝั่ง client ว่า "บันทึกวันนี้แล้ว"
    localStorage.setItem("mood_today", new Date().toDateString());

    // TODO: ถ้าจะบันทึกลงฐานข้อมูล ให้เรียก API ของคุณที่นี่
    // await fetch("/api/mood", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ mood }) });

    alert("บันทึกความรู้สึกเรียบร้อย ✅");
    window.location.href = "/student-home"; // กลับหน้าหลักนักศึกษา
  };

  return <MoodSelect onSubmit={saveMood} />;
}
