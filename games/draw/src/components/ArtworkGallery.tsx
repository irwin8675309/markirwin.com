import { useEffect, useState } from "react";
import { composeColoringExport, downloadDataUrl } from "../drawing/imageUtils";
import { listArtwork, putArtwork, removeArtwork } from "../storage/db";
import type { ArtworkRecord } from "../types";
import {
  ArrowLeftIcon,
  BrushIcon,
  DownloadIcon,
  EditIcon,
  GalleryIcon,
  TrashIcon,
} from "./Icons";
import { Modal } from "./Modal";

interface ArtworkGalleryProps {
  onBack: () => void;
  onOpenArtwork: (record: ArtworkRecord) => void;
  notify: (message: string) => void;
}

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(timestamp);
}

export function ArtworkGallery({ onBack, onOpenArtwork, notify }: ArtworkGalleryProps) {
  const [records, setRecords] = useState<ArtworkRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [renaming, setRenaming] = useState<ArtworkRecord | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [deleting, setDeleting] = useState<ArtworkRecord | null>(null);
  const [exportingId, setExportingId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const artwork = await listArtwork();
        if (active) setRecords(artwork);
      } catch (error) {
        if (active) setLoadError(error instanceof Error ? error.message : "Your artwork could not be loaded.");
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  const openRename = (record: ArtworkRecord) => {
    setRenaming(record);
    setNameDraft(record.title);
  };

  const saveRename = async () => {
    if (!renaming) return;
    const clean = nameDraft.trim();
    if (!clean) return;
    const updated = { ...renaming, title: clean, updatedAt: Date.now() };
    await putArtwork(updated);
    setRecords((current) => current.map((item) => (item.id === updated.id ? updated : item)));
    setRenaming(null);
    notify("Name saved");
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    await removeArtwork(deleting.id);
    setRecords((current) => current.filter((item) => item.id !== deleting.id));
    setDeleting(null);
    notify("Artwork deleted");
  };

  const exportArtwork = async (record: ArtworkRecord) => {
    setExportingId(record.id);
    try {
      if (record.kind === "coloring" && record.baseImage) {
        const result = await composeColoringExport(record.baseImage, record.colorImage);
        downloadDataUrl(result.dataUrl, record.title);
      } else if (record.freeImage) {
        downloadDataUrl(record.freeImage, record.title);
      } else if (record.preview) {
        downloadDataUrl(record.preview, record.title);
      } else {
        throw new Error("This artwork has no image to export.");
      }
      notify("Picture saved as a PNG");
    } catch (error) {
      notify(error instanceof Error ? error.message : "This picture could not be exported.");
    } finally {
      setExportingId(null);
    }
  };

  return (
    <main className="gallery-screen artwork-screen">
      <header className="screen-header">
        <button className="round-button" type="button" onClick={onBack} aria-label="Back home">
          <ArrowLeftIcon size={30} />
        </button>
        <div className="screen-heading">
          <span className="screen-eyebrow">Made by you</span>
          <h1>My Artwork</h1>
        </div>
        <div className="artwork-count">
          <GalleryIcon size={20} />
          <span>{records.length}</span>
        </div>
      </header>

      {loading ? (
        <section className="gallery-loading" aria-live="polite">
          <div className="skeleton-row">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
          <div className="skeleton-row">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        </section>
      ) : loadError ? (
        <section className="empty-state">
          <h2>Your art shelf is sleepy</h2>
          <p>{loadError}</p>
        </section>
      ) : records.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon"><BrushIcon size={68} /></span>
          <h2>Your art will live here</h2>
          <p>Draw something or color a page and tap Save. It will stay right here, even offline.</p>
          <button className="primary-button" type="button" onClick={onBack}>
            Let's make something
          </button>
        </section>
      ) : (
        <section className="artwork-grid-section">
          <div className="artwork-grid">
            {records.map((record) => (
              <article className="artwork-card" key={record.id}>
                <button className="artwork-open" type="button" onClick={() => onOpenArtwork(record)}>
                  <span className="artwork-preview">
                    <img src={record.preview} alt="" draggable={false} />
                  </span>
                  <span className="artwork-name">{record.title}</span>
                  <span className="artwork-meta">
                    {record.kind === "free" ? "Drawing" : record.sourceCategory ?? "Coloring"}
                    <span className="meta-dot" />
                    {formatDate(record.updatedAt)}
                  </span>
                </button>
                <div className="artwork-actions">
                  <button
                    className="mini-action"
                    type="button"
                    onClick={() => openRename(record)}
                    aria-label={`Rename ${record.title}`}
                    title="Rename"
                  >
                    <EditIcon size={20} />
                  </button>
                  <button
                    className="mini-action"
                    type="button"
                    onClick={() => void exportArtwork(record)}
                    disabled={exportingId === record.id}
                    aria-label={`Export ${record.title} as PNG`}
                    title="Export PNG"
                  >
                    <DownloadIcon size={20} />
                  </button>
                  <button
                    className="mini-action danger"
                    type="button"
                    onClick={() => setDeleting(record)}
                    aria-label={`Delete ${record.title}`}
                    title="Delete"
                  >
                    <TrashIcon size={20} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {renaming ? (
        <Modal
          title="Give it a name"
          onClose={() => setRenaming(null)}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => setRenaming(null)}>Cancel</button>
              <button className="primary-button" type="button" onClick={() => void saveRename()} disabled={!nameDraft.trim()}>
                Save name
              </button>
            </>
          }
        >
          <label className="name-label">
            <span>Picture name</span>
            <input
              className="name-input"
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              maxLength={60}
              autoFocus
              onKeyDown={(event) => {
                if (event.key === "Enter") void saveRename();
              }}
            />
          </label>
        </Modal>
      ) : null}

      {deleting ? (
        <Modal
          title="Delete this artwork?"
          onClose={() => setDeleting(null)}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => setDeleting(null)}>Keep it</button>
              <button className="danger-button" type="button" onClick={() => void confirmDelete()}>Delete</button>
            </>
          }
        >
          <p className="modal-copy">“{deleting.title}” will be removed from this device. This cannot be undone.</p>
        </Modal>
      ) : null}
    </main>
  );
}