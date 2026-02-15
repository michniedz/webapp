import React from 'react';

const Sidebar = ({ onLogout, user, myCourses = [], onSelectCourse, activeCourseId, onMenuClick }) => {
    const isAdmin = user?.role === 'admin';

    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                Tech<span>Panel</span>
            </div>

            <nav className="side-nav">
                {isAdmin ? (
                    /* --- MENU DLA ADMINISTRATORA --- */
                    <>
                        <p className="nav-section-title">ZARZĄDZANIE</p>
                        <a href="#" className={!activeCourseId ? "active" : ""} onClick={(e) => { e.preventDefault(); onMenuClick('dashboard'); }}>
                            🏠 Pulpit
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('courses'); }}>
                            📚 Kursy
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('users'); }}>
                            👥 Użytkownicy
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('quiz'); }}>
                            📝 Quizy
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('results'); }}>
                            📝 Wyniki
                        </a>
                    </>
                ) : (
                    /* --- MENU DLA STUDENTA --- */
                    <>
                        <p className="nav-section-title">GŁÓWNE</p>
                        <a href="#" className={!activeCourseId ? "active" : ""} onClick={(e) => { e.preventDefault(); onSelectCourse(null); }}>
                            🏠 Pulpit / Zapisz się
                        </a>

                        <p className="nav-section-title">MOJE KURSY</p>
                        <div className="my-courses-list">
                            {myCourses.length > 0 ? (
                                myCourses.map(course => (
                                    <a
                                        key={course.id}
                                        href="#"
                                        className={activeCourseId === course.id ? "active" : ""}
                                        onClick={(e) => { e.preventDefault(); onSelectCourse(course); }}
                                    >
                                        📘 {course.name}
                                    </a>
                                ))
                            ) : (
                                <span className="no-courses-info">Brak zapisanych kursów</span>
                            )}
                        </div>

                        <p className="nav-section-title">NAUKA</p>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('student-quiz'); }}>
                            📝 Egzaminy
                        </a>
                        <a href="#" onClick={(e) => { e.preventDefault(); onMenuClick('profile'); }}>
                            👤 Moje Informacje
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
                        {/* ZMIANA TUTAJ: Dynamiczna etykieta roli */}
                        <span style={{fontSize: '0.7rem', color: '#94a3b8'}}>
                {isAdmin ? 'Administrator' : 'Student'}
            </span>
                    </div>
                </div>

                {/* Opcjonalnie: Jeśli chcesz, aby admin też mógł wejść w edycję swojego profilu */}
                {/*{isAdmin && (*/}
                {/*    <a href="#"*/}
                {/*       style={{fontSize: '0.75rem', color: 'var(--primary)', marginBottom: '10px', display: 'block', textDecoration: 'none'}}*/}
                {/*       onClick={(e) => { e.preventDefault(); onMenuClick('profile'); }}>*/}
                {/*        ⚙️ Ustawienia konta*/}
                {/*    </a>*/}
                {/*)}*/}

                <button className="logout-btn" onClick={onLogout}>Wyloguj się</button>
            </div>
        </aside>
    );
};

export default Sidebar;