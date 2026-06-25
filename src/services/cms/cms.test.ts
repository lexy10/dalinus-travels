/**
 * Property-based tests for BlogService and MarketingPageService.
 *
 * Covers Properties 46–48 from the design document.
 */
import { describe, it, expect, beforeEach } from "vitest";
import * as fc from "fast-check";
import { BlogService } from "./BlogService";
import { MarketingPageService } from "./MarketingPageService";
import { InMemoryBlogArticleRepository } from "@/test/fakes/repositories/InMemoryBlogArticleRepository";
import { InMemoryMarketingPageRepository } from "@/test/fakes/repositories/InMemoryMarketingPageRepository";
import {
  AccountStatus,
  MarketingPageKey,
  PublicationStatus,
  Role,
  type BlogArticle,
} from "@/domain";
import { DomainErrorKind } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";

const adminActor: ActorContext = {
  userId: "admin-1",
  roles: new Set([Role.ADMINISTRATOR]),
  accountStatus: AccountStatus.ACTIVE,
  profileComplete: true,
  locale: "en",
};

const nonAdminActor: ActorContext = {
  userId: "u-1",
  roles: new Set([Role.STUDENT_TRAVELER]),
  accountStatus: AccountStatus.ACTIVE,
  profileComplete: true,
  locale: "en",
};

// ===========================================================================
// BlogService
// ===========================================================================

let blogRepo: InMemoryBlogArticleRepository;
let blogService: BlogService;

beforeEach(() => {
  blogRepo = new InMemoryBlogArticleRepository();
  blogService = new BlogService({ blogRepo });
});

const articleArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 60 }).filter((s) => s.trim() !== ""),
  slug: fc.stringMatching(/^[a-z][a-z0-9-]{1,30}$/),
  body: fc.string({ minLength: 1, maxLength: 200 }),
  status: fc.constantFrom(PublicationStatus.PUBLISHED, PublicationStatus.DRAFT),
  publishedAt: fc.date({ min: new Date("2024-01-01"), max: new Date("2027-12-31") }),
});

// ---------------------------------------------------------------------------
// Property 46: Only Published articles are ever visible, ordered most recent first
// Feature: edu-travel-platform, Property 46: Only Published articles are ever visible, ordered most recent first
// ---------------------------------------------------------------------------

describe("Property 46: Only Published articles are ever visible, ordered most recent first", () => {
  it("public listing has exactly Published, ordered most-recent-first; non-published reads return NotFound", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.array(articleArb, { minLength: 1, maxLength: 8 }),
        async (articles) => {
          blogRepo.clear();
          // De-dup by id and slug
          const byId = new Map(articles.map((a) => [a.id, a]));
          const bySlug = new Map<string, (typeof articles)[number]>();
          for (const a of byId.values()) bySlug.set(a.slug, a);
          const unique = [...bySlug.values()];

          for (const a of unique) {
            const seeded: BlogArticle = {
              id: a.id,
              authorId: "admin-1",
              title: a.title,
              slug: a.slug,
              body: a.body,
              status: a.status,
              publishedAt: a.status === PublicationStatus.PUBLISHED ? a.publishedAt : null,
              createdAt: a.publishedAt,
              updatedAt: a.publishedAt,
            };
            blogRepo.seed(seeded);
          }

          const visible = await blogService.listPublished();
          const expected = unique.filter((a) => a.status === PublicationStatus.PUBLISHED);
          expect(visible).toHaveLength(expected.length);

          // Most-recent-first ordering by publishedAt
          for (let i = 0; i + 1 < visible.length; i++) {
            const a = visible[i]!.publishedAt!.getTime();
            const b = visible[i + 1]!.publishedAt!.getTime();
            expect(a).toBeGreaterThanOrEqual(b);
          }

          // Non-published reads return NotFound and never expose body
          for (const a of unique) {
            if (a.status === PublicationStatus.PUBLISHED) continue;
            const r = await blogService.getPublishedBySlug(a.slug);
            expect(r.ok).toBe(false);
            if (!r.ok) {
              expect(r.error.kind).toBe(DomainErrorKind.NotFound);
            }
          }
        },
      ),
      { numRuns: 30 },
    );
  });

  it("unpublishing revokes visibility", async () => {
    await fc.assert(
      fc.asyncProperty(articleArb, async (a) => {
        blogRepo.clear();
        const seeded: BlogArticle = {
          id: a.id,
          authorId: "admin-1",
          title: a.title,
          slug: a.slug,
          body: a.body,
          status: PublicationStatus.PUBLISHED,
          publishedAt: a.publishedAt,
          createdAt: a.publishedAt,
          updatedAt: a.publishedAt,
        };
        blogRepo.seed(seeded);

        const before = await blogService.getPublishedBySlug(a.slug);
        expect(before.ok).toBe(true);

        const unpublish = await blogService.unpublish(a.id, adminActor);
        expect(unpublish.ok).toBe(true);

        const after = await blogService.getPublishedBySlug(a.slug);
        expect(after.ok).toBe(false);
      }),
      { numRuns: 30 },
    );
  });
});

