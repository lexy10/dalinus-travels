/** Repository port for BlogArticle entities. */
import type { BlogArticle, PublicationStatus } from "@/domain";
import type { Pagination, RepositoryResult } from "./common";

export interface CreateBlogArticleInput {
  readonly authorId: string;
  readonly title: string;
  readonly slug: string;
  readonly body: string;
  readonly status: PublicationStatus;
}

export interface UpdateBlogArticleInput {
  readonly title?: string;
  readonly slug?: string;
  readonly body?: string;
  readonly status?: PublicationStatus;
  readonly publishedAt?: BlogArticle["publishedAt"];
}

export interface BlogArticleRepository {
  findById(id: string): Promise<BlogArticle | null>;
  findPublishedBySlug(slug: string): Promise<BlogArticle | null>;
  listPublished(pagination?: Pagination): Promise<readonly BlogArticle[]>;
  list(pagination?: Pagination): Promise<readonly BlogArticle[]>;
  create(input: CreateBlogArticleInput): RepositoryResult<BlogArticle>;
  update(id: string, input: UpdateBlogArticleInput): RepositoryResult<BlogArticle>;
  delete(id: string): RepositoryResult<BlogArticle>;
}
