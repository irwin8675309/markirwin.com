import { useCallback, useEffect, useRef, useState } from "react";
import { ArtworkGallery } from "./components/ArtworkGallery";
import { ColoringEditor } from "./components/ColoringEditor";
import { ColoringGallery } from "./components/ColoringGallery";
import { FreeDrawEditor } from "./components/FreeDrawEditor";
import { HomeScreen } from "./components/HomeScreen";
import { useCatalog } from "./hooks/useCatalog";
import { useOnlineStatus } from "./hooks/useOnlineStatus";
import { SERVICE_WORKER_SCOPE, SERVICE_WORKER_URL } from "./config";
import { persistArtwork, type SaveArtworkInput } from "./storage/artwork";
import type { ArtworkRecord, ResolvedImage } from "./types";

type Screen =
  | { name: "home" }
  | { name: "coloring" }
  | { name: "artwork" }
  | { name: "free"; artwork?: ArtworkRecord }
  | {
      name: "coloring-editor";
      image?: ResolvedImage;
      artwork?: ArtworkRecord;
      returnTo: "coloring" | "artwork";
    };

export default function App() {
  const [screen, setScreen] = useState<Screen>({ name: "home" });
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<number | null>(null);
  const { categories, status, refresh } = useCatalog();
  const online = useOnlineStatus();

  const notify = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToast(null), 2600);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimer.current !== null) window.clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
    const register = () => {
      void navigator.serviceWorker
        .register(SERVICE_WORKER_URL, { scope: SERVICE_WORKER_SCOPE })
        .catch(() => {
          // The drawing app still works if service workers are unavailable.
        });
    };
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
    return () => window.removeEventListener("load", register);
  }, []);

  const handleSave = async (input: SaveArtworkInput) => {
    await persistArtwork(input);
    notify("Saved!");
    setScreen({ name: "artwork" });
  };

  const openImage = (image: ResolvedImage) => {
    setScreen({ name: "coloring-editor", image, returnTo: "coloring" });
  };

  const openArtwork = (record: ArtworkRecord) => {
    if (record.kind === "free") {
      setScreen({ name: "free", artwork: record });
    } else {
      setScreen({ name: "coloring-editor", artwork: record, returnTo: "artwork" });
    }
  };

  return (
    <div className="app-shell">
      {screen.name === "home" ? (
        <HomeScreen
          online={online}
          onFreeDraw={() => setScreen({ name: "free" })}
          onColoring={() => setScreen({ name: "coloring" })}
          onArtwork={() => setScreen({ name: "artwork" })}
        />
      ) : null}

      {screen.name === "coloring" ? (
        <ColoringGallery
          categories={categories}
          status={status}
          onBack={() => setScreen({ name: "home" })}
          onOpenImage={openImage}
          onRefresh={refresh}
        />
      ) : null}

      {screen.name === "artwork" ? (
        <ArtworkGallery
          onBack={() => setScreen({ name: "home" })}
          onOpenArtwork={openArtwork}
          notify={notify}
        />
      ) : null}

      {screen.name === "free" ? (
        <FreeDrawEditor
          key={screen.artwork?.id ?? "new-free"}
          artwork={screen.artwork}
          onExit={() => setScreen({ name: "home" })}
          onSave={handleSave}
        />
      ) : null}

      {screen.name === "coloring-editor" ? (
        <ColoringEditor
          key={screen.artwork?.id ?? screen.image?.id ?? "new-coloring"}
          image={screen.image}
          artwork={screen.artwork}
          onExit={() => setScreen(screen.returnTo === "coloring" ? { name: "coloring" } : { name: "artwork" })}
          onSave={handleSave}
        />
      ) : null}

      {toast ? (
        <div className="toast" role="status" aria-live="polite">
          {toast}
        </div>
      ) : null}
    </div>
  );
}