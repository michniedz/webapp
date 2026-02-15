import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';

const AdminPanel = ({ onLogout, user }) => {
    // --- STANY GŁÓWNE ---
    const [activeTab, setActiveTab] = useState('dashboard');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [stats, setStats] = useState({ courses: 0, quiz03: 0, quiz04: 0, students: 0 });

    // --- STANY DLA KURSÓW ---
    const [courses, setCourses] = useState([]);
    const [editingCourse, setEditingCourse] = useState(null);

    // --- STANY DLA UŻYTKOWNIKÓW ---
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);

    // --- STANY DLA QUIZÓW ---
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [showQuizCreator, setShowQuizCreator] = useState(false);
    const [newQuiz, setNewQuiz] = useState({
        category: 'INF.03', question: '',
        ans_a: '', ans_b: '', ans_c: '', ans_d: '',
        correct_ans: 'A'
    });
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([]);
    const [quizFilter, setQuizFilter] = useState('ALL');

    // -- STAN WYNIKI
    const [allResults, setAllResults] = useState([]);

    // --- FUNKCJE POBIERANIA DANYCH (API) ---
    const fetchStats = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
    };

    const fetchCourses = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/courses');
        const data = await res.json();
        if (data.success) setCourses(data.data);
    };

    const fetchUsers = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/users');
        const data = await res.json();
        if (data.success) setUsers(data.data);
    };

    const fetchQuestions = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quiz');
        const data = await res.json();
        if (data.success) setQuestions(data.data);
    };

    const fetchQuizzes = async () => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/quizzes?admin=true');
        const data = await res.json();
        if (data.success) setQuizzes(data.data);
    };
    const fetchAllResults = async () => {
        try {
            const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/results');
            const data = await res.json();
            if (data.success) setAllResults(data.data);
        } catch (err) {
            console.error("Błąd pobierania wyników:", err);
        }
    };

    // Funkcja pobierająca pytania tylko dla wybranego arkusza
    const fetchSelectedQuizQuestions = async (quizId) => {
        if (!quizId) return;
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/quiz/questions?quiz_id=${quizId}`);
        const data = await res.json();
        if (data.success) setSelectedQuizQuestions(data.data);
    };

    // Wywołaj pobieranie, gdy zmieni się wybrany quiz
    useEffect(() => {
        if (selectedQuizId) {
            fetchSelectedQuizQuestions(selectedQuizId);
        }
    }, [selectedQuizId]);

    // --- OBSŁUGA ZMIANY ZAKŁADEK ---
    useEffect(() => {
        setSearchTerm('');
        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'courses') fetchCourses();
        if (activeTab === 'users') fetchUsers();
        if (activeTab === 'results') fetchAllResults();
        if (activeTab === 'quiz') {
            fetchQuestions();
            fetchQuizzes();
        }
    }, [activeTab]);

    // --- HANDLERY AKCJI ---
    const handleUpdateCourse = async (course) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/courses', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(course)
        });
        if ((await res.json()).success) {
            setEditingCourse(null);
            fetchCourses();
            setMsg({ text: 'Kurs zaktualizowany!', type: 'success' });
        }
    };

    const handleDeleteQuiz = async (id) => {
        if (!confirm("⚠️ UWAGA: Usunięcie testu spowoduje usunięcie wszystkich wyników uczniów przypisanych do tego testu. Kontynuować?")) return;
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/quizzes?id=${id}`, { method: 'DELETE' });
        if ((await res.json()).success) {
            fetchQuizzes();
            if (selectedQuizId === id) setSelectedQuizId(null);
            setMsg({ text: 'Test został trwale usunięty.', type: 'success' });
        }
    };

    const handleDeleteCourse = async (id) => {
        if (!confirm("Czy na pewno chcesz usunąć kurs?")) return;
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/courses?id=${id}`, { method: 'DELETE' });
        if ((await res.json()).success) { fetchCourses(); setMsg({ text: 'Usunięto.', type: 'success' }); }
    };

    const handleDeleteUser = async (id) => {
        if (!confirm("Czy na pewno chcesz usunąć tego użytkownika i całą jego historię nauki?")) return;
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/users?id=${id}`, { method: 'DELETE' });
        if ((await res.json()).success) { fetchUsers(); setMsg({ text: 'Użytkownik usunięty.', type: 'success' }); }
    };

    const handleSetStatus = async (id, newStatus) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/users/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        if ((await res.json()).success) { fetchUsers(); setMsg({ text: 'Status zmieniony!', type: 'success' }); }
    };

    const handleAddQuestionToQuiz = async (qId) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quizzes/add-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: selectedQuizId, question_id: qId })
        });
        if ((await res.json()).success) { alert("Dodano do testu!"); }
    };

    const handleUpdateQuestion = async (q) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quiz', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(q)
        });
        if ((await res.json()).success) {
            setEditingQuestion(null);
            fetchQuestions();
            setMsg({ text: 'Pytanie zostało zaktualizowane!', type: 'success' });
        }
    };

    const handleAcceptReset = async (userId, quizId) => {
        if(!confirm("Czy na pewno chcesz pozwolić temu uczniowi na ponowne rozwiązanie testu? Stary wynik zostanie usunięty.")) return;

        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/quiz/reset?user_id=${userId}&quiz_id=${quizId}`, {
            method: 'DELETE'
        });

        if ((await res.json()).success) {
            setMsg({ text: 'Test został zresetowany.', type: 'success' });
            fetchAllResults(); // Odśwież listę wyników
        }
    };

    const filteredUsers = users.filter(u =>
        `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleToggleQuizStatus = async (quiz) => {
        const newStatus = quiz.is_active === 1 ? 0 : 1;
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quizzes/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: quiz.id, is_active: newStatus })
        });
        if ((await res.json()).success) {
            fetchQuizzes(); // Odśwież listę
            setMsg({ text: `Test ${newStatus ? 'włączony' : 'wyłączony'}.`, type: 'success' });
        }
    };

    const handleCSVImport = (e, quizId) => {
        const file = e.target.files[0];
        if (!file || !quizId) return alert("Wybierz plik i upewnij się, że arkusz jest wybrany!");

        const reader = new FileReader();
        reader.onload = async (event) => {
            const text = event.target.result;
            // Rozbijamy na linie i usuwamy puste
            const rows = text.split('\n').filter(row => row.trim() !== '');

            // Omijamy nagłówek jeśli pierwszy wiersz zawiera słowo "Pytanie" lub "question"
            const startIndex = rows[0].toLowerCase().includes('pytanie') ? 1 : 0;
            const dataRows = rows.slice(startIndex);

            const parsedQuestions = dataRows.map(row => {
                // Obsługa separatora (przecinek lub średnik)
                const delimiter = row.includes(';') ? ';' : ',';
                const cols = row.split(delimiter);

                if (cols.length < 6) return null;
                return {
                    question: cols[0].trim(),
                    ans_a: cols[1].trim(),
                    ans_b: cols[2].trim(),
                    ans_c: cols[3].trim(),
                    ans_d: cols[4].trim(),
                    correct_ans: cols[5].trim().toUpperCase()
                };
            }).filter(q => q !== null);

            if (parsedQuestions.length === 0) return alert("Nie znaleziono poprawnych danych w pliku.");

            try {
                const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/questions/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quiz_id: quizId, questions: parsedQuestions })
                });

                const data = await res.json();
                if (data.success) {
                    alert(`Sukces! ${data.message}`);
                    fetchQuestions(); // Odśwież bazę pytań
                } else {
                    alert("Błąd serwera: " + data.message);
                }
            } catch (err) {
                alert("Błąd połączenia podczas importu.");
            }
        };
        reader.readAsText(file, "UTF-8"); // Wymuszamy kodowanie UTF-8
    };

    // Funkcja usuwająca powiązanie
    const handleRemoveQuestionFromQuiz = async (qId) => {
        if (!confirm("Czy na pewno chcesz usunąć to pytanie z tego arkusza? (Pytanie pozostanie w ogólnej bazie)")) return;

        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/quizzes/remove-question?quiz_id=${selectedQuizId}&question_id=${qId}`, {
            method: 'DELETE'
        });

        if ((await res.json()).success) {
            fetchSelectedQuizQuestions(selectedQuizId); // Odśwież listę
            setMsg({ text: 'Pytanie usunięte z arkusza.', type: 'success' });
        }
    };

    const handleAddQuizToCourse = async (courseId, quizId) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/courses/add-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, quiz_id: quizId })
        });
        if ((await res.json()).success) {
            setMsg({ text: 'Test przypisany do kursu!', type: 'success' });
        }
    };

    return (
        <div className="dashboard">
            <Sidebar onLogout={onLogout} user={user} onMenuClick={(tab) => setActiveTab(tab)} />

            <main className="main-content">
                {msg.text && (
                    <div className={`status-banner ${msg.type}`}>
                        {msg.text}
                        <button onClick={() => setMsg({text:'', type:''})} style={{float:'right', background:'none', border:'none', cursor:'pointer'}}>×</button>
                    </div>
                )}

                {activeTab === 'dashboard' && (
                    <>
                        <header className="panel-header"><h2>Pulpit Administratora 🚀</h2></header>
                        <div className="stats-grid">
                            <div className="stat-card"><p>Kursy</p><span>{stats.courses}</span></div>
                            <div className="stat-card"><p>INF.03</p><span>{stats.quiz03}</span></div>
                            <div className="stat-card"><p>INF.04</p><span>{stats.quiz04}</span></div>
                            <div className="stat-card"><p>Uczniowie</p><span>{stats.students}</span></div>
                        </div>
                    </>
                )}

                {activeTab === 'courses' && (
                    <section className="admin-form-section">
                        <h3>Lista Kursów</h3>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead><tr><th>ID</th><th>Nazwa</th><th>Hasło</th><th>Akcje</th></tr></thead>
                                <tbody>
                                {courses.map(c => (
                                    <tr key={c.id}>
                                        <td>{c.id}</td>
                                        <td>{editingCourse?.id === c.id ? <input value={editingCourse.name} onChange={e => setEditingCourse({...editingCourse, name: e.target.value})} /> : c.name}</td>
                                        <td>{editingCourse?.id === c.id ? <input value={editingCourse.enrollment_key} onChange={e => setEditingCourse({...editingCourse, enrollment_key: e.target.value})} /> : <code>{c.enrollment_key}</code>}</td>
                                        <td>
                                            {editingCourse?.id === c.id ?
                                                <button className="btn-save" onClick={() => handleUpdateCourse(editingCourse)}>Zapisz</button> :
                                                <button className="btn-edit" onClick={() => setEditingCourse({...c})}>Edytuj</button>
                                            }
                                            <button className="btn-delete" onClick={() => handleDeleteCourse(c.id)}>Usuń</button>
                                            <select
                                                onChange={(e) => handleAddQuizToCourse(c.id, e.target.value)}
                                                defaultValue=""
                                                className="search-input"
                                                style={{ width: '150px', padding: '2px' }}
                                            >
                                                <option value="" disabled>➕ Dodaj test...</option>
                                                {quizzes.map(qz => (
                                                    <option key={qz.id} value={qz.id}>{qz.title}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                )}

                {activeTab === 'users' && (
                    <section className="admin-form-section">
                        <div className="section-header-flex">
                            <h3>Użytkownicy</h3>
                            <input className="search-input" placeholder="Szukaj..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead><tr><th>ID</th><th>Imię i Nazwisko</th><th>Status</th><th>Akcje</th></tr></thead>
                                <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>{u.id}</td>
                                        <td>{u.first_name} {u.last_name}</td>
                                        <td><span className={`tag tag-${u.status}`}>{u.status}</span></td>
                                        <td>
                                            {u.status === 'pending' && <button className="btn-save" onClick={() => handleSetStatus(u.id, 'active')}>Akceptuj</button>}
                                            <button className="btn-delete" onClick={() => handleDeleteUser(u.id)}>Usuń</button>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                    </section>
                )}

                {activeTab === 'quiz' && (
                    <div className="quiz-admin-container">
                        <section className="admin-form-section" style={{marginBottom: '2rem'}}>
                            <div className="section-header-flex">
                                <h3>🏆 Arkusze Egzaminacyjne</h3>
                                <button className="btn-save" onClick={() => setShowQuizCreator(!showQuizCreator)}>{showQuizCreator ? "Anuluj" : "➕ Nowy Test"}</button>
                            </div>
                            {showQuizCreator && (
                                <form className="admin-form" onSubmit={async (e) => {
                                    e.preventDefault();
                                    const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quizzes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            title: e.target.title.value,
                                            category: e.target.category.value, // Nazwa kursu jako kategoria
                                            description: ''
                                        })
                                    });
                                    if ((await res.json()).success) { fetchQuizzes(); setShowQuizCreator(false); }
                                }}>
                                    <input name="title" placeholder="Nazwa testu (np. Egzamin próbny)" required />
                                    <select name="category" required>
                                        <option value="">-- Wybierz kurs (Kategorię) --</option>
                                        <option value="INF.03">Ogólne: INF.03</option>
                                        <option value="INF.04">Ogólne: INF.04</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                    <button type="submit" className="login-submit-btn">Stwórz arkusz</button>
                                </form>
                            )}

                            {/* Tabela w zakładce quiz */}
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>Nazwa</th>
                                        <th>Kat.</th>
                                        <th>Status</th>
                                        <th>Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {quizzes.map(qz => (
                                        <tr key={qz.id} style={selectedQuizId === qz.id ? {background: 'rgba(99,102,241,0.1)'} : {}}>
                                            <td>{qz.title}</td>
                                            <td>{qz.category}</td>
                                            <td>
                                            <span className={`tag ${qz.is_active ? 'tag-active' : 'tag-pending'}`}>
                                                {qz.is_active ? 'Widoczny' : 'Ukryty'}
                                            </span>
                                            </td>
                                            <td style={{ display: 'flex', gap: '5px' }}>
                                                <button
                                                    className={qz.is_active ? "btn-delete" : "btn-save"}
                                                    onClick={() => handleToggleQuizStatus(qz)}
                                                >
                                                    {qz.is_active ? "Wyłącz" : "Włącz"}
                                                </button>
                                                <button className="btn-edit" onClick={() => setSelectedQuizId(qz.id)}>
                                                    {selectedQuizId === qz.id ? "🎯 Wybrany" : "Wybierz"}
                                                </button>
                                                <button className="btn-delete" onClick={() => handleDeleteQuiz(qz.id)}>Usuń</button>
                                            </td>
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                        </section>

                        {selectedQuizId && (
                            <div className="admin-form-section" style={{ borderStyle: 'dashed', borderColor: 'var(--primary)', marginBottom: '2rem' }}>
                                <header className="section-header-flex">
                                    <h4>📥 Importuj pytania z CSV do wybranego arkusza</h4>
                                </header>
                                <p style={{ fontSize: '0.8rem', color: 'var(--text-dim)', marginBottom: '1rem' }}>
                                    Wybierz plik .csv (Format: pytanie, odpA, odpB, odpC, odpD, poprawnaA-D)
                                </p>
                                <input
                                    type="file"
                                    accept=".csv"
                                    onChange={(e) => handleCSVImport(e, selectedQuizId)}
                                    style={{
                                        width: '100%',
                                        padding: '10px',
                                        background: '#0f172a',
                                        color: 'white',
                                        borderRadius: '8px',
                                        border: '1px solid #334155',
                                        cursor: 'pointer'
                                    }}
                                />
                            </div>
                        )}

                        {selectedQuizId && (
                            <section className="admin-form-section" style={{ marginTop: '2rem', border: '1px solid var(--primary)' }}>
                                <div className="section-header-flex">
                                    <h3>📝 Pytania w wybranym arkuszu (ID: {selectedQuizId})</h3>
                                    <button className="btn-cancel" onClick={() => setSelectedQuizId(null)}>Zamknij podgląd</button>
                                </div>

                                <div className="admin-table-container">
                                    <table className="admin-table">
                                        <thead>
                                        <tr>
                                            <th>Pytanie</th>
                                            <th>Poprawna</th>
                                            <th>Akcje</th>
                                        </tr>
                                        </thead>
                                        <tbody>
                                        {selectedQuizQuestions.length > 0 ? (
                                            selectedQuizQuestions.map(q => (
                                                <tr key={q.id}>
                                                    <td style={{ fontSize: '0.85rem' }}>{q.question}</td>
                                                    <td><strong>{q.correct_ans}</strong></td>
                                                    <td>
                                                        <button
                                                            className="btn-delete"
                                                            onClick={() => handleRemoveQuestionFromQuiz(q.id)}
                                                        >
                                                            Usuń z testu
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan="3" style={{ textAlign: 'center' }}>Brak pytań w tym arkuszu. Dodaj je z bazy poniżej lub zaimportuj CSV.</td></tr>
                                        )}
                                        </tbody>
                                    </table>
                                </div>
                            </section>
                        )}

                        <section className="admin-form-section">
                            <h3>➕ Dodaj Pytanie do Bazy</h3>
                            <form className="admin-form" onSubmit={async (e) => {
                                e.preventDefault();
                                const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/admin/quiz', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(newQuiz)
                                });
                                if ((await res.json()).success) fetchQuestions();
                            }}>
                                <textarea placeholder="Treść pytania" value={newQuiz.question} onChange={e => setNewQuiz({...newQuiz, question: e.target.value})} />
                                <div className="quiz-grid">
                                    <input placeholder="Odp A" value={newQuiz.ans_a} onChange={e => setNewQuiz({...newQuiz, ans_a: e.target.value})} />
                                    <input placeholder="Odp B" value={newQuiz.ans_b} onChange={e => setNewQuiz({...newQuiz, ans_b: e.target.value})} />
                                    <input placeholder="Odp C" value={newQuiz.ans_c} onChange={e => setNewQuiz({...newQuiz, ans_c: e.target.value})} />
                                    <input placeholder="Odp D" value={newQuiz.ans_d} onChange={e => setNewQuiz({...newQuiz, ans_d: e.target.value})} />
                                    <select value={newQuiz.correct_ans} onChange={e => setNewQuiz({...newQuiz, correct_ans: e.target.value})}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                                </div>
                                <button type="submit" className="login-submit-btn">Zapisz w bazie</button>
                            </form>
                        </section>

                        <section className="admin-form-section" style={{marginTop: '2rem'}}>
                            <div className="section-header-flex">
                                <h3>🗄️ Ogólna Baza Pytań</h3>
                                <div style={{display: 'flex', gap: '10px', flexWrap: 'wrap'}}>
                                    <input type="text" placeholder="Szukaj w treści..." className="search-input" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{minWidth: '250px'}} />
                                    <select className="search-input" value={quizFilter} onChange={e => setQuizFilter(e.target.value)}>
                                        <option value="ALL">Wszystkie kategorie</option>
                                        <option value="INF.03">INF.03</option>
                                        <option value="INF.04">INF.04</option>
                                        {/* Dodajemy dynamicznie nazwy kursów jako opcje filtra */}
                                        {courses.map(c => (
                                            <option key={c.id} value={c.name}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead><tr><th>Kat.</th><th>Pytanie</th><th>Popr.</th><th>Akcje</th></tr></thead>
                                    <tbody>
                                    {questions.filter(q => (quizFilter === 'ALL' || q.category === quizFilter) && q.question.toLowerCase().includes(searchTerm.toLowerCase())).map(q => (
                                        <tr key={q.id}>
                                            {editingQuestion?.id === q.id ? (
                                                <td colSpan="4">
                                                    <div style={{background: '#1c2128', padding: '15px'}}>
                                                        <textarea style={{width:'100%'}} value={editingQuestion.question} onChange={e => setEditingQuestion({...editingQuestion, question: e.target.value})} />
                                                        <div className="quiz-grid">
                                                            <input value={editingQuestion.ans_a} onChange={e => setEditingQuestion({...editingQuestion, ans_a: e.target.value})} />
                                                            <input value={editingQuestion.ans_b} onChange={e => setEditingQuestion({...editingQuestion, ans_b: e.target.value})} />
                                                            <input value={editingQuestion.ans_c} onChange={e => setEditingQuestion({...editingQuestion, ans_c: e.target.value})} />
                                                            <input value={editingQuestion.ans_d} onChange={e => setEditingQuestion({...editingQuestion, ans_d: e.target.value})} />
                                                            <select value={editingQuestion.correct_ans} onChange={e => setEditingQuestion({...editingQuestion, correct_ans: e.target.value})}><option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option></select>
                                                        </div>
                                                        <button className="btn-save" onClick={() => handleUpdateQuestion(editingQuestion)}>Zapisz</button>
                                                        <button className="btn-cancel" onClick={() => setEditingQuestion(null)}>X</button>
                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    <td>{q.category}</td><td style={{fontSize:'0.8rem'}}>{q.question}</td><td>{q.correct_ans}</td>
                                                    <td>
                                                        <button className="btn-edit" onClick={() => setEditingQuestion({...q})}>Edytuj</button>
                                                        <button className="btn-save" disabled={!selectedQuizId} onClick={() => handleAddQuestionToQuiz(q.id)}>➕</button>
                                                        <button className="btn-delete" onClick={async () => {if(confirm("Usuń?")){await fetch(`https://backend-webapp.michniedz.workers.dev/api/admin/quiz?id=${q.id}`,{method:'DELETE'});fetchQuestions();}}}>Usuń</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>

                        </section>
                    </div>
                )}

                {activeTab === 'results' && (
                    <section className="admin-form-section">
                        <div className="section-header-flex">
                            <h3>📊 Wyniki Egzaminów</h3>
                            <input className="search-input" placeholder="Szukaj ucznia/testu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead><tr><th>Uczeń</th><th>Test</th><th>Punkty</th><th>%</th><th>Data</th><th>Akcje</th></tr></thead>
                                <tbody>
                                {allResults.filter(r => `${r.first_name} ${r.last_name}`.toLowerCase().includes(searchTerm.toLowerCase()) || r.quiz_title.toLowerCase().includes(searchTerm.toLowerCase())).map(r => (
                                    <tr key={r.id} className={r.status === 'reset_requested' ? 'row-highlight-warning' : ''}>
                                        <td><strong>{r.first_name} {r.last_name}</strong></td>
                                        <td>{r.quiz_title}</td>
                                        <td>{r.score} / {r.total_questions}</td>
                                        <td>{r.percent}%</td>
                                        <td>{new Date(r.completed_at).toLocaleDateString()}</td>
                                        <td>
                                            {r.status === 'reset_requested' ? (
                                                <div style={{display: 'flex', flexDirection: 'column', gap: '5px'}}>
                                                    <span className="tag tag-pending">PROŚBA O RESET</span>
                                                    <button className="btn-save" onClick={() => handleAcceptReset(r.user_id, r.quiz_id)}>
                                                        ✅ Zezwól na poprawę
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="tag tag-active">ZAKOŃCZONY</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>

                    </section>
                )}
            </main>
        </div>
    );
};

export default AdminPanel;