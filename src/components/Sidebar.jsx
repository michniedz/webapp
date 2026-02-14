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
                    </>
                )}
            </nav>

            <div className="sidebar-footer">
                <p className="user-name-label">{user?.full_name}</p>
                <button className="logout-btn" onClick={onLogout}>Wyloguj się</button>
            </div>
        </aside>
    );
};

export default Sidebar;