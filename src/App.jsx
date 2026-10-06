import React, { useState, useEffect } from 'react';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import StudentPanel from './views/StudentPanel';
import AdminPanel from './views/AdminPanel';
import { apiFetch, getToken, setToken, clearSession, getStoredUser, storeUser } from './lib/api';
import ToastContainer from './components/ToastContainer';
import './App.css';

function App() {
    // 1. Stan użytkownika — początkowo z localStorage (dla szybkiego startu),
    //    ale autorytetem jest backend (walidacja przez /api/me).
    const [user, setUser] = useState(() => getStoredUser());
    const [isLoggingIn, setIsLoggingIn] = useState(false);
    const [sessionChecked, setSessionChecked] = useState(false);

    // 2. Przy starcie sprawdź ważność tokenu na serwerze.
    useEffect(() => {
        if (!getToken()) {
            setUser(null);
            clearSession();
            setSessionChecked(true);
            return;
        }

        apiFetch('/api/me')
            .then(async (res) => {
                const data = await res.json();
                if (data.success && data.user) {
                    setUser(data.user);
                    storeUser(data.user);
                } else {
                    clearSession();
                    setUser(null);
                }
            })
            .catch(() => {
                clearSession();
                setUser(null);
            })
            .finally(() => setSessionChecked(true));
    }, []);

    // 3. Aktualizacja danych użytkownika (np. awatara lub imienia)
    const updateUserData = (newData) => {
        setUser((prev) => {
            if (!prev) return null;
            const updated = { ...prev, ...newData };
            storeUser(updated);
            return updated;
        });
    };

    // 4. Logika po udanym logowaniu (token + dane użytkownika)
    const handleLoginSuccess = (userData, token) => {
        if (token) setToken(token);
        setUser(userData);
        storeUser(userData);
        setIsLoggingIn(false);
    };

    // 5. Wylogowanie (unieważnij sesję po stronie serwera i klienta)
    const handleLogout = () => {
        apiFetch('/api/logout', { method: 'POST' }).catch(() => {});
        clearSession();
        setUser(null);
        setIsLoggingIn(false);
    };

    // Renderowanie widoków
    if (!sessionChecked) {
        return null; // krótka przerwa na walidację sesji
    }

    let content;
    if (user) {
        content = user.role === 'admin'
            ? <AdminPanel user={user} onLogout={handleLogout} />
            : <StudentPanel user={user} onUpdateUser={updateUserData} onLogout={handleLogout} />;
    } else if (isLoggingIn) {
        content = <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setIsLoggingIn(false)}
        />;
    } else {
        content = <LandingPage onLogin={() => setIsLoggingIn(true)} />;
    }

    return (
        <>
            {content}
            <ToastContainer />
        </>
    );
}

export default App;
