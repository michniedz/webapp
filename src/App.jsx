import React, { useState } from 'react';
import LandingPage from './views/LandingPage'; // Import Twojej starej strony
import LoginPage from './views/LoginPage';
import StudentPanel from './views/StudentPanel';
import AdminPanel from './views/AdminPanel';
import './App.css';

function App() {
    const [user, setUser] = useState(null);
    const [isLoggingIn, setIsLoggingIn] = useState(false); // Czy użytkownik kliknął "Zaloguj się"?

    const handleLoginSuccess = (userData) => {
        setUser(userData);
        setIsLoggingIn(false); // Ukrywamy widok logowania po sukcesie
    };

    const handleLogout = () => {
        setUser(null);
        setIsLoggingIn(false);
    };

    // 1. Jeśli użytkownik jest zalogowany -> Pokaż odpowiedni panel
    if (user) {
        return user.role === 'admin'
            ? <AdminPanel user={user} onLogout={handleLogout} />
            : <StudentPanel user={user} onLogout={handleLogout} />;
    }

    // 2. Jeśli użytkownik kliknął przycisk logowania -> Pokaż LoginPage
    if (isLoggingIn) {
        return <LoginPage
            onLoginSuccess={handleLoginSuccess}
            onBack={() => setIsLoggingIn(false)}
        />;
    }

    // 3. Domyślnie pokazywana strona (Twoje informacje podstawowe)
    return <LandingPage onLogin={() => setIsLoggingIn(true)} />;
}

export default App;