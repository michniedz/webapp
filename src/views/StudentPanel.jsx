import React from 'react';
import Sidebar from '../components/Sidebar';

const StudentPanel = ({ onLogout }) => {
    return (
        <div className="dashboard">
            <Sidebar onLogout={onLogout} />

            <main className="main-content">
                <header className="panel-header">
                    <h2>Witaj, młody programisto! 👋</h2>
                    <p className="user-info">Zalogowany jako: Uczeń Klasy Technikum</p>
                </header>

                <section className="stats-grid">
                    <div className="stat-card">
                        <span>3</span>
                        <p>Ukończone lekcje</p>
                    </div>
                    <div className="stat-card">
                        <span>12</span>
                        <p>Pliki do pobrania</p>
                    </div>
                    <div className="stat-card">
                        <span>5 dni</span>
                        <p>Do egzaminu INF.03</p>
                    </div>
                </section>

                <section className="course-list">
                    <h3>Twoje aktywne kursy i materiały</h3>

                    <div className="course-row">
                        <div className="course-info">
                            <h4>JavaScript - Manipulacja DOM</h4>
                            <p>Materiały PDF + Zadania praktyczne</p>
                        </div>
                        <button className="btn-access">Otwórz</button>
                    </div>

                    <div className="course-row">
                        <div className="course-info">
                            <h4>React - Komponenty i Propsy</h4>
                            <p>Wideo-lekcja i repozytorium GitHub</p>
                        </div>
                        <button className="btn-access">Otwórz</button>
                    </div>

                    <div className="course-row">
                        <div className="course-info">
                            <h4>Bazy Danych - Relacje JOIN</h4>
                            <p>Ćwiczenia na bazie MariaDB</p>
                        </div>
                        <button className="btn-access">Otwórz</button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default StudentPanel;