import React, { useEffect } from 'react';

interface ToastProps {
    message: string;
    type: 'success' | 'error' | 'warning';
    onClose: () => void;
    duration?: number;
}

const Toast: React.FC<ToastProps> = ({ message, type, onClose, duration = 4000 }) => {
    useEffect(() => {
        const timer = setTimeout(onClose, duration);
        return () => clearTimeout(timer);
    }, [duration, onClose]);

    const bgColor = type === 'success' ? 'bg-emerald-500' : type === 'error' ? 'bg-red-500' : 'bg-amber-500';
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : '⚠️';

    return (
        <div className="fixed top-6 right-6 z-[9999] animate-in slide-in-from-top-5 fade-in duration-300">
            <div className={`${bgColor} text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-3 min-w-[320px] max-w-md`}>
                <span className="text-2xl">{icon}</span>
                <div className="flex-1">
                    <p className="font-bold text-sm leading-tight">{message}</p>
                </div>
                <button
                    onClick={onClose}
                    className="text-white/80 hover:text-white transition ml-2"
                >
                    ✕
                </button>
            </div>
        </div>
    );
};

export default Toast;
