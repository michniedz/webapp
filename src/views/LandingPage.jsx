import React from 'react';
import Navbar from '../components/Navbar';

const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const LandingPage = ({ onLogin }) => {
    return (
        <div className="landing-wrapper">
            <Navbar onLogin={onLogin} />

            <header className="hero" id="home">
                <h1 className="hero-title">
                    Zostań Mistrzem <span className="highlight">Programowania</span>
                </h1>
                <p className="hero-subtitle">
                    Materiały dydaktyczne, zadania praktyczne i dokumentacja
                    dla uczniów technikum. Wszystko w jednym miejscu.
                </p>
                <div className="hero-btns">
                    <button className="btn-primary" onClick={onLogin}>
                        Zaloguj się
                    </button>
                    <button className="btn-secondary" onClick={() => scrollTo('kursy')}>
                        Przeglądaj lekcje
                    </button>
                    <button className="btn-secondary" onClick={() => scrollTo('o-projekcie')}>
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
                    <div className="icon">📝</div>
                    <h3>Egzamin INF.03</h3>
                    <p>Przygotuj się do egzaminów zawodowych z bazą gotowych arkuszy i zadań.</p>
                </div>

                <div className="card">
                    <div className="icon">📝</div>
                    <h3>Egzamin INF.04</h3>
                    <p>Przygotuj się do egzaminów zawodowych z bazą gotowych arkuszy i zadań.</p>
                </div>
            </section>

            <section id="o-projekcie" className="about-section">
                <h2>O projekcie</h2>
                <p>
                    TechProgramista to platforma edukacyjna dla uczniów technikum. Znajdziesz tu materiały
                    dydaktyczne, zadania praktyczne oraz arkusze egzaminacyjne z kwalifikacji INF.03 i INF.04.
                </p>
                <div className="about-points">
                    <div className="card"><div className="icon">📚</div><h3>Materiały</h3><p>Notatki i linki pogrupowane w kursy.</p></div>
                    <div className="card"><div className="icon">🏆</div><h3>Arkusze</h3><p>Testy sprawdzające wiedzę z oceną na serwerze.</p></div>
                    <div className="card"><div className="icon">📈</div><h3>Postępy</h3><p>Śledź swoje wyniki i historię nauki.</p></div>
                </div>
                <button className="btn-primary" onClick={onLogin}>Załóż konto lub zaloguj się</button>
            </section>

            <footer className="footer">
                <p>&copy; {new Date().getFullYear()} Technik Programista - Panel Edukacyjny</p>
            </footer>
        </div>
    );
};

export default LandingPage;
