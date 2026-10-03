import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import * as schema from "./schema";

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;

// dev ที่ยังไม่มี .env -> ใช้ไฟล์ sqlite local กัน crash (deploy จริงต้องตั้ง TURSO_*)
// NOTE: @libsql/client รองรับ `file:./local.db`
const client = createClient({
  url: url ?? "file:./local.db",
  authToken
});

export const db = drizzle(client, { schema });
