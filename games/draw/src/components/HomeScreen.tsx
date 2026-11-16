import { BookIcon, BrushIcon, GalleryIcon, SparkleIcon } from "./Icons";
import { ConnectionBadge } from "./ConnectionBadge";

interface HomeScreenProps {
  online: boolean;
  onFreeDraw: () => void;
  onColoring: () => void;
  onArtwork: () => void;
}

export function HomeScreen({ online, onFreeDraw, onColoring, onArtwork }: HomeScreenProps) {
  return (
    <main className="home-screen">
      <div className="home-sky" aria-hidden="true">
        <span className="sun" />
        <span className="cloud cloud-one" />
        <span className="cloud cloud-two" />
        <span className="cloud cloud-three" />
        <span className="sparkle sparkle-one">
          <SparkleIcon size={30} />
        </span>
        <span className="sparkle sparkle-two">
          <SparkleIcon size={22} />
        </span>
      </div>

      <header className="home-heading">
        <div className="brand-mark" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <div>
          <p className="home-kicker">A happy place to make art</p>
          <h1>Little Canvas</h1>
        </div>
        <ConnectionBadge online={online} />
      </header>

      <section className="home-actions" aria-label="Choose an activity">
        <button className="home-card home-card-draw" type="button" onClick={onFreeDraw}>
          <span className="home-card-art" aria-hidden="true">
            <span className="paper-sheet">
              <span className="doodle-line doodle-one" />
              <span className="doodle-line doodle-two" />
              <span className="doodle-dot" />
            </span>
            <span className="big-pencil">
              <BrushIcon size={46} />
            </span>
            <span className="card-sparkle">
              <SparkleIcon size={28} />
            </span>
          </span>
          <span className="home-card-label">
            <strong>Free Draw</strong>
            <span>Make anything!</span>
          </span>
        </button>

        <button className="home-card home-card-color" type="button" onClick={onColoring}>
          <span className="home-card-art" aria-hidden="true">
            <span className="book-shape">
              <span className="book-page page-left" />
              <span className="book-page page-right" />
              <span className="book-blob" />
              <span className="book-dot" />
            </span>
            <span className="color-splash splash-one" />
            <span className="color-splash splash-two" />
            <span className="color-splash splash-three" />
          </span>
          <span className="home-card-label">
            <strong>Coloring Book</strong>
            <span>Pick a picture</span>
          </span>
        </button>

        <button className="home-card home-card-gallery" type="button" onClick={onArtwork}>
          <span className="home-card-art" aria-hidden="true">
            <span className="gallery-stack">
              <span className="stack-sheet stack-back" />
              <span className="stack-sheet stack-front">
                <span className="gallery-sun" />
                <span className="gallery-hill" />
                <span className="gallery-flower" />
              </span>
            </span>
            <span className="gallery-pin" />
          </span>
          <span className="home-card-label">
            <strong>My Artwork</strong>
            <span>See your art</span>
          </span>
        </button>
      </section>

      <footer className="home-footer" aria-hidden="true">
        <span>
          <BookIcon size={20} /> Color
        </span>
        <span>
          <BrushIcon size={20} /> Draw
        </span>
        <span>
          <GalleryIcon size={20} /> Keep
        </span>
      </footer>
    </main>
  );
}