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
  // Set ค่า AlertCard
  const [alertTitle, setAlertTitle] = useState("")
  const [alertDetail, setAlertDetail] = useState("")
  const [alertShow, setAlertShow] = useState(false)

  // ดึง token จาก cookie



  async function UserCheckRole(tokenValue) {
    if (!tokenValue) {
      setAlertShow(true)
      setAlertTitle("ไม่พบผู้ใช้งาน")
      setAlertDetail("โปรดเข้าสู่ระบบใหม่อีกครั้ง")
      return;
    }

    const resUser = await fetch(`${API_BASE}/api/v1/user/id`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: tokenValue
      })
    })

    const UserLocalDB = await resUser.json()

    if (UserLocalDB.UserLocalDB.role_id == 1) {
      setAlertShow(true)
      setAlertTitle("ไม่มีสิทธิ์ในการเข้าถึงหน้านี้")
      setAlertDetail("กดปุ่มเพื่อกลับไปหน้าหลัก")
    }
  }



  useEffect(() => {

    const tokenCookie = document.cookie.split("; ").find((row) => row.startsWith("auth_token="));
    const tokenValue = decodeURIComponent(tokenCookie.split("=")[1]);


    let alive = true;
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/v1/report`, {
          cache: "no-store",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list = Array.isArray(data?.result) ? data.result : [];
        if (alive) setReports(list);
      } catch (e) {
        if (alive) setError(e?.message ?? "โหลดข้อมูลล้มเหลว");
      } finally {
        if (alive) setLoading(false);
      }
    }
    load();
    UserCheckRole(tokenValue)
    return () => { alive = false; };
  }, [API_BASE]);

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

  return (
    <main className="min-h-screen bg-slate-50">
      {
        alertShow && (
          <AlertCard AlertTitle={alertTitle} AlertDetail={alertDetail} />
        )
      }
      <div className="mx-auto max-w-6xl p-6">
        <div className="flex justify-between items-start gap-4">

          {/* ซ้าย: h1 + p */}
          <div>
            <h1 className="text-2xl font-semibold">แดชบอร์ดฝ่ายพัฒนา</h1>
            <p className="text-slate-500">คิวขอความช่วยเหลือและปัญหาที่ต้องติดตาม</p>
          </div>

          {/* ขวา: ปุ่ม Logout */}
          <LogoutButton className="bg-red-600 shrink-0" />

        </div>

        {/* Tiles */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Tile title="คิวแชทที่รอรับ" value={counters.queue} />
          <Tile title="กำลังดำเนินการ" value={counters.inProgress} />
          <Tile title="แจ้งวันนี้" value={counters.closedToday} />
        </div>

        {/* Content: 12-cols -> 5/7 split on md+ */}
        <div className="mt-8 grid grid-cols-1  gap-6">
          {/* Left: Helpdesk (md:span 5) */}
          <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium">
              แชทที่ขอความช่วยเหลือ
            </div>
            <ul className="divide-y divide-slate-100">
              <li className="p-4 text-slate-500">
                (ยังไม่มี API แชท—จะแสดงเมื่อเชื่อมต่อ endpoint แชท)
              </li>
            </ul>
          </div>

          {/* Right: Issues (md:span 7) */}
          <div className="md:col-span-7 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium">
              ปัญหาที่รายงาน (ไม่แสดงผู้รายงาน)
            </div>

            <div className="p-4">
              {error ? (
                <div className="text-red-600 text-sm">เกิดข้อผิดพลาด: {error}</div>
              ) : null}

              {/* responsive wrapper prevents overflow */}
              <div className="overflow-x-auto -mx-2 md:mx-0">
                <table className="min-w-full table-fixed text-sm">
                  {/* control column widths */}
                  <colgroup>
                    <col className="w-14" />
                    <col />
                    <col className="w-40" />
                    <col className="w-24" />
                    <col className="w-40" />
                    <col className="w-40" />
                    <col className="w-20" />
                  </colgroup>

                  <thead>
                    <tr className="text-left text-slate-500">
                      <th className="py-2 px-2 md:px-0">รหัส</th>
                      <th className="py-2 px-2 md:px-0">รายละเอียด</th>
                      <th className="py-2 px-2 md:px-0">หมวดหมู่</th>
                      <th className="py-2 px-2 md:px-0">ความรุนแรง</th>
                      <th className="py-2 px-2 md:px-0">สถานที่</th>
                      <th className="py-2 px-2 md:px-0">เวลาแจ้ง</th>
                      <th className="py-2 px-2 md:px-0">ไฟล์</th>
                    </tr>
                  </thead>

                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-slate-500">
                          กำลังโหลด...
                        </td>
                      </tr>
                    ) : reports.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-slate-500">
                          ไม่มีรายการ
                        </td>
                      </tr>
                    ) : (
                      reports.map((r) => (
                        <tr key={r.report_id} className="border-t border-slate-100 align-top">
                          <td className="py-3 pr-2 md:pr-4 font-medium whitespace-nowrap">
                            #{r.report_id}
                          </td>

                          {/* รายละเอียด: clamp 2 บรรทัด */}
                          <td className="py-3 pr-2 md:pr-4 break-words">
                            <div className="line-clamp-2">
                              {r.description}
                            </div>
                          </td>

                          <td className="py-3 pr-2 md:pr-4">{r.problem_type}</td>
                          <td className="py-3 pr-2 md:pr-4">{r.problem_severe}</td>
                          <td className="py-3 pr-2 md:pr-4 break-words">
                            {r.problem_where}
                          </td>

                          {/* เวลา & ลิงก์ไม่ตัดบรรทัด เพื่อไม่กินพื้นที่แนวตั้ง */}
                          <td className="py-3 pr-2 md:pr-4 whitespace-nowrap">
                            {fmtTime(r.reported_at)}
                          </td>
                          <td className="py-3 pr-2 md:pr-4 whitespace-nowrap">
                            {r.image_url ? (
                              <a
                                href={
                                  r.image_url.startsWith("http")
                                    ? r.image_url
                                    : `${API_BASE}${r.image_url}`
                                }
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
          <a href="/dev/issues" className="text-sm text-slate-700 underline">
            ไปหน้า “รายการปัญหาทั้งหมด” →
          </a>
        </div>
      </div>
    </main>
  );
}
