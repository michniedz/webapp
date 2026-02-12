import React from 'react';
import Navbar from '../components/Navbar';

const LandingPage = ({ onLogin }) => {
    return (
        <div className="landing-wrapper">
            <Navbar onLogin={onLogin} />

            <header className="hero">
                <h1 className="hero-title">
                    Zostań Mistrzem <span className="highlight">Programowania</span>
                </h1>
                <p className="hero-subtitle">
                    Ekskluzywne materiały dydaktyczne, zadania praktyczne i dokumentacja
                    dla uczniów technikum. Wszystko w jednym miejscu.
                </p>
                <div className="hero-btns">
                    <button className="btn-primary" onClick={onLogin}>
                        Przeglądaj lekcje
                    </button>
                    <button className="btn-secondary">
                        O projekcie
                    </button>
                </div>
            </header>

            <section id="kursy" className="features">
                <div className="card">
                    <div className="icon">⚛️</div>
                    <h3>Frontend Dev</h3>
                    <p>Opanuj React.js, Vite oraz nowoczesne podejście do stylowania aplikacji webowych.</p>
                </div>

                <div className="card">
                    <div className="icon">🛡️</div>
                    <h3>Backend Core</h3>
                    <p>Zrozum architekturę serwerową, bazy danych SQL i bezpieczne API w Node.js.</p>
                </div>

                <div className="card">
                    <div className="icon">📝</div>
                    <h3>Egzamin INF.04</h3>
                    <p>Przygotuj się do egzaminów zawodowych z bazą gotowych arkuszy i zadań.</p>
                </div>
            </section>

            <footer className="footer">
                <p>&copy; 2025 Technik Programista - Panel Edukacyjny</p>
            </footer>
        </div>
    );
};

export default LandingPage;