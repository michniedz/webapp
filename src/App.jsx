import React, { useState } from 'react';
import LandingPage from './views/LandingPage';
import StudentPanel from './views/StudentPanel';
import './App.css';
import LoginPage from "./views/LoginPage.jsx";

function App() {
    const [view, setView] = useState('landing');
    return (
        <div className="app-container">
            {view === 'landing' && (
                <LandingPage onLogin={() => setView('login')} />
            )}

            {view === 'login' && (
                <LoginPage
                    onLoginSuccess={() => setView('dashboard')}
                    onBack={() => setView('landing')}
                />
            )}

            {view === 'dashboard' && (
                <StudentPanel onLogout={() => setView('landing')} />
            )}
        </div>
    );
}

export default App;