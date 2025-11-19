// "use client";

// import { useState } from "react";
// import { useRouter } from "next/navigation";
// import { signIn } from "next-auth/react";
// import Image from 'next/image';

// export default function LoginPage() {
//   const router = useRouter();


//   const [studentCode, setStudentCode] = useState("");
//   const [password, setPassword] = useState("");
//   const [loading, setLoading] = useState(false);


//   async function onSubmit(e) {
//     e.preventDefault();

//     if (!studentCode || !password) return;
//     setLoading(true);

//     const res = await fetch(
//       `http://it.e-tech.ac.th/api/v1/login?username=${studentCode}&password=${password}`,
//       {
//         method: "POST"
//       }
//     );

//     const data = await res.json(); // 👈 แปลง response เป็น JSON

//     const resLocal = await fetch("/api/v1/login", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({
//         studentCode: studentCode,
//         password: password,
//         token: data.token
//       })
//     })


//     if (!resLocal.ok) {
//       setLoading(false);
//       return;
//     }

//     const tokenCookie = document.cookie
//       .split("; ")
//       .find((row) => row.startsWith("auth_token="));

//     const token = decodeURIComponent(tokenCookie.split("=")[1])

//     const resRole = await fetch("/api/v1/role", {
//       method: "POST",
//       headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ token })
//     });

//     const RoleJson = await resRole.json();
//     const RoleRouter = RoleJson.result[0].role_name

//     if (RoleRouter === "นักเรียน") {
//       setLoading(false);

//       router.push("/student-home")
//     } else if (RoleRouter === "อาจารย์ฝ่ายพัฒนา") {
//       setLoading(false);

//       router.push("teacher")
//     } else if (RoleRouter === "ผู้ดูแลระบบ") {
//       setLoading(false);
//       router.push("dashboard")

//     }

//   }

//   return (
//     <div className="min-h-screen flex items-center justify-center  bg-[#79A8D8] p-4">

//       <div className="w-full max-w-md">
//         <div className="bg-[#94cbf8] backdrop-blur-sm shadow-xl rounded-2xl p-8 border border-slate-200">
//           <div className="mb-6 text-center">
//             <Image
//               className="mx-auto block mb-2"
//               src="/metimelogo.png"
//               width={200}
//               height={200}
//               alt="Logo"
//               loading="lazy"
//               fetchPriority="high"
//             />
//             <h1 className="text-2xl font-semibold tracking-tight">เข้าสู่ระบบ</h1>
//             <p className="text-slate-500 text-sm">ใช้รหัสนักศึกษาและรหัสผ่านเดียวกับ e-student</p>
//           </div>

//           {/* {error && (
//             <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
//               ไม่สามารถเข้าสู่ระบบได้: {error}
//             </div>
//           )} */}

//           <form onSubmit={onSubmit} className="space-y-4">
//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">รหัสนักศึกษา</label>
//               <input
//                 type="text"
//                 inputMode="numeric"
//                 autoComplete="username"
//                 value={studentCode}
//                 onChange={(e) => setStudentCode(e.target.value.trim())}
//                 className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#084B83] text-black"
//                 placeholder="เช่น 64123456"
//                 required
//               />
//             </div>

//             <div>
//               <label className="block text-sm font-medium text-slate-700 mb-1">รหัสผ่าน</label>
//               <input
//                 type="password"
//                 autoComplete="current-password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 className="w-full rounded-xl border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#084B83] text-black"
//                 placeholder="รหัสผ่าน e-student"
//                 required
//               />
//             </div>

//             <button
//               type="submit"
//               disabled={loading}
//               className="w-full rounded-xl bg-slate-900 text-white py-2.5 font-medium hover:opacity-90 disabled:opacity-60 transition"
//             >
//               {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
//             </button>
//           </form>
//         </div>

//         <p className="mt-6 text-center text-xs text-slate-500">© {new Date().getFullYear()} METIME Support</p>
//       </div>
//     </div>
//   );
// }


