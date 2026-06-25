/**
 * BlogService — publication lifecycle and public read access.
 *
 * Covers Req 15.1–15.7.
 *
 * Admin-only write operations expect callers to have already passed the
 * `assertAdministrator` gate; this service double-checks via the supplied
 * `ActorContext` so internal callers (e.g. seed scripts) cannot bypass it.
 */
import type { BlogArticle } from "@/domain";
import { PublicationStatus, missingFieldsError, notFoundError } from "@/domain";
import type { Result, DomainError } from "@/domain/kernel";
import { ok, err } from "@/domain/kernel";
import type { ActorContext } from "@/domain/kernel/actor";
import type {
  BlogArticleRepository,
  CreateBlogArticleInput,
} from "@/ports/repositories/BlogArticleRepository";
import { assertAdministrator } from "@/services/auth/authorization";

export interface PublishArticleInput
  extends Partial<Omit<CreateBlogArticleInput, "status">> {
  readonly id?: string;
}

export interface BlogServiceDeps {
  readonly blogRepo: BlogArticleRepository;
}

export class BlogService {
  private readonly blogRepo: BlogArticleRepository;

  constructor(deps: BlogServiceDeps) {
    this.blogRepo = deps.blogRepo;
  }

  // -------------------------------------------------------------------------
  // Public reads (Req 15.1, 15.2, 15.3)
  // -------------------------------------------------------------------------

  /** Public listing — published only, most recent first. */
  async listPublished(): Promise<readonly BlogArticle[]> {
    const items = await this.blogRepo.listPublished();
    return [...items].sort((a, b) => {
      const ta = a.publishedAt?.getTime() ?? a.updatedAt.getTime();
      const tb = b.publishedAt?.getTime() ?? b.updatedAt.getTime();
      return tb - ta;
    });
  }

  /** Public read by slug — returns NotFound for unpublished or missing. */
  async getPublishedBySlug(slug: string): Promise<Result<BlogArticle, DomainError>> {
    const article = await this.blogRepo.findPublishedBySlug(slug);
    if (!article) return err(notFoundError("Article is not available.", "BlogArticle"));
    return ok(article);
  }

  // -------------------------------------------------------------------------
  // Admin writes (Req 15.4, 15.5, 15.6, 15.7)
  // -------------------------------------------------------------------------

  /**
   * Publish a new or existing article. Missing required fields → ValidationError.
   */
  async publish(
    input: PublishArticleInput,
    actor: ActorContext,
  ): Promise<Result<BlogArticle, DomainError>> {
    const gate = assertAdministrator(actor);
    if (!gate.ok) return gate;

    const missing: string[] = [];
    if (typeof input.title !== "string" || input.title.trim() === "") missing.push("title");
    if (typeof input.slug !== "string" || input.slug.trim() === "") missing.push("slug");
    if (typeof input.body !== "string" || input.body.trim() === "") missing.push("body");
    if (missing.length > 0) {
      return err(missingFieldsError(missing));
    }

    if (input.id) {
      const existing = await this.blogRepo.findById(input.id);
      if (!existing) return err(notFoundError("Article not found.", "BlogArticle"));
      return this.blogRepo.update(input.id, {
        title: input.title!,
        slug: input.slug!,
        body: input.body!,
        status: PublicationStatus.PUBLISHED,
        publishedAt: existing.publishedAt ?? new Date(),
      });
    }

    return this.blogRepo.create({
      authorId: actor.userId,
      title: input.title!,
      slug: input.slug!,
      body: input.body!,
      status: PublicationStatus.PUBLISHED,
    });
  }

  async unpublish(id: string, actor: ActorContext): Promise<Result<BlogArticle, DomainError>> {
    const gate = assertAdministrator(actor);
    if (!gate.ok) return gate;
    const existing = await this.blogRepo.findById(id);
    if (!existing) return err(notFoundError("Article not found.", "BlogArticle"));
    return this.blogRepo.update(id, { status: PublicationStatus.DRAFT });
  }

  async remove(id: string, actor: ActorContext): Promise<Result<BlogArticle, DomainError>> {
    const gate = assertAdministrator(actor);
    if (!gate.ok) return gate;
    return this.blogRepo.delete(id);
  }
}
