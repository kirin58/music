"use client";

import { useState } from "react";
import { TrackRow } from "@/components/track/TrackCard";
import type { QueueTrack } from "@/store/player-store";
import { usePlayer } from "@/store/player-store";
import { Play } from "lucide-react";

export function PlaylistClient({
  id,
  name,
  initial
}: {
  id: string;
  name: string;
  initial: QueueTrack[];
}) {
  const { playQueue } = usePlayer();
  const [trackId, setTrackId] = useState("");
  const [all, setAll] = useState<QueueTrack[]>([]);
  const [msg, setMsg] = useState("");

  async function loadAll() {
    const r = await fetch("/api/tracks?limit=100").then((res) => res.json());
    setAll(r.tracks ?? []);
  }

  async function add() {
    if (!trackId) return;
    const r = await fetch(`/api/playlists/${id}/tracks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ trackId })
    });
    setMsg(r.ok ? "เพิ่มแล้ว รีเฟรชเพื่อดู" : "เพิ่มไม่สำเร็จ");
  }

  return (
    <div className="mt-2">
      <section className="flex items-end gap-5 rounded-2xl bg-gradient-to-br from-[#2a2a2a] to-surface-raised p-6">
        <div className="grid h-28 w-28 place-items-center rounded-xl bg-surface-hover text-4xl">🎶</div>
        <div>
          <p className="text-[13px] text-zinc-400">เพลย์ลิสต์</p>
          <h1 className="text-3xl font-extrabold">{name}</h1>
          <button onClick={() => playQueue(initial)} className="btn-brand mt-3 inline-flex items-center gap-2">
            <Play size={15} fill="currentColor" /> เล่นทั้งหมด
          </button>
        </div>
      </section>

      <div className="mt-5">
        {initial.length === 0 ? (
          <p className="text-sm text-zinc-500">เพลย์ลิสต์นี้ยังว่าง เพิ่มเพลงด้านล่าง</p>
        ) : (
          initial.map((t, i) => <TrackRow key={t.id} track={t} queue={initial} index={i} />)
        )}
      </div>

      <div className="card mt-6 p-4">
        <p className="text-sm font-semibold">เพิ่มเพลงเข้าเพลย์ลิสต์นี้</p>
        <div className="mt-2 flex gap-2">
          <button onClick={loadAll} className="btn-ghost shrink-0">
            โหลดรายชื่อเพลง
          </button>
          <select value={trackId} onChange={(e) => setTrackId(e.target.value)} className="input">
            <option value="">— เลือกเพลง —</option>
            {all.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title} — {t.artist}
              </option>
            ))}
          </select>
          <button onClick={add} className="btn-brand shrink-0">
            เพิ่ม
          </button>
        </div>
        {msg && <p className="mt-2 text-[13px] text-zinc-400">{msg}</p>}
      </div>
    </div>
  );
}
