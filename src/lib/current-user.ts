import { auth } from "@/lib/auth";

/** id ของผู้ใช้ที่ล็อกอินอยู่, null ถ้ายังไม่ล็อกอิน (ไม่ fallback เป็น demo) */
export async function getUserId(): Promise<string | null> {
  try {
    const session = await auth();
    const id = (session?.user as { id?: string } | undefined)?.id;
    return id ?? null;
  } catch {
    return null;
  }
}
