import { useCallback, useRef } from "react";
import type { DragItem } from "./types";

interface SavedStyle {
  el: HTMLElement;
  position: string;
  left: string;
  top: string;
  width: string;
  height: string;
  transform: string;
  zIndex: string;
  origOffsetY: number;
}

interface DragState {
  item: DragItem | null;
  startX: number;
  startY: number;
  offsetX: number;
  offsetY: number;
  dragElement: HTMLElement | null;
  isDragging: boolean;
  draggedElements: SavedStyle[];
}

export function useDragAndDrop(
  onDrop: (item: DragItem, targetType: string, targetIndex: number) => void,
) {
  const dragState = useRef<DragState>({
    item: null,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0,
    dragElement: null,
    isDragging: false,
    draggedElements: [],
  });

  const getDropTarget = useCallback(
    (x: number, y: number): { type: string; index: number } | null => {
      const elements = document.elementsFromPoint(x, y);
      for (const el of elements) {
        const dropZone = (el as HTMLElement).closest(
          "[data-drop-type]",
        ) as HTMLElement | null;
        if (dropZone) {
          return {
            type: dropZone.dataset.dropType!,
            index: parseInt(dropZone.dataset.dropIndex || "0", 10),
          };
        }
      }
      return null;
    },
    [],
  );

  const handleMoveEvent = useCallback((clientX: number, clientY: number) => {
    const state = dragState.current;
    if (!state.isDragging || !state.dragElement) return;
    const dx = clientX - state.startX;
    const dy = clientY - state.startY;
    for (const saved of state.draggedElements) {
      saved.el.style.left = `${state.offsetX + dx}px`;
      saved.el.style.top = `${saved.origOffsetY + dy}px`;
    }
  }, []);

  const handleEndEvent = useCallback(
    (clientX: number, clientY: number) => {
      const state = dragState.current;
      if (!state.isDragging || !state.dragElement) return;

      for (const saved of state.draggedElements) {
        saved.el.style.position = saved.position;
        saved.el.style.left = saved.left;
        saved.el.style.top = saved.top;
        saved.el.style.width = saved.width;
        saved.el.style.height = saved.height;
        saved.el.style.transform = saved.transform;
        saved.el.style.zIndex = saved.zIndex;
        saved.el.classList.remove("dragging");
      }
      state.draggedElements = [];
      state.isDragging = false;

      const target = getDropTarget(clientX, clientY);
      if (target && state.item) {
        onDrop(state.item, target.type, target.index);
      }

      state.item = null;
      state.dragElement = null;
    },
    [onDrop, getDropTarget],
  );

  const startDrag = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      item: DragItem,
      element: HTMLElement,
    ) => {
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = element.getBoundingClientRect();

      const state = dragState.current;
      state.item = item;
      state.startX = clientX;
      state.startY = clientY;
      state.offsetX = rect.left;
      state.offsetY = rect.top;
      state.dragElement = element;
      state.isDragging = true;

      const siblings: HTMLElement[] = [element];
      let next = element.nextElementSibling as HTMLElement | null;
      while (next) {
        if (next.classList.contains("card")) {
          siblings.push(next);
        }
        next = next.nextElementSibling as HTMLElement | null;
      }

      state.draggedElements = siblings.map((el, i) => {
        const r = el.getBoundingClientRect();
        const saved: SavedStyle = {
          el,
          position: el.style.position,
          left: el.style.left,
          top: el.style.top,
          width: el.style.width,
          height: el.style.height,
          transform: el.style.transform,
          zIndex: el.style.zIndex,
          origOffsetY: r.top,
        };
        el.style.position = "fixed";
        el.style.left = `${r.left}px`;
        el.style.top = `${r.top}px`;
        el.style.width = `${r.width}px`;
        el.style.height = `${r.height}px`;
        el.style.transform = "";
        el.classList.add("dragging");
        el.style.zIndex = `${1000 + i}`;
        return saved;
      });

      const onMouseMove = (ev: MouseEvent) =>
        handleMoveEvent(ev.clientX, ev.clientY);
      const onTouchMove = (ev: TouchEvent) => {
        ev.preventDefault();
        handleMoveEvent(ev.touches[0].clientX, ev.touches[0].clientY);
      };
      const onMouseUp = (ev: MouseEvent) => {
        handleEndEvent(ev.clientX, ev.clientY);
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
      };
      const onTouchEnd = (ev: TouchEvent) => {
        const touch = ev.changedTouches[0];
        handleEndEvent(touch.clientX, touch.clientY);
        document.removeEventListener("touchmove", onTouchMove);
        document.removeEventListener("touchend", onTouchEnd);
      };

      if ("touches" in e) {
        document.addEventListener("touchmove", onTouchMove, { passive: false });
        document.addEventListener("touchend", onTouchEnd);
      } else {
        document.addEventListener("mousemove", onMouseMove);
        document.addEventListener("mouseup", onMouseUp);
      }
    },
    [handleMoveEvent, handleEndEvent],
  );

  return { startDrag };
}
