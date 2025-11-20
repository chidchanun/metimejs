/* eslint-disable react-hooks/exhaustive-deps */
"use client";

import { useEffect, useMemo, useState } from "react";
import { getToken } from "../utils/getToken";
import Image from "next/image";
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
  const [file, setFile] = useState(null); // ✅ เก็บไฟล์จริง
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

    let reportedAt;
    if (happenedAt) {
      const timePart = showTime && happenedTime ? happenedTime : "00:00";
      const dt = new Date(`${happenedAt}T${timePart}:00`);
      reportedAt = dt.toISOString();
    } else {
      reportedAt = new Date().toISOString();
    }

    // สร้าง FormData
    const formData = new FormData();
    formData.append("description", description);
    formData.append("problem_where", problemWhere || "");
    formData.append("problem_type", problemType);
    formData.append("problem_severe", problemSevere);
    formData.append("reported_at", reportedAt);
    formData.append("token", token);

    if (file) {
      formData.append("image", file); // ส่งไฟล์จริง
    }

    setLoading(true);
    try {
      const res = await fetch(endpoint || "/api/v1/report", {
        method: "POST",
        body: formData, // ✅ FormData
      });

      const data = await res.json();

      if (!res.ok) {
        setErr(data?.message || "ส่งข้อมูลไม่สำเร็จ");
        return;
      }

      setOk("ส่งรายงานสำเร็จ");
      setDescription("");
      setProblemWhere("");
      setProblemType("");
      setProblemSevere("");
      setFile(null);
      setHappenedAt("");
      setShowTime(false);
      setHappenedTime("");
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
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 text-center">
          ไปเจออะไรมา บอกเราได้นะ
        </label>

        <div className="relative mt-1">
          <select
            className={
              "w-full appearance-none rounded-2xl border border-[#DFE7F2] " +
              "bg-white px-4 py-3 pr-10 text-sm text-center  outline-none " +
              "focus:ring-2 focus:ring-[#C3D6F4] " +
              (problemType ? "text-slate-700" : "text-slate-400")
            }
            value={problemType}
            onChange={(e) => setProblemType(e.target.value)}
            required
          >
            <option value="" disabled>
              เลือกประเภทปัญหา
            </option>
            {types.map((t) => (
              <option key={t.problemType_id} value={t.problemType_id}>
                {t.problemType_name}
              </option>
            ))}
          </select>

          {/* ลูกศรขวา */}
          <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-300">

          </div>
        </div>
      </div>

      {/* 2) อีโมจิระดับความรุนแรง */}
      <div className="space-y-3">
        <div className="text-sm font-medium text-slate-700 text-center">
          ปัญหานี้รุนแรงแค่ไหน
        </div>

        <div className="grid grid-cols-3 gap-3 bg-[#C3E8D2] rounded-3xl py-4 px-2">
          {[
            {
              id: severes?.[0]?.problemSevere_id,
              name: "พอไหว",
              img: "/img/emoji2.png",
            },
            {
              id: severes?.[1]?.problemSevere_id,
              name: "เริ่มแย่",
              img: "/img/emojisad.png",
            },
            {
              id: severes?.[2]?.problemSevere_id,
              name: "ช่วยด้วยย",
              img: "/img/emoji1.png",
            },
          ].map((s, index) => {
            const selected = String(problemSevere) === String(s.id);

            return (
              <button
                key={s.id ?? `severe-${index}`}   // ✅ ป้องกัน key ซ้ำ
                type="button"
                onClick={() => setProblemSevere(String(s.id))}
                className={
                  "flex flex-col items-center justify-start rounded-2xl px-2 py-2 transition " +
                  (selected ? "opacity-100" : "opacity-60 hover:opacity-90")
                }
              >
                <Image src={s.img} alt={s.name} className="w-14 h-14 object-contain" width={0} height={0} loading="lazy" />

                {selected && (
                  <div className="mt-1 text-sm font-medium text-slate-800 text-center">
                    {s.name}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>




      {/* 5) รายละเอียด */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-slate-700 text-center">
          เล่าให้ฟังหน่อยได้มั้ย
        </label>

        <div className="relative">
          <textarea
            className="
        w-full
        rounded-3xl
        border
        border-[#E4E9F1]
        bg-white
        px-5
        py-4
        text-sm
        text-slate-700
        outline-none
        focus:ring-2
        focus:ring-[#D7E3F7]
        placeholder:text-[#B8C4D9]
        placeholder:text-center
        resize-none
      "
            rows={5}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เขียนรายละเอียดให้ฟังที"
            required
          />
        </div>
      </div>

      {/* 3 อันเรียงกันด้านล่าง */}
      <div className="grid grid-cols-3 gap-3 ">

        {/* --- วันที่เจอปัญหาเดิม --- */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 text-center">
            วันที่เจอ
          </label>


          <input
            type="date"
            className="w-full rounded-xl border border-none px-2 py-6 text-sm outline-none bg-white "
            value={happenedAt}
            placeholder="วันที่เจอ"
            onChange={(e) => setHappenedAt(e.target.value)}
          />

          {showTime && (
            <input
              type="time"
              className="w-full rounded-xl border border-slate-300 px-2 py-6 text-sm outline-none mt-1"
              value={happenedTime}
              onChange={(e) => setHappenedTime(e.target.value)}
              step={60}
            />
          )}
        </div>

        {/* --- สถานที่เดิม --- */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 text-center">
            สถานที่
          </label>

          <input
            type="text"
            className="w-full rounded-xl border border-none px-2 py-6 text-sm outline-none bg-white"
            value={problemWhere}
            onChange={(e) => setProblemWhere(e.target.value)}
            placeholder="เช่น วิทยาลัย / บ้าน"
          />
        </div>

        {/* --- อัปโหลดรูปเดิม --- */}
        <div className="space-y-1">
          <label className="block text-sm font-medium text-slate-700 text-center">
            รูปภาพ
          </label>

          <div className="relative w-full">
            <label
              htmlFor="file-upload"
              className="block w-full rounded-xl border border-none px-8 py-6 text-sm text-slate-400 cursor-pointer bg-white text-center"
            >
              {file ? file.name : "รูปภาพ"}
            </label>
            <input
              id="file-upload"
              type="file"
              accept="image/*"
              onChange={(e) => setFile(e.target.files[0])}
              className="hidden"
            />
          </div>

          {file && (
            <p className="text-xs text-slate-500 text-center">
              {file.name}
            </p>
          )}
        </div>

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
    </form>
  );
}
