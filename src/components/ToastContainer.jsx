import React, { useState, useEffect, useCallback } from 'react';
import { registerToastHandler } from '../lib/toast';

const ToastContainer = () => {
    const [toasts, setToasts] = useState([]);

    const push = useCallback((message, type = 'info') => {
        const id = Math.random().toString(36).slice(2);
        setToasts((prev) => [...prev, { id, message, type }]);
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 4000);
    }, []);

    useEffect(() => registerToastHandler(push), [push]);

    const dismiss = (id) => setToasts((prev) => prev.filter((t) => t.id !== id));

    if (toasts.length === 0) return null;

    return (
        <div className="toast-container">
            {toasts.map((t) => (
                <div key={t.id} className={`toast toast-${t.type}`} onClick={() => dismiss(t.id)}>
                    <span>{t.message}</span>
                    <button
                        className="toast-close"
                        onClick={(e) => { e.stopPropagation(); dismiss(t.id); }}
                        aria-label="Zamknij"
                    >×</button>
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;
