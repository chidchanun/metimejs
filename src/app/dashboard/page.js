"use client";

import { useEffect, useState } from "react";

function StatCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="text-sm text-slate-500">{title}</div>
      <div className="mt-2 text-3xl font-semibold">{value}</div>
      {sub ? <div className="mt-1 text-xs text-slate-500">{sub}</div> : null}
    </div>
  );
}

function StatusBadge({ s }) {
  const map = {
    "ยังไม่ดำเนินการ": "bg-slate-200 text-slate-800",
    "รอดำเนินการ": "bg-amber-200 text-amber-900",
    "เรียบร้อย": "bg-emerald-200 text-emerald-900",
    "รับทราบ": "bg-blue-200 text-blue-900",
  };
  return (
    <span className={`px-2 py-1 rounded-full text-xs ${map[s] || "bg-slate-200"}`}>
      {s}
    </span>
  );
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ students: 0, openIssues: 0, escalatedChats: 0 });
  const [issues, setIssues] = useState([]);

  useEffect(() => {
    // TODO: เปลี่ยนเป็น fetch('/api/admin/overview')
    // Mock data
    setTimeout(() => {
      setStats({ students: 1240, openIssues: 18, escalatedChats: 7 });
      setIssues([
        { id: 101, anon: "#ANON-4821", category: "การเรียน", severity: "สูง", status: "รอดำเนินการ", created_at: "2025-11-05 10:12" },
        { id: 102, anon: "#ANON-3912", category: "การเงิน", severity: "กลาง", status: "ยังไม่ดำเนินการ", created_at: "2025-11-05 09:40" },
        { id: 103, anon: "#ANON-1055", category: "สุขภาพจิต", severity: "ฉุกเฉิน", status: "รอดำเนินการ", created_at: "2025-11-04 22:31" },
        { id: 104, anon: "#ANON-9981", category: "อื่นๆ", severity: "ต่ำ", status: "เรียบร้อย", created_at: "2025-11-04 18:00" },
      ]);
      setLoading(false);
    }, 400);
  }, []);

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-6xl p-6">
        <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
        <p className="text-slate-500">ภาพรวมระบบและรายการปัญหาล่าสุด</p>

        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard title="จำนวนนักศึกษาทั้งหมด" value={stats.students} />
          <StatCard title="ปัญหาที่ยังไม่ปิด" value={stats.openIssues} />
          <StatCard title="แชทที่ถูกขอความช่วยเหลือ" value={stats.escalatedChats} />
        </div>

        <div className="mt-8 rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="border-b border-slate-200 p-4">
            <div className="font-medium">ปัญหาที่รายงานล่าสุด</div>
          </div>
          <div className="overflow-x-auto p-4">
            <table className="min-w-full text-sm">
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
                  <tr><td className="py-6 text-slate-500" colSpan={6}>กำลังโหลด...</td></tr>
                ) : issues.length === 0 ? (
                  <tr><td className="py-6 text-slate-500" colSpan={6}>ยังไม่มีรายการ</td></tr>
                ) : (
                  issues.map((it) => (
                    <tr key={it.id} className="border-t border-slate-100">
                      <td className="py-3 pr-4 font-medium">#{it.id}</td>
                      <td className="py-3 pr-4">{it.anon}</td>
                      <td className="py-3 pr-4">{it.category}</td>
                      <td className="py-3 pr-4">{it.severity}</td>
                      <td className="py-3 pr-4"><StatusBadge s={it.status} /></td>
                      <td className="py-3 pr-4">{it.created_at}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <a href="/admin/users" className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
            <div className="font-medium">จัดการผู้ใช้/บทบาท</div>
            <div className="text-sm text-slate-500">เพิ่ม/แก้ไขสิทธิ์ผู้ใช้</div>
          </a>
          <a href="/admin/catalogs" className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
            <div className="font-medium">หมวดหมู่/ความรุนแรง/เสียงผ่อนคลาย</div>
            <div className="text-sm text-slate-500">ตั้งค่าระบบพื้นฐาน</div>
          </a>
          <a href="/dev/issues" className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
            <div className="font-medium">ปัญหาทั้งหมด (มุมมอง Dev)</div>
            <div className="text-sm text-slate-500">ตรวจสอบคิวงาน</div>
          </a>
        </div>
      </div>
    </main>
  );
}
