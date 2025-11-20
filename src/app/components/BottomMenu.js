import Image from "next/image";

export default function BottomMenu({ setOpenReport }) {
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

          <button aria-label="หน้าแรก" className="flex flex-col items-center">
            <Image src="/img/icon_home.png" alt="หน้าแรก" width={32} height={32} />
          </button>

          <button aria-label="เพลงผ่อนคลาย" className="flex flex-col items-center">
            <Image src="/img/icon_music.png" alt="เพลง" width={32} height={32} />
          </button>

          <button aria-label="กิจกรรมดีๆ" className="flex flex-col items-center">
            <Image src="/img/icon_AI.png" alt="AI" width={32} height={32} />
          </button>

          <button aria-label="ห้องแชท" className="flex flex-col items-center">
            <Image src="/img/icon_chat.png" alt="แชท" width={32} height={32} />
          </button>
        </div>
      </div>
    </footer>
  );
}
