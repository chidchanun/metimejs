/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import LogoutButton from "../components/LogoutButton";
import AlertCard from "../components/AlertCard";
import { FaBell } from "react-icons/fa";
import ChatComponent from "../components/ChatComponent";
import { FaArchive } from "react-icons/fa";
import { IoMailUnread } from "react-icons/io5";


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
function ModalChat({ open, onClose, title, children, roomId }) {
  const isOpen = !!open;
  const dialogRef = useRef(null);
  const lastFocusedEl = useRef(null);
  console.log("Parent roomId:", roomId)
  const esc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  const onCloseChat = async () => {
    const updateRoom = await fetch("api/v1/room", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room_id: roomId })
    });

    if (!updateRoom.ok) {
      return;
    }

    onClose(); // <-- ต้องเรียก
  }

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
              onClick={onCloseChat}
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

function Tile({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

function fmtTime(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString();
}

export default function TeacherDashboard() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:3000";
  const [openChatTeacher, setOpenChatTeacher] = useState(false);
  const [selectedNotice, setSelectedNotice] = useState(null);
  // ▼ เพิ่มสองบรรทัดนี้
  const [openMoreModal, setOpenMoreModal] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);
  const SHORT_DESC_LIMIT = 25; // ปรับเลขได้ เช่น 20, 25, 30 ตัวอักษร
  // ▲ เพิ่มสองบรรทัดนี้
  const [roomId, setRoomId] = useState()
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);
  const [filter, setFilter] = useState("unread");
  const [message, setMessage] = useState([])
  // Alert state
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDetail, setAlertDetail] = useState("");
  const [alertShow, setAlertShow] = useState(false);

  // Notice state
  const [notices, setNotices] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Status-related state
  const [statuses, setStatuses] = useState([]);
  const [statusByReportId, setStatusByReportId] = useState({});
  const [savingStatus, setSavingStatus] = useState({});

  const ws = useRef(null);

  // =========================
  // Helpers
  // =========================
  const getTokenFromCookie = () => {
    try {
      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="));
      if (!tokenCookie) return "";
      return decodeURIComponent(tokenCookie.split("=")[1] || "");
    } catch {
      return "";
    }
  };

  async function UserCheckRole(tokenValue) {
    if (!tokenValue) {
      setAlertShow(true);
      setAlertTitle("ไม่พบผู้ใช้งาน");
      setAlertDetail("โปรดเข้าสู่ระบบใหม่อีกครั้ง");
      return;
    }

    try {
      const resUser = await fetch(`${API_BASE}/api/v1/user/id`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenValue }),
      });
      if (!resUser.ok) throw new Error("ไม่สามารถตรวจสอบสิทธิ์ได้");
      const UserLocalDB = await resUser.json();
      if (UserLocalDB?.UserLocalDB?.role_id === 1) {
        setAlertShow(true);
        setAlertTitle("ไม่มีสิทธิ์ในการเข้าถึงหน้านี้");
        setAlertDetail("กดปุ่มเพื่อกลับไปหน้าหลัก");
      }
    } catch (e) {
      setAlertShow(true);
      setAlertTitle("เกิดข้อผิดพลาดในการตรวจสอบผู้ใช้");
      setAlertDetail(e?.message || "โปรดลองใหม่");
    }
  }

  useEffect(() => {
    let alive = true;

    async function loadNotices() {
      try {
        const res = await fetch(`${API_BASE}/api/v1/notice`, { cache: "no-store" });
        if (!res.ok) throw new Error("โหลด notice ล้มเหลว");
        const data = await res.json();
        if (alive && data?.result) {
          setNotices(data.result);
          // นับจำนวน notice ที่ยัง unread
          setUnreadCount(data.result.filter(n => n.status === 'unread').length);
        }
      } catch (e) {
        console.error(e);
      }
    }

    loadNotices();

    return () => { alive = false; };
  }, [API_BASE]);

  // =========================
  // Data loading
  // =========================
  useEffect(() => {
    let alive = true;
    const tokenValue = getTokenFromCookie();

    async function loadAll() {
      try {
        setLoading(true);
        setError(null);

        // 1) รายการรีพอร์ต
        const resReports = await fetch(`${API_BASE}/api/v1/report`, { cache: "no-store" });
        if (!resReports.ok) throw new Error(`HTTP ${resReports.status}`);
        const dataReports = await resReports.json();
        const list = Array.isArray(dataReports?.result) ? dataReports.result : [];

        // 2) รายการสถานะทั้งหมด (สำหรับ select)
        const resStatuses = await fetch(`${API_BASE}/api/v1/report/status`, { cache: "no-store" });
        if (!resStatuses.ok) throw new Error(`HTTP ${resStatuses.status}`);
        const dataStatuses = await resStatuses.json();
        const allStatuses = Array.isArray(dataStatuses?.result) ? dataStatuses.result : [];

        // 3) สถานะของแต่ละรีพอร์ต (map report_id -> status_id)
        const resRS = await fetch(`${API_BASE}/api/v1/report/report-status`, { cache: "no-store" });
        if (!resRS.ok) throw new Error(`HTTP ${resRS.status}`);
        const dataRS = await resRS.json();
        const arrRS = Array.isArray(dataRS?.result) ? dataRS.result : [];
        const mapRS = {};
        for (const it of arrRS) {
          if (it?.report_id != null && it?.status_id != null) {
            mapRS[it.report_id] = it.status_id;
          }
        }

        if (alive) {
          setReports(list);
          setStatuses(allStatuses);
          setStatusByReportId(mapRS);
        }
      } catch (e) {
        if (alive) setError(e?.message ?? "โหลดข้อมูลล้มเหลว");
      } finally {
        if (alive) setLoading(false);
      }
    }

    loadAll();
    UserCheckRole(tokenValue);

    // =========================
    // WebSocket connect
    // =========================
    ws.current = new WebSocket("ws://localhost:8082");
    ws.current.onopen = () => {
      console.log("Connected WS for notices");
      // ส่ง init role=2
      ws.current.send(JSON.stringify({ type: "init", role: 2 }));
    };
    ws.current.onmessage = (evt) => {
      const data = JSON.parse(evt.data);
      if (data.type === "notice") {
        setNotices((prev) => [...prev, data]);
        setUnreadCount((c) => c + 1);
      }
    };
    ws.current.onclose = () => console.log("WS disconnected");
    return () => {
      alive = false;
      ws.current?.close();
    };
  }, [API_BASE]);

  async function handleChangeStatus(reportId, newStatusId) {
    const rId = Number(reportId);
    const sId = Number(newStatusId);

    if (!Number.isFinite(rId) || !Number.isFinite(sId)) {
      alert("report_id/status_id ไม่ถูกต้อง");
      return;
    }

    setSavingStatus((s) => ({ ...s, [rId]: true }));
    try {
      const res = await fetch(`${API_BASE}/api/v1/report/status`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ report_id: rId, status_id: sId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);

      setStatusByReportId((m) => ({ ...m, [rId]: sId }));
    } catch (e) {
      alert(e?.message ?? "บันทึกสถานะไม่สำเร็จ");
    } finally {
      setSavingStatus((s) => ({ ...s, [rId]: false }));
    }
  }

  // =========================
  // Counters
  // =========================
  const counters = useMemo(() => {
    const total = reports.length;
    const today = new Date();
    const isSameDay = (a, b) =>
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate();
    const todayCount = reports.filter((r) =>
      isSameDay(new Date(r.reported_at), today)
    ).length;
    return { queue: total, inProgress: 0, closedToday: todayCount };
  }, [reports]);

  const filteredNotices = notices.filter(n => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "read") return n.status === "read";
    return true; // all
  });

  function ReportCard({ r }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">#{r.report_id}</div>
          <div className="text-xs text-slate-500">{fmtTime(r.reported_at)}</div>
        </div>

        <div className="text-sm text-slate-700 whitespace-pre-wrap wrap-anywhere">
          {r.description}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-slate-500">หมวดหมู่</div>
            <div className="font-medium">{r.problem_type || '-'}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2">
            <div className="text-slate-500">ความรุนแรง</div>
            <div className="font-medium">{r.problem_severe || '-'}</div>
          </div>
          <div className="rounded-lg bg-slate-50 p-2 col-span-2">
            <div className="text-slate-500">สถานที่</div>
            <div className="font-medium wrap-anywhere">{r.problem_where || '-'}</div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white p-2 text-sm"
            value={statusByReportId[r.report_id] ?? ""}
            onChange={(e) => handleChangeStatus(r.report_id, e.target.value)}
            disabled={!!savingStatus[r.report_id]}
          >
            <option value="" disabled>เลือกสถานะ</option>
            {statuses.map((s) => (
              <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
            ))}
          </select>

          {r.image_url ? (
            <a
              href={r.image_url.startsWith("http") ? r.image_url : `${API_BASE}${r.image_url}`}
              className="shrink-0 underline text-sm"
              target="_blank"
              rel="noreferrer"
            >
              เปิดรูป
            </a>
          ) : (
            <span className="text-sm text-slate-400">-</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      {alertShow && (
        <AlertCard AlertTitle={alertTitle} AlertDetail={alertDetail} />
      )}

      <div className="mx-auto max-w-6xl p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold">แดชบอร์ดฝ่ายพัฒนา</h1>
            <p className="text-slate-500">คิวขอความช่วยเหลือและปัญหาที่ต้องติดตาม</p>
          </div>
          <div className="self-start flex flex-row items-center gap-4">
            {/* Notice bell */}
            <div className="relative cursor-pointer" onClick={() => setUnreadCount(0)}>
              <FaBell className="w-8 h-8" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </div>
            <LogoutButton className="bg-red-600 shrink-0" />
          </div>
        </div>

        {/* Tiles */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Tile title="คิวแชทที่รอรับ" value={counters.queue} />
          <Tile title="กำลังดำเนินการ" value={counters.inProgress} />
          <Tile title="แจ้งวันนี้" value={counters.closedToday} />
        </div>

        {/* Content */}
        <div className="mt-8 grid grid-cols-1 gap-6">
          {/* Helpdesk placeholder */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium flex flex-row items-center justify-between">
              แชทที่ขอความช่วยเหลือ
              <div className="flex flex-row gap-4">
                <IoMailUnread className="w-5 h-5 cursor-pointer hover:text-gray-400 transition-transform" onClick={() => setFilter("unread")} />
                <FaArchive className="w-5 h-5 cursor-pointer hover:text-gray-400 transition-transform" onClick={() => setFilter("read")} />
              </div>
            </div>

            <ul className="divide-y divide-slate-100">
              <li className="p-4 text-slate-500">
                {filteredNotices.map((n, idx) => (
                  <div
                    key={idx}
                    onClick={async () => {
                      setSelectedNotice(n);

                      try {
                        const tokenCookie = document.cookie
                          .split("; ")
                          .find(row => row.startsWith("auth_token="));
                        const token = tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
                        if (!token) throw new Error("โปรดเข้าสู่ระบบใหม่");



                        if (n.status === "read") {
                          const resHistory = await fetch("/api/v1/history/id",
                            {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify(
                                { room_id: n.room_id }
                              )

                            }
                          )
                          if (!resHistory.ok) {
                            return;
                          }
                          setRoomId(n.room_id)

                          const ChatHistory = await resHistory.json()

                          setMessage(ChatHistory)
                          setOpenChatTeacher(true);

                          return;
                        }

                        const res = await fetch("/api/v1/room", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token, student_id: n.user_id })
                        });

                        const data = await res.json();
                        if (!res.ok) throw new Error(data.message || "สร้างห้องไม่สำเร็จ");

                        setRoomId(data.room_id);
                        setOpenChatTeacher(true);

                        const updateNotice = await fetch("/api/v1/notice", {
                          method: "PATCH",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ token: token, notice_id: n })
                        });

                        if (!updateNotice.ok) {
                          return;
                        }
                      } catch (err) {
                        alert(err.message);
                      }
                    }}
                    className="p-2 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition"
                  >
                    {n.message}
                  </div>
                ))}
              </li>
            </ul>
          </div>

          {/* =============================
          Modal ห้องแชท ฝ่ายพัฒนา
      ============================== */}
          <ModalChat
            open={openChatTeacher}
            onClose={() => setOpenChatTeacher(false)}
            roomId={roomId}
            title="ห้องแชท ฝ่ายพัฒนา"
          >
            <div className="h-[70vh]">
              {/* ส่ง role_id = 2 เพื่อเป็นอาจารย์ */}
              <ChatComponent
                role_id={2}
                student_id={selectedNotice?.student_id}
                notice={selectedNotice}
                roomId={roomId}
                message={message}
              />
            </div>
          </Modal>
          <Modal
            open={openMoreModal}
            onClose={() => setOpenMoreModal(false)}
            title="รายละเอียดปัญหา"
          >
            {selectedReport ? (
              <div className="text-sm space-y-2 max-h-[70vh] overflow-y-auto">
                <div className="text-slate-500">รายละเอียด</div>
                <p className="whitespace-pre-wrap">
                  {selectedReport.description || "-"}
                </p>
              </div>
            ) : (
              <div className="text-sm text-slate-500">ไม่พบข้อมูลปัญหา</div>
            )}
          </Modal>



          {/* Issues */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium flex items-center justify-between">
              <span>ปัญหาที่รายงาน </span>
              <span className="text-xs text-slate-500 sm:hidden">ทั้งหมด {reports.length} รายการ</span>
            </div>

            <div className="p-4">
              {error && <div className="text-red-600 text-sm">เกิดข้อผิดพลาด: {error}</div>}
              <div className="sm:hidden w-full max-w-full overflow-x-hidden">
                <div className="grid grid-cols-1 gap-4 px-3">
                  {loading ? (
                    <div className="text-slate-500 text-sm">กำลังโหลด...</div>
                  ) : reports.length === 0 ? (
                    <div className="text-slate-500 text-sm">ไม่มีรายการ</div>
                  ) : (
                    reports.map((r) => <ReportCard key={r.report_id} r={r} />)
                  )}
                </div>
              </div>

              <div className="hidden sm:block overflow-x-auto -mx-2 sm:mx-0">
                <table className="min-w-full table-auto text-sm">
                  <colgroup>
                    <col className="w-14" />
                    <col />
                    <col className="w-40" />
                    <col className="w-28" />
                    <col className="w-48" />
                    <col className="w-48" />
                    <col className="w-44" />
                    <col className="w-20" />
                  </colgroup>

                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-2 sm:px-0">รหัส</th>
                      <th className="py-2 px-2 sm:px-0">รายละเอียด</th>
                      <th className="py-2 px-2 sm:px-0">หมวดหมู่</th>
                      <th className="py-2 px-2 sm:px-0">ความรุนแรง</th>
                      <th className="py-2 px-2 sm:px-0">สถานที่</th>
                      <th className="py-2 px-2 sm:px-0">เวลาแจ้ง</th>
                      <th className="py-2 px-2 sm:px-0">สถานะ</th>
                      <th className="py-2 px-2 sm:px-0">ไฟล์</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-slate-500">กำลังโหลด...</td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-6 text-slate-500">ไม่มีรายการ</td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.report_id} className="border-t border-slate-100 align-top">
                          <td className="py-3 pr-2 sm:pr-4 font-medium whitespace-nowrap">#{r.report_id}</td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">
                            <span
                              className="inline-block      max-w-[180px]    /* ความกว้างคอลัมน์ ปรับได้ เช่น 160, 200 */ truncate cursor-pointer hover:underline"
                              title={r.description || "-"}
                              onClick={() => {
                                setSelectedReport(r);      // เก็บแถวที่เลือก
                                setOpenMoreModal(true);    // เปิดป๊อปอัป
                              }}
                            >
                              {r.description && r.description.length > SHORT_DESC_LIMIT
                                ? `${r.description.slice(0, SHORT_DESC_LIMIT)}...`
                                : (r.description || "-")}
                            </span>
                          </td>

                          <td className="py-3 pr-2 sm:pr-4">{r.problem_type}</td>
                          <td className="py-3 pr-2 sm:pr-4">{r.problem_severe}</td>
                          <td className="py-3 pr-2 sm:pr-4 wrap-anywhere">{r.problem_where}</td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">{fmtTime(r.reported_at)}</td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">
                            <select
                              value={statusByReportId[r.report_id] ?? ""}
                              onChange={(e) => handleChangeStatus(r.report_id, e.target.value)}
                              className={`
                                rounded-md border border-slate-300 p-1.5 text-sm font-medium
                                transition-colors duration-200
                                ${statusByReportId[r.report_id] === "2"
                                  ? "bg-yellow-100 text-yellow-800 border-yellow-300"
                                  : statusByReportId[r.report_id] === "3"
                                    ? "bg-green-100 text-green-800 border-green-300"
                                    : "bg-white text-slate-700"
                                }
                              `}
                            >
                              <option value="" disabled>เลือกสถานะ</option>
                              {statuses.map((s) => (
                                <option key={s.status_id} value={s.status_id}>
                                  {s.status_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">
                            {r.image_url ? (
                              <a
                                href={r.image_url.startsWith("http") ? r.image_url : `${API_BASE}${r.image_url}`}
                                className="underline"
                                target="_blank"
                                rel="noreferrer"
                              >
                                เปิดรูป
                              </a>
                            ) : "-"}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6">
          <a href="/dev/issues" className="text-sm text-slate-700 underline">ไปหน้า “รายการปัญหาทั้งหมด” →</a>
        </div>
      </div>
    </main>
  );
}
