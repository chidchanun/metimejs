export async function VerifyToken() {
    try {
        // อ่าน token จาก cookie
        const tokenCookie = document.cookie
            .split("; ")
            .find((row) => row.startsWith("auth_token=")); // ✅ ตรงกับที่เซิร์ฟเวอร์ตั้งไว้

        if (!tokenCookie) {
            router.push("/login");
            return;
        }

        const token = decodeURIComponent(tokenCookie.split("=")[1]); // ✅ เผื่อ token มีอักขระพิเศษ

        // ตรวจสอบ token ผ่าน API
        const res = await fetch("/api/v1/token/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ token }),
        });

        const data = await res.json();
        console.log(data)

        if (res.status !== 200) {
            console.warn("Token ไม่ถูกต้อง:", data.message);
            router.push("/login");
            return;
        }

        console.log("✅ Token ยังไม่หมดอายุ:", data.newExpiresAt);
    } catch (err) {
        console.error("เกิดข้อผิดพลาด:", err);
        router.push("/login");
    }
};