export type Difficulty = "easy" | "medium" | "advanced";

export interface CatalogImage {
  id: string;
  name: string;
  image: string;
  thumbnail: string;
  format: "png" | "svg";
  difficulty: Difficulty;
  published: boolean;
  description?: string;
  sourceType?: string;
  provider?: string;
  generatedDate?: string;
  prompt?: string;
  rightsNotes?: string;
  usageTerms?: string;
}

export interface CatalogCategory {
  id: string;
  name: string;
  images: CatalogImage[];
}

export interface ColoringCatalog {
  version: number;
  lastUpdated: string;
  categories: CatalogCategory[];
}

export interface ResolvedImage extends CatalogImage {
  imageUrl: string;
  thumbnailUrl: string;
  categoryId: string;
  categoryName: string;
}

export interface ResolvedCategory extends Omit<CatalogCategory, "images"> {
  images: ResolvedImage[];
}

export type ArtworkKind = "free" | "coloring";

export interface ArtworkRecord {
  id: string;
  title: string;
  kind: ArtworkKind;
  width: number;
  height: number;
  preview: string;
  createdAt: number;
  updatedAt: number;
  /** Flattened artwork for free drawing. */
  freeImage?: string;
  /** Original coloring-page lines. Preserved even if the remote library changes. */
  baseImage?: string;
  /** The child's transparent color layer. */
  colorImage?: string;
  sourceId?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceUrl?: string;
}

export interface DraftRecord {
  id: string;
  kind: ArtworkKind;
  width: number;
  height: number;
  updatedAt: number;
  freeImage?: string;
  baseImage?: string;
  colorImage?: string;
  sourceId?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceUrl?: string;
}

export interface AssetRecord {
  url: string;
  blob: Blob;
  fetchedAt: number;
}

export interface CatalogRecord {
  id: "current";
  catalog: ColoringCatalog;
  fetchedAt: number;
}