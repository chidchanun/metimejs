"use client";
import { useState } from "react";

export default function UploadSong() {
  const [songName, setSongName] = useState("");
  const [songFile, setSongFile] = useState(null);
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [coverFile, setCoverFile] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!songName || (!songFile && !youtubeUrl)) return alert("กรุณาใส่ชื่อเพลงและไฟล์/URL");

    setLoading(true);

    try {
      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="));
      const token = tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : "";
      if (!token) return alert("โปรดเข้าสู่ระบบใหม่อีกครั้ง");

      let songUrl = null;

      const formData = new FormData();
      formData.append("song_name", songName);
      if (coverFile) formData.append("cover_file", coverFile);
      formData.append("token", token);

      // ------------------ ถ้าเป็น YouTube URL ------------------
      if (youtubeUrl) {
        const resYT = await fetch("/api/v1/download-youtube", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: youtubeUrl })
        });
        const dataYT = await resYT.json();
        if (dataYT.message !== "ok") {
          setLoading(false);
          return alert(dataYT.message);
        }
        formData.append("song_url", dataYT.song_url); // ส่ง path จาก download-youtube
      } else if (songFile) {
        // ------------------ ถ้าเป็นไฟล์ ------------------
        formData.append("file", songFile);
      }

      // ส่งไปบันทึก DB
      const resDB = await fetch("/api/v1/song", { method: "POST", body: formData });
      const dataDB = await resDB.json();
      if (dataDB.message !== "ok") {
        setLoading(false);
        return alert(dataDB.message);
      }

      songUrl = dataDB.song_url;
      alert("อัปโหลดเพลงเรียบร้อย: " + songUrl);

      // เคลียร์ค่า
      setSongName("");
      setSongFile(null);
      setYoutubeUrl("");
      setCoverFile(null);

    } catch (err) {
      console.error(err);
      alert("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto mt-10 p-4 border rounded">
      <input
        type="text"
        placeholder="ชื่อเพลง"
        value={songName}
        onChange={(e) => setSongName(e.target.value)}
        className="w-full p-2 border rounded"
      />

      <div>
        <label className="block mb-1 font-medium">อัปโหลดไฟล์เพลง (mp3, m4a, mp4)</label>
        <input
          type="file"
          accept="audio/*,video/*"
          onChange={(e) => setSongFile(e.target.files[0])}
          className="w-full"
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
        />
      </div>

      <div>
        <label className="block mb-1 font-medium">อัปโหลด Cover (ถ้ามี)</label>
        <input
          type="file"
          accept="image/*"
          onChange={(e) => setCoverFile(e.target.files[0])}
          className="w-full"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full p-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        {loading ? "กำลังอัปโหลด..." : "อัปโหลดเพลง"}
      </button>
    </form>
  );
}
