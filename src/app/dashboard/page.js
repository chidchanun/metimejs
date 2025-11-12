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

  useEffect(() => {
    let alive = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        // ดึงข้อมูลจริงจาก API
        const res = await fetch("http://localhost:3000/api/v1/report", {
          method: "GET",
          // ปิด cache ให้เห็นรายการล่าสุดเสมอ (โดยเฉพาะเวลา dev)
          cache: "no-store",
          headers: { "Accept": "application/json" },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const rows = Array.isArray(data?.result) ? data.result : [];
        const mapped = rows.map((r) => ({
          id: r.report_id ?? r.id ?? 0,
          anon: r.anon_id || r.student_code || r.reporter || "-",
          category: r.problem_type || r.category || "-",
          severity: r.problem_severe || r.severity || "-",
          status: r.status || r.report_status || "ยังไม่ระบุ",
          created_at: fmtThai(r.reported_at || r.created_at),
        }));

        if (!alive) return;
        setIssues(mapped);
        const openIssues = mapped.filter((m) => m.status !== "เรียบร้อย").length;
        setStats((s) => ({ ...s, openIssues }));
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
    return () => {
      alive = false;
    };
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
          <div className="border-b border-slate-200 p-4 flex items-center justify-between">
            <div className="font-medium">ปัญหาที่รายงานล่าสุด</div>
            <button
              onClick={() => window.location.reload()}
              className="text-xs rounded-full border px-3 py-1 hover:bg-slate-50"
            >รีเฟรช</button>
          </div>
          <div className="overflow-x-auto p-4">
            {error ? (
              <div className="text-sm text-red-600">{error}</div>
            ) : null}
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
          <a href="/song" className="rounded-2xl border border-slate-200 bg-white p-5 hover:shadow-md transition">
            <div className="font-medium">เพิ่มเสียงผ่อนคลาย</div>
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
