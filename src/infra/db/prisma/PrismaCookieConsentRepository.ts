import type { CookieConsent, CookieConsentChoice } from "@/domain";
import { isCookieConsentChoice } from "@/domain";
import type {
  CookieConsentRepository,
  RecordCookieConsentInput,
} from "@/ports/repositories/CookieConsentRepository";
import type { RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

function toDomain(row: {
  id: string;
  visitorId: string;
  choice: string;
  recordedAt: Date;
}): CookieConsent {
  return {
    id: row.id,
    visitorId: row.visitorId,
    choice: (isCookieConsentChoice(row.choice) ? row.choice : "accepted") as CookieConsentChoice,
    recordedAt: row.recordedAt,
  };
}

export class PrismaCookieConsentRepository implements CookieConsentRepository {
  async findLatestByVisitor(visitorId: string) {
    const row = await prisma.cookieConsent.findFirst({
      where: { visitorId },
      orderBy: { recordedAt: "desc" },
    });
    return row ? toDomain(row) : null;
  }
  async record(input: RecordCookieConsentInput): RepositoryResult<CookieConsent> {
    try {
      const row = await prisma.cookieConsent.create({
        data: { visitorId: input.visitorId, choice: input.choice },
      });
      return ok(toDomain(row));
    } catch {
      return err(persistenceError());
    }
  }
}
