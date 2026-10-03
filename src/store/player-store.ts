import { create } from "zustand";

export type QueueTrack = {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  coverUrl?: string | null;
  audioUrl: string;
  duration?: number | null;
  plays?: number | null;
  source?: string | null;
  youtubeId?: string | null;
  spotifyId?: string | null;
};

type PlayerState = {
  current: QueueTrack | null;
  queue: QueueTrack[];
  index: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeat: "off" | "one" | "all";
  play: (track: QueueTrack, queue?: QueueTrack[]) => void;
  playQueue: (queue: QueueTrack[], index?: number) => void;
  toggle: () => void;
  setPlaying: (v: boolean) => void;
  next: () => void;
  prev: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
};

export const usePlayer = create<PlayerState>((set, get) => ({
  current: null,
  queue: [],
  index: -1,
  isPlaying: false,
  shuffle: false,
  repeat: "off",

  play: (track, queue) => {
    const q = queue ?? [track, ...get().queue.filter((t) => t.id !== track.id)];
    const idx = Math.max(
      0,
      q.findIndex((t) => t.id === track.id)
    );
    set({ current: q[idx], queue: q, index: idx, isPlaying: true });
  },
  playQueue: (queue, index = 0) => {
    if (!queue.length) return;
    set({
      queue,
      index,
      current: queue[index],
      isPlaying: true
    });
  },
  toggle: () => set((s) => ({ isPlaying: !s.isPlaying })),
  setPlaying: (v) => set({ isPlaying: v }),
  next: () => {
    const { queue, index, shuffle, repeat } = get();
    if (!queue.length) return;
    if (repeat === "one") {
      set({ isPlaying: true });
      return;
    }
    if (shuffle) {
      const i = Math.floor(Math.random() * queue.length);
      set({ index: i, current: queue[i], isPlaying: true });
      return;
    }
    const ni = index + 1;
    if (ni >= queue.length) {
      if (repeat === "all") set({ index: 0, current: queue[0], isPlaying: true });
      else set({ isPlaying: false });
      return;
    }
    set({ index: ni, current: queue[ni], isPlaying: true });
  },
  prev: () => {
    const { queue, index } = get();
    if (!queue.length) return;
    const pi = Math.max(0, index - 1);
    set({ index: pi, current: queue[pi], isPlaying: true });
  },
  toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
  cycleRepeat: () =>
    set((s) => ({
      repeat: s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off"
    }))
}));
