"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Shuffle,
  Repeat,
  Repeat1,
  Heart
} from "lucide-react";
import { usePlayer } from "@/store/player-store";
import { formatTime } from "@/lib/utils";

export function PlayerBar() {
  const { current, isPlaying, toggle, next, prev, shuffle, repeat, toggleShuffle, cycleRepeat } =
    usePlayer();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);

  // เปลี่ยนเพลง -> โหลด + เล่น + นับ plays
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    el.src = current.audioUrl;
    el.play().catch(() => {});
    setLiked(false);
    fetch(`/api/tracks/${current.id}/play`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // play / pause ตาม state
  useEffect(() => {
    const el = audioRef.current;
    if (!el || !current) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, current]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted]);

  if (!current) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-black px-4 py-3 text-center text-[13px] text-zinc-500">
        เลือกเพลงเพื่อเริ่มฟัง — อัปโหลดเพลงแรกได้ที่หน้า “อัปโหลดเพลง”
        <audio ref={audioRef} className="hidden" />
      </footer>
    );
  }

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-black/95 backdrop-blur">
      <audio
        ref={audioRef}
        onTimeUpdate={(e) => setProgress(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        onEnded={() => {
          if (repeat === "one" && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => {});
          } else next();
        }}
      />
      <div className="mx-auto grid max-w-[1400px] grid-cols-3 items-center gap-3 px-3 py-2.5 md:px-5">
        {/* ซ้าย: ปก + ชื่อ */}
        <div className="flex min-w-0 items-center gap-3">
          <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-md bg-surface-hover">
            {current.coverUrl ? (
              <Image src={current.coverUrl} alt={current.title} fill className="object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-lg">🎵</div>
            )}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{current.title}</p>
            <p className="truncate text-xs text-zinc-400">{current.artist}</p>
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            className={`ml-1 hidden sm:block ${liked ? "text-brand" : "text-zinc-500 hover:text-white"}`}
            aria-label="like"
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* กลาง: ปุ่ม + seek */}
        <div className="flex flex-col items-center gap-1.5">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleShuffle}
              className={`relative ${shuffle ? "text-brand" : "text-zinc-400 hover:text-white"}`}
              aria-label="shuffle"
            >
              <Shuffle size={16} />
              {shuffle && <span className="absolute -bottom-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-brand" />}
            </button>
            <button onClick={prev} className="text-zinc-300 hover:text-white" aria-label="prev">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <button
              onClick={toggle}
              className="grid h-9 w-9 place-items-center rounded-full bg-white text-black hover:scale-105 transition"
              aria-label="play-pause"
            >
              {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
            </button>
            <button onClick={next} className="text-zinc-300 hover:text-white" aria-label="next">
              <SkipForward size={20} fill="currentColor" />
            </button>
            <button
              onClick={cycleRepeat}
              className={`${repeat !== "off" ? "text-brand" : "text-zinc-400 hover:text-white"}`}
              aria-label="repeat"
            >
              <RepeatIcon size={16} />
            </button>
          </div>
          <div className="group/seek hidden w-full max-w-md items-center gap-2 sm:flex">
            <span className="w-10 text-right text-[11px] tabular-nums text-zinc-500">
              {formatTime(progress)}
            </span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={progress}
              onChange={(e) => {
                const v = Number(e.target.value);
                setProgress(v);
                if (audioRef.current) audioRef.current.currentTime = v;
              }}
              className="slider w-full"
            />
            <span className="w-10 text-[11px] tabular-nums text-zinc-500">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* ขวา: volume */}
        <div className="hidden items-center justify-end gap-2 sm:flex">
          <button
            onClick={() => setMuted((m) => !m)}
            className="text-zinc-400 hover:text-white"
            aria-label="mute"
          >
            {muted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => {
              setVolume(Number(e.target.value));
              setMuted(false);
            }}
            className="slider w-24"
          />
        </div>
        {/* mobile: ปุ่ม play อย่างเดียว */}
        <div className="flex justify-end sm:hidden">
          <button
            onClick={toggle}
            className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"
            aria-label="play-pause-mobile"
          >
            {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
          </button>
        </div>
      </div>
      {/* mobile seek bar บางๆ */}
      <div className="h-0.5 w-full bg-surface-hover sm:hidden">
        <div
          className="h-full bg-brand transition-[width]"
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        />
      </div>
    </footer>
  );
}
