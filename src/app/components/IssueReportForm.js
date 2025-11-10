/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "../utils/getToken";

/**
 * ฟอร์มรายงานปัญหา (JavaScript)
 * - หน้าตา/ลำดับฟิลด์ใกล้เคียงภาพตัวอย่าง
 * - ปุ่มการ์ดอีโมจิสำหรับระดับความรุนแรง
 * - รองรับเลือกวันที่พบปัญหา (ไม่บังคับ) + ใส่เวลาเพิ่ม (ไม่บังคับ)
 */
export default function IssueReportForm({ endpoint = "/api/v1/report", onSubmitted }) {
  // ตัวเลือกจากฐานข้อมูล
  const [types, setTypes] = useState([]); // problem_type
  const [severes, setSeveres] = useState([]); // problem_severe

  // ค่าฟอร์ม
  const [description, setDescription] = useState("");
  const [problemWhere, setProblemWhere] = useState("");
  const [problemType, setProblemType] = useState("");
  const [problemSevere, setProblemSevere] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [happenedAt, setHappenedAt] = useState(""); // yyyy-mm-dd จาก input[type=date]
  const [showTime, setShowTime] = useState(false); // NEW: เปิด/ปิดช่องเวลา
  const [happenedTime, setHappenedTime] = useState(""); // NEW: HH:mm จาก input[type=time]

  // สถานะทั่วไป
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  // โหลดตัวเลือกจาก API
  useEffect(() => {
    async function loadOptions() {
      try {
        const [resSevere, resType] = await Promise.all([
          fetch("/api/v1/problem-severe", { cache: "no-store" }),
          fetch("/api/v1/problem-type", { cache: "no-store" }),
        ]);

        const severeJson = await resSevere.json();
        const typeJson = await resType.json();

        setSeveres(severeJson.result ?? []);
        setTypes(typeJson.result ?? []);
      } catch (e) {
        console.error(e);
        setErr("โหลดตัวเลือกไม่สำเร็จ");
      }
    }
    loadOptions();
  }, []);

  // map ชื่อความรุนแรง -> อีโมจิ (fallback กรณี backend กำหนดชื่อไม่แน่นอน)
  const severeEmoji = useMemo(
    () =>
      new Map([
        ["ชิว", "😊"],
        ["สบาย", "😊"],
        ["พอไหว", "🙂"],
        ["ไม่สบายใจ", "😕"],
        ["แย่", "😫"],
        ["วิกฤต", "😫"],
      ]),
    []
  );

  function pickEmoji(name = "") {
    for (const [k, v] of severeEmoji.entries()) {
      if (name.includes(k)) return v;
    }
    return "🙂";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    if (!description || !problemType || !problemSevere) {
      setErr("โปรดกรอกข้อมูลให้ครบถ้วน");
      return;
    }

    const token = await getToken();

    // หากผู้ใช้ระบุวันที่ ใช้วันนั้น + เวลา (ถ้าเลือก) ไม่งั้นใช้ 00:00 ของวันนั้น
    // ถ้าไม่ระบุวันเลย ใช้เวลาปัจจุบัน
    let reportedAt;
    if (happenedAt) {
      const timePart = showTime && happenedTime ? happenedTime : "00:00"; // NEW
      // ประกอบเป็น local datetime ก่อนคอนเวิร์ตเป็น ISO (UTC)
      const dt = new Date(`${happenedAt}T${timePart}:00`); // NEW
      reportedAt = dt.toISOString();
    } else {
      reportedAt = new Date().toISOString();
    }

    const payload = {
      description,
      problem_where: problemWhere || null,
      problem_type: Number(problemType),
      problem_severe: Number(problemSevere),
      image_url: imageUrl || null,
      reported_at: reportedAt,
      token,
    };

    console.log("PAYLOAD ที่ส่ง:", payload);

    setLoading(true);
    try {
      const res = await fetch(endpoint || "/api/v1/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.message || "ส่งข้อมูลไม่สำเร็จ");
        return;
      }

      setOk("ส่งรายงานสำเร็จ");
      // ล้างฟอร์ม
      setDescription("");
      setProblemWhere("");
      setProblemType("");
      setProblemSevere("");
      setImageUrl("");
      setHappenedAt("");
      setShowTime(false); // NEW
      setHappenedTime(""); // NEW

      onSubmitted?.();
    } catch (e) {
      console.error(e);
      setErr("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* แถบแจ้งเตือน */}
      {err && (
        <div className="rounded-lg bg-rose-50 text-rose-700 border border-rose-200 px-3 py-2 text-sm">
          {err}
        </div>
      )}
      {ok && (
        <div className="rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-2 text-sm">
          {ok}
        </div>
      )}

      {/* 1) เลือกประเภทปัญหา */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          คุณไปเจอปัญหาแบบไหนมา
        </label>
        <div className="relative">
          <select
            className="w-full appearance-none rounded-xl border border-slate-300 px-3 py-2 pr-9 text-sm outline-none focus:ring-2 focus:ring-slate-300 bg-white"
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            required
          >
            <option value="" disabled>
              -- เลือกประเภทปัญหา --
            </option>
            {types.map((t) => (
              <option key={t.problemType_id} value={t.problemType_id}>
                {t.problemType_name}
              </option>
            ))}
          </select>
          <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">▾</div>
        </div>
      </div>

      {/* 2) อีโมจิระดับความรุนแรง */}
      <div className="space-y-2">
        <div className="text-sm font-medium text-slate-700">
          ตอนนี้คุณเป็นอย่างไรกับปัญหาที่พบ
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {severes.map((s) => {
            const selected = String(s.problemSevere_id) === String(problemSevere);
            return (
              <button
                key={s.problemSevere_id}
                type="button"
                onClick={() => setProblemSevere(String(s.problemSevere_id))}
                className={
                  "flex flex-col items-center justify-center rounded-2xl border px-3 py-3 transition shadow-sm bg-white " +
                  (selected
                    ? "border-slate-900 ring-2 ring-slate-900/10"
                    : "border-slate-200 hover:border-slate-300")
                }
              >
                <div className="text-2xl leading-none">{pickEmoji(s.problemSevere_name || "")}</div>
                <div className="mt-1 text-sm text-slate-700 text-center">
                  {s.problemSevere_name}
                </div>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-slate-400">แตะเพื่อเลือก 1 รายการ</p>
      </div>

      {/* 3) วันที่เจอปัญหา + ปุ่มใส่เวลา */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-slate-700">
            คุณเจอปัญหาวันไหน
          </label>
          <button
            type="button"
            onClick={() => setShowTime((v) => !v)} // NEW
            className="text-xs rounded-lg border border-slate-300 px-2 py-1 hover:bg-slate-50"
          >
            {showTime ? "เอาเวลาออก" : "ใส่เวลาเพิ่ม"} {/* NEW */}
          </button>
        </div>
        <input
          type="date"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={happenedAt}
          onChange={(e) => setHappenedAt(e.target.value)}
        />

        {showTime && ( // NEW: ช่องเวลา
          <div className="mt-2">
            <label className="block text-xs text-slate-600 mb-1">
              เวลา (ไม่บังคับ)
            </label>
            <input
              type="time"
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
              value={happenedTime}
              onChange={(e) => setHappenedTime(e.target.value)}
              step={60} // นาทีละ 1 // NEW
            />
            <p className="text-xs text-slate-400 mt-1">
              ถ้าไม่ใส่เวลาจะใช้เวลา 00:00 ของวันที่เลือก
            </p>
          </div>
        )}
      </div>

      {/* 4) สถานที่ */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          แจ้งสถานที่ให้เราทราบ (ถ้ามี)
        </label>
        <input
          type="text"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={problemWhere}
          onChange={(e) => setProblemWhere(e.target.value)}
          placeholder="เช่น ในวิทยาลัย / บ้าน / ออนไลน์"
        />
      </div>

      {/* 5) รายละเอียด */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          เล่ารายละเอียดให้เราฟังหน่อย <span className="text-rose-600">*</span>
        </label>
        <textarea
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เขียนรายละเอียดที่ต้องการรายงาน..."
          required
        />
      </div>

      {/* 6) ลิงก์รูปภาพ */}
      <div className="space-y-1">
        <label className="block text-sm font-medium text-slate-700">
          ถ้าคุณมีรูปภาพ/วิดีโอหลักฐานโปรดแนบลิงก์ (ถ้ามี)
        </label>
        <input
          type="url"
          className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-slate-300"
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
        />
        <p className="text-xs text-slate-400">อนุญาตเฉพาะ JPG, JPEG, PNG • ไม่เกิน 2MB ต่อไฟล์ (หากอัปโหลดจริงควรทำฝั่ง backend)</p>
      </div>

      {/* 7) ปุ่มส่ง */}
      <div className="pt-2">
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-2xl bg-slate-900 text-white px-4 py-3 text-sm font-medium hover:opacity-90 shadow-sm disabled:opacity-60"
        >
          {loading ? "กำลังส่ง..." : "ส่งรายงาน"}
        </button>
      </div>

      <p className="text-xs text-slate-400">
        * ระบบจะดึง <code>token</code> จาก <code>localStorage</code> ชื่อ <code>token</code> เพื่อยืนยันตัวตน
      </p>
    </form>
  );
}
