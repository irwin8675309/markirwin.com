import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { ColoringEngine } from "../drawing/ColoringEngine";
import { loadImage } from "../drawing/imageUtils";
import { useAssetUrl } from "../hooks/useAssetUrl";
import {
  draftIdForColoring,
  loadDraft,
  saveEditorDraft,
  type SaveArtworkInput,
} from "../storage/artwork";
import type { ArtworkRecord, ResolvedImage } from "../types";
import {
  ArrowLeftIcon,
  BrushIcon,
  BucketIcon,
  EraserIcon,
  RedoIcon,
  SaveIcon,
  TrashIcon,
  UndoIcon,
} from "./Icons";
import { Modal } from "./Modal";

interface ColoringEditorProps {
  image?: ResolvedImage;
  artwork?: ArtworkRecord;
  onExit: () => void;
  onSave: (input: SaveArtworkInput) => Promise<void>;
}

type ColoringTool = "brush" | "bucket" | "eraser";

const COLORS = [
  "#ff5d5d", "#ff8a3d", "#ffd23f", "#8bd450", "#35c77e", "#25b8cf",
  "#3d7bff", "#7d5cff", "#d45cff", "#ff6fb5", "#8b5e3c", "#222222",
  "#7a8494", "#ffffff",
];
const SIZES = [
  { value: 8, label: "Small" },
  { value: 18, label: "Medium" },
  { value: 34, label: "Large" },
  { value: 58, label: "Extra large" },
];

