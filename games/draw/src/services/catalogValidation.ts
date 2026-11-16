import type { ColoringCatalog, CatalogCategory, CatalogImage, Difficulty } from "../types";

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function parseDifficulty(value: unknown): Difficulty {
  if (value === "easy" || value === "medium" || value === "advanced") return value;
  return "medium";
}

function parseImage(value: unknown, categoryId: string): CatalogImage | null {
  if (!isObject(value)) return null;
  if (!nonEmptyString(value.id) || !nonEmptyString(value.name)) return null;
  if (!nonEmptyString(value.image) || !nonEmptyString(value.thumbnail)) return null;

  const format = value.format === "svg" ? "svg" : "png";
  return {
    id: value.id,
    name: value.name,
    image: value.image,
    thumbnail: value.thumbnail,
    format,
    difficulty: parseDifficulty(value.difficulty),
    published: value.published !== false,
    description: optionalString(value.description),
    sourceType: optionalString(value.sourceType),
    provider: optionalString(value.provider),
    generatedDate: optionalString(value.generatedDate),
    prompt: optionalString(value.prompt),
    rightsNotes: optionalString(value.rightsNotes),
    usageTerms: optionalString(value.usageTerms),
  };
}

function parseCategory(value: unknown): CatalogCategory | null {
  if (!isObject(value)) return null;
  if (!nonEmptyString(value.id) || !nonEmptyString(value.name)) return null;
  if (!Array.isArray(value.images)) return null;

  const images = value.images
    .map((image) => parseImage(image, value.id as string))
    .filter((image): image is CatalogImage => image !== null);

  return { id: value.id, name: value.name, images };
}

/**
 * Validates the public catalog shape. Unknown optional metadata is ignored so
 * future fields do not break older application builds.
 */
export function validateCatalog(value: unknown): ColoringCatalog {
  if (!isObject(value)) throw new Error("The coloring catalog is not an object.");
  if (typeof value.version !== "number" || !Array.isArray(value.categories)) {
    throw new Error("The coloring catalog has an unsupported shape.");
  }

  const categories = value.categories
    .map(parseCategory)
    .filter((category): category is CatalogCategory => category !== null);

  return {
    version: value.version,
    lastUpdated: typeof value.lastUpdated === "string" ? value.lastUpdated : "",
    categories,
  };
}