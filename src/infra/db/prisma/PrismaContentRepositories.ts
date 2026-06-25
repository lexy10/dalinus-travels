/**
 * Bundled adapters for the three CMS content repos:
 * BlogArticle, MarketingPage, Statistic.
 */
import { Prisma } from "@prisma/client";
import type {
  BlogArticle,
  MarketingPage,
  MarketingPageKey,
  PublicationStatus,
  Statistic,
  StatisticKey,
  StatisticValueType,
} from "@/domain";
import { isMarketingPageKey, isPublicationStatus, isStatisticKey, isStatisticValueType } from "@/domain";
import type {
  BlogArticleRepository,
  CreateBlogArticleInput,
  UpdateBlogArticleInput,
} from "@/ports/repositories/BlogArticleRepository";
import type {
  MarketingPageRepository,
  UpsertMarketingPageInput,
} from "@/ports/repositories/MarketingPageRepository";
import type { StatisticRepository } from "@/ports/repositories/StatisticRepository";
import type { Pagination, RepositoryResult } from "@/ports/repositories/common";
import { ok, err } from "@/domain/kernel";
import { persistenceError } from "@/domain/kernel/errors";
import { prisma } from "./client";

// ---------------------------------------------------------------------------
// BlogArticle
// ---------------------------------------------------------------------------

function toDomainBlog(row: {
  id: string;
  authorId: string;
  title: string;
  slug: string;
  body: string;
  status: string;
  publishedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}): BlogArticle {
  return {
    id: row.id,
    authorId: row.authorId,
    title: row.title,
    slug: row.slug,
    body: row.body,
    status: (isPublicationStatus(row.status) ? row.status : "draft") as PublicationStatus,
    publishedAt: row.publishedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaBlogArticleRepository implements BlogArticleRepository {
  async findById(id: string) {
    const row = await prisma.blogArticle.findUnique({ where: { id } });
    return row ? toDomainBlog(row) : null;
  }
  async findPublishedBySlug(slug: string) {
    const row = await prisma.blogArticle.findFirst({
      where: { slug, status: "published" },
    });
    return row ? toDomainBlog(row) : null;
  }
  async listPublished(pagination?: Pagination) {
    const rows = await prisma.blogArticle.findMany({
      where: { status: "published" },
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { publishedAt: "desc" },
    });
    return rows.map(toDomainBlog);
  }
  async list(pagination?: Pagination) {
    const rows = await prisma.blogArticle.findMany({
      skip: pagination?.offset ?? 0,
      take: pagination?.limit,
      orderBy: { updatedAt: "desc" },
    });
    return rows.map(toDomainBlog);
  }
  async create(input: CreateBlogArticleInput): RepositoryResult<BlogArticle> {
    try {
      const row = await prisma.blogArticle.create({
        data: {
          authorId: input.authorId,
          title: input.title,
          slug: input.slug,
          body: input.body,
          status: input.status,
          publishedAt: input.status === "published" ? new Date() : null,
        },
      });
      return ok(toDomainBlog(row));
    } catch {
      return err(persistenceError());
    }
  }
  async update(id: string, input: UpdateBlogArticleInput): RepositoryResult<BlogArticle> {
    try {
      const row = await prisma.blogArticle.update({
        where: { id },
        data: {
          ...(input.title !== undefined && { title: input.title }),
          ...(input.slug !== undefined && { slug: input.slug }),
          ...(input.body !== undefined && { body: input.body }),
          ...(input.status !== undefined && { status: input.status }),
          ...(input.publishedAt !== undefined && { publishedAt: input.publishedAt }),
        },
      });
      return ok(toDomainBlog(row));
    } catch {
      return err(persistenceError());
    }
  }
  async delete(id: string): RepositoryResult<BlogArticle> {
    try {
      const row = await prisma.blogArticle.delete({ where: { id } });
      return ok(toDomainBlog(row));
    } catch {
      return err(persistenceError());
    }
  }
}

// ---------------------------------------------------------------------------
// MarketingPage
// ---------------------------------------------------------------------------

function toDomainPage(row: {
  id: string;
  key: string;
  localizedContent: Prisma.JsonValue;
  status: string;
  updatedAt: Date;
}): MarketingPage {
  return {
    id: row.id,
    key: (isMarketingPageKey(row.key) ? row.key : "about") as MarketingPageKey,
    localizedContent:
      typeof row.localizedContent === "object" && row.localizedContent !== null
        ? (row.localizedContent as Readonly<Record<string, string>>)
        : {},
    status: (isPublicationStatus(row.status) ? row.status : "draft") as PublicationStatus,
    updatedAt: row.updatedAt,
  };
}

export class PrismaMarketingPageRepository implements MarketingPageRepository {
  async findByKey(key: MarketingPageKey) {
    const row = await prisma.marketingPage.findUnique({ where: { key } });
    return row ? toDomainPage(row) : null;
  }
  async list() {
    const rows = await prisma.marketingPage.findMany({ orderBy: { key: "asc" } });
    return rows.map(toDomainPage);
  }
  async upsert(input: UpsertMarketingPageInput): RepositoryResult<MarketingPage> {
    try {
      const row = await prisma.marketingPage.upsert({
        where: { key: input.key },
        create: {
          key: input.key,
          localizedContent: input.localizedContent as Prisma.InputJsonValue,
          status: input.status,
        },
        update: {
          localizedContent: input.localizedContent as Prisma.InputJsonValue,
          status: input.status,
        },
      });
      return ok(toDomainPage(row));
    } catch {
      return err(persistenceError());
    }
  }
}

// ---------------------------------------------------------------------------
// Statistic
// ---------------------------------------------------------------------------

function toDomainStat(row: {
  id: string;
  key: string;
  valueType: string;
  value: number;
  updatedAt: Date;
}): Statistic {
  return {
    id: row.id,
    key: (isStatisticKey(row.key) ? row.key : "program_count") as StatisticKey,
    valueType: (isStatisticValueType(row.valueType) ? row.valueType : "count") as StatisticValueType,
    value: row.value,
    updatedAt: row.updatedAt,
  };
}

export class PrismaStatisticRepository implements StatisticRepository {
  async findByKey(key: StatisticKey) {
    const row = await prisma.statistic.findUnique({ where: { key } });
    return row ? toDomainStat(row) : null;
  }
  async list() {
    const rows = await prisma.statistic.findMany({ orderBy: { key: "asc" } });
    return rows.map(toDomainStat);
  }
  async updateValue(key: StatisticKey, value: number): RepositoryResult<Statistic> {
    try {
      const row = await prisma.statistic.update({ where: { key }, data: { value } });
      return ok(toDomainStat(row));
    } catch {
      return err(persistenceError());
    }
  }
}
