"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { TrackRow } from "@/components/track/TrackCard";
import type { QueueTrack } from "@/store/player-store";

export const dynamic = "force-dynamic";

function SearchInner() {
  const params = useSearchParams();
  const q = params.get("q") ?? "";
  const [results, setResults] = useState<QueueTrack[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/tracks?q=${encodeURIComponent(q)}&limit=50`)
      .then((r) => r.json())
      .then((d) => setResults(d.tracks ?? []))
      .finally(() => setLoading(false));
  }, [q]);

  return (
    <div className="mt-2">
      <h1 className="text-2xl font-bold">
        {q ? `ผลลัพธ์สำหรับ “${q}”` : "ค้นหาเพลง"}
      </h1>
      <p className="mt-1 text-sm text-zinc-400">
        ค้นจากชื่อเพลง ศิลปิน และอัลบั้มในฐานข้อมูลจริง
      </p>
      <div className="mt-5">
        {loading ? (
          <p className="text-sm text-zinc-500">กำลังค้นหา...</p>
        ) : results.length === 0 ? (
          <p className="text-sm text-zinc-500">ไม่พบเพลง ลองคำอื่น หรืออัปโหลดเพลงเอง</p>
        ) : (
          results.map((t, i) => <TrackRow key={t.id} track={t} queue={results} index={i} />)
        )}
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<p className="mt-6 text-sm text-zinc-500">กำลังโหลด...</p>}>
      <SearchInner />
    </Suspense>
  );
}
