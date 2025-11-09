"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { VerifyToken } from "@/app/utils/VerifyToken";
import { getToken } from "../utils/getToken";

export default function ProtectedPage() {
    const [songName, setSongName] = useState("");
    const [file, setFile] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [tokenValue, setTokenValue] = useState(null);
    const [coverFile, setCoverFile] = useState(null)

    useEffect(() => {
        async function fetchToken() {
            const token = await getToken();
            setTokenValue(token);
        }
        fetchToken();
    }, []);

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file || !songName) return alert("กรุณาใส่ชื่อเพลงและเลือกไฟล์");

        setIsUploading(true);



        const formData = new FormData();
        formData.append("song_name", songName);
        formData.append("file", file);
        formData.append("token", tokenValue);
        formData.append("cover_file", coverFile)

        const res = await fetch("/api/v1/song", {
            method: "POST",
            body: formData, // ไม่ต้อง JSON.stringify
        });

        const data = await res.json();
        setIsUploading(false);

        if (data.message === "ok") {
            alert("อัปโหลดเพลงสำเร็จ!");
            setSongName("");
            setFile(null);
        } else {
            alert("อัปโหลดไม่สำเร็จ: " + data.error);
        }
    };

    return (
        <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-2xl text-black">
            <h1 className="text-2xl font-bold mb-4">🎧 Upload Song</h1>
            <form onSubmit={handleUpload} className="space-y-4">
                <div>
                    <label className="block text-sm font-medium mb-1">ชื่อเพลง</label>
                    <input
                        type="text"
                        className="w-full border p-2 rounded"
                        value={songName}
                        onChange={(e) => setSongName(e.target.value)}
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium mb-1">เลือกไฟล์เพลง</label>
                    <input
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        className="w-full border p-2 rounded"
                    />
                </div>

                <button
                    type="submit"
                    disabled={isUploading}
                    className="w-full bg-sky-500 text-white py-2 rounded hover:bg-sky-600"
                >
                    {isUploading ? "กำลังอัปโหลด..." : "อัปโหลด"}
                </button>
            </form>
        </div>
    );
}
