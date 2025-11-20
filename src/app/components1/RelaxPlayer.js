"use client";
import { useEffect, useMemo, useRef, useState } from "react";

const formatTime = (sec) => {
  if (!Number.isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

// ✅ เอากรอบ/พื้นหลัง/เงาออก และรองรับ className จากภายนอก
export default function RelaxPlayer({ playlist = [], className = "" }) {
  const audioRef = useRef(null);
  const [songs, setSongs] = useState([]);

  useEffect(() => {
    async function loadSongs() {
      try {
        const res = await fetch("/api/v1/song", { cache: "no-store" });
        const data = await res.json();
        setSongs(
          (data?.res ?? []).map((s) => ({
            id: s.id,
            title: s.song_name,
            artist: "Metime",
            src: s.song_url,
            cover: s.cover_url ?? s.thumbnail_url ?? "/relax/covers/default.jpg",
          }))
        );
      } catch (e) {
        console.error("โหลดเพลงล้มเหลว:", e);
      }
    }
    loadSongs();
  }, []);

  const list = songs.length ? songs : playlist;

  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.9);
  const [isLoop, setIsLoop] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);

  useEffect(() => {
    if (!list.length) return;
    setIndex((i) => (i >= list.length ? 0 : i));
  }, [list.length]);

  const current = list[index];

  const nextIndex = useMemo(() => {
    if (!list.length) return 0;
    if (isShuffle) {
      let r = Math.floor(Math.random() * list.length);
      if (r === index && list.length > 1) r = (r + 1) % list.length;
      return r;
    }
    return (index + 1) % list.length;
  }, [index, isShuffle, list.length]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onLoaded = () => setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
    const onTime = () => setCurrentTime(Number.isFinite(audio.currentTime) ? audio.currentTime : 0);
    const onEnded = () => {
      if (isLoop) {
        audio.currentTime = 0;
        audio.play().catch(() => setIsPlaying(false));
      } else {
        setIndex(nextIndex);
      }
    };

    audio.volume = volume;
    audio.addEventListener("loadedmetadata", onLoaded);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    return () => {
      audio.removeEventListener("loadedmetadata", onLoaded);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
    };
  }, [isLoop, nextIndex, volume]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !current?.src) return;
    setCurrentTime(0);
    setDuration(0);
    audio.loop = isLoop;
    audio.load();
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [current?.src, isLoop, isPlaying]);

  useEffect(() => {
    const onKey = (e) => {
      // if (e.code === "Space") {
      //   e.preventDefault();
      //   togglePlay();
      // } else 
      if (e.key === "ArrowLeft") {
        const audio = audioRef.current;
        if (audio) audio.currentTime = Math.max(0, audio.currentTime - 5);
      } else if (e.key === "ArrowRight") {
        const audio = audioRef.current;
        if (audio && Number.isFinite(audio.duration)) {
          audio.currentTime = Math.min(audio.duration, audio.currentTime + 5);
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    }
  };

  const handleSeek = (e) => {
    const audio = audioRef.current;
    if (!audio) return;
    const val = Number(e.target.value);
    audio.currentTime = val;
    setCurrentTime(val);
  };

  const handleVolume = (e) => {
    const audio = audioRef.current;
    const val = Number(e.target.value);
    setVolume(val);
    if (audio) audio.volume = val;
  };

  const prev = () => {
    if (!list.length) return;
    setIndex((i) => (i - 1 + list.length) % list.length);
  };

  const next = () => {
    if (!list.length) return;
    setIndex(nextIndex);
  };

  if (!list.length) {
    // ❌ ไม่มีกรอบ/พื้นหลัง/เงา
    return <div className={`p-0 text-sm text-slate-600 ${className}`}>ไม่มีเพลงในเพลย์ลิสต์</div>;
  }

  return (
    // ❌ ไม่มี rounded/border/bg/shadow แล้ว
    <div className={`w-full ${className}`}>
      <div className="flex items-center gap-4">
        <img
          src={current.cover || "/relax/covers/default.jpg"}
          alt={current.title}
          className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl object-cover" // เอา border ออก
        />
        <div className="min-w-0">
          <div className="truncate font-medium text-black">{current.title}</div>
          <div className="text-xs text-slate-500 truncate">{current.artist || "Relax Audio"}</div>
        </div>
      </div>

      {/* progress */}
      <div className="mt-4">
        <input
          type="range"
          min={0}
          max={Number.isFinite(duration) ? duration : 0}
          step={0.1}
          value={currentTime}
          onChange={handleSeek}
          className="w-full"
        />
        <div className="mt-1 flex justify-between text-xs text-slate-500">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>
      </div>

      {/* controls */}
      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsShuffle((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-sm border text-black ${isShuffle ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"
              }`}
            title="สุ่มเพลง"
          >
            สุ่ม
          </button>
          <button
            onClick={() => setIsLoop((v) => !v)}
            className={`px-3 py-1.5 rounded-lg text-sm border text-black ${isLoop ? "bg-slate-900 text-white border-slate-900" : "border-slate-300"
              }`}
            title="เล่นซ้ำ"
          >
            ซ้ำ
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={prev}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 text-black"
            title="ก่อนหน้า"
          >
            ◀
          </button>
          <button
            onClick={togglePlay}
            className="rounded-xl bg-slate-900 text-white px-4 py-1.5 text-sm hover:opacity-90"
            title={isPlaying ? "หยุดชั่วคราว" : "เล่น"}
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
          <button
            onClick={next}
            className="rounded-xl border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50 text-black"
            title="ถัดไป"
          >
            ▶
          </button>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2">
          <span className="text-xs text-slate-500">เสียง</span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={handleVolume}
            className="w-full sm:w-28"
          />
        </div>

      </div>

      <audio ref={audioRef} preload="metadata">
        <source src={current.src} type="audio/mp4" />
      </audio>
    </div>
  );
}
