"use client";

import { useMemo, useState } from "react";
import { TrackCard, TrackRow } from "@/components/track/TrackCard";
import type { QueueTrack } from "@/store/player-store";
import { usePlayer } from "@/store/player-store";
import { Play } from "lucide-react";

const GENRES = ["ทั้งหมด", "Pop", "Rock", "Hip-Hop", "R&B", "Indie", "Electronic", "ลูกทุ่ง", "เพื่อชีวิต", "อื่นๆ"];

export function HomeClient({ initial }: { initial: QueueTrack[] }) {
  const [genre, setGenre] = useState("ทั้งหมด");
  const { playQueue } = usePlayer();

  const list = useMemo(
    () => (genre === "ทั้งหมด" ? initial : initial.filter((t) => (t as { genre?: string | null }).genre === genre)),
    [initial, genre]
  );

  if (!initial.length) {
    return (
      <section className="card mt-4 p-10 text-center">
        <p className="text-5xl">🎧</p>
        <h1 className="mt-4 text-2xl font-bold">ยังไม่มีเพลงในระบบ</h1>
        <p className="mx-auto mt-2 max-w-md text-sm text-zinc-400">
          ตั้งค่า <code className="text-zinc-200">TURSO_DATABASE_URL</code> +{" "}
          <code className="text-zinc-200">R2_*</code> ในไฟล์ .env แล้วอัปโหลดไฟล์ .mp3
          แรกของคุณ ระบบจะสตรีมได้จริงทันที
        </p>
        <a href="/upload" className="btn-brand mt-6 inline-block">
          อัปโหลดเพลงแรก
        </a>
      </section>
    );
  }

  return (
    <div className="mt-2">
      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#1a3a26] via-surface-raised to-surface-raised p-6 md:p-8">
        <p className="text-[13px] font-medium text-zinc-300">มาแรงตอนนี้</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight md:text-4xl">
          ฟังเพลงที่คอมมูนิตี้โพสต์
        </h1>
        <p className="mt-2 max-w-lg text-sm text-zinc-400">
          สตรีมไฟล์จริงจาก object storage • เก็บยอดเล่น เพลย์ลิสต์ และไลก์ในฐานข้อมูลจริง
        </p>
        <button onClick={() => playQueue(list)} className="btn-brand mt-5 inline-flex items-center gap-2">
          <Play size={16} fill="currentColor" /> เล่นทั้งหมด
        </button>
      </section>

      <div className="mt-6 flex flex-wrap gap-2">
        {GENRES.map((g) => (
          <button
            key={g}
            onClick={() => setGenre(g)}
            className={`rounded-full px-4 py-1.5 text-[13px] font-medium transition ${
              genre === g ? "bg-white text-black" : "bg-surface-raised text-zinc-300 hover:bg-surface-hover"
            }`}
          >
            {g}
          </button>
        ))}
      </div>

      <h2 className="mb-3 mt-6 text-xl font-bold">อัลบั้ม / เพลงแนะนำ</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {list.slice(0, 10).map((t) => (
          <TrackCard key={t.id} track={t} queue={list} />
        ))}
      </div>

      <h2 className="mb-2 mt-8 text-xl font-bold">ทั้งหมด</h2>
      <div>
        {list.map((t, i) => (
          <TrackRow key={t.id} track={t} queue={list} index={i} />
        ))}
      </div>
    </div>
  );
}
