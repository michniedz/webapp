// Centralny moduł API — dodaje token sesji do każdego żądania i obsługuje
// wygaśnięcie sesji (401).

const API_BASE = 'https://backend-webapp.michniedz.workers.dev';

export function getToken() {
    try {
        return localStorage.getItem('token') || '';
    } catch {
        return '';
    }
}

export function setToken(token) {
    try {
        if (token) {
            localStorage.setItem('token', token);
        } else {
            localStorage.removeItem('token');
        }
    } catch {
        /* ignore */
    }
}

export function clearSession() {
    try {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    } catch {
        /* ignore */
    }
}

export function getStoredUser() {
    try {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    } catch {
        return null;
    }
}

export function storeUser(user) {
    try {
        localStorage.setItem('user', JSON.stringify(user));
    } catch {
        /* ignore */
    }
}

export async function apiFetch(path, options = {}) {
    const token = getToken();
    const headers = { ...(options.headers || {}) };

    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (options.body && typeof options.body === 'string' && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
    }

    const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

    // Wygaśnięta/unieważniona sesja — wyloguj i wróć do strony głównej.
    if (res.status === 401) {
        clearSession();
        if (!window.location.pathname.endsWith('/index.html') && window.location.pathname !== '/') {
            window.location.reload();
        }
        const err = new Error('Nieautoryzowany dostęp. Zaloguj się ponownie.');
        err.status = 401;
        throw err;
    }

    return res;
}

export default apiFetch;
