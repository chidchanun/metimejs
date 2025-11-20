import Image from "next/image";

export default function BottomMenu({ setOpenReport }) {
  return (
    <footer className="relative mt-6 bg-[#cdeee4]">
      <div className="mx-auto max-w-md w-full pb-18 pt-4 relative">
        {/* ปุ่ม + ใหญ่ตรงกลาง */}
        <button
          onClick={() => setOpenReport(true)}
          className="absolute left-1/2 -top-10 -translate-x-1/2 h-28 w-28 rounded-full bg-[#2fb297] flex items-center justify-center text-4xl text-white shadow-xl border-4 border-[#cdeee4]"
        >
          +
        </button>

        {/* icon menu */}
        <div className="flex justify-between px-10 text-slate-700 gap-6">
          {/* หน้าแรก */}
          <button aria-label="หน้าแรก" className="flex flex-col items-center">
            <Image src="/img/icon_home.png" alt="หน้าแรก" width={32} height={32} />
          </button>

          {/* เพลงผ่อนคลาย */}
          <button aria-label="เพลงผ่อนคลาย" className="flex flex-col items-center">
            <Image src="/img/icon_music.png" alt="เพลง" width={32} height={32} />
          </button>

          {/* AI Activities */}
          <button aria-label="กิจกรรมดีๆ" className="flex flex-col items-center">
            <Image src="/img/icon_AI.png" alt="AI" width={32} height={32} />
          </button>

          {/* ห้องแชท */}
          <button aria-label="ห้องแชท" className="flex flex-col items-center">
            <Image src="/img/icon_chat.png" alt="แชท" width={32} height={32} />
          </button>
        </div>
      </div>
    </footer>
  );
}
