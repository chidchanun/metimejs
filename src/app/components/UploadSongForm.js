"use client";

import { useState, useMemo } from "react";

export default function UploadSongForm({
  uploadUrl = "/api/v1/song",              // endpoint อัปโหลดไฟล์/บันทึกเพลง
  youtubeDownloadUrl = "/api/v1/download-youtube", // endpoint ดาวน์โหลด YouTube
  onSuccess,                                // callback หลังอัปโหลดสำเร็จ (optional)
}) {
  const [songName, setSongName] = useState("");
  const [songFile, setSongFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

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
      xhr.open("POST", uploadUrl, true);

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

      // ----- กรณีเป็น YouTube URL -----
      if (youtubeUrl) {
        setPhase("downloading_youtube");
        const resYT = await fetch(youtubeDownloadUrl, {
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
        formData.append("song_url", dataYT.song_url);
        if (dataYT.thumbnail_url) {
          formData.append("thumbnail_url", dataYT.thumbnail_url);
        }
      } else if (songFile) {
        // ----- กรณีเป็นไฟล์ที่อัปโหลด -----
        formData.append("file", songFile);
      }

      setPhase("uploading");
      const dataDB = await uploadWithProgress(formData);
      if (dataDB.message !== "ok") {
        setLoading(false);
        setPhase("idle");
        return alert(dataDB.message || "บันทึกข้อมูลไม่สำเร็จ");
      }

      setPhase("saving");
      const songUrl = dataDB.song_url;
      setPhase("done");

      if (onSuccess) {
        onSuccess(dataDB);
      } else {
        alert("อัปโหลดเพลงเรียบร้อย: " + songUrl);
      }

      // reset ฟอร์ม
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
        className="space-y-4 w-full" // ✅ เอา max-w / border / การ์ดออก ให้ฟอร์มกินเต็ม container
      >
        <input
          type="text"
          placeholder="ชื่อเพลง"
          value={songName}
          onChange={(e) => setSongName(e.target.value)}
          className="w-full p-2 border rounded text-sm md:text-base"
          disabled={isDisabled}
        />

        <div className="w-full">
          <label className="block mb-1 font-medium text-sm md:text-base">
            อัปโหลดไฟล์เพลง (mp3, m4a, mp4)
          </label>
          <input
            type="file"
            accept="audio/*,video/*"
            onChange={(e) => setSongFile(e.target.files[0])}
            className="w-full text-xs md:text-sm"
            disabled={isDisabled}
          />
        </div>

        <div className="w-full">
          <label className="block mb-1 font-medium text-sm md:text-base">
            หรือใส่ URL YouTube
          </label>
          <input
            type="text"
            placeholder="URL YouTube"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            className="w-full p-2 border rounded text-sm md:text-base"
            disabled={isDisabled}
          />
        </div>

        <div className="w-full">
          <label className="block mb-1 font-medium text-sm md:text-base">
            อัปโหลด Cover (ถ้ามี)
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setCoverFile(e.target.files[0])}
            className="w-full text-xs md:text-sm"
            disabled={isDisabled}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-60 text-sm md:text-base"
        >
          {loading ? "กำลังอัปโหลด..." : "อัปโหลดเพลง"}
        </button>

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

            {phase === "downloading_youtube" && (
              <div className="w-full h-3 bg-gray-200 rounded overflow-hidden">
                <div className="h-3 bg-blue-600 animate-[progress_1.2s_ease-in-out_infinite]" />
              </div>
            )}

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

            {phase === "saving" && (
              <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
                <div className="h-2 bg-blue-600 animate-[progress_1s_linear_infinite]" />
              </div>
            )}
          </div>
        )}
      </form>

      {/* overlay เบา ๆ กันคลิกระหว่างโหลด ถ้าไม่อยากได้จะลบทิ้งก็ได้ */}
      {loading && (
        <div className="fixed inset-0 pointer-events-none" aria-hidden />
      )}

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
