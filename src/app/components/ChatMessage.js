import { IoPersonCircleSharp } from "react-icons/io5";

export default function ChatMessage({ message, role }) {
  const isStudent = role === "student"; // ถ้าเป็นนักเรียน → ซ้าย / ถ้าเป็น ai → ขวา

  return (
    <div
      className={`flex w-full my-2 text-black ${
        isStudent ? "justify-start" : "justify-end"
      }`}
    >
      {/* ไอคอนเฉพาะฝั่ง student */}
      {isStudent && <IoPersonCircleSharp className="w-10 h-10 mr-2" />}

      <div
        className={`text-lg max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap wrap-anywhere ${
          isStudent
            ? "bg-gray-200 text-black self-start rounded-tl-none"
            : "bg-blue-500 text-white self-end rounded-tr-none"
        }`}
      >
        {message}
      </div>

      {/* ไอคอนเฉพาะฝั่ง AI */}
      {!isStudent && <IoPersonCircleSharp className="w-10 h-10 ml-2 text-blue-500" />}
    </div>
  );
}
