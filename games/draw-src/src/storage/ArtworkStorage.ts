import type { ArtworkDocument, SavedArtwork } from '../types'

const DB_NAME = 'little-artists'
const DB_VERSION = 1
const ARTWORKS = 'artworks'
const DRAFTS = 'drafts'

let databasePromise: Promise<IDBDatabase> | null = null

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) return databasePromise
  databasePromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(ARTWORKS)) {
        const store = database.createObjectStore(ARTWORKS, { keyPath: 'id' })
        store.createIndex('updatedAt', 'updatedAt')
      }
      if (!database.objectStoreNames.contains(DRAFTS)) {
        database.createObjectStore(DRAFTS, { keyPath: 'id' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Could not open artwork storage'))
  })
  return databasePromise
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('Storage request failed'))
  })
}

function transactionDone(transaction: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('Storage transaction failed'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Storage transaction was aborted'))
  })
}

export interface DraftRecord {
  id: string
  document: ArtworkDocument
  updatedAt: number
}

export class ArtworkStorage {
  async saveArtwork(artwork: SavedArtwork): Promise<void> {
    const database = await openDatabase()
    const transaction = database.transaction(ARTWORKS, 'readwrite')
    transaction.objectStore(ARTWORKS).put(artwork)
    await transactionDone(transaction)
  }

  async getArtwork(id: string): Promise<SavedArtwork | undefined> {
    const database = await openDatabase()
    const transaction = database.transaction(ARTWORKS, 'readonly')
    return requestResult(transaction.objectStore(ARTWORKS).get(id)) as Promise<SavedArtwork | undefined>
  }

  async listArtworks(): Promise<SavedArtwork[]> {
    const database = await openDatabase()
    const transaction = database.transaction(ARTWORKS, 'readonly')
    const all = await requestResult(
      transaction.objectStore(ARTWORKS).getAll(),
    ) as SavedArtwork[]
    return all.sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async deleteArtwork(id: string): Promise<void> {
    const database = await openDatabase()
    const transaction = database.transaction(ARTWORKS, 'readwrite')
    transaction.objectStore(ARTWORKS).delete(id)
    await transactionDone(transaction)
  }

  async clearArtworks(): Promise<void> {
    const database = await openDatabase()
    const transaction = database.transaction([ARTWORKS, DRAFTS], 'readwrite')
    transaction.objectStore(ARTWORKS).clear()
    transaction.objectStore(DRAFTS).clear()
    await transactionDone(transaction)
  }

  async saveDraft(id: string, document: ArtworkDocument): Promise<void> {
    const database = await openDatabase()
    const transaction = database.transaction(DRAFTS, 'readwrite')
    transaction.objectStore(DRAFTS).put({ id, document, updatedAt: Date.now() } satisfies DraftRecord)
    await transactionDone(transaction)
  }

  async getDraft(id: string): Promise<ArtworkDocument | undefined> {
    const database = await openDatabase()
    const transaction = database.transaction(DRAFTS, 'readonly')
    const record = await requestResult(transaction.objectStore(DRAFTS).get(id)) as DraftRecord | undefined
    return record?.document
  }

  async clearDraft(id: string): Promise<void> {
    const database = await openDatabase()
    const transaction = database.transaction(DRAFTS, 'readwrite')
    transaction.objectStore(DRAFTS).delete(id)
    await transactionDone(transaction)
  }

  async estimateUsage(): Promise<{ usage: number; quota: number } | null> {
    if (!navigator.storage?.estimate) return null
    try {
      const estimate = await navigator.storage.estimate()
      return { usage: estimate.usage ?? 0, quota: estimate.quota ?? 0 }
    } catch {
      return null
    }
  }
}

export const artworkStorage = new ArtworkStorage()