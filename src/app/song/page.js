"use client";
import BottomMenu from "../components/BottomMenu";
import { useState, useRef } from "react";

export default function Song() {
  const [openReport, setOpenReport] = useState(false);

  // เก็บเพลงที่กำลังเล่นอยู่ (ID)
  const [playingSongs, setPlayingSongs] = useState([]);

  // เก็บ audio element ของแต่ละเพลง
  const audioMap = useRef({});

  const songs = [
    { id: 1, title: "Relax 1", file: "/music/relax1.mp3" },
    { id: 2, title: "Relax 2", file: "/music/relax2.mp3" },
    { id: 3, title: "Relax 3", file: "/music/relax3.mp3" },
    { id: 4, title: "Relax 4", file: "/music/relax3.mp3" },
    { id: 5, title: "Relax 5", file: "/music/relax3.mp3" }, 
    { id: 6, title: "Relax 6", file: "/music/relax3.mp3" },
    { id: 7, title: "Relax 1", file: "/music/relax1.mp3" },
    { id: 8, title: "Relax 2", file: "/music/relax2.mp3" },
    { id: 9, title: "Relax 3", file: "/music/relax3.mp3" },
    { id: 10, title: "Relax 4", file: "/music/relax3.mp3" },
    { id: 11, title: "Relax 5", file: "/music/relax3.mp3" },
    { id: 12, title: "Relax 6", file: "/music/relax3.mp3" },
    { id: 13, title: "Relax 1", file: "/music/relax1.mp3" },
    { id: 14, title: "Relax 2", file: "/music/relax2.mp3" },
    { id: 15, title: "Relax 3", file: "/music/relax3.mp3" },
    { id: 16, title: "Relax 4", file: "/music/relax3.mp3" },
    { id: 17, title: "Relax 5", file: "/music/relax3.mp3" },
    { id: 18, title: "Relax 6", file: "/music/relax3.mp3" },
    // ...ต่อไป
  ];

  const togglePlay = (song) => {
    const isPlaying = playingSongs.includes(song.id);

    // ถ้า pause
    if (isPlaying) {
      audioMap.current[song.id].pause();
      setPlayingSongs((prev) => prev.filter((id) => id !== song.id));
      return;
    }

    // ถ้าเล่นเพิ่มแล้วเกิน 3 เพลง → ไม่ให้เล่นเพิ่ม
    if (playingSongs.length >= 3) {
      alert("สามารถเล่นพร้อมกันได้สูงสุด 3 เพลง");
      return;
    }

    // ถ้ายังไม่มี audio ของเพลงนี้ → สร้างใหม่
    if (!audioMap.current[song.id]) {
      audioMap.current[song.id] = new Audio(song.file);
    }

    // Play เพลงใหม่
    audioMap.current[song.id].play();

    // เพิ่มเข้ารายชื่อเพลงที่เล่นอยู่
    setPlayingSongs((prev) => [...prev, song.id]);
  };

  return (
    <div className="w-screen h-screen relative flex flex-col pb-24 overflow-x-hidden">
      {/* Header */}
      <div className="bg-[#C0E8E0] w-full min-h-24 text-[#34495E] text-4xl font-bold flex justify-center items-center">
        MEtime Radio
      </div>

      {/* Grid เพลง */}
      <div className="grid grid-cols-3 gap-6 p-6 w-full">
        {songs.map((song) => {
          const isPlaying = playingSongs.includes(song.id);

          return (
            <div key={song.id} className="flex flex-col items-center">

              {/* ปุ่ม Play / Pause */}
              <button
                className="h-16 w-16 rounded-full bg-[#2fb297] text-white text-3xl flex items-center justify-center shadow-lg"
                onClick={() => togglePlay(song)}
              >
                {isPlaying ? "❚❚" : "▶"}
              </button>

              {/* ชื่อเพลง */}
              <div className="mt-3 text-center">
                <span className="text-sm font-semibold">{song.title}</span>
              </div>

            </div>
          );
        })}
      </div>

      <BottomMenu setOpenReport={setOpenReport} />
    </div>
  );
}
