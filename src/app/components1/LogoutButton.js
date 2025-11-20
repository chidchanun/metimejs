"use client";

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
      className={`rounded-2xl bg-red-600 text-white px-4 py-3 text-sm md:text-base hover:opacity-90 shadow-sm transition-opacity active:opacity-80 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-300 ${className}`}
    >
      ออกจากระบบ
    </button>
  );
}
