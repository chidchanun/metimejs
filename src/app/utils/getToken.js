export async function getToken() {
    const tokenCookie = document.cookie
        .split("; ")
        .find((row) => row.startsWith("auth_token=")); // ✅ ตรงกับที่เซิร์ฟเวอร์ตั้งไว้

    const token = decodeURIComponent(tokenCookie.split("=")[1]);

    return token;
}