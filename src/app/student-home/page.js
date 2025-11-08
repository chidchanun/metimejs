"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import RelaxPlayer from "../components/RelaxPlayer";
import IssueReportForm from "../components/IssueReportForm";
import MoodPickerCard from "../components/MoodPickerCard";
import LogoutButton from "../components/LogoutButton";

/**
 * Utilities
 */
function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

/**
 * Hook: ตรวจว่าหน้าจอเป็น mobile/tablet/desktop ผ่าน CSS media query
 */
function useMediaQuery(query) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mql = window.matchMedia(query);
    const onChange = (e) => setMatches(e.matches);
    setMatches(mql.matches);
    mql.addEventListener?.("change", onChange);
    return () => mql.removeEventListener?.("change", onChange);
  }, [query]);
  return matches;
}

function QuickButton({ onClick, href, children, className = "" }) {
  const base =
    "rounded-2xl text-white px-4 py-3 text-sm md:text-base hover:opacity-90 shadow-sm transition-opacity active:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300";
  if (onClick)
    return (
      <button onClick={onClick} className={cx(base, className)}>
        {children}
      </button>
    );
  return (
    <a href={href} className={cx(base, className)}>
      {children}
    </a>
  );
}

function Modal({ open, onClose, title, children }) {
  const isOpen = !!open;
  const dialogRef = useRef(null);
  const lastFocusedEl = useRef(null);

  const esc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  // ล็อกสกอร์ลเมื่อโมดัลเปิด + ฟังปุ่ม ESC
  useEffect(() => {
    if (!isOpen) return;
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "hidden";
    }
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      if (typeof document !== "undefined") {
        document.documentElement.style.overflow = "";
      }
    };
  }, [isOpen, esc]);

  // โฟกัสภายในโมดัล (focus trap อย่างง่าย)
  useEffect(() => {
    if (!isOpen) return;
    lastFocusedEl.current = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      lastFocusedEl.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-xl sm:max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 outline-none"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200">
            <h3 className="font-semibold text-base sm:text-lg">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
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
  const [openMood, setOpenMood] = useState(false);
  const [range, setRange] = useState(7);


  const isMobile = useMediaQuery("(max-width: 640px)");

  // ตรวจว่าวันนี้เคยบันทึกหรือยัง (ฝั่ง client)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const done = localStorage.getItem("mood_today") === today;
    setHasMoodToday(done);
  }, []);

  useEffect(() => {
    async function loadMood() {
      try {
        const res = await fetch(`/api/v1/user-emotion?days=${range}`, { cache: "no-store" });
        const { data } = await res.json();
        console.log('rows', data.length, data);

        setMoods(
          data.map((row) => ({
            d: new Date(row.created_at).toLocaleDateString("th-TH", { weekday: "short" }),
            mood:
              row.emotion_name.includes("ดี")
                ? "good"
                : row.emotion_name.includes("แย่")
                  ? "bad"
                  : "neutral",
          }))
        );
        const todayStr = new Date().toDateString();
        const hasToday = data.some(
          r => new Date(r.created_at).toDateString() === todayStr
        );
        setHasMoodToday(hasToday);
      } catch (e) {
        console.error("โหลด mood ล้มเหลว:", e);
      } finally {
        setLoading(false);
      }
    }

    loadMood();
  }, []);



  const categories = [
    { id: 1, name: "ความเครียดจากการเรียน" },
    { id: 2, name: "ความกดดันส่วนตัว" },
    { id: 3, name: "ปัญหาความสัมพันธ์" },
    { id: 4, name: "ปัญหาครอบครัว" },
    { id: 5, name: "สุขภาพจิต" },
    { id: 99, name: "อื่นๆ" },
  ];

  const moodColor = (m) =>
  ({
    very_good: "bg-emerald-500",
    good: "bg-emerald-400",
    neutral: "bg-slate-300",
    bad: "bg-amber-400",
    very_bad: "bg-rose-500",
  }[m] || "bg-slate-300");

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">สวัสดี 👋</h1>
            <p className="text-slate-500 text-sm sm:text-base">
              ดูภาพรวมช่วงนี้และเริ่มใช้งานอย่างรวดเร็ว
            </p>
          </div>
          <LogoutButton className="bg-red-600" />
        </header>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          <QuickButton
            onClick={() => setOpenMood(true)}
            className={hasMoodToday ? "bg-green-600" : "bg-red-500"}
          >
            บันทึกความรู้สึก
          </QuickButton>

          <QuickButton onClick={() => setOpenReport(true)} className="bg-slate-900">
            รายงานปัญหา
          </QuickButton>

          <QuickButton href="/chat" className="bg-slate-900">
            ไปที่ห้องแชท
          </QuickButton>
        </div>


        {/* Mood last 7 days */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex justify-between">
            <div className="font-medium mb-3 sm:mb-4">อารมณ์ 7 วันที่ผ่านมา</div>
            <div className="flex ">
              <button onClick={() => setRange(7)} className={`px-3 py-1 rounded ${range === 7 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                7 วัน
              </button>
              <button onClick={() => setRange(30)} className={`px-3 py-1 rounded ${range === 30 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                30 วัน
              </button>
            </div>

          </div>
          {loading ? (
            <div className="text-slate-500">กำลังโหลด...</div>
          ) : (
            <div>
              {/* มือถือ: สไลด์แนวนอน / จอใหญ่: กริด 7 คอลัมน์ */}
              <div
                className={cx(
                  "gap-2",
                  isMobile
                    ? "flex overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                    : "grid grid-cols-7"
                )}
              >
                {moods.map((m, i) => (
                  <div key={i} className={cx("text-center", isMobile && "min-w-[44px]")}>
                    <div className={cx("h-10 w-full rounded-xl", moodColor(m.mood))} />
                    <div className="mt-1 text-[10px] sm:text-xs text-slate-500">{m.d}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Relax music widget */}
        <section className="mt-6">
          <div className="mb-2 sm:mb-3 font-medium">เปิดเสียงผ่อนคลาย</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <RelaxPlayer
              playlist={[
                {
                  id: 1,
                  title: "Ocean Breath",
                  artist: "Metime",
                  src: "/relax/ocean-breath.mp3",
                  cover: "/relax/covers/ocean.jpg",
                },
                {
                  id: 2,
                  title: "Forest Whisper",
                  artist: "Metime",
                  src: "/relax/forest-whisper.mp3",
                  cover: "/relax/covers/forest.jpg",
                },
                {
                  id: 3,
                  title: "Calm Piano",
                  artist: "Metime",
                  src: "/relax/calm-piano.mp3",
                  cover: "/relax/covers/piano.jpg",
                },
              ]}
            />
          </div>
        </section>

        {/* My Issues & Chats: วางเป็นกริด 1 คอลัมน์บนมือถือ / 2 คอลัมน์บนจอใหญ่ */}
        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="font-medium mb-3">ปัญหาที่ฉันรายงาน</div>
            {loading ? (
              <div className="text-slate-500">กำลังโหลด...</div>
            ) : myIssues.length === 0 ? (
              <div className="text-slate-500 text-sm">
                ยังไม่มีการรายงาน ลองเริ่มที่ “รายงานปัญหา”
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myIssues.map((it) => (
                  <li key={it.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">#{it.id} • {it.category}</div>
                      <div className="text-xs text-slate-500">สถานะ: {it.status}</div>
                    </div>
                    <a href={`/issues/${it.id}`} className="text-sm text-slate-700 underline shrink-0">
                      เปิดดู
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="font-medium mb-3">ห้องแชทของฉัน</div>
            {loading ? (
              <div className="text-slate-500">กำลังโหลด...</div>
            ) : myChats.length === 0 ? (
              <div className="text-slate-500 text-sm">
                ยังไม่มีห้องแชท เริ่มแชทใหม่ได้ที่หน้า “แชท”
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {myChats.map((c) => (
                  <li key={c.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{c.topic}</div>
                      <div className="text-xs text-slate-500">ห้อง #{c.id} • สถานะ: {c.status}</div>
                    </div>
                    <a href={`/chat/${c.id}`} className="text-sm text-slate-700 underline shrink-0">
                      เข้าแชท
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>
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

      {/* Modal: บันทึกความรู้สึก */}
      <Modal open={openMood} onClose={() => setOpenMood(false)} title="บันทึกความรู้สึก">
        <MoodPickerCard
          onSubmit={async (mood) => {
            // ถ้าต้องบันทึกลง DB ให้ปลดคอมเมนต์บรรทัดล่าง แล้วทำ API route /api/mood
            // await fetch("/api/mood", { method:"POST", headers:{ "Content-Type":"application/json" }, body: JSON.stringify({ mood }) });

            // ให้ปุ่มเปลี่ยนสีทันที
            if (typeof window !== "undefined") {
              localStorage.setItem("mood_today", new Date().toDateString());
            }
            setHasMoodToday(true);
            setOpenMood(false);
          }}
        />
      </Modal>
    </main>
  );
}
