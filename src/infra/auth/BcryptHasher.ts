/**
 * bcryptjs-backed PasswordHasher for the AuthService.
 *
 * Cost factor 12 strikes a sensible balance for serverless functions —
 * fast enough for sub-second login but expensive enough to deter brute force.
 */
import bcrypt from "bcryptjs";
import type { PasswordHasher } from "@/services/auth/AuthService";

const BCRYPT_COST = 12;

export class BcryptHasher implements PasswordHasher {
  async hash(password: string): Promise<string> {
    return bcrypt.hash(password, BCRYPT_COST);
  }
  async verify(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
