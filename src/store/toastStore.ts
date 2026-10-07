import { create } from "zustand";

export interface ToastItem {
  id: number;
  message: string;
}

interface ToastState {
  toasts: ToastItem[];
  showToast: (message: string) => void;
  dismissToast: (id: number) => void;
}

let nextId = 1;

export const useToastStore = create<ToastState>()((set) => ({
  toasts: [],
  showToast: (message) => {
    if (!message) return;
    set((state) => ({ toasts: [...state.toasts, { id: nextId++, message }] }));
  },
  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
}));

export const showToast = (message: string) => useToastStore.getState().showToast(message);