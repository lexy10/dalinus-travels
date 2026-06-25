import type { BlogArticle } from "@/domain";
import type { BlogArticleRepository, CreateBlogArticleInput, UpdateBlogArticleInput, Pagination } from "@/ports";
import { ok, err, type Result, type DomainError, conflictError } from "@/domain/kernel";
import { randomUUID } from "crypto";

export class InMemoryBlogArticleRepository implements BlogArticleRepository {
  private store = new Map<string, BlogArticle>();

  async findById(id: string): Promise<BlogArticle | null> {
    return this.store.get(id) ?? null;
  }

  async findPublishedBySlug(slug: string): Promise<BlogArticle | null> {
    for (const a of this.store.values()) {
      if (a.slug === slug && a.status === "published") return a;
    }
    return null;
  }

  async listPublished(pagination?: Pagination): Promise<readonly BlogArticle[]> {
    const all = [...this.store.values()].filter(a => a.status === "published");
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async list(pagination?: Pagination): Promise<readonly BlogArticle[]> {
    const all = [...this.store.values()];
    const offset = pagination?.offset ?? 0;
    const limit = pagination?.limit ?? all.length;
    return all.slice(offset, offset + limit);
  }

  async create(input: CreateBlogArticleInput): Promise<Result<BlogArticle, DomainError>> {
    const now = new Date();
    const article: BlogArticle = {
      id: randomUUID(),
      authorId: input.authorId,
      title: input.title,
      slug: input.slug,
      body: input.body,
      status: input.status,
      publishedAt: input.status === "published" ? now : null,
      createdAt: now,
      updatedAt: now,
    };
    this.store.set(article.id, article);
    return ok(article);
  }

  async update(id: string, input: UpdateBlogArticleInput): Promise<Result<BlogArticle, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Blog article not found.", "BlogArticle"));
    const updated: BlogArticle = { ...existing, ...input, updatedAt: new Date() };
    this.store.set(id, updated);
    return ok(updated);
  }

  async delete(id: string): Promise<Result<BlogArticle, DomainError>> {
    const existing = this.store.get(id);
    if (!existing) return err(conflictError("Blog article not found.", "BlogArticle"));
    this.store.delete(id);
    return ok(existing);
  }

  clear() { this.store.clear(); }
  seed(article: BlogArticle) { this.store.set(article.id, article); }
}
