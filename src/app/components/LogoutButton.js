"use client";

import { FiLogOut } from "react-icons/fi";

export default function LogoutButton({ className = "" }) {
  const handleLogout = () => {
    // ลบ cookie token
    document.cookie = "auth_token=; path=/; max-age=0;";

    // ลบค่าที่เก็บฝั่ง client ถ้ามี
    localStorage.removeItem("mood_today");

    // Redirect ไปหน้า login
    window.location.href = "/login";
  };

  return (
    <button
      onClick={handleLogout}
      aria-label="ออกจากระบบ"
      className={`
        flex items-center justify-center
        w-11 h-11 rounded-full
        bg-red-600 text-white
        shadow-md hover:opacity-90 active:opacity-80
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300
        ${className}
      `}
    >
      <FiLogOut className="w-5 h-5" />
    </button>
  );
}
