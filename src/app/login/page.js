"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import Image from 'next/image';

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

        try {
            const res = await fetch(
                `http://it.e-tech.ac.th/api/v1/login?username=${studentCode}&password=${password}`,
                {
                    method: "POST",
                }
            );

            const data = await res.json(); // 👈 แปลง response เป็น JSON
            console.log("Response JSON:", data);

            if (res.ok) {
                // ✅ ทำสิ่งที่ต้องการเมื่อ login สำเร็จ เช่นเก็บ token
                console.log("Token:", data.token);
                // localStorage.setItem("token", data.token);
            } else {
                console.error("Login failed:", data.error || data.message);
            }
        } catch (err) {
            console.error("เกิดข้อผิดพลาด:", err);
        }

        setLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center  bg-[#79A8D8] p-4">
            <div className="w-full max-w-md">
                <div className="bg-[#94cbf8] backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-slate-200">
                    <div className="mb-6 text-center">
                        <Image
                            className="mx-auto block mb-2"
                            src="/metimelogo.png"
                            width={200}
                            height={200}
                            alt="Logo"
                        />
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
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#084B83] text-black"
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
                                className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#084B83] text-black"
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

                <p className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} METIME Support</p>
            </div>
        </div>
    );
}
