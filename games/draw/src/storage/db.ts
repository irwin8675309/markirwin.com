import type { ArtworkRecord, AssetRecord, CatalogRecord, DraftRecord } from "../types";

const DATABASE_NAME = "little-canvas";
const DATABASE_VERSION = 1;

let databasePromise: Promise<IDBDatabase> | null = null;

export function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise;

  databasePromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("artwork")) {
        const store = db.createObjectStore("artwork", { keyPath: "id" });
        store.createIndex("updatedAt", "updatedAt");
      }
      if (!db.objectStoreNames.contains("catalog")) {
        db.createObjectStore("catalog", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("assets")) {
        db.createObjectStore("assets", { keyPath: "url" });
      }
      if (!db.objectStoreNames.contains("drafts")) {
        db.createObjectStore("drafts", { keyPath: "id" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open local storage"));
  });

  return databasePromise;
}

function requestAsPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Local storage request failed"));
  });
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Local storage transaction failed"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Local storage transaction aborted"));
  });
}

async function store(name: string, mode: IDBTransactionMode): Promise<IDBObjectStore> {
  const db = await openDatabase();
  return db.transaction(name, mode).objectStore(name);
}

export async function putArtwork(record: ArtworkRecord): Promise<void> {
  const objectStore = await store("artwork", "readwrite");
  objectStore.put(record);
  await transactionDone(objectStore.transaction);
}

export async function listArtwork(): Promise<ArtworkRecord[]> {
  const objectStore = await store("artwork", "readonly");
  const records = await requestAsPromise(objectStore.getAll() as IDBRequest<ArtworkRecord[]>);
  return records.sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function getArtwork(id: string): Promise<ArtworkRecord | undefined> {
  const objectStore = await store("artwork", "readonly");
  return requestAsPromise(objectStore.get(id) as IDBRequest<ArtworkRecord | undefined>);
}

export async function removeArtwork(id: string): Promise<void> {
  const objectStore = await store("artwork", "readwrite");
  objectStore.delete(id);
  await transactionDone(objectStore.transaction);
}

export async function saveDraft(record: DraftRecord): Promise<void> {
  const objectStore = await store("drafts", "readwrite");
  objectStore.put(record);
  await transactionDone(objectStore.transaction);
}

export async function getDraft(id: string): Promise<DraftRecord | undefined> {
  const objectStore = await store("drafts", "readonly");
  return requestAsPromise(objectStore.get(id) as IDBRequest<DraftRecord | undefined>);
}

export async function removeDraft(id: string): Promise<void> {
  const objectStore = await store("drafts", "readwrite");
  objectStore.delete(id);
  await transactionDone(objectStore.transaction);
}

export async function saveCatalogRecord(record: CatalogRecord): Promise<void> {
  const objectStore = await store("catalog", "readwrite");
  objectStore.put(record);
  await transactionDone(objectStore.transaction);
}

export async function getCatalogRecord(): Promise<CatalogRecord | undefined> {
  const objectStore = await store("catalog", "readonly");
  return requestAsPromise(objectStore.get("current") as IDBRequest<CatalogRecord | undefined>);
}

export async function saveAsset(record: AssetRecord): Promise<void> {
  const objectStore = await store("assets", "readwrite");
  objectStore.put(record);
  await transactionDone(objectStore.transaction);
}

export async function getAsset(url: string): Promise<AssetRecord | undefined> {
  const objectStore = await store("assets", "readonly");
  return requestAsPromise(objectStore.get(url) as IDBRequest<AssetRecord | undefined>);
}

export async function estimateStorage(): Promise<{ usage: number; quota: number } | null> {
  if (!navigator.storage?.estimate) return null;
  const estimate = await navigator.storage.estimate();
  return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 };
}