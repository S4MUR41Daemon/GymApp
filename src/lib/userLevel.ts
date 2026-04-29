import { eq } from "drizzle-orm";
import { db } from "@/db";
import { userLevels } from "@/db/schema";

export async function getOrCreateUserLevel(userId: string) {
  const existing = await db.query.userLevels.findFirst({
    where: eq(userLevels.userId, userId),
  });
  if (existing) return existing;

  const [created] = await db.insert(userLevels)
    .values({ userId })
    .returning();

  if (!created) {
    throw new Error("No se pudo crear el nivel del usuario.");
  }

  return created;
}
