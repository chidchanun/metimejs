/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import RelaxPlayer from "../components/RelaxPlayer";
import IssueReportForm from "../components/IssueReportForm";
import MoodPickerCard from "../components/MoodPickerCard";
import LogoutButton from "../components/LogoutButton";
import ChatComponent from "../components/ChatComponent";
import BottomMenu from "../components/BottomMenu";
import Image from "next/image";

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

// ✅ ปรับ QuickButton รองรับ disabled + สไตล์กดไม่ได้
function QuickButton({
  onClick,
  href,
  children,
  className = "",
  disabled = false,
}) {
  const base =
    "rounded-2xl text-white px-4 py-3 text-sm md:text-base hover:opacity-90 shadow-sm transition active:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-300";
  const disabledCls = disabled
    ? "opacity-50 pointer-events-none cursor-not-allowed"
    : "";

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
    <div
      className="fixed inset-0 z-60 "
      role="dialog"
      aria-modal="true"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4 ">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-xl sm:max-w-2xl rounded-2xl shadow-2xl border border-slate-200 outline-none bg-[#F5F7FA]"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200">
            <h3 className="font-semibold text-base sm:text-lg text-black">
              {title}
            </h3>
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

// helper แปลง mood → emoji + สีพื้นหลัง
const moodEmoji = (m) =>
({
  very_good: "😁",
  good: "😊",
  neutral: "😐",
  bad: "😣",
  very_bad: "😭",
}[m] || "😐");

const moodBg = (m) =>
({
  very_good: "bg-emerald-400",
  good: "bg-emerald-300",
  neutral: "bg-slate-300",
  bad: "bg-amber-400",
  very_bad: "bg-rose-500",
}[m] || "bg-slate-300");

const EMOJI_IMAGES = {
  1: "/img/emojidedee.png",
  2: "/img/emojiok.png",
  3: "/img/emojiverysad.png",
  4: "/img/emojiverysad.png",
};


export default function StudentHome() {
  const [loading, setLoading] = useState(true);
  const [moods, setMoods] = useState([]);
  const [myIssues, setMyIssues] = useState([]);
  const [openReport, setOpenReport] = useState(false);
  const [hasMoodToday, setHasMoodToday] = useState(false);
  const [openMood, setOpenMood] = useState(false);
  const [range] = useState(7);
  const [openChatAI, setOpenChatAI] = useState(false);
  const [openChatDev] = useState(false); // ยังไม่ได้ใช้
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [reports, setReports] = useState([]);
  const [visibleCount, setVisibleCount] = useState(10);
  const [visibleCountMobile, setVisibleCountMobile] = useState(5);


  const isMobile = useMediaQuery("(max-width: 640px)");


  // ตรวจว่าวันนี้เคยบันทึกหรือยัง (ฝั่ง client)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const today = new Date().toDateString();
    const done = localStorage.getItem("mood_today") === today;
    setHasMoodToday(done);
  }, []);

  // โหลดอารมณ์ย้อนหลัง
  useEffect(() => {
    async function loadMood() {
      try {
        const res = await fetch(`/api/v1/user-emotion?days=${range}`, {
          cache: "no-store",
        });
        const { data } = await res.json();
        console.log("user-emotion data =", data);
        setMoods(
          data
            .reverse()
            .slice(0, 6)
            .map((row) => ({
              d: new Date(row.created_at).toLocaleDateString("th-TH", {
                weekday: "long",

              }).replace("วัน", ""),

              mood: row.emotion_id,
            }))
        );

        const todayStr = new Date().toDateString();
        const hasToday = data.some(
          (r) => new Date(r.created_at).toDateString() === todayStr
        );
        setHasMoodToday(hasToday);
      } catch (e) {
        console.error("โหลด mood ล้มเหลว:", e);
      } finally {
        setLoading(false);
      }
    }

    loadMood();
  }, [range]);

  const categories = [
    { id: 1, name: "ความเครียดจากการเรียน" },
    { id: 2, name: "ความกดดันส่วนตัว" },
    { id: 3, name: "ปัญหาความสัมพันธ์" },
    { id: 4, name: "ปัญหาครอบครัว" },
    { id: 5, name: "สุขภาพจิต" },
    { id: 99, name: "อื่นๆ" },
  ];

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
            status: r.status ?? "ดำเนินการ",
          }))
        );
      } catch (err) {
        console.error("โหลดปัญหาล้มเหลว:", err);
        setMyIssues([]);
      }
    }

    loadIssues();
  }, [router]);

  useEffect(() => {
    async function loadUser() {
      try {
        const tokenCookie = document.cookie
          .split("; ")
          .find((row) => row.startsWith("auth_token="));

        if (!tokenCookie) return;

        const token = decodeURIComponent(tokenCookie.split("=")[1]);

        const res = await fetch("/api/v1/user/id", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });

        const data = await res.json();
        if (data.UserLocalDB) setUser(data.UserLocalDB);
      } catch (err) {
        console.error("โหลดข้อมูลผู้ใช้ล้มเหลว", err);
      }
    }

    loadUser();
  }, []);

  useEffect(() => {
    async function loadReports() {
      const res = await fetch("/api/v1/report-status");
      const { result } = await res.json();
      setReports(result);
    }

    loadReports();
  }, []);

  const today = new Date();
  const todayStr = today.toLocaleDateString("th-TH", {
    day: "2-digit",
    month: "2-digit",
    year: "2-digit",
  });

  const showCount = isMobile ? visibleCountMobile : visibleCount;

  function moodImage(moodId) {
    const src = EMOJI_IMAGES[moodId];


    if (!src) {
      return <span className="text-3xl">😐</span>;
    }

    return (
      <Image
        src={src}
        alt={String(moodId)}
        width={96}
        height={96}
        className="object-contain"
        priority
      />
    );
  }
  return (
    <main className="min-h-screen bg-[#F5F7FA] flex flex-col">
      {/* Header — วางนอก container เพื่อให้เต็มจอ */}
      <header className="w-full bg-[#C0E8E0] px-6 py-6">
        <div className="max-w-6xl mx-auto flex items-start justify-between gap-4">
          <div>
            <p className="text-2xl sm:text-3xl font-semibold text-[#34495E]">
              สวัสดี
            </p>
            <p className="text-[#34495E] text-sm sm:text-base">
              วันนี้เป็นยังไงบ้าง {user ? `${user.fname} ${user.lname}` : ""}
            </p>
          </div>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto w-full max-w-6xl flex-1 flex flex-col px-4 sm:px-6 lg:px-8 pb-28  ">

        {/* กล่องหลักสีขาวตามดีไซน์ */}
        <div className="mt-6 flex-1">
          <div className="  px-4 sm:px-8 py-6 sm:py-8">
            <div className="grid grid-cols-1 lg:grid-cols-[0.35fr_0.65fr] gap-8">
              {/* ซ้าย: วันนี้ + อีโมจิอารมณ์ */}
              <div>
                {/* บรรทัด วันนี้ + วันที่ + วงกลม + */}
                <div className="flex items-center gap-6">
                  <button
                    onClick={() => setOpenMood(true)}
                    className={cx(
                      "flex items-center justify-center rounded-full border-4 border-[#cdeee4] bg-[#e2f7f0] text-4xl sm:text-5xl h-28 w-28 sm:h-32 sm:w-32 shadow-md",
                      hasMoodToday && "opacity-60 cursor-default"
                    )}
                    disabled={hasMoodToday}
                  >
                    +
                  </button>
                  <div>
                    <div className="text-xl sm:text-2xl font-semibold text-slate-900">
                      วันนี้
                    </div>
                    <div className="text-lg sm:text-xl text-slate-600">
                      {todayStr}
                    </div>
                  </div>
                </div>

                <div className="mt-8 grid grid-cols-3 gap-6 max-w-xs">
                  {(loading ? Array.from({ length: 6 }) : moods).map((m, idx) => (
                    <div key={idx} className="flex flex-col items-center text-center">
                      <div className="h-20 w-20 sm:h-18 sm:w-18 rounded-full flex items-center justify-center  ">
                        {m ? moodImage(m.mood) : "…"}
                      </div>
                      <div className="mt-2 text-xs sm:text-sm text-slate-600">
                        {m ? m.d : "-"}
                      </div>
                    </div>
                  ))}
                </div>


              </div>

              {/* ขวา: รายการปัญหาที่รายงาน */}
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between mb-3 sm:mb-4">
                  <h2 className="font-semibold text-slate-900 text-base sm:text-lg">
                    ปัญหาที่ฉันรายงาน
                  </h2>
                  {/* <QuickButton
                    onClick={() => setOpenReport(true)}
                    className="bg-[#f2a33b] text-xs sm:text-sm"
                  >
                    + รายงานปัญหา
                  </QuickButton> */}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-h-320px overflow-y-auto pr-1 pb-2">
                  {myIssues.length === 0 && (
                    <div className="text-sm text-slate-500 col-span-2">
                      ยังไม่มีการรายงานปัญหา
                    </div>
                  )}

                  {myIssues.slice(0, showCount).map((issue) => (
                    <div
                      key={issue.id}
                      className="flex items-center justify-between w-full rounded-2xl bg-white px-5 py-4 shadow-sm"
                    >
                      <div className="mr-3 min-w-0">
                        <div className="text-sm sm:text-base text-[#34495E] truncate">
                          <span className="font-semibold">#{issue.id}</span> – {issue.category}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={cx(
                            "rounded-full px-3 py-1 text-[11px] sm:text-xs font-medium",
                            issue.status === "เสร็จสิ้น"
                              ? "bg-emerald-500 text-white"
                              : issue.status === "รอ"
                                ? "bg-amber-400 text-white"
                                : "bg-slate-300 text-slate-800"
                          )}
                        >
                          {issue.status}
                        </span>
                        <span className="text-slate-400 text-lg">›</span>
                      </div>
                    </div>
                  ))}
                </div>
                {/* LOAD MORE BUTTON */}
                {showCount < myIssues.length && (
                  <button
                    onClick={() => {
                      if (isMobile) {
                        setVisibleCountMobile((prev) => prev + 5);   // มือถือ เพิ่มทีละ 5
                      } else {
                        setVisibleCount((prev) => prev + 10);        // จอใหญ่ เพิ่มทีละ 10 (เหมือนเดิม)
                      }
                    }}
                    className="mt-3 px-4 py-1 bg-slate-200 text-slate-700 text-sm rounded-md hover:bg-slate-300 transition self-center"
                  >
                    โหลดเพิ่ม
                  </button>
                )}
                {/* ปุ่มห้องแชท */}
                {/* <div className="mt-5 flex flex-wrap gap-3">
                  <QuickButton
                    onClick={() => setOpenChatAI(true)}
                    className="bg-slate-900"
                  >
                    ห้องแชท AI BigBot
                  </QuickButton>
                  <QuickButton href="/chat" className="bg-slate-900">
                    ห้องแชท ฝ่ายพัฒนา
                  </QuickButton>
                </div> */}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* แถบเมนูด้านล่าง + ปุ่ม + ใหญ่ */}
      <BottomMenu setOpenReport={setOpenReport} />
      
      {/* Modal: รายงานปัญหา */}
      <Modal open={openReport} onClose={() => setOpenReport(false)} title="รายงานปัญหา" >
        <IssueReportForm
          endpoint="/api/v1/report"
          categories={categories}
          onSubmitted={() => setOpenReport(false)}
        />
      </Modal>

      {/* Modal: บันทึกความรู้สึก */}
      <Modal open={openMood} onClose={() => setOpenMood(false)} title="วันนี้รู้สึกอย่างไร">
        <MoodPickerCard
          onSubmit={async (mood) => {
            if (typeof window !== "undefined") {
              localStorage.setItem("mood_today", new Date().toDateString());
            }
            setHasMoodToday(true);
            setOpenMood(false);
          }}
        />
      </Modal>

      {/* Modal: ห้องแชท AI BigBot */}
      <Modal
        open={openChatAI}
        onClose={() => setOpenChatAI(false)}
        title={
          <div className="flex items-center gap-2">
            <Image
              src="/img/images.jpg"
              alt="BigBot Avatar"
              width={40}
              height={40}
              className="rounded-full"
              priority
              fill
            />
            <span>ห้องแชท AI BigBot</span>
          </div>
        }
      >
        <div className="h-[70vh]">
          <ChatComponent role_id={1} />
        </div>
      </Modal>
    </main>
  );
}
