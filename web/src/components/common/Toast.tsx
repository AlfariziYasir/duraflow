import React from 'react';

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  variant?: 'info' | 'success' | 'warning' | 'error';
}

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2 pointer-events-none max-w-md w-full">
      {toasts.map((toast) => {
        const isError = toast.variant === 'error';
        const isWarning = toast.variant === 'warning';
        const isSuccess = toast.variant === 'success';

        let iconName = toast.icon || 'check_circle';
        let iconColor = 'text-[#38bdf8]';
        let borderColor = 'border-[#1e293b]';

        if (isError) {
          iconName = toast.icon || 'error';
          iconColor = 'text-[#ffb4ab]';
          borderColor = 'border-[#93000a]';
        } else if (isWarning) {
          iconName = toast.icon || 'warning';
          iconColor = 'text-[#ffc174]';
          borderColor = 'border-[#f59e0b]/40';
        } else if (isSuccess) {
          iconName = toast.icon || 'verified';
          iconColor = 'text-[#10b981]';
          borderColor = 'border-[#10b981]/40';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto p-3.5 rounded-xl bg-[#111827] text-[#dfe2ef] shadow-[0_16px_36px_-8px_rgba(0,0,0,0.8)] border ${borderColor} flex items-start gap-3 transition-all duration-300 animate-slide-up backdrop-blur-md`}
          >
            <span className={`material-symbols-outlined text-[20px] ${iconColor} mt-0.5`}>
              {iconName}
            </span>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-mono font-semibold text-[#dfe2ef]">
                {toast.title}
              </div>
              {toast.description && (
                <div className="text-[11px] font-mono text-[#87929a] mt-0.5 leading-snug">
                  {toast.description}
                </div>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-[#87929a] hover:text-[#dfe2ef] p-0.5 rounded cursor-pointer"
            >
              <span className="material-symbols-outlined text-[15px]">close</span>
            </button>
          </div>
        );
      })}
    </div>
  );
};
