import { sqliteTable, text, integer, primaryKey } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

// helper: id เป็น string (nanoid/uuid จาก app), createdAt เป็น ISO string
export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  image: text("image"),
  passwordHash: text("password_hash"),
  provider: text("provider").default("credentials"), // credentials | google
  createdAt: text("created_at").default(sql`(datetime('now'))`)
});

export const tracks = sqliteTable("tracks", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  artist: text("artist").notNull(),
  album: text("album"),
  genre: text("genre"),
  coverUrl: text("cover_url"),
  audioUrl: text("audio_url").notNull(),
  // ที่มาของเพลง: upload (ไฟล์ขึ้น R2) | external (ลิงก์ mp3 ตรง) | youtube | spotify
  source: text("source").default("upload"),
  youtubeId: text("youtube_id"),
  spotifyId: text("spotify_id"),
  duration: integer("duration").default(0), // วินาที
  plays: integer("plays").default(0),
  userId: text("user_id").references(() => users.id),
  createdAt: text("created_at").default(sql`(datetime('now'))`)
});

export const playlists = sqliteTable("playlists", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  coverUrl: text("cover_url"),
  userId: text("user_id").references(() => users.id),
  isPublic: integer("is_public").default(1),
  createdAt: text("created_at").default(sql`(datetime('now'))`)
});

export const playlistTracks = sqliteTable(
  "playlist_tracks",
  {
    playlistId: text("playlist_id")
      .notNull()
      .references(() => playlists.id, { onDelete: "cascade" }),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    addedAt: text("added_at").default(sql`(datetime('now'))`)
  },
  (t) => ({ pk: primaryKey({ columns: [t.playlistId, t.trackId] }) })
);

export const likes = sqliteTable(
  "likes",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    trackId: text("track_id")
      .notNull()
      .references(() => tracks.id, { onDelete: "cascade" }),
    createdAt: text("created_at").default(sql`(datetime('now'))`)
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.trackId] }) })
);

export type Track = typeof tracks.$inferSelect;
export type Playlist = typeof playlists.$inferSelect;
