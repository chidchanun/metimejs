"use client";
import { useState, useMemo } from "react";

export default function UploadSong() {
  const [songName, setSongName] = useState("");
  const [songFile, setSongFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

  // progress state
  const [progress, setProgress] = useState(0);
  const [bytes, setBytes] = useState({ loaded: 0, total: 0 });
  const [phase, setPhase] = useState("idle"); // idle | downloading_youtube | uploading | saving | done

  const humanBytes = useMemo(() => {
    const fmt = (n) => (n / (1024 * 1024)).toFixed(2);
    if (!bytes.total) return "";
    return `${fmt(bytes.loaded)} / ${fmt(bytes.total)} MB`;
  }, [bytes]);

  const uploadWithProgress = (formData) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/v1/song", true);

      // อัปเดตเปอร์เซ็นต์เฉพาะ "การอัปโหลด" (ฝั่ง client -> server)
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setProgress(percent);
          setBytes({ loaded: e.loaded, total: e.total });
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText || "{}");
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve(data);
          } else {
            reject(data?.message || "อัปโหลดไม่สำเร็จ");
          }
        } catch (err) {
          reject("ไม่สามารถอ่านผลลัพธ์ได้");
        }
      };

      xhr.onerror = () => reject("เครือข่ายมีปัญหา");
      xhr.send(formData);
    });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!songName || (!songFile && !youtubeUrl))
      return alert("กรุณาใส่ชื่อเพลงและไฟล์/URL");

    setLoading(true);
    setProgress(0);
    setBytes({ loaded: 0, total: 0 });
    setPhase("idle");

    try {
      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="));
      const token = tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : "";
      if (!token) {
        setLoading(false);
        return alert("โปรดเข้าสู่ระบบใหม่อีกครั้ง");
      }

      const formData = new FormData();
      formData.append("song_name", songName);
      formData.append("token", token);
      if (coverFile) formData.append("cover_file", coverFile);

      // ---------- กรณีเป็น YouTube URL ----------
      if (youtubeUrl) {
        setPhase("downloading_youtube"); // ช่วงนี้แสดง indeterminate bar
        const resYT = await fetch("/api/v1/download-youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: youtubeUrl }),
        });
        const dataYT = await resYT.json();
        if (dataYT.message !== "ok") {
          setLoading(false);
          setPhase("idle");
          return alert(dataYT.message || "ดาวน์โหลดจาก YouTube ไม่สำเร็จ");
        }
        // ใส่ path ที่ได้จาก backend
        formData.append("song_url", dataYT.song_url);
        if (dataYT.thumbnail_url) {
          formData.append("thumbnail_url", dataYT.thumbnail_url);
        }
      } else if (songFile) {
        // ---------- กรณีเป็นการอัปโหลดไฟล์ ----------
        formData.append("file", songFile);
      }

      // บันทึก DB (+ อัปโหลดไฟล์ขึ้น server ถ้ามี)
      setPhase("uploading");
      const dataDB = await uploadWithProgress(formData);
      if (dataDB.message !== "ok") {
        setLoading(false);
        setPhase("idle");
        return alert(dataDB.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setPhase("saving");
      // (ถ้าฝั่งเซิร์ฟเวอร์มีการประมวลผลต่อ อาจโชว์สถานะนี้สั้น ๆ)
      const songUrl = dataDB.song_url;
      setPhase("done");
      alert("อัปโหลดเพลงเรียบร้อย: " + songUrl);

      // reset
      setSongName("");
      setSongFile(null);
      setYoutubeUrl("");
      setCoverFile(null);
      setProgress(0);
      setBytes({ loaded: 0, total: 0 });
      setPhase("idle");
    } catch (err) {
      console.error(err);
      alert(typeof err === "string" ? err : "เกิดข้อผิดพลาด");
      setPhase("idle");
    } finally {
      setLoading(false);
    }
  };

  const isDisabled = loading;

  return (
    <>
      <form
        onSubmit={handleSubmit}
        className="space-y-4 max-w-md mx-auto mt-10 p-4 border rounded relative"
      >
        <input
          type="text"
          placeholder="ชื่อเพลง"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          className="w-full p-2 border rounded"
          disabled={isDisabled}
        />

        <div>
          <label className="block mb-1 font-medium">อัปโหลดไฟล์เพลง (mp3, m4a, mp4)</label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setSongFile(e.target.files[0])}
            className="w-full"
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">หรือใส่ URL YouTube</label>
          <input
            type="text"
            placeholder="URL YouTube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full p-2 border rounded"
            disabled={isDisabled}
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">อัปโหลด Cover (ถ้ามี)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            className="w-full"
            disabled={isDisabled}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60"
        >
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดเพลง"}
        </button>

        {/* Progress block */}
        {loading && (
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">
                {phase === "downloading_youtube" && "กำลังดาวน์โหลดจาก YouTube..."}
                {phase === "uploading" && "กำลังอัปโหลดไฟล์..."}
                {phase === "saving" && "กำลังบันทึกข้อมูล..."}
                {phase === "done" && "เสร็จสิ้น"}
              </span>
              {phase === "uploading" && (
                <span className="text-sm text-gray-600">{progress}%</span>
              )}
            </div>

            {/* Indeterminate bar (YouTube phase) */}
            {phase === "downloading_youtube" && (
              <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                <div className="h-3 bg-blue-600 animate-[progress_1.2s_ease-in-out_infinite]" />
              </div>
            )}

            {/* Determinate bar (Upload phase) */}
            {phase === "uploading" && (
              <>
                <div className="w-full h-3 bg-gray-200 rounded">
                  <div
                    className="h-3 bg-blue-600 rounded"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <div className="mt-1 text-xs text-gray-600">{humanBytes}</div>
              </>
            )}

            {/* Saving phase (thin indeterminate) */}
            {phase === "saving" && (
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div className="h-2 bg-blue-600 animate-[progress_1s_linear_infinite]" />
              </div>
            )}
          </div>
        )}
      </form>

      {/* Overlay เพื่อกันการคลิกระหว่างโหลด (ถ้าอยากให้มืดทั้งหน้า) */}
      {loading && (
        <div className="fixed inset-0 pointer-events-none" aria-hidden />
      )}

      {/* Tailwind keyframes (ถ้าโปรเจกต์ยังไม่มี keyframe ชื่อ progress) 
          คุณสามารถย้ายไปไว้ใน globals.css ได้เช่นกัน */}
      <style jsx global>{`
        @keyframes progress {
          0% {
            transform: translateX(-100%);
          }
          50% {
            transform: translateX(-10%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        .animate-\\[progress_1\\.2s_ease-in-out_infinite\\] {
          animation: progress 1.2s ease-in-out infinite;
        }
        .animate-\\[progress_1s_linear_infinite\\] {
          animation: progress 1s linear infinite;
        }
      `}</style>
    </>
  );
}
