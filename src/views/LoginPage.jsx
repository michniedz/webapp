import React, { useState } from 'react';

const LoginPage = ({ onLoginSuccess, onBack }) => {
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Pola formularza
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        first_name: '',
        last_name: ''
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAction = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        const endpoint = isRegister ? '/api/register' : '/api/login';

        try {
            const res = await fetch(`https://backend-webapp.michniedz.workers.dev${endpoint}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok && data.success) {
                if (isRegister) {
                    alert("Konto utworzone! Poczekaj na akceptację administratora.");
                    setIsRegister(false);
                } else {
                    onLoginSuccess(data.user);
                }
            } else {
                setError(data.message || data.error || "Wystąpił błąd.");
            }
        } catch (err) {
            setError("Błąd połączenia z serwerem.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">
                <button className="back-link" onClick={onBack}>← Wróć do strony głównej</button>

                <h2>{isRegister ? "Stwórz konto" : "Witaj ponownie"}</h2>
                <p>{isRegister ? "Dołącz do platformy edukacyjnej" : "Zaloguj się do swojego panelu"}</p>

                {error && <div className="status-banner error">{error}</div>}

                <form onSubmit={handleAction} className="admin-form">
                    {isRegister && (
                        <div className="quiz-grid">
                            <div className="input-group">
                                <label>Imię</label>
                                <input type="text" name="first_name" required onChange={handleChange} />
                            </div>
                            <div className="input-group">
                                <label>Nazwisko</label>
                                <input type="text" name="last_name" required onChange={handleChange} />
                            </div>
                        </div>
                    )}

                    <div className="input-group">
                        <label>Email</label>
                        <input type="email" name="email" required onChange={handleChange} />
                    </div>

                    <div className="input-group">
                        <label>Hasło</label>
                        <input type="password" name="password" required onChange={handleChange} />
                    </div>

                    <button type="submit" className="login-submit-btn" disabled={loading}>
                        {loading ? "Proszę czekać..." : (isRegister ? "Zarejestruj się" : "Zaloguj się")}
                    </button>
                </form>

                <div className="login-footer">
                    {isRegister ? (
                        <p>Masz już konto? <span className="toggle-link" onClick={() => setIsRegister(false)}>Zaloguj się</span></p>
                    ) : (
                        <p>Nie masz konta? <span className="toggle-link" onClick={() => setIsRegister(true)}>Zarejestruj się</span></p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default LoginPage;