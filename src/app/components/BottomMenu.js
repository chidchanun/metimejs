import Image from "next/image";
import Link from "next/link";
import ChatComponent from "./ChatComponent";
import { useState, useRef, useCallback, useEffect } from "react";


function Modal({ open, onClose, title, children }) {
  const isOpen = !!open;
  const dialogRef = useRef(null);
  const lastFocusedEl = useRef(null);



  const esc = useCallback(
    (e) => {
      if (e.key === "Escape") onClose?.();
    },
    [onClose]
  );

  // ล็อกสกอร์ลเมื่อโมดัลเปิด + ฟังปุ่ม ESC
  useEffect(() => {
    if (!isOpen) return;
    if (typeof document !== "undefined") {
      document.documentElement.style.overflow = "hidden";
    }
    window.addEventListener("keydown", esc);
    return () => {
      window.removeEventListener("keydown", esc);
      if (typeof document !== "undefined") {
        document.documentElement.style.overflow = "";
      }
    };
  }, [isOpen, esc]);

  // โฟกัสภายในโมดัล (focus trap อย่างง่าย)
  useEffect(() => {
    if (!isOpen) return;
    lastFocusedEl.current = document.activeElement;
    dialogRef.current?.focus();
    return () => {
      lastFocusedEl.current?.focus?.();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-4">
        <div
          ref={dialogRef}
          tabIndex={-1}
          className="w-full max-w-xl sm:max-w-2xl rounded-2xl bg-white shadow-2xl border border-slate-200 outline-none"
        >
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-200">
            <h3 className="font-semibold text-base sm:text-lg text-black">{title}</h3>
            <button
              onClick={onClose}
              className="rounded-lg px-2 py-1 text-slate-600 hover:bg-slate-100"
              aria-label="ปิด"
            >
              ✕
            </button>
          </div>
          <div className="p-4 sm:p-5">{children}</div>
        </div>
      </div>
    </div>
  );
}

export default function BottomMenu({ setOpenReport }) {

  const [openChatAI, setOpenChatAI] = useState(false);

  return (
    <footer className="bg-[#cdeee4] bottom-0 fixed w-full left-0 h-24 flex justify-center">

      {/* กล่องภายใน กำหนดความกว้างสูงสุด */}
      <div className="relative w-full max-w-md h-full">

        {/* ปุ่ม + ลอยด้านบน */}
        <button
          onClick={() => setOpenReport(true)}
          className="absolute left-1/2 -translate-x-1/2 -top-7 
                     h-20 w-20 rounded-full bg-[#2fb297] 
                     flex items-center justify-center 
                     text-4xl text-white shadow-xl 
                     border-4 border-[#cdeee4] z-99"
        >
          +
        </button>

        {/* Bottom Menu */}
        <div className="absolute bottom-0 left-0 w-full h-full flex items-end justify-between px-6 pb-4">
          <Link href="/student-home">
            <button aria-label="หน้าแรก" className="flex flex-col items-center">
              <Image src="/img/icon_home.png" alt="หน้าแรก" width={32} height={32} />
            </button>
          </Link>
          <Link href="/song">
            <button aria-label="เพลงผ่อนคลาย" className="flex flex-col items-center">
              <Image src="/img/icon_music.png" alt="เพลง" width={32} height={32} />
            </button>
          </Link>
          <button aria-label="กิจกรรมดีๆ" className="flex flex-col items-center">
            <Image src="/img/icon_AI.png" alt="AI" width={32} height={32} />
          </button>

          <button aria-label="ห้องแชท" className="flex flex-col items-center" onClick={() => setOpenChatAI(true)}>
            <Image src="/img/icon_chat.png" alt="แชท" width={32} height={32} />
          </button>
        </div>
      </div>
      <Modal
        open={openChatAI}
        onClose={() => setOpenChatAI(false)}
        title={
          <div className="flex items-center gap-2">
            <Image
              src="/img/images.jpg"
              alt="BigBot Avatar"
              width={40}
              height={40}
              className="rounded-full"
            />
            <span>ห้องแชท AI BigBot</span>
          </div>
        }
      >
        <div className="h-[70vh]">
          <ChatComponent role_id={1} />
        </div>
      </Modal>
    </footer>
  );
}
