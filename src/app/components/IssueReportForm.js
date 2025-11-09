"use client";

import { useMemo, useRef, useState } from "react";

/**
 * ฟอร์มรายงานปัญหา — ส่ง multipart/form-data
 * fields: categoryId, mood, occurredAt, location, details, token
 * files:  files (แนบได้หลายไฟล์; เซิร์ฟเวอร์จะใช้ไฟล์แรกเป็น image_url)
 */
export default function IssueReportForm({
  categories = [
    { id: 1, name: "ความเครียดจากการเรียน" },
    { id: 2, name: "ความกดดันส่วนตัว" },
    { id: 3, name: "ปัญหาความสัมพันธ์" },
    { id: 4, name: "ปัญหาครอบครัว" },
    { id: 5, name: "สุขภาพจิต" },
    { id: 99, name: "อื่นๆ" },
  ],
  onSubmitted,
  endpoint = "/api/issues",
  maxFiles = 5,
  maxFileSizeMB = 2,
  accept = "image/jpeg,image/png",
  className,
}) {
  const [categoryId, setCategoryId] = useState("");
  const [mood, setMood] = useState("");
  const [occurredAt, setOccurredAt] = useState("");
  const [location, setLocation] = useState("");
  const [details, setDetails] = useState("");
  const [files, setFiles] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [okMsg, setOkMsg] = useState("");

  const fileInputRef = useRef(null);

  const moods = useMemo(
    () => [
      { key: "very_good", label: "ชิวๆ", emoji: "😊" },
      { key: "good", label: "พอไหวอยู่", emoji: "🙂" },
      { key: "neutral", label: "ไม่สบายใจ", emoji: "😔" },
      { key: "bad", label: "แย่มากๆ", emoji: "😟" },
    ],
    []
  );

  function onPickFiles(e) {
    const list = Array.from(e.target.files || []);
    const maxBytes = maxFileSizeMB * 1024 * 1024;
    const accepted = accept.split(",").map((s) => s.trim());

    const next = [];
    for (const f of list) {
      if (!accepted.includes(f.type)) {
        setError(`ประเภทไฟล์ไม่รองรับ: ${f.name}`);
        continue;
      }
      if (f.size > maxBytes) {
        setError(`ไฟล์ ${f.name} มีขนาดเกิน ${maxFileSizeMB}MB`);
        continue;
      }
      next.push(f);
    }

    const merged = [...files, ...next].slice(0, maxFiles);
    setFiles(merged);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function removeFile(idx) {
    const clone = files.slice();
    clone.splice(idx, 1);
    setFiles(clone);
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setOkMsg("");

    if (!categoryId) return setError("กรุณาเลือกประเภทปัญหา");
    if (!mood) return setError("กรุณาเลือกระดับความรู้สึก");
    if (!occurredAt) return setError("กรุณาเลือกวันที่พบปัญหา");
    if (!details.trim()) return setError("กรุณากรอกรายละเอียดปัญหา");

    setLoading(true);
    try {
      // ดึง token จาก localStorage ตามที่ต้องการ
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setLoading(false);
        return setError("โปรดเข้าสู่ระบบใหม่อีกครั้ง");
      }

      const fd = new FormData();
      fd.append("categoryId", String(categoryId));
      fd.append("mood", mood);
      fd.append("occurredAt", occurredAt); // YYYY-MM-DD
      if (location) fd.append("location", location);
      fd.append("details", details);
      fd.append("token", token);
      files.forEach((f) => fd.append("files", f)); // แนบไฟล์ทั้งหมด

      const res = await fetch(endpoint, { method: "POST", body: fd });
      let data = null;
      try { data = await res.json(); } catch {}

      if (!res.ok) {
        const msg = data?.error || data?.message || "ส่งรายงานไม่สำเร็จ";
        setError(msg);
      } else {
        setOkMsg("ส่งรายงานสำเร็จ ขอบคุณที่แจ้งให้เราทราบ");
        // reset
        setCategoryId("");
        setMood("");
        setOccurredAt("");
        setLocation("");
        setDetails("");
        setFiles([]);
        if (typeof onSubmitted === "function") onSubmitted(data);
      }
    } catch (err) {
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ โปรดลองอีกครั้ง");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm ${className || ""}`}
    >
      {/* Category */}
      <label className="block text-sm font-medium text-slate-800">คุณไปเจอปัญหาแบบไหนมา</label>
      <div className="mt-2">
        <select
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          <option value="">-- เลือกประเภทปัญหา --</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Mood */}
      <div className="mt-5">
        <div className="text-sm font-medium text-slate-800 mb-2">ตอนนี้คุณเป็นอย่างไรกับปัญหาที่พบ</div>
        <div className="flex flex-wrap gap-2">
          {moods.map((m) => (
            <button
              key={m.key}
              type="button"
              onClick={() => setMood(m.key)}
              className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm transition ${
                mood === m.key ? "bg-slate-900 text-white border-slate-900" : "border-slate-300 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg">{m.emoji}</span>
              <span>{m.label}</span>
            </button>
          ))}
        </div>
        <div className="mt-1 text-xs text-slate-500">แตะเพื่อเลือก 1 ความรู้สึก</div>
      </div>

      {/* Date */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-800 mb-1">คุณเจอปัญหาวันไหน</label>
        <input
          type="date"
          value={occurredAt}
          onChange={(e) => setOccurredAt(e.target.value)}
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      {/* Location */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-800 mb-1">แจ้งสถานที่ให้ทราบหน่อย (ถ้ามี)</label>
        <input
          type="text"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="เช่น ในวิทยาลัย / บ้าน / ออนไลน์"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      {/* Details */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-800 mb-1">เล่ารายละเอียดให้เราฟังหน่อย</label>
        <textarea
          rows={5}
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder="เขียนรายละเอียดที่ต้องการรายงาน..."
          className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-900/20"
        />
      </div>

      {/* Files */}
      <div className="mt-5">
        <label className="block text-sm font-medium text-slate-800 mb-1">
          ถ้าคุณมีรูปภาพ/วิดีโอหลักฐานโปรดแนบมาให้เราพร้อมด้วย (ถ้ามี)
        </label>
        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          multiple
          onChange={onPickFiles}
          className="block w-full text-sm text-slate-700 file:mr-3 file:rounded-lg file:border file:border-slate-300 file:bg-white file:px-3 file:py-2 file:text-sm file:hover:bg-slate-50"
        />
        <div className="mt-1 text-xs text-slate-500">
          อนุญาตเฉพาะ JPG, JPEG, PNG • ไม่เกิน {maxFileSizeMB}MB ต่อไฟล์ • สูงสุด {maxFiles} ไฟล์
        </div>
        {files.length > 0 && (
          <ul className="mt-3 space-y-2 text-sm">
            {files.map((f, idx) => (
              <li key={idx} className="flex items-center justify-between rounded-lg border border-slate-200 px-3 py-2">
                <span className="truncate">
                  {f.name} <span className="text-xs text-slate-500">({(f.size/1024/1024).toFixed(2)} MB)</span>
                </span>
                <button type="button" onClick={() => removeFile(idx)} className="text-slate-600 hover:text-slate-900">
                  ลบ
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Alerts */}
      {error && <div className="mt-5 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {okMsg && <div className="mt-5 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{okMsg}</div>}

      <div className="mt-6">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 font-medium text-white hover:opacity-90 disabled:opacity-60"
        >
          {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
        </button>
      </div>
    </form>
  );
}
