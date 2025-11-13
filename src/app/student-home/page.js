/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RelaxPlayer from "../components/RelaxPlayer";
import IssueReportForm from "../components/IssueReportForm";
import MoodPickerCard from "../components/MoodPickerCard";
import LogoutButton from "../components/LogoutButton";
import UserReportsList from "../components/UserReportsList";
import ChatComponent from "../components/ChatComponent";

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

// function QuickButton({ onClick, href, children, className = "" }) {
//   const base =
//     "rounded-2xl text-white px-4 py-3 text-sm md:text-base hover:opacity-90 shadow-sm transition-opacity active:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300";
//   if (onClick)
//     return (
//       <button onClick={onClick} className={cx(base, className)}>
//         {children}
//       </button>
//     );
//   return (
//     <a href={href} className={cx(base, className)}>
//       {children}
//     </a>
//   );
// }

// ✅ ปรับ QuickButton รองรับ disabled + สไตล์กดไม่ได้
function QuickButton({ onClick, href, children, className = "", disabled = false }) {
  const base =
    "rounded-2xl text-white px-4 py-3 text-sm md:text-base hover:opacity-90 shadow-sm transition-opacity active:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300";
  const disabledCls = disabled ? "opacity-50 pointer-events-none cursor-not-allowed" : "";

  if (onClick) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={[base, className, disabledCls].join(" ")}
        aria-disabled={disabled}
      >
        {children}
      </button>
    );
  }
  return (
    <a
      href={href}
      className={[base, className, disabledCls].join(" ")}
      aria-disabled={disabled}
      onClick={(e) => disabled && e.preventDefault()}
    >
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
            <h3 className="font-semibold text-base sm:text-lg text-black">{title}</h3>
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
  const [openChatAI, setOpenChatAI] = useState(false);
  const [openChatDev, setOpenChatDev] = useState(false);
  const router = useRouter()


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
        // console.log('rows', data.length, data);

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

  useEffect(() => {
    async function loadIssues() {
      try {
        // ✅ หยิบ token จาก cookie
        const tokenCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="));

        if (!tokenCookie) {
          router.push("/login");
          return;
        }

        const token = decodeURIComponent(tokenCookie.split("=")[1]);

        // ✅ เรียก API พร้อมส่ง Header Authorization
        const res = await fetch("/api/v1/user-report", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (res.status === 400 || res.status === 401) {
          router.push("/login");
          return;
        }

        const { result } = await res.json();

        // ✅ Map ให้ตรง UI
        setMyIssues(
          result.map((r) => ({
            id: r.report_id,
            category: r.problem_type ?? "ไม่ระบุประเภท",
            severity: r.problem_severe ?? "ไม่ระบุระดับ",
            place: r.problem_where ?? "-",
            description: r.description ?? "",
            imageUrl: r.image_url ?? null,
            reportedAt: r.reported_at ? new Date(r.reported_at) : null,
          }))
        );
      } catch (err) {
        console.error("โหลดปัญหาล้มเหลว:", err);
        setMyIssues([]);
      }
    }

    loadIssues();
  }, []);


  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-6">
        <header className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1 sm:gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-black">สวัสดี 👋</h1>
            <p className="text-slate-500 text-sm sm:text-base">
              ดูภาพรวมช่วงนี้และเริ่มใช้งานอย่างรวดเร็ว
            </p>
          </div>
          <LogoutButton className="bg-red-600" />
        </header>

        {/* Quick actions */}
        <div className="mt-5 grid grid-cols-2 sm:flex sm:flex-wrap gap-3">
          {/* // ✅ ตรงปุ่ม "บันทึกความรู้สึก" — ปิดการกดเมื่อกดไปแล้ววันนี้ */}
          <QuickButton
            onClick={() => setOpenMood(true)}
            disabled={hasMoodToday}
            className={hasMoodToday ? "bg-green-600" : "bg-red-500"}
          >
            {hasMoodToday ? "บันทึกแล้ววันนี้" : "บันทึกความรู้สึก"}
          </QuickButton>


          <QuickButton onClick={() => setOpenReport(true)} className="bg-slate-900">
            รายงานปัญหา
          </QuickButton>

          <QuickButton onClick={() => setOpenChatAI(true)} className="bg-slate-900">
            ห้องแชท AI BigBot
          </QuickButton>

          {/* <QuickButton href="/chat" className="bg-slate-900">
            ห้องแชท AI BigBot
          </QuickButton> */}

          <QuickButton href="/chat" className="bg-slate-900">
            ห้องแชท ฝ่ายพัฒนา
          </QuickButton>
        </div>


        {/* Mood last 7 days */}
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
          <div className="flex justify-between">
            <div className="font-medium mb-3 sm:mb-4 text-black">อารมณ์ 7 วันที่ผ่านมา</div>
            <div className="flex ">
              {/* <button onClick={() => setRange(7)} className={`px-3 py-1 rounded text-black ${range === 7 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                7 วัน
              </button>
              <button onClick={() => setRange(30)} className={`px-3 py-1 rounded text-black ${range === 30 ? 'bg-blue-600 text-white' : 'bg-slate-200'}`}>
                30 วัน
              </button> */}
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
          <div className="mb-2 sm:mb-3 font-medium text-black">เปิดเสียงผ่อนคลาย</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm">
            <RelaxPlayer />

          </div>
        </section>

        {/* My Issues & Chats: วางเป็นกริด 1 คอลัมน์บนมือถือ / 2 คอลัมน์บนจอใหญ่ */}

        <section className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* แทนกล่องฝั่งซ้ายด้วย */}
          <UserReportsList className="" />

          {/* กล่องห้องแชทของฉัน เหมือนเดิม */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-sm">
            <div className="font-medium mb-3 text-black">ห้องแชทของฉัน</div>
            {/* ... เนื้อหาเดิม ... */}
          </div>
        </section>
      </div>

      {/* Modal: รายงานปัญหา */}
      {/* <Modal open={openReport} onClose={() => setOpenReport(false)} title="รายงานปัญหา">
        <IssueReportForm
          categories={categories}
          endpoint="/api/v1/report"  
          onSubmitted={() => setOpenReport(false)}
        />
      </Modal> */}
      <Modal open={openReport} onClose={() => setOpenReport(false)} title="รายงานปัญหา">
        <IssueReportForm endpoint="/api/v1/report" onSubmitted={() => setOpenReport(false)} />
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

      {/* Modal: ห้องแชท AI BigBot */}
      <Modal open={openChatAI} onClose={() => setOpenChatAI(false)} title="ห้องแชท AI BigBot">
        <div className="h-[70vh]">
          <ChatComponent />
        </div>
      </Modal>
    </main>
  );
}
