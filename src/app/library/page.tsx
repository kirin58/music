"use client";

import { useEffect, useState } from "react";
import { TrackRow } from "@/components/track/TrackCard";
import type { QueueTrack } from "@/store/player-store";
import { Plus } from "lucide-react";

type Playlist = { id: string; name: string; description?: string | null; _count?: number };

export default function LibraryPage() {
  const [liked, setLiked] = useState<QueueTrack[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  async function refresh() {
    const [t, p] = await Promise.all([
      fetch("/api/likes").then((r) => r.json()).catch(() => ({ tracks: [] })),
      fetch("/api/playlists").then((r) => r.json()).catch(() => ({ playlists: [] }))
    ]);
    setLiked(t.tracks ?? []);
    setPlaylists(p.playlists ?? []);
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createPlaylist(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCreating(true);
    await fetch("/api/playlists", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name })
    });
    setName("");
    setCreating(false);
    refresh();
  }

  return (
    <div className="mt-2 grid gap-4 lg:grid-cols-[320px_1fr]">
      <section className="card h-fit p-5">
        <h2 className="text-lg font-bold">เพลย์ลิสต์ของฉัน</h2>
        <form onSubmit={createPlaylist} className="mt-3 flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="ชื่อเพลย์ลิสต์ใหม่..."
            className="input"
          />
          <button className="btn-brand shrink-0" disabled={creating}>
            <Plus size={16} />
          </button>
        </form>
        <div className="mt-4 space-y-2">
          {playlists.length === 0 && (
            <p className="text-[13px] text-zinc-500">ยังไม่มีเพลย์ลิสต์ สร้างอันแรกเลย</p>
          )}
          {playlists.map((p) => (
            <a
              key={p.id}
              href={`/playlist/${p.id}`}
              className="block rounded-lg bg-surface-hover p-3 transition hover:bg-[#333]"
            >
              <p className="truncate text-sm font-semibold">{p.name}</p>
              <p className="text-xs text-zinc-500">{p.description ?? "—"}</p>
            </a>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold">เพลงที่ถูกใจ</h2>
        <div className="mt-2">
          {liked.length === 0 ? (
            <p className="text-sm text-zinc-500">กดหัวใจที่เพลงไหนก็จะมาอยู่ตรงนี้</p>
          ) : (
            liked.map((t, i) => <TrackRow key={t.id} track={t} queue={liked} index={i} />)
          )}
        </div>
      </section>
    </div>
  );
}
