import { db } from "@/lib/db";
import { tracks } from "@/lib/schema";
import { desc } from "drizzle-orm";
import { HomeClient } from "./HomeClient";

export const dynamic = "force-dynamic";

async function getTracks() {
  try {
    return await db.select().from(tracks).orderBy(desc(tracks.createdAt)).limit(50);
  } catch {
    return [];
  }
}

export default async function HomePage() {
  const rows = await getTracks();
  return <HomeClient initial={rows} />;
}
