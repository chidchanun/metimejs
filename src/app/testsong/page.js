"use client";

import { useEffect, useState } from "react";
import RelaxPlayer from "@/app/components/RelaxPlayer";

export default function SongPage() {
  const [playlist, setPlaylist] = useState([]);

  useEffect(() => {
    async function fetchSongs() {
      try {
        const res = await fetch("/api/v1/song");
        const data = await res.json();
        if (data.message === "ok") {
          const songs = data.res.map((s) => ({
            title: s.song_name,
            src: s.song_url,
            cover: s.cover_url || "/relax/covers/default.jpg",
            artist: "Relax Audio",
          }));
          setPlaylist(songs);
        }
      } catch (e) {
        console.error(e);
      }
    }

    fetchSongs();
  }, []);

  return (
    <div className="max-w-2xl mx-auto mt-10">
      <h1 className="text-2xl font-bold mb-6">🎵 Relax Player</h1>
      <RelaxPlayer playlist={playlist} />
    </div>
  );
}
