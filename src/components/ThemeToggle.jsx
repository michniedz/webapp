import React, { useState, useEffect } from 'react';

// Przełącznik trybu jasny/ciemny (zapis w localStorage).
const ThemeToggle = () => {
    const [theme, setTheme] = useState(() => {
        try { return localStorage.getItem('theme') || 'light'; } catch { return 'light'; }
    });

    useEffect(() => {
        document.documentElement.setAttribute('data-theme', theme);
        try { localStorage.setItem('theme', theme); } catch { /* ignore */ }
    }, [theme]);

    const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

    return (
        <button
            className="theme-toggle"
            onClick={toggle}
            title={theme === 'light' ? 'Włącz tryb ciemny' : 'Włącz tryb jasny'}
            aria-label={theme === 'light' ? 'Włącz tryb ciemny' : 'Włącz tryb jasny'}
        >
            {theme === 'light' ? '🌙' : '☀️'}
        </button>
    );
};

export default ThemeToggle;
