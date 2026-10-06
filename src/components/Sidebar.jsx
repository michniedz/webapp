import React, { useState } from 'react';
import ThemeToggle from './ThemeToggle';

const Sidebar = ({ onLogout, user, myCourses = [], onSelectCourse, activeCourseId, onMenuClick }) => {
    const isAdmin = user?.role === 'admin';
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const closeMobile = () => setMobileOpen(false);

    return (
        <aside className={`sidebar${collapsed ? ' collapsed' : ''}${mobileOpen ? ' mobile-open' : ''}`}>
            <div className="sidebar-logo">
                {collapsed ? (
                    <span className="logo-mark">⚡</span>
                ) : (
                    <>Tech<span>Panel</span></>
                )}
                <div className="sidebar-logo-actions">
                    <button
                        className="collapse-btn"
                        onClick={() => setCollapsed(!collapsed)}
                        title={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                        aria-label={collapsed ? 'Rozwiń menu' : 'Zwiń menu'}
                    >
                        {collapsed ? '»' : '«'}
                    </button>
                    <button
                        className="mobile-toggle"
                        onClick={() => setMobileOpen(!mobileOpen)}
                        title="Menu"
                        aria-label="Menu"
                    >
                        {mobileOpen ? '✕' : '☰'}
                    </button>
                </div>
            </div>

            <nav className="side-nav">
                {isAdmin ? (
                    /* --- MENU DLA ADMINISTRATORA --- */
                    <>
                        <p className="nav-section-title">ZARZĄDZANIE</p>
                        <a href="#" className={!activeCourseId ? "active" : ""} onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('dashboard'); }} title="Pulpit">
                            🏠 <span className="nav-label">Pulpit</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('courses'); }} title="Kursy">
                            📚 <span className="nav-label">Kursy</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('users'); }} title="Użytkownicy">
                            👥 <span className="nav-label">Użytkownicy</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('quiz'); }} title="Quizy">
                            📝 <span className="nav-label">Quizy</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('results'); }} title="Wyniki">
                            📊 <span className="nav-label">Wyniki</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('materials'); }} title="Materiały">
                            📂 <span className="nav-label">Materiały</span>
                        </a>
                    </>
                ) : (
                    /* --- MENU DLA STUDENTA --- */
                    <>
                        <p className="nav-section-title">GŁÓWNE</p>
                        <a href="#" className={!activeCourseId ? "active" : ""} onClick={(e) => { e.preventDefault(); closeMobile(); onSelectCourse(null); }} title="Pulpit / Zapisz się">
                            🏠 <span className="nav-label">Pulpit / Zapisz się</span>
                        </a>

                        <p className="nav-section-title">MOJE KURSY</p>
                        <div className="my-courses-list">
                            {myCourses.length > 0 ? (
                                myCourses.map(course => (
                                    <a
                                        key={course.id}
                                        href="#"
                                        className={activeCourseId === course.id ? "active" : ""}
                                        onClick={(e) => { e.preventDefault(); closeMobile(); onSelectCourse(course); }}
                                        title={course.name}
                                    >
                                        📘 <span className="nav-label">{course.name}</span>
                                    </a>
                                ))
                            ) : (
                                <span className="no-courses-info">Brak zapisanych kursów</span>
                            )}
                        </div>

                        <p className="nav-section-title">NAUKA</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('student-quiz'); }} title="Egzaminy">
                            📝 <span className="nav-label">Egzaminy</span>
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); closeMobile(); onMenuClick('profile'); }} title="Moje Informacje">
                            👤 <span className="nav-label">Moje Informacje</span>
                        </a>
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <div className="sidebar-user-box">
                    {user?.avatar ? (
                        <img src={user.avatar} alt="Avatar" className="avatar-circle" />
                    ) : (
                        <div className="avatar-circle">👤</div>
                    )}
                    <div className="user-info-text">
                        <span className="user-name-small">{user?.first_name} {user?.last_name}</span>
                        <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>
                            {isAdmin ? 'Administrator' : 'Student'}
                        </span>
                    </div>
                </div>

                <div className="sidebar-footer-actions">
                    <ThemeToggle />
                    <button className="logout-btn" onClick={onLogout} title="Wyloguj się">
                        {collapsed ? (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                <polyline points="16 17 21 12 16 7" />
                                <line x1="21" y1="12" x2="9" y2="12" />
                            </svg>
                        ) : (
                            'Wyloguj się'
                        )}
                    </button>
                </div>
            </div>
        </aside>
    );
};

export default Sidebar;
