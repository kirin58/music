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

declare global {
  interface Window {
    YT?: {
      Player: new (el: HTMLElement, opts: Record<string, unknown>) => YTPlayer;
      PlayerState: { ENDED: number; PLAYING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YTPlayer = {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (s: number, allowSeekAhead: boolean) => void;
  setVolume: (v: number) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  destroy: () => void;
};

function loadYTAPI(): Promise<NonNullable<Window["YT"]>> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve(window.YT!);
    };
    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const s = document.createElement("script");
      s.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(s);
    }
  });
}

export function PlayerBar() {
  const { current, isPlaying, toggle, next, prev, shuffle, repeat, toggleShuffle, cycleRepeat } =
    usePlayer();
  const mediaRef = useRef<HTMLMediaElement | null>(null);
  const ytHostRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayer | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [liked, setLiked] = useState(false);
  const repeatRef = useRef(repeat);
  repeatRef.current = repeat;
  const nextRef = useRef(next);
  nextRef.current = next;

  const isYT = current?.source === "youtube" && !!current?.youtubeId;
  const isSpotify = current?.source === "spotify" && !!current?.spotifyId;
  const isAudio = !isYT && !isSpotify;

  // mp4/webm (container วิดีโอ) ต้องเล่นด้วย <video> ถึงจะได้ยินเสียงชัวร์ทุกเบราว์เซอร์
  const needsVideo =
    isAudio && !!current && /\.(mp4|mov|m4v|webm)(\?|#|$)/i.test(current.audioUrl);

  function onMediaTimeUpdate(e: React.SyntheticEvent<HTMLMediaElement>) {
    setProgress(e.currentTarget.currentTime);
  }
  function onMediaLoadedMetadata(e: React.SyntheticEvent<HTMLMediaElement>) {
    setDuration(e.currentTarget.duration);
  }
  function onMediaEnded() {
    if (repeatRef.current === "one" && mediaRef.current) {
      mediaRef.current.currentTime = 0;
      mediaRef.current.play().catch(() => {});
    } else nextRef.current();
  }

  // เปลี่ยนเพลง -> รีเซ็ต + นับ plays
  useEffect(() => {
    if (!current) return;
    setProgress(0);
    setDuration(current.duration ?? 0);
    setLiked(false);
    fetch(`/api/tracks/${current.id}/play`, { method: "POST" }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  // --- ไฟล์เสียง (upload / external): <audio> ---
  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !current || !isAudio) return;
    el.src = current.audioUrl;
    el.play().catch(() => {});
  }, [current?.id, isAudio]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = mediaRef.current;
    if (!el || !isAudio || !current) return;
    if (isPlaying) el.play().catch(() => {});
    else el.pause();
  }, [isPlaying, current, isAudio]);

  useEffect(() => {
    if (mediaRef.current && isAudio) {
      mediaRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted, isAudio]);

  // --- YouTube: IFrame Player API (ปุ่มของเราคุม player ที่ซ่อนอยู่) ---
  useEffect(() => {
    if (!isYT || !current?.youtubeId) return;
    let cancelled = false;
    let player: YTPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;

    loadYTAPI().then((YT) => {
      if (cancelled || !ytHostRef.current) return;
      player = new YT.Player(ytHostRef.current, {
        videoId: current.youtubeId,
        playerVars: { autoplay: 1, controls: 0, disablekb: 1, rel: 0 },
        events: {
          onReady: (e: { target: YTPlayer }) => {
            if (cancelled) return;
            ytPlayerRef.current = e.target;
            e.target.setVolume(muted ? 0 : Math.round(volume * 100));
            if (!usePlayer.getState().isPlaying) e.target.pauseVideo();
          },
          onStateChange: (e: { data: number }) => {
            if (e.data === YT.PlayerState.ENDED) {
              if (repeatRef.current === "one") player?.seekTo(0, true);
              else nextRef.current();
            }
          }
        }
      });
      timer = setInterval(() => {
        try {
          if (player) {
            setProgress(player.getCurrentTime() ?? 0);
            setDuration(player.getDuration() ?? 0);
          }
        } catch {}
      }, 500);
    });

    return () => {
      cancelled = true;
      if (timer) clearInterval(timer);
      try {
        player?.destroy();
      } catch {}
      ytPlayerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, isYT]);

  useEffect(() => {
    const p = ytPlayerRef.current;
    if (!p || !isYT) return;
    try {
      if (isPlaying) p.playVideo();
      else p.pauseVideo();
    } catch {}
  }, [isPlaying, isYT]);

  useEffect(() => {
    try {
      ytPlayerRef.current?.setVolume(muted ? 0 : Math.round(volume * 100));
    } catch {}
  }, [volume, muted]);

  function seek(v: number) {
    setProgress(v);
    if (isYT) {
      try {
        ytPlayerRef.current?.seekTo(v, true);
      } catch {}
    } else if (mediaRef.current) {
      mediaRef.current.currentTime = v;
    }
  }

  if (!current) {
    return (
      <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-black px-4 py-3 text-center text-[13px] text-zinc-500">
        เลือกเพลงเพื่อเริ่มฟัง — อัปโหลดหรือวางลิงก์เพลงแรกได้ที่หน้า “อัปโหลดเพลง”
      </footer>
    );
  }

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <footer className="fixed inset-x-0 bottom-0 z-30 border-t border-surface-border bg-black/95 backdrop-blur">
      {isAudio && !needsVideo && (
        <audio
          ref={(el) => {
            mediaRef.current = el;
          }}
          onTimeUpdate={onMediaTimeUpdate}
          onLoadedMetadata={onMediaLoadedMetadata}
          onEnded={onMediaEnded}
        />
      )}
      {isAudio && needsVideo && (
        <video
          playsInline
          preload="metadata"
          ref={(el) => {
            mediaRef.current = el;
          }}
          onTimeUpdate={onMediaTimeUpdate}
          onLoadedMetadata={onMediaLoadedMetadata}
          onEnded={onMediaEnded}
          className="hidden"
        />
      )}
      {/* host ซ่อนสำหรับ YouTube player */}
      {isYT && <div ref={ytHostRef} className="hidden" />}

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
            <p className="truncate text-xs text-zinc-400">
              {current.artist}
              {current.source && current.source !== "upload" ? ` • ${current.source}` : ""}
            </p>
          </div>
          <button
            onClick={() => setLiked((v) => !v)}
            className={`ml-1 hidden sm:block ${liked ? "text-brand" : "text-zinc-500 hover:text-white"}`}
            aria-label="like"
          >
            <Heart size={17} fill={liked ? "currentColor" : "none"} />
          </button>
        </div>

        {/* กลาง */}
        {isSpotify ? (
          <div className="flex items-center justify-center gap-2">
            <button onClick={prev} className="text-zinc-300 hover:text-white" aria-label="prev">
              <SkipBack size={20} fill="currentColor" />
            </button>
            <iframe
              key={current.spotifyId}
              src={`https://open.spotify.com/embed/track/${current.spotifyId}?utm_source=generator&theme=0`}
              width="340"
              height="80"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
              className="max-w-full rounded-xl"
            />
            <button onClick={next} className="text-zinc-300 hover:text-white" aria-label="next">
              <SkipForward size={20} fill="currentColor" />
            </button>
          </div>
        ) : (
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
                onChange={(e) => seek(Number(e.target.value))}
                className="slider w-full"
              />
              <span className="w-10 text-[11px] tabular-nums text-zinc-500">
                {formatTime(duration)}
              </span>
            </div>
          </div>
        )}

        {/* ขวา: volume (ซ่อนตอน Spotify เพราะคุมในกรอบ) */}
        <div className="hidden items-center justify-end gap-2 sm:flex">
          {!isSpotify && (
            <>
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
            </>
          )}
        </div>
        <div className="flex justify-end sm:hidden">
          {!isSpotify && (
            <button
              onClick={toggle}
              className="grid h-10 w-10 place-items-center rounded-full bg-white text-black"
              aria-label="play-pause-mobile"
            >
              {isPlaying ? <Pause size={19} fill="currentColor" /> : <Play size={19} fill="currentColor" className="ml-0.5" />}
            </button>
          )}
        </div>
      </div>
      <div className="h-0.5 w-full bg-surface-hover sm:hidden">
        <div
          className="h-full bg-brand transition-[width]"
          style={{ width: `${duration ? (progress / duration) * 100 : 0}%` }}
        />
      </div>
    </footer>
  );
}
