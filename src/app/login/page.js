"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams?.get("error");

  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    if (!studentCode || !password) return;
    setLoading(true);

    const res = await signIn("credentials", {
      redirect: false,
      studentCode,
      password,
      callbackUrl: "/",
    });

    if (res?.ok) {
      router.push(res.url ?? "/");
      router.refresh();
    } else {
      alert(res?.error ?? "ไม่สามารถเข้าสู่ระบบได้");
    }

    setLoading(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="bg-white/80 backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-slate-200">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-2 h-12 w-12 rounded-2xl bg-slate-900 flex items-center justify-center text-white text-xl font-bold">S</div>
            <h1 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
            <p className="text-slate-500 text-sm">ใช้รหัสนักศึกษาและรหัสผ่านเดียวกับ e-student</p>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              ไม่สามารถเข้าสู่ระบบได้: {error}
            </div>
          )}

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสนักศึกษา</label>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="username"
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value.trim())}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/50"
                placeholder="เช่น 64123456"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/50"
                placeholder="รหัสผ่าน e-student"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-60 transition"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} Student Support</p>
      </div>
    </div>
  );
}
