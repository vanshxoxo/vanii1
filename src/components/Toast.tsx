import { useStore } from '../store';
import { Check, Heart, X } from 'lucide-react';

export default function ToastContainer() {
  const { toasts, dismissToast } = useStore();

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] flex flex-col gap-2 items-center pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto flex items-center gap-3 bg-ink text-cream px-4 py-3 rounded-xl shadow-xl animate-toast-in max-w-sm"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full shrink-0 ${
              toast.type === 'wishlist' ? 'bg-peach' : 'bg-pistachio'
            }`}
          >
            {toast.type === 'wishlist' ? (
              <Heart size={14} fill="currentColor" className="text-white" />
            ) : (
              <Check size={14} className="text-ink" />
            )}
          </span>
          <p className="text-sm font-medium">{toast.message}</p>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
            className="text-cream/50 hover:text-cream transition-colors shrink-0"
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
