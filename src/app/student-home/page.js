"use client";

import { useEffect, useState, useCallback } from "react";
import RelaxPlayer from "../components/RelaxPlayer";
import IssueReportForm from "../components/IssueReportForm";
import MoodPickerCard from "../components/MoodPickerCard";

function QuickButton({ onClick, href, children, className = "" }) {
    const base = "rounded-2xl text-white px-4 py-3 text-sm hover:opacity-90 shadow-sm";
    if (onClick) return <button onClick={onClick} className={`${base} ${className}`}>{children}</button>;
    return <a href={href} className={`${base} ${className}`}>{children}</a>;
}

function Modal({ open, onClose, title, children }) {
    const esc = useCallback((e) => { if (e.key === "Escape") onClose?.(); }, [onClose]);
    useEffect(() => {
        if (!open) return;
        window.addEventListener("keydown", esc);
        return () => window.removeEventListener("keydown", esc);
    }, [open, esc]);
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[60]">
            <div className="absolute inset-0 bg-black/40" onClick={onClose} />
            <div className="absolute inset-0 flex items-center justify-center p-4">
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200">
                    <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200">
                        <h3 className="font-semibold">{title}</h3>
                        <button onClick={onClose} className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100" aria-label="ปิด">✕</button>
                    </div>
                    <div className="p-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function StudentHome() {
    const [loading, setLoading] = useState(true);
    const [moods, setMoods] = useState([]);
    const [myIssues, setMyIssues] = useState([]);
    const [myChats, setMyChats] = useState([]);
    const [openReport, setOpenReport] = useState(false);
    const [hasMoodToday, setHasMoodToday] = useState(false);

    // ...ภายใน StudentHome component:
    const [openMood, setOpenMood] = useState(false);   // <-- state โมดัล Mood
    // const [hasMoodToday, setHasMoodToday] = useState(false);

    // ตรวจว่าวันนี้เคยบันทึกหรือยัง
    useEffect(() => {
        const done = localStorage.getItem("mood_today") === new Date().toDateString();
        setHasMoodToday(done);
    }, []);

    useEffect(() => {
        // ตรวจว่าบันทึกอารมณ์วันนี้หรือยัง (ฝั่ง client)
        const done = localStorage.getItem("mood_today") === new Date().toDateString();
        setHasMoodToday(done);
    }, []);

    const playlist = [
        { id: 1, title: "Ocean Breath", artist: "Metime", src: "/relax/ocean-breath.mp3", cover: "/relax/covers/ocean.jpg" },
        { id: 2, title: "Forest Whisper", artist: "Metime", src: "/relax/forest-whisper.mp3", cover: "/relax/covers/forest.jpg" },
        { id: 3, title: "Calm Piano", artist: "Metime", src: "/relax/calm-piano.mp3", cover: "/relax/covers/piano.jpg" },
    ];

    useEffect(() => { setTimeout(() => setLoading(false), 300); }, []);
    useEffect(() => {
        setTimeout(() => {
            setMoods([
                { d: "อา", mood: "good" }, { d: "จ", mood: "neutral" }, { d: "อ", mood: "good" },
                { d: "พ", mood: "bad" }, { d: "พฤ", mood: "good" }, { d: "ศ", mood: "good" }, { d: "ส", mood: "neutral" },
            ]);
            setMyIssues([
                { id: 210, category: "การเรียน", status: "ยังไม่ดำเนินการ" },
                { id: 211, category: "สุขภาพจิต", status: "รอดำเนินการ" },
            ]);
            setMyChats([
                { id: 6001, topic: "เครียดเรื่องงานกลุ่ม", status: "open" },
                { id: 6002, topic: "อยากปรึกษาการเงิน", status: "closed" },
            ]);
            setLoading(false);
        }, 400);
    }, []);

    const categories = [
        { id: 1, name: "ความเครียดจากการเรียน" },
        { id: 2, name: "ความกดดันส่วนตัว" },
        { id: 3, name: "ปัญหาความสัมพันธ์" },
        { id: 4, name: "ปัญหาครอบครัว" },
        { id: 5, name: "สุขภาพจิต" },
        { id: 99, name: "อื่นๆ" },
    ];

    const moodColor = (m) => ({
        very_good: "bg-emerald-500",
        good: "bg-emerald-400",
        neutral: "bg-slate-300",
        bad: "bg-amber-400",
        very_bad: "bg-rose-500",
    }[m] || "bg-slate-300");

    return (
        <main className="min-h-screen bg-slate-50">
            <div className="mx-auto max-w-5xl p-6">
                <h1 className="text-2xl font-semibold">สวัสดี 👋</h1>
                <p className="text-slate-500">ดูภาพรวมช่วงนี้และเริ่มใช้งานอย่างรวดเร็ว</p>

                {/* Quick actions */}
                <div className="mt-6 flex flex-wrap gap-3">
                    {/* ปุ่ม Mood: สีแดงถ้ายังไม่บันทึกวันนี้ / เขียวถ้าบันทึกแล้ว */}
                    {/* <QuickButton
                        href="/mood"
                        className={hasMoodToday ? "bg-green-600" : "bg-red-500"}
                    >
                        บันทึกความรู้สึก
                    </QuickButton> */}

                    <QuickButton
                        onClick={() => setOpenMood(true)}
                        className={hasMoodToday ? "bg-green-600" : "bg-red-500"}
                    >
                        บันทึกความรู้สึก
                    </QuickButton>

                    {/* รายงานปัญหา (เปิดโมดัลฟอร์ม) */}
                    <QuickButton onClick={() => setOpenReport(true)} className="bg-slate-900">
                        รายงานปัญหา
                    </QuickButton>

                    <QuickButton href="/chat" className="bg-slate-900">ไปที่ห้องแชท</QuickButton>
                </div>

                {/* Mood last 7 days */}
                <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="font-medium mb-4">อารมณ์ 7 วันที่ผ่านมา</div>
                    {loading ? (
                        <div className="text-slate-500">กำลังโหลด...</div>
                    ) : (
                        <div className="grid grid-cols-7 gap-2">
                            {moods.map((m, i) => (
                                <div key={i} className="text-center">
                                    <div className={`h-10 w-full rounded-xl ${moodColor(m.mood)}`} />
                                    <div className="mt-1 text-xs text-slate-500">{m.d}</div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Relax music widget */}
                <div className="mt-8">
                    <div className="mb-3 font-medium">เปิดเสียงผ่อนคลาย</div>
                    <RelaxPlayer playlist={playlist} />
                </div>

                {/* My Issues */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="font-medium mb-3">ปัญหาที่ฉันรายงาน</div>
                    {loading ? (
                        <div className="text-slate-500">กำลังโหลด...</div>
                    ) : myIssues.length === 0 ? (
                        <div className="text-slate-500 text-sm">ยังไม่มีการรายงาน ลองเริ่มที่ “รายงานปัญหา”</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {myIssues.map((it) => (
                                <li key={it.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">#{it.id} • {it.category}</div>
                                        <div className="text-xs text-slate-500">สถานะ: {it.status}</div>
                                    </div>
                                    <a href={`/issues/${it.id}`} className="text-sm text-slate-700 underline">เปิดดู</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                {/* My Chats */}
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="font-medium mb-3">ห้องแชทของฉัน</div>
                    {loading ? (
                        <div className="text-slate-500">กำลังโหลด...</div>
                    ) : myChats.length === 0 ? (
                        <div className="text-slate-500 text-sm">ยังไม่มีห้องแชท เริ่มแชทใหม่ได้ที่หน้า “แชท”</div>
                    ) : (
                        <ul className="divide-y divide-slate-100">
                            {myChats.map((c) => (
                                <li key={c.id} className="py-3 flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">{c.topic}</div>
                                        <div className="text-xs text-slate-500">ห้อง #{c.id} • สถานะ: {c.status}</div>
                                    </div>
                                    <a href={`/chat/${c.id}`} className="text-sm text-slate-700 underline">เข้าแชท</a>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

            {/* Modal: รายงานปัญหา */}
            <Modal open={openReport} onClose={() => setOpenReport(false)} title="รายงานปัญหา">
                <IssueReportForm
                    categories={categories}
                    endpoint="/api/issues"
                    onSubmitted={() => {
                        setOpenReport(false);
                        // TODO: โหลด myIssues ใหม่ถ้าต้องการ
                    }}
                />
            </Modal>

            <Modal open={openMood} onClose={() => setOpenMood(false)} title="บันทึกความรู้สึก">
                <MoodPickerCard
                    onSubmit={async (mood) => {
                        // ถ้าต้องบันทึกลง DB ให้ปลดคอมเมนต์บรรทัดล่าง แล้วทำ API route /api/mood
                        // await fetch("/api/mood", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ mood }) });

                        // ให้ปุ่มเปลี่ยนสีทันที
                        localStorage.setItem("mood_today", new Date().toDateString());
                        setHasMoodToday(true);

                        setOpenMood(false);
                    }}
                />
            </Modal>
        </main>
    );
}
