"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { VerifyToken } from "@/app/utils/VerifyToken";

export default function ProtectedPage() {
    const router = useRouter();

    useEffect(() => {
        VerifyToken()

    }, [router]);

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                หน้าหลัก (Token ตรวจสอบแล้ว)
            </h1>
        </div>
    );
}
