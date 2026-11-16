import { getDraft, putArtwork, removeDraft, saveDraft } from "./db";
import type { ArtworkRecord, DraftRecord } from "../types";

export interface SaveArtworkInput {
  id?: string;
  title: string;
  kind: ArtworkRecord["kind"];
  width: number;
  height: number;
  preview: string;
  freeImage?: string;
  baseImage?: string;
  colorImage?: string;
  sourceId?: string;
  sourceName?: string;
  sourceCategory?: string;
  sourceUrl?: string;
  createdAt?: number;
  draftId?: string;
}

export async function persistArtwork(input: SaveArtworkInput): Promise<ArtworkRecord> {
  const now = Date.now();
  const record: ArtworkRecord = {
    id: input.id ?? `art-${now}-${Math.random().toString(36).slice(2, 8)}`,
    title: input.title,
    kind: input.kind,
    width: input.width,
    height: input.height,
    preview: input.preview,
    createdAt: input.createdAt ?? now,
    updatedAt: now,
    freeImage: input.freeImage,
    baseImage: input.baseImage,
    colorImage: input.colorImage,
    sourceId: input.sourceId,
    sourceName: input.sourceName,
    sourceCategory: input.sourceCategory,
    sourceUrl: input.sourceUrl,
  };

  await putArtwork(record);
  if (input.draftId) await removeDraft(input.draftId);
  return record;
}

export function draftIdForColoring(sourceId: string, artworkId?: string): string {
  return artworkId ? `coloring:art:${artworkId}` : `coloring:${sourceId}`;
}

export function draftIdForFree(artworkId?: string): string {
  return artworkId ? `free:art:${artworkId}` : "free";
}

export async function loadDraft(id: string): Promise<DraftRecord | undefined> {
  return getDraft(id);
}

export async function saveEditorDraft(record: DraftRecord): Promise<void> {
  await saveDraft(record);
}