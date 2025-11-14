"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import AdminUserRoleManager from "../components/AdminUserRoleManager";
import UploadSongForm from "../components/UploadSongForm";
import LogoutButton from "../components/LogoutButton";
function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}
function Modal({ open, onClose, title, children }) {
  const dialogRef = useRef(null);

  const esc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  useEffect(() => {
    if (!open) return;
    document.addEventListener("keydown", esc);
    return () => document.removeEventListener("keydown", esc);
  }, [open, esc]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-3"
      onClick={onClose}
    >
      <div
        ref={dialogRef}
        className="max-h-[85vh] w-full max-w-lg sm:max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3 sm:px-6">
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="rounded-full px-2 text-slate-500 hover:bg-slate-100"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="px-3 py-4 sm:px-6 overflow-auto max-h-[70vh]">
          {children}
        </div>
      </div>
    </div>
  );
}


function StatusBadge({ s }) {
  const map = {
    "ยังไม่กำหนดสถานะ": "bg-slate-200 text-slate-800",
    "ยังไม่ดำเนินการ": "bg-slate-200 text-slate-800",
    "กำลังดำเนินการ": "bg-amber-200 text-amber-900",
    "เสร็จสิ้น": "bg-emerald-200 text-emerald-900",
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs ${map[s] || "bg-slate-200 text-slate-800"}`}>
      {s}
    </span>
  );
}


function fmtThai(iso) {
  if (!iso) return "-";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("th-TH", { dateStyle: "short", timeStyle: "short" });
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, openIssues: 0, escalatedChats: 0 });
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [reports, setReports] = useState([]);
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [songModalOpen, setSongModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 8; // อยากให้ต่อหน้า 5 / 20 แก้ค่าได้

  // คำนวณ pagination
  const totalPages = Math.max(1, Math.ceil(issues.length / pageSize));
  const pagedIssues = issues.slice((page - 1) * pageSize, page * pageSize);
  const startIndex = issues.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, issues.length);

  // ถ้า issues เปลี่ยน (เช่น reload) ให้กลับไปหน้า 1
  useEffect(() => {
    setPage(1);
  }, [issues.length]);

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        // ---------- 1) โหลด report ----------
        const resReport = await fetch("http://localhost:3000/api/v1/report", {
          cache: "no-store",
        });
        if (!resReport.ok) throw new Error("โหลดรายงานไม่สำเร็จ");
        const dataReport = await resReport.json();
        const reportRows = Array.isArray(dataReport?.result) ? dataReport.result : [];

        // ---------- 2) โหลด status ----------
        const resStatus = await fetch("http://localhost:3000/api/v1/report/report-status", {
          cache: "no-store",
        });
        if (!resStatus.ok) throw new Error("โหลดสถานะไม่สำเร็จ");
        const dataStatus = await resStatus.json();
        const statusRows = Array.isArray(dataStatus?.result) ? dataStatus.result : [];

        const statusMap = {};
        statusRows.forEach((s) => {
          statusMap[s.report_id] = s.status_name;
        });

        const merged = reportRows.map((r) => ({
          id: r.report_id,
          anon: r.anon_id || r.student_code || r.reporter || "-",
          category: r.problem_type || "-",
          severity: r.problem_severe || "-",
          status: statusMap[r.report_id] || "ยังไม่กำหนดสถานะ",
          created_at: fmtThai(r.reported_at),
        }));

        // ---------- 3) นับนักศึกษาจาก /api/v1/users-admin ----------
        let studentCount = 0;

        try {
          const tokenCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("auth_token="));
          const token = tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : "";

          if (token) {
            const resUsers = await fetch(
              `/api/v1/users-admin?token=${encodeURIComponent(token)}`,
              { cache: "no-store" }
            );

            if (resUsers.ok) {
              const dataUsers = await resUsers.json();
              const userRows = Array.isArray(dataUsers?.result) ? dataUsers.result : [];
              // นับเฉพาะ role_id = 1 เป็นนักศึกษา
              studentCount = userRows.filter((u) => u.role_id === 1).length;
            } else {
              // จะ console.log ไว้เฉย ๆ ก็ได้ ไม่ต้อง throw ซ้ำ
              console.warn("โหลด users-admin ไม่สำเร็จ");
            }
          }
        } catch (err) {
          console.error("นับจำนวนนักศึกษาล้มเหลว:", err);
        }

        if (!alive) return;

        setIssues(merged);

        const openIssues = merged.filter((m) => m.status !== "เรียบร้อย").length;

        setStats((s) => ({
          ...s,
          openIssues,
          students: studentCount, // 👈 อัปเดตจำนวนนักศึกษา
        }));
      } catch (e) {
        if (!alive) return;
        setError(e?.message || "โหลดข้อมูลไม่สำเร็จ");
        setIssues([]);
        setStats((s) => ({ ...s, openIssues: 0 }));
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, []);



  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex items-center justify-between mt-2">
          <div>
            <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
            <p className="text-slate-500">ภาพรวมระบบและรายการปัญหาล่าสุด</p>
          </div>

          <LogoutButton className="bg-red-600 px-4 py-2 text-white rounded-lg hover:bg-red-700" />
        </div>
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="จำนวนนักศึกษาทั้งหมด" value={stats.students} />
          <StatCard title="ปัญหาที่ยังไม่ปิด" value={stats.openIssues} />
          <StatCard title="แชทที่ถูกขอความช่วยเหลือ" value={stats.escalatedChats} />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4 flex items-center justify-between">
            <div className="font-medium">ปัญหาที่รายงานล่าสุด</div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
            >
              รีเฟรช
            </button>
          </div>

          <div className="p-4">
            {error && (
              <div className="text-sm text-red-600 mb-3">{error}</div>
            )}

            {/* ✅ มือถือ: แสดงเป็น list แบบการ์ด */}
            <div className="space-y-3 sm:hidden">
              {loading ? (
                <div className="py-4 text-slate-500 text-sm">กำลังโหลด...</div>
              ) : issues.length === 0 ? (
                <div className="py-4 text-slate-500 text-sm">ยังไม่มีรายการ</div>
              ) : (
                pagedIssues.map((it) => (
                  <div
                    key={it.id}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs bg-slate-50/60"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="font-semibold text-slate-800">
                        #{it.id}
                      </div>
                      <StatusBadge s={it.status} />
                    </div>
                    <div className="text-slate-700">
                      <span className="font-medium">{it.category}</span>
                      {it.severity && (
                        <span className="ml-1 text-[11px] text-amber-700">
                          ({it.severity})
                        </span>
                      )}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-600">
                      ผู้รายงาน: {it.anon}
                    </div>
                    <div className="mt-1 text-[11px] text-slate-500">
                      เวลา: {it.created_at}
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* ✅ จอใหญ่ขึ้นไป: ใช้ table แบบเดิม */}
            <div className="overflow-x-auto hidden sm:block">
              <table className="min-w-full text-xs sm:text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">รหัส</th>
                    <th className="py-2 pr-4">ผู้รายงาน</th>
                    <th className="py-2 pr-4">หมวดหมู่</th>
                    <th className="py-2 pr-4">ความรุนแรง</th>
                    <th className="py-2 pr-4">สถานะ</th>
                    <th className="py-2 pr-4">เวลา</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td className="py-6 text-slate-500" colSpan={6}>
                        กำลังโหลด...
                      </td>
                    </tr>
                  ) : issues.length === 0 ? (
                    <tr>
                      <td className="py-6 text-slate-500" colSpan={6}>
                        ยังไม่มีรายการ
                      </td>
                    </tr>
                  ) : (
                    pagedIssues.map((it) => (
                      <tr key={it.id} className="border-t border-slate-100">
                        <td className="py-3 pr-4 font-medium">#{it.id}</td>
                        <td className="py-3 pr-4">{it.anon}</td>
                        <td className="py-3 pr-4">{it.category}</td>
                        <td className="py-3 pr-4">{it.severity}</td>
                        <td className="py-3 pr-4">
                          <StatusBadge s={it.status} />
                        </td>
                        <td className="py-3 pr-4">{it.created_at}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {/* แถบเปลี่ยนหน้า */}
            {!loading && issues.length > 0 && (
              <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs sm:text-sm">
                <div className="text-slate-500">
                  แสดง {startIndex}–{endIndex} จาก {issues.length} รายการ
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-40 hover:bg-slate-50"
                  >
                    ก่อนหน้า
                  </button>
                  <span className="text-slate-600">
                    หน้า {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-3 py-1 rounded border text-xs sm:text-sm disabled:opacity-40 hover:bg-slate-50"
                  >
                    ถัดไป
                  </button>
                </div>
              </div>
            )}

          </div>

        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            type="button"
            onClick={() => setUserModalOpen(true)}
            className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition cursor-pointer"
          >
            <div className="font-medium">จัดการผู้ใช้/บทบาท</div>
            <div className="text-sm text-slate-500">เพิ่ม/แก้ไขสิทธิ์ผู้ใช้</div>
          </button>

          {/* <a
            href="/song"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition"
          >
            <div className="font-medium">เพิ่มเสียงผ่อนคลาย</div>
            <div className="text-sm text-slate-500">ตั้งค่าระบบพื้นฐาน</div>
          </a> */}

          <button
            type="button"
            onClick={() => setSongModalOpen(true)}   // 👈 เปิด modal เพลง
            className="text-left rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition cursor-pointer"
          >
            <div className="font-medium">เพิ่มเสียงผ่อนคลาย</div>
            <div className="text-sm text-slate-500">ตั้งค่าระบบพื้นฐาน</div>
          </button>

          <a
            href="/dev/issues"
            className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition"
          >
            <div className="font-medium">ปัญหาทั้งหมด (มุมมอง Dev)</div>
            <div className="text-sm text-slate-500">ตรวจสอบคิวงาน</div>
          </a>
        </div>

      </div>
      {/* Modal จัดการผู้ใช้/บทบาท */}
      <Modal
        open={userModalOpen}
        onClose={() => setUserModalOpen(false)}
        title="จัดการผู้ใช้/บทบาท"
      >
        <AdminUserRoleManager />
      </Modal>
      {/* Modal เพิ่มเสียงผ่อนคลาย */}
      <Modal
        open={songModalOpen}
        onClose={() => setSongModalOpen(false)}
        title="เพิ่มเสียงผ่อนคลาย"
      >
        <UploadSongForm
          onSuccess={() => {
            // ปิด modal หลังอัปโหลดสำเร็จ หรือจะแจ้งเตือนเพิ่มก็ได้
            setSongModalOpen(false);
          }}
        />
      </Modal>
    </main>
  );
}
