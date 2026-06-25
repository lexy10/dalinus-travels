/**
 * Prisma-backed reset-token store for AuthService.
 *
 * Tokens are random 32-byte URL-safe strings persisted with an expiry. The
 * row is removed on `consume`. Expired tokens are checked at the call site
 * (AuthService.resetPassword) but a periodic sweep can be added later.
 */
import { randomBytes } from "crypto";
import type { ResetToken, TokenStore } from "@/services/auth/AuthService";
import { prisma } from "@/infra/db/prisma/client";

function generateToken(): string {
  return randomBytes(32).toString("base64url");
}

export class PrismaTokenStore implements TokenStore {
  async create(email: string, ttlMs: number): Promise<ResetToken> {
    const lowered = email.toLowerCase();
    const user = await prisma.user.findUnique({ where: { email: lowered } });
    if (!user) {
      // AuthService never calls `create` for a non-existent user; if it did,
      // we surface a synthetic token that resolves to "invalid" on lookup.
      return { token: generateToken(), email: lowered, expiresAt: new Date(0) };
    }
    const token = generateToken();
    const expiresAt = new Date(Date.now() + ttlMs);
    await prisma.resetToken.create({
      data: { token, email: lowered, userId: user.id, expiresAt },
    });
    return { token, email: lowered, expiresAt };
  }

  async find(token: string): Promise<ResetToken | null> {
    const row = await prisma.resetToken.findUnique({ where: { token } });
    if (!row) return null;
    return { token: row.token, email: row.email, expiresAt: row.expiresAt };
  }

  async consume(token: string): Promise<void> {
    await prisma.resetToken.deleteMany({ where: { token } });
  }
}
