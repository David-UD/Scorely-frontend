import { describe, it, expect, beforeEach } from "vitest";
import { showToast, useToastStore } from "@/store/toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.setState({ toasts: [] });
  });

  it("adds a toast with showToast", () => {
    showToast("Competición creada.");
    const { toasts } = useToastStore.getState();
    expect(toasts).toHaveLength(1);
    expect(toasts[0].message).toBe("Competición creada.");
  });

  it("keeps multiple toasts stacked", () => {
    showToast("Uno");
    showToast("Dos");
    expect(useToastStore.getState().toasts.map((toast) => toast.message)).toEqual([
      "Uno",
      "Dos",
    ]);
  });

  it("ignores empty messages", () => {
    showToast("");
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("dismisses a toast by id", () => {
    showToast("Uno");
    const id = useToastStore.getState().toasts[0].id;
    useToastStore.getState().dismissToast(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("assigns unique ids to each toast", () => {
    showToast("Uno");
    showToast("Dos");
    const [first, second] = useToastStore.getState().toasts;
    expect(first.id).not.toBe(second.id);
  });
});