"use client";

import { useEffect, useState } from "react";

function getAuthTokenFromCookie() {
  if (typeof document === "undefined") return null;
  const tokenCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="));
  return tokenCookie ? decodeURIComponent(tokenCookie.split("=")[1]) : null;
}

function Modal({ open, onClose, title, children }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60]">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3">
        <div className="w-full max-w-xl rounded-2xl bg-white shadow-2xl border border-slate-200">
          <div className="flex justify-between px-4 py-3 border-b">
            <h3 className="font-medium text-black">{title}</h3>
            <button onClick={onClose}>✕</button>
          </div>
          <div className="p-4">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function UserReportsList() {
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState([]);
  const [error, setError] = useState("");
  const [selected, setSelected] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);


  // ✅ เพิ่ม Pagination state
  const [page, setPage] = useState(1);
  const limit = 5;

  const currentPageReports = reports.slice((page - 1) * limit, page * limit);
  const totalPages = Math.ceil(reports.length / limit);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const token = getAuthTokenFromCookie();
        if (!token) {
          window.location.href = "/login";
          return;
        }

        const res = await fetch("/api/v1/user-report", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(j?.message || "โหลดข้อมูลล้มเหลว");
        }

        const data = await res.json();
        console.log(data)
        setReports(data.result || []);
      } catch (err) {
        setError(err.message || "เกิดข้อผิดพลาด");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <div className="rounded-2xl border  border-slate-200 bg-white p-4 shadow-sm">
      <div className="font-medium mb-3 text-black">ปัญหาที่ฉันรายงาน</div>

      {loading && <div className="text-slate-500">กำลังโหลด...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && !error && currentPageReports.length === 0 && (
        <div className="text-slate-500 text-sm">ยังไม่มีการรายงาน</div>
      )}

      {!loading && currentPageReports.length > 0 && (
        <>
          <ul className="divide-y divide-slate-200">
            {currentPageReports.map((r) => (
              <li key={r.report_id} className="py-3 flex justify-between items-center">
                <div>
                  <div className="font-medium truncate">
                    #{r.report_id} • {r.problem_type || "ไม่ระบุประเภท"}
                  </div>
                  <div className="text-xs text-slate-500">
                    ความรุนแรง: {r.problem_severe || "-"} • สถานะ: {r.status_name || "ไม่พบสถานะ"} •{" "}
                    {r.reported_at ? new Date(r.reported_at).toLocaleString("th-TH") : "-"}
                  </div>
                </div>

                <button
                  className="text-sm text-white bg-slate-900 rounded-lg px-3 py-2 hover:opacity-90"
                  onClick={() => setSelected(r)}
                >
                  เปิดดู
                </button>
              </li>
            ))}
          </ul>

          {/* ✅ Pagination ปรากฏเฉพาะเมื่อมีมากกว่า limit */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-4">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded bg-slate-200 disabled:opacity-40"
              >
                ก่อนหน้า
              </button>

              <span className="text-sm text-slate-600 pt-1.5">
                หน้า {page} / {totalPages}
              </span>

              <button
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded bg-slate-200 disabled:opacity-40"
              >
                ถัดไป
              </button>
            </div>
          )}
        </>
      )}

      {/* โมดัล */}
      {/* <Modal open={!!selected} onClose={() => setSelected(null)} title="รายละเอียดรายงาน">
        {selected && (
          <div className="space-y-2 text-sm">
            <p><b>ประเภท:</b> {selected.problem_type}</p>
            <p><b>ความรุนแรง:</b> {selected.problem_severe}</p>
            <p><b>สถานที่:</b> {selected.problem_where}</p>
            <p><b>คำอธิบาย:</b> {selected.description}</p>

            
          </div>
        )}
      </Modal> */}

      {/* โมดัล */}
      <Modal open={!!selected} onClose={() => setSelected(null)} title="รายละเอียดรายงาน">
        {selected && (
          <div className="space-y-2 text-sm">
            <p><b>ประเภท:</b> {selected.problem_type}</p>
            <p><b>ความรุนแรง:</b> {selected.problem_severe}</p>
            <p><b>สถานที่:</b> {selected.problem_where}</p>
            <p><b>คำอธิบาย:</b> {selected.description}</p>
            <p><b>สถานะ:</b> {selected.status_name || "ไม่พบสถานะ"}</p>

            {selected.image_url && (
              <div className="pt-2">
                <p className="font-medium mb-1">รูปภาพประกอบ</p>

                <div className="flex justify-center">
                  <img
                    src={selected.image_url}
                    alt="รูปภาพประกอบรายงาน"
                    className="rounded-lg max-h-64 object-contain border border-slate-200 cursor-pointer"
                    onClick={() => setPreviewImage(selected.image_url)}  // 👈 คลิกเพื่อขยาย
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal
        open={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title="รูปภาพประกอบ"
      >
        <div className="flex justify-center">
          <img
            src={previewImage}
            alt="ขยายรูปภาพ"
            className="max-h-[80vh] rounded-lg object-contain"
          />
        </div>
      </Modal>

    </div>
  );
}
