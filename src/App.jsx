import React, { useState } from 'react';
import './App.css';

function App() {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <div className="container">
            {/* Nawigacja */}
            <nav className="navbar">
                <div className="logo">
                    Tech<span>Programista</span>
                </div>

                <button className="menu-toggle" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                    {isMenuOpen ? '✕' : '☰'}
                </button>

                <ul className={`nav-links ${isMenuOpen ? 'active' : ''}`}>
                    <li><a href="#home">Start</a></li>
                    <li><a href="#materialy">Materiały</a></li>
                    <li><button className="login-btn">Zaloguj się</button></li>
                </ul>
            </nav>

            {/* Hero Section */}
            <header className="hero">
                <div className="hero-content">
                    <h1>Materiały dla technika <span className="highlight">programisty</span></h1>
                    <p>Zaloguj się, aby uzyskać dostęp do zadań, skryptów i przygotowania do egzaminów zawodowych.</p>
                    <div className="hero-btns">
                        <button className="btn-primary">Moje Kursy</button>
                        <button className="btn-secondary">Harmonogram</button>
                    </div>
                </div>
            </header>

            {/* Sekcja Materiałów */}
            <section id="materialy" className="features">
                <div className="card">
                    <div className="icon">💻</div>
                    <h3>Egzamin INF.03</h3>
                    <p>Tworzenie stron i baz danych. JavaScript, PHP i SQL w praktyce.</p>
                </div>
                <div className="card">
                    <div className="icon">⚙️</div>
                    <h3>Egzamin INF.04</h3>
                    <p>Projektowanie i testowanie oprogramowania. Java, C# i Python.</p>
                </div>
                <div className="card">
                    <div className="icon">📚</div>
                    <h3>Repozytorium</h3>
                    <p>Kody źródłowe z lekcji i gotowe szablony do pobrania.</p>
                </div>
            </section>

            <footer className="footer">
                <p>&copy; 2025 Panel Edukacyjny Technikum. Wszystkie prawa zastrzeżone.</p>
            </footer>
        </div>
    );
}

export default App;