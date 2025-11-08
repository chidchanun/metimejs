// src/utils/Redirect.js
export async function Redirect() {
  

  const tokenCookie = document.cookie
    .split("; ")
    .find((row) => row.startsWith("auth_token="));

  if (!tokenCookie) {
    console.warn("No auth_token cookie found");
    return;
  }

  const token = decodeURIComponent(tokenCookie.split("=")[1]);

  const res = await fetch("/api/v1/user/id", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  const UserLocalDB = await res.json();

  if (UserLocalDB?.UserLocalDB?.role_id === 1) {
    window.location.href = "http://localhost:3000/student-home"
  } else if (UserLocalDB?.UserLocalDB?.role_id === 2) {
    window.location.href = "http://localhost:3000/teacher"

    // router.push("/teacher");
  }
}
