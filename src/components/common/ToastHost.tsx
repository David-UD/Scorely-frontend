import Toast from "@/components/common/Toast";
import { useToastStore } from "@/store/toastStore";

export default function ToastHost() {
  const toasts = useToastStore((state) => state.toasts);
  const dismissToast = useToastStore((state) => state.dismissToast);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed right-5 bottom-5 z-[100] flex flex-col gap-3">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          onClose={() => dismissToast(toast.id)}
          floating={false}
        />
      ))}
    </div>
  );
}