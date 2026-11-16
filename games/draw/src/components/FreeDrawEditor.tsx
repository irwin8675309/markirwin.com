import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { FreeDrawEngine } from "../drawing/FreeDrawEngine";
import { loadDraft, persistArtwork, saveEditorDraft, draftIdForFree, type SaveArtworkInput } from "../storage/artwork";
import type { ArtworkRecord } from "../types";
import { ArrowLeftIcon, BrushIcon, EraserIcon, RedoIcon, SaveIcon, TrashIcon, UndoIcon } from "./Icons";
import { Modal } from "./Modal";

interface FreeDrawEditorProps {
  artwork?: ArtworkRecord;
  onExit: () => void;
  onSave: (input: SaveArtworkInput) => Promise<void>;
}

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

export function FreeDrawEditor({ artwork, onExit, onSave }: FreeDrawEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FreeDrawEngine | null>(null);
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const drawingRef = useRef(false);
  const dirtyRef = useRef(false);
  const savedRef = useRef(false);
  const draftIdRef = useRef(draftIdForFree(artwork?.id));

  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [history, setHistory] = useState({ canUndo: false, canRedo: false });
  const [tool, setTool] = useState<"brush" | "eraser">("brush");
  const [color, setColor] = useState(COLORS[0]);
  const [size, setSize] = useState(18);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [showClear, setShowClear] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const canvas = canvasRef.current;
    const stage = stageRef.current;
    if (!canvas || !stage) return;

    void (async () => {
      try {
        const draft = await loadDraft(draftIdRef.current);
        if (cancelled) return;

        const rect = stage.getBoundingClientRect();
        const aspect = rect.height > 0
          ? Math.max(0.68, Math.min(1.75, rect.width / rect.height))
          : 1.33;
        const longSide = 1700;
        const computedWidth = aspect >= 1 ? longSide : Math.round(longSide * aspect);
        const computedHeight = aspect >= 1 ? Math.round(longSide / aspect) : longSide;
        const width = artwork?.width ?? draft?.width ?? computedWidth;
        const height = artwork?.height ?? draft?.height ?? computedHeight;

        const engine = new FreeDrawEngine(canvas, width, height);
        engineRef.current = engine;

        const image = draft?.freeImage ?? artwork?.freeImage;
        if (image) await engine.load(image);
        if (cancelled) return;

        setReady(true);
        setHistory(engine.getHistoryState());
      } catch (error) {
        if (!cancelled) setLoadError(error instanceof Error ? error.message : "This drawing could not be opened.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [artwork]);

  useEffect(() => {
    return () => {
      const engine = engineRef.current;
      if (!engine || !dirtyRef.current || savedRef.current) return;
      void saveEditorDraft({
        id: draftIdRef.current,
        kind: "free",
        width: engine.width,
        height: engine.height,
        updatedAt: Date.now(),
        freeImage: engine.dataUrl(),
      });
    };
  }, []);

  const updateHistory = () => {
    const engine = engineRef.current;
    if (engine) setHistory(engine.getHistoryState());
  };

  const markDirty = () => {
    dirtyRef.current = true;
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
    try {
      event.currentTarget.setPointerCapture(event.pointerId);
    } catch {
      // Some older browsers do not expose pointer capture for touch input.
    }
    const point = toCanvasPoint(event);
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
      kind: "free",
      width: engine.width,
      height: engine.height,
      updatedAt: Date.now(),
      freeImage: engine.dataUrl(),
    });
    dirtyRef.current = false;
  };

  const handleExit = async () => {
    try {
      await persistDraftNow();
    } catch {
      // The browser will still keep the current canvas while this screen is open.
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
        title: artwork?.title ?? "My Drawing",
        kind: "free",
        width: engine.width,
        height: engine.height,
        preview: engine.previewDataUrl(520),
        freeImage: engine.dataUrl(),
        draftId: draftIdRef.current,
      });
      dirtyRef.current = false;
    } catch (error) {
      savedRef.current = false;
      setSaveError(error instanceof Error ? error.message : "Your drawing could not be saved.");
      setSaving(false);
    }
  };

  return (
    <main className="editor-screen free-editor">
      <header className="editor-header">
        <button className="round-button" type="button" onClick={() => void handleExit()} aria-label="Back">
          <ArrowLeftIcon size={30} />
        </button>
        <div className="editor-heading">
          <span className="editor-eyebrow">Free Draw</span>
          <h1>{artwork?.title ?? "My Drawing"}</h1>
        </div>
        <div className="editor-actions">
          <button
            className="icon-button"
            type="button"
            onClick={handleUndo}
            disabled={!history.canUndo}
            aria-label="Undo"
          >
            <UndoIcon />
          </button>
          <button
            className="icon-button"
            type="button"
            onClick={handleRedo}
            disabled={!history.canRedo}
            aria-label="Redo"
          >
            <RedoIcon />
          </button>
          <button className="primary-button save-button" type="button" onClick={() => void handleSave()} disabled={!ready || saving}>
            <SaveIcon size={22} />
            <span>{saving ? "Saving…" : "Save"}</span>
          </button>
        </div>
      </header>

      <div className="editor-body">
        <div className="canvas-stage" ref={stageRef}>
          <canvas
            ref={canvasRef}
            className={`drawing-canvas ${tool === "eraser" ? "is-erasing" : ""}`}
            aria-label="Drawing canvas"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
          {!ready && !loadError ? (
            <div className="canvas-loading">
              <span className="loading-dot" />
              <span>Getting the paper ready…</span>
            </div>
          ) : null}
          {loadError ? <div className="canvas-error">{loadError}</div> : null}
        </div>

        <aside className="editor-tools" aria-label="Drawing tools">
          <div className="tool-row" role="group" aria-label="Drawing tool">
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

          <div className="size-picker" role="group" aria-label="Brush size">
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
          title="Start over?"
          onClose={() => setShowClear(false)}
          actions={
            <>
              <button className="secondary-button" type="button" onClick={() => setShowClear(false)}>Keep drawing</button>
              <button className="danger-button" type="button" onClick={handleClear}>Clear it</button>
            </>
          }
        >
          <p className="modal-copy">This will clear the paper. You can undo it if you change your mind.</p>
        </Modal>
      ) : null}
    </main>
  );
}