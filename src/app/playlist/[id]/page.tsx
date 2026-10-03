import { db } from "@/lib/db";
import { playlists, playlistTracks, tracks } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { PlaylistClient } from "./PlaylistClient";

export const dynamic = "force-dynamic";

export default async function PlaylistPage({ params }: { params: { id: string } }) {
  let name = "เพลย์ลิสต์";
  let rows: typeof tracks.$inferSelect[] = [];
  try {
    const pl = await db.select().from(playlists).where(eq(playlists.id, params.id)).limit(1);
    name = pl[0]?.name ?? name;
    const joined = await db
      .select({ track: tracks })
      .from(playlistTracks)
      .innerJoin(tracks, eq(playlistTracks.trackId, tracks.id))
      .where(eq(playlistTracks.playlistId, params.id));
    rows = joined.map((j) => j.track);
  } catch {
    // ยังไม่มี DB -> แสดงว่าง
  }
  return <PlaylistClient id={params.id} name={name} initial={rows} />;
}
