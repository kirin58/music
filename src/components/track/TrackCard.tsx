"use client";

import Image from "next/image";
import { Play, Pause, Heart } from "lucide-react";
import { useState } from "react";
import { usePlayer, type QueueTrack } from "@/store/player-store";
import { formatPlays, formatTime } from "@/lib/utils";

export function TrackCard({ track, queue }: { track: QueueTrack; queue: QueueTrack[] }) {
  const { current, isPlaying, play } = usePlayer();
  const active = current?.id === track.id;

  return (
    <div
      onClick={() => play(track, queue)}
      className="group cursor-pointer rounded-xl bg-surface-raised p-3 transition hover:bg-surface-hover"
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-surface-hover">
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center text-4xl">🎵</div>
        )}
        <button
          aria-label="play"
          className={`absolute bottom-2 right-2 grid h-11 w-11 place-items-center rounded-full bg-brand text-black shadow-lg transition-all hover:scale-105 hover:bg-brand-light ${
            active ? "opacity-100" : "translate-y-2 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
          }`}
        >
          {active && isPlaying ? (
            <Pause size={19} fill="currentColor" />
          ) : (
            <Play size={19} fill="currentColor" className="ml-0.5" />
          )}
        </button>
      </div>
      <p className="mt-2.5 truncate text-sm font-semibold">{track.title}</p>
      <p className="truncate text-[13px] text-zinc-400">{track.artist}</p>
    </div>
  );
}

export function TrackRow({
  track,
  queue,
  index
}: {
  track: QueueTrack;
  queue: QueueTrack[];
  index: number;
}) {
  const { current, isPlaying, play } = usePlayer();
  const [liked, setLiked] = useState(false);
  const active = current?.id === track.id;

  return (
    <div
      onClick={() => play(track, queue)}
      className={`group grid cursor-pointer grid-cols-[28px_1fr_auto] items-center gap-3 rounded-lg px-2 py-2 transition sm:grid-cols-[28px_44px_1fr_90px_60px] ${
        active ? "bg-surface-hover" : "hover:bg-surface-raised"
      }`}
    >
      <span className="text-center text-sm tabular-nums text-zinc-500">
        {active && isPlaying ? (
          <span className="inline-block h-3.5 w-3.5 animate-pulse rounded-sm bg-brand" />
        ) : (
          index + 1
        )}
      </span>
      <div className="relative hidden h-11 w-11 overflow-hidden rounded bg-surface-hover sm:block">
        {track.coverUrl ? (
          <Image src={track.coverUrl} alt={track.title} fill className="object-cover" />
        ) : (
          <div className="grid h-full w-full place-items-center">🎵</div>
        )}
      </div>
      <div className="min-w-0">
        <p className={`truncate text-sm font-medium ${active ? "text-brand" : ""}`}>
          {track.title}
        </p>
        <p className="truncate text-[13px] text-zinc-400">{track.artist}</p>
      </div>
      <span className="hidden text-right text-[13px] tabular-nums text-zinc-500 sm:block">
        {formatPlays(track.plays ?? 0)}
      </span>
      <div className="flex items-center justify-end gap-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setLiked((v) => !v);
          }}
          className={liked ? "text-brand" : "text-zinc-600 hover:text-white"}
          aria-label="like"
        >
          <Heart size={16} fill={liked ? "currentColor" : "none"} />
        </button>
        <span className="w-10 text-right text-[13px] tabular-nums text-zinc-500">
          {formatTime(track.duration ?? 0)}
        </span>
      </div>
    </div>
  );
}
