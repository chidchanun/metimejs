/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import LogoutButton from "../components/LogoutButton";
import AlertCard from "../components/AlertCard";

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

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reports, setReports] = useState([]);

  // Alert state
  const [alertTitle, setAlertTitle] = useState("");
  const [alertDetail, setAlertDetail] = useState("");
  const [alertShow, setAlertShow] = useState(false);

  // Status-related state
  const [statuses, setStatuses] = useState([]);                 // all statuses
  const [statusByReportId, setStatusByReportId] = useState({}); // map: report_id -> status_id
  const [savingStatus, setSavingStatus] = useState({});         // map: report_id -> boolean

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

  // =========================
  // Data loading (single effect, mobile-friendly, no duplicate calls)
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
    return () => { alive = false; };
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
        // credentials: "include",
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
  // Counters (unchanged)
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

  // =========================
  // Responsive item (mobile card)
  // =========================
  function ReportCard({ r }) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="font-semibold">#{r.report_id}</div>
          <div className="text-xs text-slate-500">{fmtTime(r.reported_at)}</div>
        </div>

        <div className="text-sm text-slate-700 whitespace-pre-wrap break-words">
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
            <div className="font-medium break-words">{r.problem_where || '-'}</div>
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
          <div className="self-start">
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
            <div className="border-b border-slate-200 p-4 font-medium">แชทที่ขอความช่วยเหลือ</div>
            <ul className="divide-y divide-slate-100">
              <li className="p-4 text-slate-500">(ยังไม่มี API แชท—จะแสดงเมื่อเชื่อมต่อ endpoint แชท)</li>
            </ul>
          </div>

          {/* Issues */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium flex items-center justify-between">
              <span>ปัญหาที่รายงาน </span>
              {/* small counter on mobile */}
              <span className="text-xs text-slate-500 sm:hidden">ทั้งหมด {reports.length} รายการ</span>
            </div>

            <div className="p-4">
              {error ? (
                <div className="text-red-600 text-sm">เกิดข้อผิดพลาด: {error}</div>
              ) : null}
              {/* Mobile: cards (<= sm) */}
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
              {/* Desktop / Tablet: table */}
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
                          <td className="py-3 pr-2 sm:pr-4 break-words">
                            <div className="line-clamp-2">{r.description}</div>
                          </td>
                          <td className="py-3 pr-2 sm:pr-4">{r.problem_type}</td>
                          <td className="py-3 pr-2 sm:pr-4">{r.problem_severe}</td>
                          <td className="py-3 pr-2 sm:pr-4 break-words">{r.problem_where}</td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">{fmtTime(r.reported_at)}</td>
                          <td className="py-3 pr-2 sm:pr-4 whitespace-nowrap">
                            {/* <select
                              className="rounded-md border border-slate-300 bg-white p-1.5 text-sm"
                              value={statusByReportId[r.report_id] ?? ""}
                              onChange={(e) => handleChangeStatus(r.report_id, e.target.value)}
                              disabled={!!savingStatus[r.report_id]}
                            >
                              <option value="" disabled>เลือกสถานะ</option>
                              {statuses.map((s) => (
                                <option key={s.status_id} value={s.status_id}>{s.status_name}</option>
                              ))}
                            </select> */}
                            <select
                              value={statusByReportId[r.report_id] ?? ""}
                              onChange={(e) => handleChangeStatus(r.report_id, e.target.value)}
                              className={`
                                rounded-md border border-slate-300 p-1.5 text-sm font-medium
                                transition-colors duration-200
                                ${
                                  statusByReportId[r.report_id] === "2"
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
                            ) : (
                              "-"
                            )}
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
