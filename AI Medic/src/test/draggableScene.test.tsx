import { fireEvent, render, screen } from "@testing-library/react";
import { beforeAll, describe, expect, it } from "vitest";
import DraggableScene from "@/components/three/DraggableScene";

beforeAll(() => {
  if (window.PointerEvent) return;
  class PointerEventMock extends MouseEvent {
    pointerId: number;
    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
    }
  }
  Object.defineProperty(window, "PointerEvent", {
    writable: true,
    value: PointerEventMock as unknown as typeof PointerEvent,
  });
});

const renderScene = () => {
  const { container } = render(
    <DraggableScene>
      <div>3D</div>
    </DraggableScene>,
  );
  return {
    handle: screen.getByRole("button"),
    scene: container.querySelector<HTMLElement>("[data-draggable-scene]")!,
    moving: container.querySelector<HTMLElement>(".will-change-transform")!,
  };
};

describe("DraggableScene", () => {
  it("moves the scene by the cursor delta", () => {
    const { handle, scene, moving } = renderScene();

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 100, clientY: 80 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 140, clientY: 105 });
    fireEvent.pointerUp(handle, { pointerId: 1 });

    expect(scene).toHaveAttribute("data-drag-x", "40");
    expect(scene).toHaveAttribute("data-drag-y", "25");
    expect(moving.style.transform).toBe("translate3d(40px, 25px, 0)");
  });

  it("returns the scene to its original position on double click", () => {
    const { handle, scene, moving } = renderScene();

    fireEvent.pointerDown(handle, { pointerId: 1, button: 0, clientX: 20, clientY: 20 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientX: 65, clientY: 70 });
    fireEvent.pointerUp(handle, { pointerId: 1 });
    expect(scene).toHaveAttribute("data-drag-x", "45");
    expect(scene).toHaveAttribute("data-drag-y", "50");
    fireEvent.doubleClick(handle);

    expect(scene).toHaveAttribute("data-drag-x", "0");
    expect(scene).toHaveAttribute("data-drag-y", "0");
    expect(moving.style.transform).toBe("translate3d(0px, 0px, 0)");
  });
});
