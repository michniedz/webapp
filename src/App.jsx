import React, { useState } from 'react';
import LandingPage from './views/LandingPage';
import LoginPage from './views/LoginPage';
import StudentPanel from './views/StudentPanel';
import AdminPanel from './views/AdminPanel';
import './App.css';

function App() {
    // 1. Definiujemy stan użytkownika.
    // Próbujemy pobrać dane z localStorage przy starcie aplikacji.
    const [user, setUser] = useState(() => {
        const savedUser = localStorage.getItem('user');
        return savedUser ? JSON.parse(savedUser) : null;
    });

    const [isLoggingIn, setIsLoggingIn] = useState(false);

    // 2. Funkcja aktualizacji danych (np. awatara lub imienia)
    const updateUserData = (newData) => {
        setUser(prev => {
            if (!prev) return null;
            const updated = { ...prev, ...newData };
            // Zapisujemy zmiany w localStorage, żeby nie zniknęły po odświeżeniu
            localStorage.setItem('user', JSON.stringify(updated));
            return updated;
        });
    };

    // 3. Logika po udanym logowaniu
    const handleLoginSuccess = (userData) => {
        setUser(userData);
        // Zapisujemy sesję w przeglądarce
        localStorage.setItem('user', JSON.stringify(userData));
        setIsLoggingIn(false);
    };

    // 4. Logika wylogowania
    const handleLogout = () => {
        setUser(null);
        // Czyścimy pamięć przeglądarki
        localStorage.removeItem('user');
        setIsLoggingIn(false);
    };

    // Renderowanie widoków
    if (user) {
        return user.role === 'admin'
            ? <AdminPanel user={user} onLogout={handleLogout} />
            : <StudentPanel user={user} onUpdateUser={updateUserData} onLogout={handleLogout} />;
    }

    if (isLoggingIn) {
        return <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setIsLoggingIn(false)}
        />;
    }

    return <LandingPage onLogin={() => setIsLoggingIn(true)} />;
}

export default App;