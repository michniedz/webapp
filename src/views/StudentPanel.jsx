import React, {useEffect, useRef, useState} from 'react';
import Sidebar from '../components/Sidebar';
import StudentQuiz from "./StudentQuiz.jsx";

const StudentPanel = ({ onLogout, user, onUpdateUser }) => {
    const fileInputRef = useRef(null);

    const [courses, setCourses] = useState([]);
    const [myCourses, setMyCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [materials, setMaterials] = useState([]);
    const [viewHtml, setViewHtml] = useState(null);
    const [enrollData, setEnrollData] = useState({ courseId: '', key: '' });
    const [isQuizMode, setIsQuizMode] = useState(false);

    const [activeTab, setActiveTab] = useState('dashboard'); // Domyślnie pulpit

    // NOWE: Stan do przechowywania ID konkretnego testu
    const [selectedQuizId, setSelectedQuizId] = useState(null);

    // Dodajemy stan na wyniki, aby wyliczyć statystyki na pulpicie
    const [userResults, setUserResults] = useState({});
    const [courseQuizzes, setCourseQuizzes] = useState([]); // Nowy stan na testy kursu

    const [profileData, setProfileData] = useState({
        first_name: user.first_name,
        last_name: user.last_name,
        avatar: user.avatar || '',
        password: ''
    });

    const [loginHistory, setLoginHistory] = useState([]);

    const formatGoogleDriveLink = (url) => {
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
            // Zamienia /view lub /edit na /preview, co pozwala na osadzenie w iframe
            return url.replace(/\/view.*|\/edit.*/, '/preview');
        }
        return url;
    };

    const handleRemoveAvatar = () => {
        if (confirm("Czy na pewno chcesz usunąć swoje zdjęcie profilowe?")) {
            setProfileData({ ...profileData, avatar: '' }); // Czyścimy podgląd
            if (fileInputRef.current) {
                fileInputRef.current.value = ""; // Czyścimy input pliku, aby można było wgrać to samo zdjęcie ponownie
            }
        }
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // 1. Sprawdzenie rozszerzenia (MIME type)
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];
        if (!allowedTypes.includes(file.type)) {
            alert("Niepoprawny format pliku! Wybierz obraz JPG, PNG lub GIF.");
            e.target.value = "";
            return;
        }

        // 2. Sprawdzenie wielkości (100 KB = 102400 bajtów)
        if (file.size > 102400) {
            alert("Plik jest zbyt duży! Maksymalna wielkość to 100 KB. Twój plik ma: " + Math.round(file.size / 1024) + " KB");
            e.target.value = "";
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            setProfileData({ ...profileData, avatar: reader.result });
        };
        reader.readAsDataURL(file);
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/user/update', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: user.id,
                ...profileData
            })
        });

        const data = await res.json();
        if (data.success) {
            // AKTUALIZACJA LOKALNEGO STANU W CAŁEJ APLIKACJI
            onUpdateUser({
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                avatar: profileData.avatar
            });

            alert("Dane i awatar zostały zaktualizowane!");
            setProfileData({...profileData, password: ''});
        }
    };

    useEffect(() => {
        fetchCourses();
        fetchMyCourses();
        fetchQuizResults();
    }, []);

    const fetchLoginHistory = async () => {
        try {
            const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/user/login-history?user_id=${user.id}`);
            const data = await res.json();
            if (data.success) {
                setLoginHistory(data.data);
            }
        } catch (err) {
            console.error("Błąd pobierania historii logowań:", err);
        }
    };

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

    const fetchCourseQuizzes = async (courseName) => {
        try {
            // Wysyłamy nazwę kursu jako kategorię
            const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/course/quizzes?course_name=${encodeURIComponent(courseName)}`);
            const data = await res.json();
            if (data.success) setCourseQuizzes(data.data);
        } catch (err) {
            console.error("Błąd pobierania testów kursu:", err);
        }
    };

    // POPRAWIONE: Tylko JEDNA definicja handleSelectCourse łącząca obie funkcjonalności
    const handleSelectCourse = async (course) => {
        if (!course) {
            setSelectedCourse(null);
            return;
        }
        setIsQuizMode(false);
        setSelectedQuizId(null);
        setSelectedCourse(course);

        // Pobieranie materiałów
        const resM = await fetch(`https://backend-webapp.michniedz.workers.dev/api/materials?course_id=${course.id}`);
        const dataM = await resM.json();
        if (dataM.success) setMaterials(dataM.data);

        // POBIERANIE TESTÓW PO NAZWIE KURSU
        fetchCourseQuizzes(course.name);
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
                        setSelectedQuizId(null);
                        setSelectedCourse(null);
                        setActiveTab('quiz');
                    } else if (action === 'profile') {
                        setIsQuizMode(false);
                        setSelectedCourse(null);
                        setActiveTab('profile');
                        fetchLoginHistory();
                    } else {
                        setIsQuizMode(false);
                        setSelectedCourse(null);
                        setActiveTab('dashboard');
                    }
                }}
            />
            <main className="main-content">
                {isQuizMode ? (
                    <StudentQuiz
                        user={user}
                        quizId={selectedQuizId} // Przekazujemy konkretne ID jeśli istnieje
                        onBack={() => {
                            setIsQuizMode(false);
                            setSelectedQuizId(null);
                            fetchQuizResults();
                        }}
                    />
                ) : activeTab === 'profile' ? (
                    /* --- NOWA SEKCJA PROFILU --- */
                    <section className="admin-form-section" style={{ maxWidth: '600px', margin: '2rem auto' }}>
                        <header className="panel-header" style={{ textAlign: 'center', marginBottom: '2rem' }}>
                            <h2>👤 Moje Informacje</h2>
                            <p>Zarządzaj swoimi danymi i hasłem</p>
                        </header>

                        <form onSubmit={handleUpdateProfile} className="admin-form">

                            <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
                                <div style={{
                                    width: '100px', height: '100px', borderRadius: '50%',
                                    backgroundColor: '#334155', margin: '0 auto 1rem',
                                    overflow: 'hidden', border: '2px solid var(--primary)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                                }}>
                                    {profileData.avatar ? (
                                        <img src={profileData.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    ) : (
                                        <div style={{ fontSize: '2rem' }}>👤</div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                    <button
                                        type="button"
                                        className="btn-access"
                                        style={{ padding: '8px 15px', fontSize: '0.8rem', cursor: 'pointer' }}
                                        onClick={() => fileInputRef.current.click()}
                                    >
                                        {profileData.avatar ? 'Zmień' : 'Dodaj zdjęcie'}
                                    </button>

                                    {/* Przycisk usuwania - widoczny tylko gdy jest awatar */}
                                    {profileData.avatar && (
                                        <button
                                            type="button"
                                            className="btn-delete"
                                            style={{ padding: '8px 15px', fontSize: '0.8rem', cursor: 'pointer' }}
                                            onClick={handleRemoveAvatar}
                                        >
                                            Usuń
                                        </button>
                                    )}
                                </div>

                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    style={{ display: 'none' }}
                                />

                                <p style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '10px' }}>
                                    JPG, PNG lub GIF (max 100 KB)
                                </p>
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Email (Login)</label>
                                <input type="text" value={user.email} disabled style={{ opacity: 0.6, cursor: 'not-allowed' }} />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Imię</label>
                                <input
                                    type="text"
                                    value={profileData.first_name}
                                    onChange={e => setProfileData({...profileData, first_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div style={{ marginBottom: '1rem' }}>
                                <label>Nazwisko</label>
                                <input
                                    type="text"
                                    value={profileData.last_name}
                                    onChange={e => setProfileData({...profileData, last_name: e.target.value})}
                                    required
                                />
                            </div>

                            <div style={{ marginTop: '1.5rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                                <label>Nowe Hasło (zostaw puste, by nie zmieniać)</label>
                                <input
                                    type="password"
                                    value={profileData.password}
                                    onChange={e => setProfileData({...profileData, password: e.target.value})}
                                    placeholder="Wpisz nowe hasło..."
                                />
                            </div>

                            <button type="submit" className="login-submit-btn" style={{ marginTop: '2rem' }}>
                                Zapisz zmiany
                            </button>
                            <div style={{ marginTop: '3rem', borderTop: '1px solid #334155', paddingTop: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.1rem', marginBottom: '1rem', color: 'var(--primary)' }}>
                                    🕒 Ostatnie logowania na konto
                                </h3>
                                <div className="admin-table-container">
                                    <table className="admin-table" style={{ fontSize: '0.85rem' }}>
                                        <thead>
                                        <tr>
                                            <th>Data i godzina</th>
                                            <th>Status</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {loginHistory.length > 0 ? (
                                            loginHistory.map((login, idx) => (
                                                <tr key={idx}>
                                                    <td>{new Date(login.login_date).toLocaleString('pl-PL')}</td>
                                                    <td><span className="tag tag-active">Sukces</span></td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan="2" style={{ textAlign: 'center' }}>Brak danych o logowaniach.</td>
                                            </tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </form>
                        <button className="back-link" onClick={() => setActiveTab('dashboard')} style={{ marginTop: '1rem' }}>
                            ← Wróć do pulpitu
                        </button>
                    </section>
                ) : (
                    <>
                        <header className="panel-header">
                            <h2>Witaj, {user?.first_name || 'Uczniu'}! 👋</h2>
                            <p className="user-info">Osiągaj swoje cele edukacyjne.</p>
                        </header>

                        {!selectedCourse ? (
                            <div className="pulpit-view">
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

                                <div className="materials-list">
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
                                </div>

                                <div className="course-quizzes-section" style={{ marginTop: '3rem' }}>
                                    <h3 style={{ marginBottom: '1.5rem', borderBottom: '1px solid #334155', paddingBottom: '0.5rem' }}>
                                        🏆 Testy i Arkusze
                                    </h3>
                                    {courseQuizzes.length > 0 ? (
                                        <div className="stats-grid">
                                            {courseQuizzes.map(quiz => {
                                                const result = userResults[quiz.id];
                                                return (
                                                    <div key={quiz.id} className="stat-card">
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                            <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{quiz.category}</p>
                                                            {result && (
                                                                <span className="tag tag-active" style={{ fontSize: '0.7rem' }}>
                                                                    Wynik: {result.percent}%
                                                                </span>
                                                            )}
                                                        </div>
                                                        <h4 style={{ margin: '0.5rem 0', color: 'var(--text-main)' }}>{quiz.title}</h4>

                                                        <button
                                                            className="login-submit-btn"
                                                            style={{ padding: '0.6rem', fontSize: '0.9rem', marginTop: '1rem' }}
                                                            onClick={() => {
                                                                setSelectedQuizId(quiz.id);
                                                                setIsQuizMode(true);
                                                            }}
                                                        >
                                                            {result ? "Spróbuj ponownie" : "Rozpocznij test"}
                                                        </button>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="no-data">Do tego kursu nie przypisano jeszcze żadnych testów.</p>
                                    )}
                                </div>
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