'use client';

import { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface Toast {
    id: number;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 4 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 4000);
    }, []);

    const removeToast = (id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}

            {/* Toast container */}
            <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
                {toasts.map((toast) => (
                    <div
                        key={toast.id}
                        className={cn(
                            'px-4 py-3 rounded-xl shadow-lg flex items-center gap-3 animate-slide-up cursor-pointer',
                            'transform transition-all duration-300 hover:scale-105',
                            toast.type === 'success' && 'bg-green-500 text-white',
                            toast.type === 'error' && 'bg-red-500 text-white',
                            toast.type === 'warning' && 'bg-yellow-500 text-white',
                            toast.type === 'info' && 'bg-blue-500 text-white'
                        )}
                        onClick={() => removeToast(toast.id)}
                    >
                        <span className="text-lg">
                            {toast.type === 'success' && '✓'}
                            {toast.type === 'error' && '✗'}
                            {toast.type === 'warning' && '⚠'}
                            {toast.type === 'info' && 'ℹ'}
                        </span>
                        <p className="font-medium text-sm">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
}
