import { CATALOG_URL } from "../config";
import { getCatalogRecord, saveCatalogRecord } from "../storage/db";
import type { ColoringCatalog, ResolvedCategory, ResolvedImage } from "../types";
import { validateCatalog } from "./catalogValidation";

export type CatalogLoadSource = "network" | "cache";

export interface CatalogLoadResult {
  catalog: ColoringCatalog;
  source: CatalogLoadSource;
}

export async function readCachedCatalog(): Promise<ColoringCatalog | null> {
  const record = await getCatalogRecord();
  if (!record) return null;
  try {
    return validateCatalog(record.catalog);
  } catch {
    return null;
  }
}

export async function fetchLatestCatalog(): Promise<ColoringCatalog> {
  const response = await fetch(CATALOG_URL, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error(`Catalog request failed (${response.status})`);
  const value: unknown = await response.json();
  return validateCatalog(value);
}

export async function loadCatalog(): Promise<CatalogLoadResult> {
  try {
    const catalog = await fetchLatestCatalog();
    await saveCatalogRecord({ id: "current", catalog, fetchedAt: Date.now() });
    return { catalog, source: "network" };
  } catch {
    const cached = await readCachedCatalog();
    if (!cached) throw new Error("The coloring book is unavailable while offline.");
    return { catalog: cached, source: "cache" };
  }
}

export function resolveCatalog(catalog: ColoringCatalog): ResolvedCategory[] {
  const catalogUrl = new URL(CATALOG_URL, document.baseURI);

  return catalog.categories
    .map((category): ResolvedCategory => {
      const images: ResolvedImage[] = category.images
        .filter((image) => image.published)
        .map((image) => ({
          ...image,
          imageUrl: new URL(image.image, catalogUrl).href,
          thumbnailUrl: new URL(image.thumbnail, catalogUrl).href,
          categoryId: category.id,
          categoryName: category.name,
        }));
      return { ...category, images };
    })
    .filter((category) => category.images.length > 0);
}

export function catalogFingerprint(catalog: ColoringCatalog): string {
  return JSON.stringify(catalog);
}