"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
// import { signIn } from "next-auth/react"; // ไม่ได้ใช้ในโค้ดนี้ คอมเมนต์ออกไว้ก่อนได้ครับ
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();

  const [studentCode, setStudentCode] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();

    if (!studentCode || !password) return;
    setLoading(true);

    try {
      const res = await fetch(
        `http://it.e-tech.ac.th/api/v1/login?username=${studentCode}&password=${password}`,
        {
          method: "POST"
        }
      );

      const data = await res.json();

      const resLocal = await fetch("/api/v1/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          studentCode: studentCode,
          password: password,
          token: data.token
        })
      });

      if (!resLocal.ok) {
        setLoading(false);
        // อาจจะเพิ่ม Alert แจ้งเตือนตรงนี้ว่า Login ไม่สำเร็จ
        return;
      }

      const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token="));

      // ป้องกัน error กรณีไม่มี cookie
      if (!tokenCookie) {
        setLoading(false);
        return;
      }

      const token = decodeURIComponent(tokenCookie.split("=")[1]);

      const resRole = await fetch("/api/v1/role", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token })
      });

      const RoleJson = await resRole.json();

      // ป้องกัน error กรณีไม่มี result
      if (RoleJson.result && RoleJson.result.length > 0) {
        const RoleRouter = RoleJson.result[0].role_name;

        if (RoleRouter === "นักเรียน") {
          router.push("/student-home");
        } else if (RoleRouter === "อาจารย์ฝ่ายพัฒนา") {
          router.push("teacher");
        } else if (RoleRouter === "ผู้ดูแลระบบ") {
          router.push("dashboard");
        }
      } else {
        setLoading(false);
      }

    } catch (error) {
      console.error("Login error:", error);
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative p-4 overflow-hidden">
      {/* 1. Mobile Background (แก้ไข: เช็คนามสกุลไฟล์ให้ตรงกับของจริง) */}
      <div className="block md:hidden absolute inset-0 -z-10">
        <Image
          src="/img/BG_phone.png"  // 👈 แก้เป็น .jpg (ถ้าไฟล์จริงเป็น .jpg)
          alt="Mobile Background"
          fill
          className="object-cover object-bottom"
          quality={100}
          priority
        />
      </div>

      {/* 2. Desktop Background (แก้ไข: เพิ่ม hidden md:block เพื่อไม่ให้บังมือถือ) */}
      <div className="hidden md:block absolute inset-0 -z-10 bg-[#F5F7FA]">
        {/* 👆 เติม hidden md:block ตรงนี้ครับ */}
        <Image
          src="/img/BG_desktop.png" // เช็คนามสกุลด้วยว่าเป็น png หรือ jpg
          alt="Background"
          fill
          className="object-cover object-bottom"
          quality={100}
          priority
        />
      </div>

      <div className="w-full max-w-sm z-10 mb-24 md:mb-0 ">

        <div className="mb-8 text-center">
          {/* Logo Placeholder */}
          <div className="mx-auto w-60 h-40 flex items-center justify-center mb-4">
            <Image
              src="/img/logo_MEtime_colored.png"
              width={900}
              height={900}
              alt="Logo"
              className="object-contain"
            />
          </div>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">

          {/* Input รหัสนักศึกษา */}
          <div className="space-y-2">
            <label className="block text-gray-600 text-lg pl-2">รหัสนักศึกษา</label>
            <input
              type="text"
              inputMode="numeric"
              value={studentCode}
              onChange={(e) => setStudentCode(e.target.value.trim())}
              // สไตล์: ขอบมนเต็มวง (rounded-full), ขอบสีเขียวอ่อน, พื้นขาว
              className="w-full rounded-full border-2 border-[#C0E8E0] px-6 py-3 text-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#458E83] focus:ring-1 focus:ring-[#458E83] transition-colors"
              placeholder="รหัสนักศึกษา"
              required
            />
          </div>

          {/* Input รหัสผ่าน */}
          <div className="space-y-2">
            <label className="block text-gray-600 text-lg pl-2">รหัสผ่าน</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-full border-2 border-[#C0E8E0] px-6 py-3 text-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:border-[#458E83] focus:ring-1 focus:ring-[#458E83] transition-colors"
              placeholder="รหัสผ่าน"
              required
            />
          </div>

          {/* Button เข้าสู่ระบบ */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              // สไตล์: สีเขียวเข้ม (#458E83), มนเต็มวง, มีเงาสีฟ้าเทาๆ ด้านล่าง
              className="w-full rounded-full bg-[#4A9085] text-white text-xl font-bold py-3 hover:bg-[#3A7A70] transition-all shadow-[0_8px_20px_-5px_rgba(148,163,184,1)] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </div>

        </form>
        {/* </div> */}

      </div>
    </div>
  );
}