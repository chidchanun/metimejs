import { IoPersonCircleSharp } from "react-icons/io5";

export default function ChatMessage({ message, role }) {
  const isStudent = role === "student";

  const safeMessage =
    typeof message === "object"
      ? message.detail || JSON.stringify(message)
      : message;

  return (
    <div
      className={`flex w-full my-2 text-black ${isStudent ? "justify-start" : "justify-end"
        }`}
    >
      {isStudent && <IoPersonCircleSharp className="w-10 h-10 mr-2" />}

      <div
        className={`text-lg max-w-[70%] px-4 py-2 rounded-2xl whitespace-pre-wrap break-words ${isStudent
            ? "bg-gray-200 text-black self-start rounded-tl-none"
            : "bg-blue-500 text-white self-end rounded-tr-none"
          }`}
      >
        {safeMessage}
      </div>

      {!isStudent && (
        <IoPersonCircleSharp className="w-10 h-10 ml-2 text-blue-500" />
      )}
    </div>
  );
}