export function ColoringEditor({ image, artwork, onExit, onSave }: ColoringEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<ColoringEngine | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const savedRef = useRef(false);
  const sourceId = artwork?.sourceId ?? image?.id ?? "unknown";
  const draftIdRef = useRef(draftIdForColoring(sourceId, artwork?.id));

  const sourceUrl = !artwork ? image?.imageUrl : undefined;
  const asset = useAssetUrl(sourceUrl);

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [tool, setTool] = useState<ColoringTool>("bucket");
  const [color, setColor] = useState("#ff5d5d");
  const [size, setSize] = useState(18);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showClear, setShowClear] = useState(false);
  const [hint, setHint] = useState("");

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const open = async () => {
      try {
        let sourceImage: HTMLImageElement;
        if (artwork?.baseImage) {
          sourceImage = await loadImage(artwork.baseImage);
        } else if (asset.url) {
          sourceImage = await loadImage(asset.url);
        } else {
          return;
        }
        if (cancelled) return;

        const engine = new ColoringEngine(canvas, sourceImage);
        engineRef.current = engine;

        const draft = await loadDraft(draftIdRef.current);
        if (cancelled) return;

        if (draft?.baseImage) {
          await engine.loadSaved(draft.baseImage, draft.colorImage);
        } else if (artwork) {
          await engine.loadSaved(artwork.baseImage!, artwork.colorImage);
        }

        if (cancelled) return;
        setReady(true);
        setHistory(engine.getHistoryState());
        if (draft) setHint("Your colors are right where you left them.");
      } catch (error) {
        if (!cancelled) {
          setLoadError(error instanceof Error ? error.message : "This picture could not be opened.");
        }
      }
    };

    void open();

    return () => {
      cancelled = true;
    };
  }, [artwork, asset.url]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (!engine || !dirtyRef.current || savedRef.current) return;
      void saveEditorDraft({
        id: draftIdRef.current,
        kind: "coloring",
        width: engine.width,
        height: engine.height,
        updatedAt: Date.now(),
        baseImage: engine.baseDataUrl(),
        colorImage: engine.colorDataUrl(),
        sourceId,
        sourceName: artwork?.sourceName ?? image?.name,
        sourceCategory: artwork?.sourceCategory ?? image?.categoryName,
        sourceUrl: artwork?.sourceUrl ?? image?.imageUrl,
      });
    };
  }, [artwork, image, sourceId]);

  const updateHistory = () => {
    const engine = engineRef.current;
    if (engine) setHistory(engine.getHistoryState());
  };

  const markDirty = () => {
    dirtyRef.current = true;
    if (hint) setHint("");
  };

  const toCanvasPoint = (event: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };

  const pressureFor = (event: { pointerType: string; pressure: number }) => {
    if (event.pointerType !== "pen") return 0.5;
    return event.pressure > 0 ? event.pressure : 0.5;
  };

  const handlePointerDown = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!ready || !engineRef.current) return;
    event.preventDefault();
    const engine = engineRef.current;
    const point = toCanvasPoint(event);

    if (tool === "bucket") {
      const changed = engine.fillAt(point.x, point.y, color);
      if (changed === 0) {
        setHint("Try tapping inside a shape.");
        window.setTimeout(() => setHint(""), 1800);
        return;
      }
      markDirty();
      updateHistory();
      return;
    }

    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some older browsers do not expose pointer capture for touch input.
    }
    engine.pushHistory();
    engine.drawSegment(point, point, color, size, tool === "eraser", pressureFor(event));
    lastPointRef.current = point;
    drawingRef.current = true;
    markDirty();
    updateHistory();
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || !engineRef.current || !lastPointRef.current) return;
    event.preventDefault();
    const engine = engineRef.current;
    const native = event.nativeEvent;
    const samples = typeof native.getCoalescedEvents === "function"
      ? native.getCoalescedEvents()
      : [native];
    const points = samples.length > 0 ? samples : [native];

    for (const sample of points) {
      const point = toCanvasPoint(sample);
      engine.drawSegment(lastPointRef.current, point, color, size, tool === "eraser", pressureFor(sample));
      lastPointRef.current = point;
    }
  };

  const endStroke = (event: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    lastPointRef.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
    updateHistory();
  };

  const handleUndo = () => {
    if (!engineRef.current?.undo()) return;
    markDirty();
    updateHistory();
  };

  const handleRedo = () => {
    if (!engineRef.current?.redo()) return;
    markDirty();
    updateHistory();
  };

  const handleClear = () => {
    engineRef.current?.clear();
    markDirty();
    updateHistory();
    setShowClear(false);
  };

  const persistDraftNow = async () => {
    const engine = engineRef.current;
    if (!engine || !dirtyRef.current || savedRef.current) return;
    await saveEditorDraft({
      id: draftIdRef.current,
      kind: "coloring",
      width: engine.width,
      height: engine.height,
      updatedAt: Date.now(),
      baseImage: engine.baseDataUrl(),
      colorImage: engine.colorDataUrl(),
      sourceId,
      sourceName: artwork?.sourceName ?? image?.name,
      sourceCategory: artwork?.sourceCategory ?? image?.categoryName,
      sourceUrl: artwork?.sourceUrl ?? image?.imageUrl,
    });
    dirtyRef.current = false;
  };

  const handleExit = async () => {
    try {
      await persistDraftNow();
    } catch {
      // The on-screen canvas remains intact even if draft writing fails.
    }
    onExit();
  };

  const handleSave = async () => {
    const engine = engineRef.current;
    if (!engine || saving) return;
    setSaving(true);
    setSaveError("");
    savedRef.current = true;
    try {
      await onSave({
        id: artwork?.id,
        createdAt: artwork?.createdAt,
        title: artwork?.title ?? image?.name ?? "My Coloring",
        kind: "coloring",
        width: engine.width,
        height: engine.height,
        preview: engine.previewDataUrl(520),
        baseImage: engine.baseDataUrl(),
        colorImage: engine.colorDataUrl(),
        sourceId,
        sourceName: artwork?.sourceName ?? image?.name,
        sourceCategory: artwork?.sourceCategory ?? image?.categoryName,
        sourceUrl: artwork?.sourceUrl ?? image?.imageUrl,
        draftId: draftIdRef.current,
      });
      dirtyRef.current = false;
    } catch (error) {
      savedRef.current = false;
      setSaveError(error instanceof Error ? error.message : "Your picture could not be saved.");
      setSaving(false);
    }
  };

  const title = artwork?.title ?? image?.name ?? "Coloring Page";
  const subtitle = artwork?.sourceCategory ?? image?.categoryName ?? "Coloring Book";

  return (
    <main className="editor-screen coloring-editor">
      <header className="editor-header">
        <button className="round-button" type="button" onClick={() => void handleExit()} aria-label="Back">
          <ArrowLeftIcon size={30} />
        </button>
        <div className="editor-heading">
          <span className="editor-eyebrow">{subtitle}</span>
          <h1>{title}</h1>
        </div>
        <div className="editor-actions">
          <button className="icon-button" type="button" onClick={handleUndo} disabled={!history.canUndo} aria-label="Undo">
            <UndoIcon />
          </button>
          <button className="icon-button" type="button" onClick={handleRedo} disabled={!history.canRedo} aria-label="Redo">
            <RedoIcon />
          </button>
          <button className="primary-button save-button" type="button" onClick={() => void handleSave()} disabled={!ready || saving}>
            <SaveIcon size={22} />
            <span>{saving ? "Saving…" : "Save"}</span>
          </button>
        </div>
      </header>

      <div className="editor-body coloring-body">
        <div className="canvas-stage coloring-stage" aria-label={`${title} coloring canvas`}>
          <canvas
            ref={canvasRef}
            className={`drawing-canvas coloring-canvas tool-${tool}`}
            aria-label={`${title} coloring canvas`}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
          {!ready && !loadError && !asset.loading ? (
            <div className="canvas-loading">
              <span className="loading-dot" />
              <span>Getting the picture ready…</span>
            </div>
          ) : null}
          {asset.loading && !artwork ? (
            <div className="canvas-loading">
              <span className="loading-dot" />
              <span>Finding the picture…</span>
            </div>
          ) : null}
          {loadError ? <div className="canvas-error">{loadError}</div> : null}
          {asset.error && !artwork ? <div className="canvas-error">This picture is not available offline yet.</div> : null}
          {hint ? <div className="canvas-hint">{hint}</div> : null}
        </div>

        <aside className="editor-tools coloring-tools" aria-label="Coloring tools">
          <div className="tool-row" role="group" aria-label="Coloring tool">
            <button
              className={`tool-button ${tool === "brush" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTool("brush")}
              aria-pressed={tool === "brush"}
            >
              <BrushIcon size={28} />
              <span>Brush</span>
            </button>
            <button
              className={`tool-button ${tool === "bucket" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTool("bucket")}
              aria-pressed={tool === "bucket"}
            >
              <BucketIcon size={28} />
              <span>Fill</span>
            </button>
            <button
              className={`tool-button ${tool === "eraser" ? "is-active" : ""}`}
              type="button"
              onClick={() => setTool("eraser")}
              aria-pressed={tool === "eraser"}
            >
              <EraserIcon size={28} />
              <span>Eraser</span>
            </button>
          </div>

          <div className="palette" role="group" aria-label="Colors">
            {COLORS.map((swatch) => (
              <button
                key={swatch}
                className={`color-swatch ${color === swatch ? "is-selected" : ""}`}
                type="button"
                style={{ backgroundColor: swatch }}
                onClick={() => setColor(swatch)}
                aria-label={`Color ${swatch}`}
                aria-pressed={color === swatch}
              />
            ))}
          </div>

          <div className={`size-picker ${tool === "bucket" ? "is-muted" : ""}`} role="group" aria-label="Brush size">
            {SIZES.map((option) => (
              <button
                key={option.value}
                className={`size-button ${size === option.value ? "is-selected" : ""}`}
                type="button"
                onClick={() => setSize(option.value)}
                aria-label={`${option.label} brush`}
                aria-pressed={size === option.value}
              >
                <span style={{ width: Math.min(30, option.value), height: Math.min(30, option.value) }} />
              </button>
            ))}
          </div>

          <button className="tool-button clear-button" type="button" onClick={() => setShowClear(true)}>
            <TrashIcon size={26} />
            <span>Clear</span>
          </button>
        </aside>
      </div>

      {saveError ? <div className="save-error" role="alert">{saveError}</div> : null}

      {showClear ? (
        <Modal
          title="Clear the colors?"
          onClose={() => setShowClear(false)}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => setShowClear(false)}>Keep colors</button>
              <button className="danger-button" type="button" onClick={handleClear}>Clear colors</button>
            </>
          }
        >
          <p className="modal-copy">The black outlines stay safe. You can undo this too.</p>
        </Modal>
      ) : null}
    </main>
  );
}