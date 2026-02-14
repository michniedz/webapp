import React, { useEffect, useState } from 'react';
import Sidebar from '../components/Sidebar';
import StudentQuiz from "./StudentQuiz.jsx";

const StudentPanel = ({ onLogout, user }) => {
    const [courses, setCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [viewHtml, setViewHtml] = useState(null);
    const [enrollData, setEnrollData] = useState({ courseId: '', key: '' });
    const [isQuizMode, setIsQuizMode] = useState(false);

    // Dodajemy stan na wyniki, aby wyliczyć statystyki na pulpicie
    const [userResults, setUserResults] = useState({});

    useEffect(() => {
        fetchCourses();
        fetchMyCourses();
        fetchQuizResults();
    }, []);

    const fetchMyCourses = async () => {
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/my-courses?user_id=${user.id}`);
        const data = await res.json();
        if (data.success) setMyCourses(data.data);
    };

    const fetchCourses = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/courses');
        const data = await res.json();
        if (data.success) setCourses(data.data);
    };

    const fetchQuizResults = async () => {
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/my-results?user_id=${user.id}`);
        const data = await res.json();
        if (data.success) {
            const resultsMap = {};
            data.data.forEach(r => resultsMap[r.quiz_id] = r);
            setUserResults(resultsMap);
        }
    };

    const handleSelectCourse = async (course) => {
        if (!course) {
            setSelectedCourse(null);
            return;
        }
        setIsQuizMode(false);
        setSelectedCourse(course);
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/materials?course_id=${course.id}`);
        const data = await res.json();
        if (data.success) setMaterials(data.data);
    };

    const handleEnroll = async (e) => {
        e.preventDefault();
        if (!enrollData.courseId) return alert("Wybierz kurs z listy!");

        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                user_id: user.id,
                course_id: parseInt(enrollData.courseId),
                key: enrollData.key
            })
        });
        const data = await res.json();
        if (data.success) {
            alert("Zapisano pomyślnie!");
            fetchMyCourses();
            setEnrollData({ courseId: '', key: '' });
        } else {
            alert(data.message || "Błąd zapisu");
        }
    };

    // --- LOGIKA WYLICZANIA STATYSTYK ---
    const calculateStats = () => {
        const resultsArray = Object.values(userResults);
        if (resultsArray.length === 0) return null;

        const totalTests = resultsArray.length;
        const passedTests = resultsArray.filter(r => r.percent >= 50).length;
        const avgPercent = Math.round(resultsArray.reduce((acc, curr) => acc + curr.percent, 0) / totalTests);

        const lastFive = resultsArray
            .sort((a, b) => new Date(a.completed_at) - new Date(b.completed_at))
            .slice(-5);

        return { totalTests, passedTests, avgPercent, lastFive };
    };

    const stats = calculateStats();

    return (
        <div className="dashboard">
            <Sidebar
                onLogout={onLogout}
                user={user}
                myCourses={myCourses}
                onSelectCourse={handleSelectCourse}
                activeCourseId={selectedCourse?.id}
                onMenuClick={(action) => {
                    if (action === 'student-quiz') {
                        setIsQuizMode(true);
                        setSelectedCourse(null);
                    }
                }}
            />
            <main className="main-content">
                {isQuizMode ? (
                    <StudentQuiz
                        user={user}
                        onBack={() => {
                            setIsQuizMode(false);
                            fetchQuizResults(); // Odśwież wyniki po powrocie z quizu
                        }}
                    />
                ) : (
                    <>
                        <header className="panel-header">
                            <h2>Witaj, {user?.first_name || 'Uczniu'}! 👋</h2>
                            <p className="user-info">Osiągaj swoje cele edukacyjne.</p>
                        </header>

                        {!selectedCourse ? (
                            <div className="pulpit-view">
                                {/* SEKCJA STATYSTYK */}
                                {stats && (
                                    <section className="student-stats-section" style={{ marginBottom: '2.5rem' }}>
                                        <div className="stats-grid">
                                            <div className="stat-card">
                                                <p>Średni wynik</p>
                                                <h3 style={{ color: stats.avgPercent >= 50 ? '#22c55e' : '#ef4444', margin: '0.5rem 0' }}>
                                                    {stats.avgPercent}%
                                                </h3>
                                            </div>
                                            <div className="stat-card">
                                                <p>Zdane arkusze</p>
                                                <h3 style={{ margin: '0.5rem 0' }}>{stats.passedTests} / {stats.totalTests}</h3>
                                            </div>
                                            <div className="stat-card">
                                                <p>Aktywne kursy</p>
                                                <h3 style={{ margin: '0.5rem 0' }}>{myCourses.length}</h3>
                                            </div>
                                        </div>

                                        <div className="admin-form-section" style={{ marginTop: '1.5rem', maxWidth: '100%' }}>
                                            <h4>Ostatnie wyniki:</h4>
                                            <div className="progress-chart">
                                                {stats.lastFive.map((r, i) => (
                                                    <div key={i} className="chart-column-wrapper">
                                                        <div
                                                            className={`chart-bar ${r.percent >= 50 ? 'pass' : 'fail'}`}
                                                            style={{ height: `${r.percent}%` }}
                                                        >
                                                            <span className="bar-value">{r.percent}%</span>
                                                        </div>
                                                        <span className="bar-label">Test #{r.quiz_id}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </section>
                                )}

                                <section className="admin-form-section" style={{ maxWidth: '100%', marginBottom: '2rem' }}>
                                    <h3>➕ Zapisz się na nowy kurs</h3>
                                    <form onSubmit={handleEnroll} className="admin-form" style={{ flexDirection: 'row', alignItems: 'flex-end', gap: '1rem' }}>
                                        <div style={{ flex: 2 }}>
                                            <label>Wybierz kurs</label>
                                            <select
                                                value={enrollData.courseId}
                                                onChange={e => setEnrollData({ ...enrollData, courseId: e.target.value })}
                                                required
                                            >
                                                <option value="">-- Dostępne kursy --</option>
                                                {courses.map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div style={{ flex: 1 }}>
                                            <label>Klucz dostępu</label>
                                            <input
                                                type="text"
                                                value={enrollData.key}
                                                onChange={e => setEnrollData({ ...enrollData, key: e.target.value })}
                                                placeholder="Hasło..."
                                                required
                                            />
                                        </div>
                                        <button type="submit" className="login-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem' }}>Zapisz się</button>
                                    </form>
                                </section>

                                <section className="course-selection">
                                    <h3>Twoje aktywne kursy:</h3>
                                    <div className="stats-grid">
                                        {myCourses.length > 0 ? (
                                            myCourses.map(course => (
                                                <div key={course.id} className="stat-card clickable" onClick={() => handleSelectCourse(course)}>
                                                    <p>{course.name}</p>
                                                    <span>Wejdź do kursu →</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="no-data">Nie jesteś jeszcze zapisany na żaden kurs.</p>
                                        )}
                                    </div>
                                </section>
                            </div>
                        ) : (
                            <section className="course-materials">
                                <button className="back-link" onClick={() => setSelectedCourse(null)}>← Wróć do pulpitu</button>
                                <h3 className="course-title-active">{selectedCourse.name}</h3>

                                {materials.length > 0 ? (
                                    materials.map(item => (
                                        <div key={item.id} className="course-row">
                                            <div className="course-info">
                                                <h4>{item.title}</h4>
                                                <p>{item.content_type === 'link' ? '🔗 Link zewnętrzny' : '📄 Notatka'}</p>
                                            </div>
                                            {item.content_type === 'link' ? (
                                                <a href={item.content_value} target="_blank" rel="noreferrer" className="btn-access">Otwórz</a>
                                            ) : (
                                                <button className="btn-access" onClick={() => setViewHtml(item)}>Czytaj</button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="no-data">W tym kursie nie ma jeszcze materiałów.</p>
                                )}
                            </section>
                        )}
                    </>
                )}

                {viewHtml && (
                    <div className="modal-overlay" onClick={() => setViewHtml(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <button className="close-modal" onClick={() => setViewHtml(null)}>×</button>
                            <h2>{viewHtml.title}</h2>
                            <hr />
                            <div className="html-render" dangerouslySetInnerHTML={{ __html: viewHtml.content_value }} />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default StudentPanel;