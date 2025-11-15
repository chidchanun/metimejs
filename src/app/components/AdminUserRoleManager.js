"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const ROLE_OPTIONS = [
  { value: 1, label: "นักศึกษา (1)" },
  { value: 2, label: "อาจารย์/เจ้าหน้าที่ (2)" },
  { value: 3, label: "ผู้ดูแลระบบ (3)" },
];

function RoleBadge({ role_id }) {
  const map = {
    1: "bg-emerald-100 text-emerald-800",
    2: "bg-sky-100 text-sky-800",
    3: "bg-rose-100 text-rose-800",
  };
  const labelMap = {
    1: "นักศึกษา",
    2: "อาจารย์/เจ้าหน้าที่",
    3: "ผู้ดูแลระบบ",
  };
  const cls = map[role_id] || "bg-slate-100 text-slate-700";
  const text = labelMap[role_id] || `role_id = ${role_id}`;

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-[11px] sm:text-xs ${cls}`}>
      {text}
    </span>
  );
}

export default function AdminUserRoleManager() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [pendingRoles, setPendingRoles] = useState({}); // userId -> role_id ที่เลือกไว้ แต่ยังไม่บันทึก

  const router = useRouter();

  const getTokenFromCookie = () => {
    if (typeof document === "undefined") return null;
    const tokenCookie = document.cookie
      .split("; ")
      .find((row) => row.startsWith("auth_token="));
    if (!tokenCookie) return null;
    return decodeURIComponent(tokenCookie.split("=")[1]);
  };

  // โหลดรายการผู้ใช้ทั้งหมด
  useEffect(() => {
    async function loadUsers() {
      try {
        setLoading(true);
        setError("");
        setMessage("");

        const token = getTokenFromCookie();
        if (!token) {
          router.push("/login");
          return;
        }

        const res = await fetch(
          `/api/v1/users-admin?token=${encodeURIComponent(token)}`,
          { method: "GET", cache: "no-store" }
        );

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data?.message || "โหลดรายชื่อผู้ใช้ไม่สำเร็จ");
        }

        const rows = Array.isArray(data?.result) ? data.result : [];
        setUsers(rows);

        // ตั้งค่าเริ่มต้นของ pendingRoles ตาม role ปัจจุบัน
        const initPending = {};
        rows.forEach((u) => {
          initPending[u.id] = u.role_id;
        });
        setPendingRoles(initPending);
      } catch (e) {
        setError(e.message || "เกิดข้อผิดพลาด");
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }

    loadUsers();
  }, []);

  // กดปุ่มบันทึก role ของ user คนหนึ่ง
  async function handleSaveRole(userId) {
    const newRoleId = pendingRoles[userId];
    if (!newRoleId) return;

    try {
      setSavingId(userId);
      setError("");
      setMessage("");

      const token = getTokenFromCookie();
      if (!token) {
        router.push("/login");
        return;
      }

      const res = await fetch("/api/v1/users-admin", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token,
          user_id: userId,
          role_id: Number(newRoleId),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || "บันทึกสิทธิ์ไม่สำเร็จ");
      }

      setUsers((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, role_id: Number(newRoleId) } : u
        )
      );
      setMessage("บันทึกสิทธิ์สำเร็จ");
    } catch (e) {
      setError(e.message || "เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSavingId(null);
    }
  }

  return (
    <div className="mt-2">
      {/* แถบข้อความด้านบน */}
      <div className="flex items-center justify-between text-xs sm:text-sm">
        {loading && <span className="text-xs text-slate-500">กำลังโหลด...</span>}
      </div>

      <div className="mt-1 text-xs sm:text-sm">
        {error && <span className="text-red-600 mr-4">{error}</span>}
        {message && <span className="text-emerald-600">{message}</span>}
      </div>

      {/* มือถือ: แสดงเป็นการ์ดรายคน */}
      <div className=" mt-2 space-y-3 sm:hidden">
        {loading ? (
          <div className="py-3 text-slate-500 text-xs">กำลังโหลด...</div>
        ) : users.length === 0 ? (
          <div className="py-3 text-slate-500 text-xs">ยังไม่มีผู้ใช้</div>
        ) : (
          users.map((u) => (
            <div
              key={u.id}
              className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs"
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-semibold text-slate-800">
                  #{u.id} · {u.username_code}
                </div>
                <RoleBadge role_id={u.role_id} />
              </div>
              <div className="text-slate-700">
                {u.fname} {u.lname}
              </div>

              <div className="mt-2 flex items-center gap-2">
                <select
                  value={pendingRoles[u.id] ?? u.role_id}
                  onChange={(e) =>
                    setPendingRoles((prev) => ({
                      ...prev,
                      [u.id]: Number(e.target.value),
                    }))
                  }
                  className="flex-1 rounded-lg border border-slate-300 bg-white px-2 py-1 text-[11px]"
                  disabled={savingId === u.id}
                >
                  <option value="">-- เลือก role --</option>
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => handleSaveRole(u.id)}
                  disabled={savingId === u.id}
                  className="whitespace-nowrap rounded-lg border border-slate-300 px-3 py-1 text-[11px] hover:bg-slate-100 disabled:opacity-50"
                >
                  {savingId === u.id ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* จอใหญ่: ตารางแบบเดิม */}
      <div className="mt-2 overflow-x-auto hidden sm:block">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50 text-slate-500">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">รหัสผู้ใช้</th>
              <th className="py-2 px-4 text-left">ชื่อ - สกุล</th>
              <th className="py-2 px-4 text-left">role ปัจจุบัน</th>
              <th className="py-2 px-4 text-left">เปลี่ยน role</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td className="py-6 px-4 text-slate-500" colSpan={5}>
                  กำลังโหลด...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td className="py-6 px-4 text-slate-500" colSpan={5}>
                  ยังไม่มีผู้ใช้
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} className="border-t border-slate-100">
                  <td className="py-3 px-4 font-mono text-xs">#{u.id}</td>
                  <td className="py-3 px-4">{u.username_code}</td>
                  <td className="py-3 px-4">
                    {u.fname} {u.lname}
                  </td>
                  <td className="py-3 px-4">
                    <RoleBadge role_id={u.role_id} />
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <select
                        value={pendingRoles[u.id] ?? u.role_id}
                        onChange={(e) =>
                          setPendingRoles((prev) => ({
                            ...prev,
                            [u.id]: Number(e.target.value),
                          }))
                        }
                        className="rounded-lg border border-slate-300 bg-white px-2 py-1 text-xs"
                        disabled={savingId === u.id}
                      >
                        <option value="">-- เลือก role --</option>
                        {ROLE_OPTIONS.map((r) => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                      <button
                        onClick={() => handleSaveRole(u.id)}
                        disabled={savingId === u.id}
                        className="rounded-lg border border-slate-300 px-3 py-1 text-xs hover:bg-slate-50 disabled:opacity-50"
                      >
                        {savingId === u.id ? "กำลังบันทึก..." : "บันทึก"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
