import { useRef, useState, type PointerEvent, type ReactNode } from "react";
import { Move } from "lucide-react";
import { useLanguage } from "@/hooks/useLanguage";

type Offset = { x: number; y: number };

type DragState = {
  pointerId: number;
  startX: number;
  startY: number;
  origin: Offset;
};

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

interface DraggableSceneProps {
  children: ReactNode;
  className?: string;
  ready?: boolean;
}

/** A decorative scene with a small drag handle that never covers page controls. */
const DraggableScene = ({ children, className = "", ready = false }: DraggableSceneProps) => {
  const { t } = useLanguage();
  const rootRef = useRef<HTMLDivElement>(null);
  const movingRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const offsetRef = useRef<Offset>({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);

  const applyOffset = (next: Offset) => {
    const root = rootRef.current;
    const moving = movingRef.current;
    if (!root || !moving) return;

    const rect = root.getBoundingClientRect();
    let constrained = next;
    if (rect.width > 0 && rect.height > 0) {
      const visible = Math.min(56, rect.width * 0.35, rect.height * 0.35);
      constrained = {
        x: clamp(next.x, visible - rect.right, window.innerWidth - visible - rect.left),
        y: clamp(next.y, visible - rect.bottom, window.innerHeight - visible - rect.top),
      };
    }

    offsetRef.current = constrained;
    moving.style.transform = `translate3d(${constrained.x}px, ${constrained.y}px, 0)`;
    root.dataset.dragX = String(Math.round(constrained.x));
    root.dataset.dragY = String(Math.round(constrained.y));
  };

  const finishDrag = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragRef.current?.pointerId !== event.pointerId) return;
    dragRef.current = null;
    setDragging(false);
    if (event.currentTarget.hasPointerCapture?.(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  return (
    <div
      ref={rootRef}
      className={`pointer-events-none ${className}`}
      data-draggable-scene="true"
      data-drag-x="0"
      data-drag-y="0"
      data-scene-ready={ready ? "true" : undefined}
    >
      <div ref={movingRef} className="pointer-events-none relative h-full w-full will-change-transform">
        {children}
        <button
          type="button"
          aria-label={t("scene.move")}
          title={t("scene.move")}
          className={`pointer-events-auto absolute bottom-1 right-1 z-30 flex h-7 w-7 items-center justify-center rounded-full border border-border/50 bg-background/75 text-muted-foreground opacity-45 shadow-sm backdrop-blur-md transition-opacity hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
            dragging ? "cursor-grabbing opacity-100" : "cursor-grab"
          }`}
          onPointerDown={(event) => {
            if (event.button > 0) return;
            event.preventDefault();
            dragRef.current = {
              pointerId: event.pointerId,
              startX: event.clientX,
              startY: event.clientY,
              origin: offsetRef.current,
            };
            setDragging(true);
            try {
              event.currentTarget.setPointerCapture?.(event.pointerId);
            } catch {
              // Dragging still works when a test browser has no active pointer to capture.
            }
          }}
          onPointerMove={(event) => {
            const drag = dragRef.current;
            if (!drag || drag.pointerId !== event.pointerId) return;
            event.preventDefault();
            applyOffset({
              x: drag.origin.x + event.clientX - drag.startX,
              y: drag.origin.y + event.clientY - drag.startY,
            });
          }}
          onPointerUp={finishDrag}
          onPointerCancel={finishDrag}
          onLostPointerCapture={() => {
            dragRef.current = null;
            setDragging(false);
          }}
          onDoubleClick={(event) => {
            event.preventDefault();
            applyOffset({ x: 0, y: 0 });
          }}
          onKeyDown={(event) => {
            const step = event.shiftKey ? 30 : 10;
            const moves: Record<string, Offset> = {
              ArrowLeft: { x: -step, y: 0 },
              ArrowRight: { x: step, y: 0 },
              ArrowUp: { x: 0, y: -step },
              ArrowDown: { x: 0, y: step },
            };
            if (event.key === "Home") {
              event.preventDefault();
              applyOffset({ x: 0, y: 0 });
              return;
            }
            const move = moves[event.key];
            if (!move) return;
            event.preventDefault();
            applyOffset({ x: offsetRef.current.x + move.x, y: offsetRef.current.y + move.y });
          }}
        >
          <Move size={13} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default DraggableScene;
