import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useAssetUrl } from "../hooks/useAssetUrl";
import { useOnlineStatus } from "../hooks/useOnlineStatus";
import type { Difficulty, ResolvedCategory, ResolvedImage } from "../types";
import { ConnectionBadge } from "./ConnectionBadge";
import { ArrowLeftIcon, BookIcon, RefreshIcon, SparkleIcon } from "./Icons";
import type { SyncStatus } from "../hooks/useCatalog";

interface ColoringGalleryProps {
  categories: ResolvedCategory[];
  status: SyncStatus;
  onBack: () => void;
  onOpenImage: (image: ResolvedImage) => void;
  onRefresh: () => Promise<void>;
}

const CATEGORY_COLORS = [
  "#ff6b6b", "#ff9f43", "#ffd93d", "#6bcB77", "#4d96ff", "#9b5de5",
  "#f15bb5", "#00bbf9", "#00f5d4", "#fee440", "#f15bb5", "#9b5de5",
];

function difficultyLabel(difficulty: Difficulty): string {
  if (difficulty === "easy") return "Easy";
  if (difficulty === "advanced") return "Advanced";
  return "Medium";
}

function ColoringCard({ image, onOpen }: { image: ResolvedImage; onOpen: (image: ResolvedImage) => void }) {
  const asset = useAssetUrl(image.thumbnailUrl);
  return (
    <button className="coloring-card" type="button" onClick={() => onOpen(image)}>
      <span className="coloring-card-picture">
        {asset.url ? (
          <img src={asset.url} alt="" draggable={false} />
        ) : (
          <span className="thumbnail-loading">
            {asset.loading ? <span className="loading-dot" /> : <BookIcon size={40} />}
          </span>
        )}
        <span className={`difficulty-badge difficulty-${image.difficulty}`}>
          <SparkleIcon size={14} />
          {difficultyLabel(image.difficulty)}
        </span>
      </span>
      <span className="coloring-card-name">{image.name}</span>
    </button>
  );
}

export function ColoringGallery({ categories, status, onBack, onOpenImage, onRefresh }: ColoringGalleryProps) {
  const online = useOnlineStatus();
  const [activeId, setActiveId] = useState(categories[0]?.id ?? "");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!categories.some((category) => category.id === activeId)) {
      setActiveId(categories[0]?.id ?? "");
    }
  }, [categories, activeId]);

  const activeCategory = useMemo(
    () => categories.find((category) => category.id === activeId) ?? categories[0],
    [categories, activeId],
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  const isLoading = status === "loading" && categories.length === 0;
  const hasError = status === "error" && categories.length === 0;

  return (
    <main className="gallery-screen">
      <header className="screen-header">
        <button className="round-button" type="button" onClick={onBack} aria-label="Back home">
          <ArrowLeftIcon size={30} />
        </button>
        <div className="screen-heading">
          <span className="screen-eyebrow">Pick a picture</span>
          <h1>Coloring Book</h1>
        </div>
        <div className="header-side">
          <ConnectionBadge online={online} />
          <button
            className={`icon-button refresh-button ${refreshing ? "is-spinning" : ""}`}
            type="button"
            onClick={() => void handleRefresh()}
            disabled={refreshing}
            aria-label="Refresh coloring book"
          >
            <RefreshIcon />
          </button>
        </div>
      </header>

      {!online ? (
        <div className="offline-note">
          <span className="offline-dot" />
          Offline — your saved coloring pages still work.
        </div>
      ) : null}

      {isLoading ? (
        <section className="gallery-loading" aria-live="polite">
          <div className="skeleton skeleton-wide" />
          <div className="skeleton-row">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
          <div className="skeleton-row">
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
            <div className="skeleton skeleton-card" />
          </div>
        </section>
      ) : hasError ? (
        <section className="empty-state">
          <span className="empty-icon"><BookIcon size={64} /></span>
          <h2>The coloring book is resting</h2>
          <p>Connect to the internet once to download the coloring book, then it will be ready offline.</p>
          <button className="primary-button" type="button" onClick={() => void handleRefresh()}>
            <RefreshIcon size={22} />
            Try again
          </button>
        </section>
      ) : categories.length === 0 ? (
        <section className="empty-state">
          <span className="empty-icon"><SparkleIcon size={64} /></span>
          <h2>New pictures are on the way</h2>
          <p>Check back soon for more coloring pages.</p>
          <button className="primary-button" type="button" onClick={() => void handleRefresh()}>
            <RefreshIcon size={22} />
            Check again
          </button>
        </section>
      ) : (
        <div className="gallery-content">
          <nav className="category-strip" aria-label="Coloring categories">
            {categories.map((category, index) => {
              const color = CATEGORY_COLORS[index % CATEGORY_COLORS.length];
              return (
                <button
                  key={category.id}
                  className={`category-chip ${activeCategory?.id === category.id ? "is-active" : ""}`}
                  style={{ "--category-color": color } as CSSProperties}
                  type="button"
                  onClick={() => setActiveId(category.id)}
                  aria-pressed={activeCategory?.id === category.id}
                >
                  <span className="category-dot" />
                  <span>{category.name}</span>
                  <span className="category-count">{category.images.length}</span>
                </button>
              );
            })}
          </nav>

          {activeCategory ? (
            <section className="category-section">
              <div className="category-heading">
                <h2>{activeCategory.name}</h2>
                <span>Tap a picture to color</span>
              </div>
              <div className="coloring-grid">
                {activeCategory.images.map((image) => (
                  <ColoringCard key={`${image.categoryId}-${image.id}`} image={image} onOpen={onOpenImage} />
                ))}
              </div>
            </section>
          ) : null}
        </div>
      )}
    </main>
  );
}