"use client";
import BottomMenu from "../components/BottomMenu";
import { useState, useEffect, useRef } from "react";

export default function Song() {
    const [openReport, setOpenReport] = useState(false);
    const [songs, setSongs] = useState([]);
    const [playingSongs, setPlayingSongs] = useState([]);
    const audioMap = useRef({});

    // เก็บ volume ของแต่ละเพลง (0-1)
    const [volumes, setVolumes] = useState({});

    // โหลดเพลงจาก API
    useEffect(() => {
        async function fetchSongs() {
            try {
                const res = await fetch("/api/v1/song");
                const data = await res.json();
                setSongs(data.res || []);
            } catch (e) {
                console.error("โหลดเพลงไม่สำเร็จ", e);
            }
        }
        fetchSongs();
    }, []);

    const togglePlay = (song) => {
        const id = song.song_id;
        const isPlaying = playingSongs.includes(id);

        if (isPlaying) {
            audioMap.current[id].pause();
            setPlayingSongs((prev) => prev.filter((sid) => sid !== id));
            return;
        }

        if (playingSongs.length >= 3) {
            alert("สามารถเล่นพร้อมกันได้สูงสุด 3 เพลง");
            return;
        }

        if (!audioMap.current[id]) {
            audioMap.current[id] = new Audio(song.song_url);
            audioMap.current[id].volume = volumes[id] ?? 0.5; // ตั้ง default 0.5
        }

        audioMap.current[id].play();
        setPlayingSongs((prev) => [...prev, id]);
    };

    const changeVolume = (id, value) => {
        const vol = parseFloat(value);
        setVolumes((prev) => ({ ...prev, [id]: vol }));

        if (audioMap.current[id]) {
            audioMap.current[id].volume = vol;
        }
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
                    const id = song.song_id;
                    const isPlaying = playingSongs.includes(id);
                    const volume = volumes[id] ?? 0.5;

                    return (
                        <div key={id} className="flex flex-col items-center">
                            {/* ปุ่ม Play / Pause */}
                            <button
                                className="h-16 w-16 rounded-full bg-[#2fb297] text-white text-3xl flex items-center justify-center shadow-lg"
                                onClick={() => togglePlay(song)}
                            >
                                {isPlaying ? "❚❚" : "▶"}
                            </button>

                            {/* ปรับเสียง แสดงเฉพาะเมื่อเล่นอยู่ */}
                            {isPlaying && (
                                <div className="flex items-center mt-2 space-x-2">
                                    

                                    <input
                                        type="range"
                                        min={0}
                                        max={1}
                                        step={0.01}
                                        value={volume}
                                        onChange={(e) => changeVolume(id, e.target.value)}
                                        className="w-20"
                                    />

                                    
                                </div>
                            )}

                            {/* ชื่อเพลง */}
                            <div className="mt-3 text-center">
                                <span className="text-sm font-semibold">{song.song_name}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            <BottomMenu setOpenReport={setOpenReport} />
        </div>
    );
}