// ---------------------------------------------------------------------------
// Property 47: Publishing requires all required fields
// Feature: edu-travel-platform, Property 47: Publishing requires all required fields
// ---------------------------------------------------------------------------

describe("Property 47: Publishing requires all required fields", () => {
  it("rejects publish when any of title/slug/body is missing or empty", async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.record({
          dropTitle: fc.boolean(),
          dropSlug: fc.boolean(),
          dropBody: fc.boolean(),
        }),
        async ({ dropTitle, dropSlug, dropBody }) => {
          fc.pre(dropTitle || dropSlug || dropBody);
          blogRepo.clear();

          const result = await blogService.publish(
            {
              title: dropTitle ? "" : "T",
              slug: dropSlug ? "" : "t-slug",
              body: dropBody ? "" : "Body",
            },
            adminActor,
          );

          expect(result.ok).toBe(false);
          if (result.ok) return;
          expect(result.error.kind).toBe(DomainErrorKind.Validation);
        },
      ),
    );
  });

  it("rejects non-admin actors with AuthorizationError", async () => {
    const result = await blogService.publish(
      { title: "T", slug: "s", body: "B" },
      nonAdminActor,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error.kind).toBe(DomainErrorKind.Authorization);
  });
});

// ===========================================================================
// MarketingPageService
// ===========================================================================

let pageRepo: InMemoryMarketingPageRepository;
let pageService: MarketingPageService;

beforeEach(() => {
  pageRepo = new InMemoryMarketingPageRepository();
  pageService = new MarketingPageService({ pageRepo });
});

// ---------------------------------------------------------------------------
// Property 48: CMS updates round-trip on subsequent retrieval (subset for pages)
// Feature: edu-travel-platform, Property 48: CMS updates round-trip on subsequent retrieval
// ---------------------------------------------------------------------------

describe("Property 48: CMS updates round-trip on subsequent retrieval", () => {
  it("a marketing-page upsert is visible on the next get", async () => {
    const keyArb = fc.constantFrom(
      MarketingPageKey.ABOUT,
      MarketingPageKey.FAQ,
      MarketingPageKey.GUIDANCE_VISA,
    );
    const bodyArb = fc.string({ minLength: 1, maxLength: 200 });

    await fc.assert(
      fc.asyncProperty(keyArb, bodyArb, async (key, body) => {
        pageRepo.clear();

        const upsert = await pageService.upsert(
          { key, localizedContent: { en: body }, status: PublicationStatus.PUBLISHED },
          adminActor,
        );
        expect(upsert.ok).toBe(true);

        const get = await pageService.getPublishedContent(key, "en");
        expect(get.ok).toBe(true);
        if (!get.ok) return;
        expect(get.value.body).toBe(body);
        expect(get.value.fellBackToDefault).toBe(false);
      }),
    );
  });

  it("non-administrators cannot upsert", async () => {
    const r = await pageService.upsert(
      { key: MarketingPageKey.ABOUT, localizedContent: { en: "x" } },
      nonAdminActor,
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe(DomainErrorKind.Authorization);
  });

  it("draft pages are not publicly readable", async () => {
    await pageRepo.upsert({
      key: MarketingPageKey.PRIVACY,
      localizedContent: { en: "secret" },
      status: PublicationStatus.DRAFT,
    });
    const r = await pageService.getPublishedContent(MarketingPageKey.PRIVACY, "en");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.kind).toBe(DomainErrorKind.NotFound);
  });
});
