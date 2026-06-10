'use client';

import { useEffect, useState, useCallback, createContext, useContext, type ReactNode } from 'react';

type ToastType = 'success' | 'error';

interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastCtx {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastCtx>({
  toast: () => {
    // 回退：直接 DOM 操作，不依赖 React 状态
    showDomToast('(toast unavailable)', 'error');
  },
});

let _nextId = 0;

/** 无视 React 状态，直接操作 DOM 弹出 toast */
function showDomToast(message: string, type: ToastType) {
  const id = 'dom-toast-' + ++_nextId;
  const el = document.createElement('div');
  el.id = id;
  el.className =
    'pointer-events-auto animate-slide-up rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ' +
    (type === 'success'
      ? 'bg-green-600 text-white'
      : 'bg-red-600 text-white');
  el.innerHTML = `<div class="flex items-center gap-2"><span>${message}</span></div>`;

  const container = document.getElementById('toast-container');
  if (container) {
    container.appendChild(el);
    setTimeout(() => el.remove(), 3000);
  }
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const add = useCallback((message: string, type: ToastType = 'success') => {
    // React 方式
    const id = ++_nextId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);

    // 同时用 DOM 方式兜底（确保 toast 一定出现）
    showDomToast(message, type);
  }, []);

  const remove = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast: add }}>
      {children}
      <div
        id="toast-container"
        className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto animate-slide-up rounded-lg px-4 py-3 text-sm font-medium shadow-lg transition-all ${
              t.type === 'success'
                ? 'bg-green-600 text-white dark:bg-green-700'
                : 'bg-red-600 text-white dark:bg-red-700'
            }`}
          >
            <div className="flex items-center gap-2">
              {t.type === 'success' ? (
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="h-4 w-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
              <span>{t.message}</span>
              <button
                onClick={() => remove(t.id)}
                className="ml-2 opacity-70 hover:opacity-100"
              >
                <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastCtx {
  return useContext(ToastContext);
}
