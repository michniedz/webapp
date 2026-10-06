// Prosty globalny system powiadomień (toast) — bez zależności od React Context.
let handler = null;

export function registerToastHandler(fn) {
    handler = fn;
    return () => {
        handler = null;
    };
}

// Wyświetla toast. Typy: 'info' (domyślnie), 'success', 'warning', 'error'.
export function toast(message, type = 'info') {
    if (handler) handler(message, type);
}
