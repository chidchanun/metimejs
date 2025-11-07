"use client";

import { useEffect, useState } from "react";

function Tile({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
    </div>
  );
}

export default function TeacherDashboard() {
  const [loading, setLoading] = useState(true);
  const [counters, setCounters] = useState({ queue: 0, inProgress: 0, closedToday: 0 });
  const [helpdesk, setHelpdesk] = useState([]);
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    // TODO: แทนที่ด้วย fetch('/api/dev/overview'), fetch('/api/chat/helpdesk')
    setTimeout(() => {
      setCounters({ queue: 5, inProgress: 3, closedToday: 2 });
      setHelpdesk([
        { id: 9001, roomId: 501, topic: "กังวลเรื่องสอบกลางภาค", created_at: "10:31" },
        { id: 9002, roomId: 502, topic: "ปัญหาความรุนแรงในหอพัก", created_at: "09:12" },
      ]);
      setIssues([
        { id: 110, anon: "#ANON-4412", category: "สุขภาพจิต", severity: "สูง", status: "รอดำเนินการ" },
        { id: 111, anon: "#ANON-1290", category: "การเงิน", severity: "กลาง", status: "ยังไม่ดำเนินการ" },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold">แดชบอร์ดฝ่ายพัฒนา</h1>
        <p className="text-slate-500">คิวขอความช่วยเหลือและปัญหาที่ต้องติดตาม</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Tile title="คิวแชทที่รอรับ" value={counters.queue} />
          <Tile title="กำลังดำเนินการ" value={counters.inProgress} />
          <Tile title="ปิดวันนี้" value={counters.closedToday} />
        </div>

        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Helpdesk Chats */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium">แชทที่ขอความช่วยเหลือ</div>
            <ul className="divide-y divide-slate-100">
              {loading ? (
                <li className="p-4 text-slate-500">กำลังโหลด...</li>
              ) : helpdesk.length === 0 ? (
                <li className="p-4 text-slate-500">ไม่มีคิวแชท</li>
              ) : (
                helpdesk.map((h) => (
                  <li key={h.id} className="p-4 flex items-center justify-between">
                    <div>
                      <div className="font-medium">{h.topic}</div>
                      <div className="text-xs text-slate-500">Thread #{h.id} • ห้อง {h.roomId} • {h.created_at}</div>
                    </div>
                    <a href={`/teacher/chats/${h.roomId}`} className="rounded-xl bg-slate-900 text-white px-3 py-1.5 text-sm hover:opacity-90">
                      เข้าแชท
                    </a>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Issues anonymized */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 p-4 font-medium">ปัญหาที่รายงาน (ไม่แสดงผู้รายงาน)</div>
            <div className="p-4">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-500">
                    <th className="py-2 pr-4">รหัส</th>
                    <th className="py-2 pr-4">ผู้รายงาน</th>
                    <th className="py-2 pr-4">หมวดหมู่</th>
                    <th className="py-2 pr-4">ความรุนแรง</th>
                    <th className="py-2 pr-4">สถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={5} className="py-6 text-slate-500">กำลังโหลด...</td></tr>
                  ) : issues.length === 0 ? (
                    <tr><td colSpan={5} className="py-6 text-slate-500">ไม่มีรายการ</td></tr>
                  ) : (
                    issues.map((it) => (
                      <tr key={it.id} className="border-t border-slate-100">
                        <td className="py-3 pr-4 font-medium">#{it.id}</td>
                        <td className="py-3 pr-4">{it.anon}</td>
                        <td className="py-3 pr-4">{it.category}</td>
                        <td className="py-3 pr-4">{it.severity}</td>
                        <td className="py-3 pr-4">{it.status}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
