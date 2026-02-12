import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess, onBack }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Tutaj w przyszłości dodasz walidację z bazą danych
        console.log("Logowanie...", { email, password });
        onLoginSuccess();
    };

    return (
        <div className="login-container">
            <form className="login-card" onSubmit={handleSubmit}>
                <button type="button" className="back-link" onClick={onBack}>
                    ← Wróć do strony głównej
                </button>
                <h2>Zaloguj się do <span className="highlight">TechProgramista</span></h2>
                <p>Wprowadź swoje dane, aby uzyskać dostęp do materiałów.</p>

                <div className="input-group">
                    <label>E-mail</label>
                    <input
                        type="email"
                        placeholder="twoj@email.pl"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>

                <div className="input-group">
                    <label>Hasło</label>
                    <input
                        type="password"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>

                <button type="submit" className="login-submit-btn">
                    Zaloguj się
                </button>

                <p className="login-footer">
                    Nie masz konta? Skontaktuj się z nauczycielem.
                </p>
            </form>
        </div>
    );
};

export default LoginPage;