import React, { useState, useEffect } from 'react';
import Sidebar from '../components/Sidebar';
import DOMPurify from 'dompurify';
import ConfirmModal from '../components/ConfirmModal';
import R2ImagePicker from '../components/R2ImagePicker';
import Skeleton from '../components/Skeleton';
import { apiFetch } from '../lib/api';
import { toast } from '../lib/toast';

const AdminPanel = ({ onLogout, user }) => {
    // --- STANY GŁÓWNE ---
    const [activeTab, setActiveTab] = useState('dashboard');
    const [msg, setMsg] = useState({ text: '', type: '' });
    const [stats, setStats] = useState({ courses: 0, quiz03: 0, quiz04: 0, students: 0 });

    // --- STANY DLA KURSÓW ---
    const [courses, setCourses] = useState([]);
    const [editingCourse, setEditingCourse] = useState(null);
    const [showCourseCreator, setShowCourseCreator] = useState(false);

    // --- STANY DLA UŻYTKOWNIKÓW ---
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingUser, setEditingUser] = useState(null);
    const [userFilterStatus, setUserFilterStatus] = useState('ALL');
    const [userFilterRole, setUserFilterRole] = useState('ALL');
    const [userSort, setUserSort] = useState({ field: 'id', dir: 'asc' });

    // --- STANY DLA QUIZÓW ---
    const [quizzes, setQuizzes] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [showQuizCreator, setShowQuizCreator] = useState(false);
    const [newQuiz, setNewQuiz] = useState({
        category: 'INF.03', question: '',
        ans_a: '', ans_b: '', ans_c: '', ans_d: '',
        correct_ans: 'A',
        image_url: ''
    });
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [selectedQuizQuestions, setSelectedQuizQuestions] = useState([]);
    const [quizFilter, setQuizFilter] = useState('ALL');

    // -- STAN WYNIKI
    const [allResults, setAllResults] = useState([]);
    const [resultFilterStatus, setResultFilterStatus] = useState('ALL');
    const [resultFilterQuiz, setResultFilterQuiz] = useState('ALL');
    const [resultFilterCategory, setResultFilterCategory] = useState('ALL');
    const [resultSort, setResultSort] = useState({ field: 'date', dir: 'desc' });

    const [allMaterials, setAllMaterials] = useState([]);
    const [materialCourseFilter, setMaterialCourseFilter] = useState('ALL');
    const [materialSearch, setMaterialSearch] = useState('');

    const [previewData, setPreviewData] = useState(null);

    // --- STANY PAGINACJI ---
    const [usersPage, setUsersPage] = useState(1);
    const [usersPagination, setUsersPagination] = useState(null);
    const [questionsPage, setQuestionsPage] = useState(1);
    const [questionsPagination, setQuestionsPagination] = useState(null);
    const [resultsPage, setResultsPage] = useState(1);
    const [resultsPagination, setResultsPagination] = useState(null);
    const [materialsPage, setMaterialsPage] = useState(1);
    const [materialsPagination, setMaterialsPagination] = useState(null);

    // Modal potwierdzenia (zamiast natywnego confirm)
    const [confirmState, setConfirmState] = useState(null);
    const openConfirm = (title, message, onConfirm, confirmLabel = 'Potwierdź') =>
        setConfirmState({ title, message, onConfirm, confirmLabel });
    const closeConfirm = () => setConfirmState(null);

    // Flagi ładowania tabel
    const [loadingUsers, setLoadingUsers] = useState(false);
    const [loadingQuestions, setLoadingQuestions] = useState(false);
    const [loadingResults, setLoadingResults] = useState(false);
    const [loadingCourses, setLoadingCourses] = useState(false);
    const [loadingMaterials, setLoadingMaterials] = useState(false);

    // Wybór obrazu z R2 (do pola image_url)
    const [r2PickerOpen, setR2PickerOpen] = useState(false);
    const [r2PickerTarget, setR2PickerTarget] = useState('new');

    const handleR2Select = (url) => {
        if (r2PickerTarget === 'edit' && editingQuestion) {
            setEditingQuestion({ ...editingQuestion, image_url: url });
        } else {
            setNewQuiz({ ...newQuiz, image_url: url });
        }
    };

    // Edycja limitu czasu testu
    const [editingTimeQuizId, setEditingTimeQuizId] = useState(null);
    const [editingTimeValue, setEditingTimeValue] = useState('');

    const handleUpdateQuizTime = async (id) => {
        const minutes = parseInt(editingTimeValue, 10);
        if (!Number.isFinite(minutes) || minutes < 1) {
            toast("Podaj poprawną liczbę minut.", "warning");
            return;
        }
        const res = await apiFetch('/api/admin/quizzes/time', {
            method: 'PUT',
            body: JSON.stringify({ id, time_limit_minutes: minutes })
        });
        if ((await res.json()).success) {
            setEditingTimeQuizId(null);
            fetchQuizzes();
            toast("Czas testu zaktualizowany.", "success");
        }
    };

    const fetchAllMaterials = async (page = materialsPage) => {
        setLoadingMaterials(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            if (materialSearch) params.set('search', materialSearch);
            if (materialCourseFilter !== 'ALL') params.set('course', materialCourseFilter);
            const res = await apiFetch(`/api/materials?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAllMaterials(data.data);
                setMaterialsPagination(data.pagination);
            }
        } finally {
            setLoadingMaterials(false);
        }
    };

    const getEmbedUrl = (url) => {
        if (!url) return url;
        if (url.includes('drive.google.com') || url.includes('docs.google.com')) {
            return url.replace(/\/view|\/edit|\/usp=sharing|\/edit\?usp=sharing/g, '/preview');
        }
        return url;
    };

    // --- FUNKCJE POBIERANIA DANYCH (API) ---
    const fetchStats = async () => {
        const res = await apiFetch('/api/admin/stats');
        const data = await res.json();
        if (data.success) setStats(data.data);
    };

    const fetchCourses = async () => {
        setLoadingCourses(true);
        try {
            const res = await apiFetch('/api/admin/courses');
            const data = await res.json();
            if (data.success) setCourses(data.data);
        } finally {
            setLoadingCourses(false);
        }
    };

    const fetchUsers = async (page = usersPage) => {
        setLoadingUsers(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            if (searchTerm) params.set('search', searchTerm);
            if (userFilterStatus !== 'ALL') params.set('status', userFilterStatus);
            if (userFilterRole !== 'ALL') params.set('role', userFilterRole);
            params.set('sort', userSort.field);
            params.set('dir', userSort.dir);
            const res = await apiFetch(`/api/admin/users?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setUsers(data.data);
                setUsersPagination(data.pagination);
            }
        } finally {
            setLoadingUsers(false);
        }
    };

    const fetchQuestions = async (page = questionsPage) => {
        setLoadingQuestions(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            if (searchTerm) params.set('search', searchTerm);
            if (quizFilter !== 'ALL') params.set('category', quizFilter);
            const res = await apiFetch(`/api/admin/quiz?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setQuestions(data.data);
                setQuestionsPagination(data.pagination);
            }
        } finally {
            setLoadingQuestions(false);
        }
    };

    const fetchQuizzes = async () => {
        const res = await apiFetch('/api/quizzes?admin=true');
        const data = await res.json();
        if (data.success) setQuizzes(data.data);
    };
    const fetchAllResults = async (page = resultsPage) => {
        setLoadingResults(true);
        try {
            const params = new URLSearchParams({ page: String(page), limit: '50' });
            if (searchTerm) params.set('search', searchTerm);
            if (resultFilterStatus !== 'ALL') params.set('status', resultFilterStatus);
            if (resultFilterQuiz !== 'ALL') params.set('quiz_id', resultFilterQuiz);
            if (resultFilterCategory !== 'ALL') params.set('category', resultFilterCategory);
            params.set('sort', resultSort.field);
            params.set('dir', resultSort.dir);
            const res = await apiFetch(`/api/admin/results?${params.toString()}`);
            const data = await res.json();
            if (data.success) {
                setAllResults(data.data);
                setResultsPagination(data.pagination);
            }
        } catch (err) {
            console.error("Błąd pobierania wyników:", err);
        } finally {
            setLoadingResults(false);
        }
    };

    // Funkcja pobierająca pytania tylko dla wybranego arkusza
    const fetchSelectedQuizQuestions = async (quizId) => {
        if (!quizId) return;
        const res = await apiFetch(`/api/admin/quiz/questions?quiz_id=${quizId}`);
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
        setUsersPage(1);
        setQuestionsPage(1);
        setResultsPage(1);
        setMaterialsPage(1);
        if (activeTab === 'dashboard') fetchStats();
        if (activeTab === 'courses') fetchCourses();
        if (activeTab === 'users') fetchUsers(1);
        if (activeTab === 'results') { fetchAllResults(1); fetchQuizzes(); }
        if (activeTab === 'quiz') {
            fetchQuestions(1);
            fetchQuizzes();
        }
        if (activeTab === 'materials') {
            fetchAllMaterials(1);
            fetchCourses(); // potrzebne do listy rozwijanej kursów
        }
    }, [activeTab]);

    // --- REFETCH PRZY ZMIANIE WYSZUKIWANIA/FILTRÓW/SORTOWANIA (debounce) ---
    useEffect(() => {
        const t = setTimeout(() => {
            if (activeTab === 'users') { setUsersPage(1); fetchUsers(1); }
            if (activeTab === 'results') { setResultsPage(1); fetchAllResults(1); }
            if (activeTab === 'quiz') { setQuestionsPage(1); fetchQuestions(1); }
            if (activeTab === 'materials') { setMaterialsPage(1); fetchAllMaterials(1); }
        }, 300);
        return () => clearTimeout(t);
    }, [searchTerm, userFilterStatus, userFilterRole, userSort, resultFilterStatus, resultFilterQuiz, resultFilterCategory, resultSort, quizFilter, materialSearch, materialCourseFilter]);

    const handleShowPreview = (e) => {
        const form = e.target.closest('form');
        const formData = new FormData(form);

        setPreviewData({
            title: formData.get('title'),
            content_type: formData.get('content_type'),
            content_value: formData.get('content_value')
        });
    };

    const handleDeleteMaterial = (id) => {
        openConfirm('Usuń materiał', 'Czy na pewno chcesz usunąć ten materiał?', async () => {
            const res = await apiFetch(`/api/admin/materials?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                setMsg({ text: 'Materiał usunięty.', type: 'success' });
                fetchAllMaterials();
            }
        }, 'Usuń');
    };

    // --- HANDLERY AKCJI ---
    const handleUpdateCourse = async (course) => {
        const res = await apiFetch('/api/admin/courses', {
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

    const handleAddCourse = async (e) => {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const enrollment_key = e.target.enrollment_key.value.trim();
        const res = await apiFetch('/api/admin/courses', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, enrollment_key })
        });
        const data = await res.json();
        if (data.success) {
            setMsg({ text: 'Kurs został dodany!', type: 'success' });
            e.target.reset();
            fetchCourses();
        } else {
            setMsg({ text: 'Błąd: ' + (data.error || data.message || 'nie udało się dodać kursu.'), type: 'error' });
        }
    };

    const handleDeleteQuiz = (id) => {
        openConfirm('Usuń test', '⚠️ UWAGA: Usunięcie testu spowoduje usunięcie wszystkich wyników uczniów przypisanych do tego testu. Kontynuować?', async () => {
            const res = await apiFetch(`/api/admin/quizzes?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchQuizzes();
                if (selectedQuizId === id) setSelectedQuizId(null);
                setMsg({ text: 'Test został trwale usunięty.', type: 'success' });
            }
        }, 'Usuń');
    };

    const handleDeleteCourse = (id) => {
        openConfirm('Usuń kurs', 'Czy na pewno chcesz usunąć kurs?', async () => {
            const res = await apiFetch(`/api/admin/courses?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) { fetchCourses(); setMsg({ text: 'Usunięto.', type: 'success' }); }
        }, 'Usuń');
    };

    const handleDeleteUser = (id) => {
        openConfirm('Usuń użytkownika', 'Czy na pewno chcesz usunąć tego użytkownika i całą jego historię nauki?', async () => {
            const res = await apiFetch(`/api/admin/users?id=${id}`, { method: 'DELETE' });
            if ((await res.json()).success) { fetchUsers(); setMsg({ text: 'Użytkownik usunięty.', type: 'success' }); }
        }, 'Usuń');
    };

    const handleSetStatus = async (id, newStatus) => {
        const res = await apiFetch('/api/admin/users/status', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, status: newStatus })
        });
        if ((await res.json()).success) { fetchUsers(); setMsg({ text: 'Status zmieniony!', type: 'success' }); }
    };

    const handleUpdateUser = async () => {
        const { id, first_name, last_name, email, role, status, password } = editingUser;
        const res = await apiFetch('/api/admin/users', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id, first_name, last_name, email, role, status, password })
        });
        const data = await res.json();
        if (data.success) {
            setEditingUser(null);
            fetchUsers();
            setMsg({ text: 'Konto użytkownika zaktualizowane!', type: 'success' });
        } else {
            setMsg({ text: 'Błąd: ' + (data.error || data.message || 'nie udało się zapisać.'), type: 'error' });
        }
    };

    const handleAddQuestionToQuiz = async (qId) => {
        const res = await apiFetch('/api/admin/quizzes/add-question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ quiz_id: selectedQuizId, question_id: qId })
        });
        if ((await res.json()).success) { toast("Dodano do testu!", "success"); }
    };

    const handleUpdateQuestion = async (q) => {
        const res = await apiFetch('/api/admin/quiz', {
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

    const handleAcceptReset = (userId, quizId) => {
        openConfirm('Zezwól na poprawę', 'Czy na pewno chcesz pozwolić temu uczniowi na ponowne rozwiązanie testu? Stary wynik zostanie usunięty.', async () => {
            const res = await apiFetch(`/api/admin/quiz/reset?user_id=${userId}&quiz_id=${quizId}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                setMsg({ text: 'Test został zresetowany.', type: 'success' });
                fetchAllResults(); // Odśwież listę wyników
            }
        }, 'Zezwól');
    };

    const handleUserSort = (field) => {
        setUserSort(prev => prev.field === field
            ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { field, dir: 'asc' });
    };

    // Kategorie dostępne w filtrze wyników (z listy wszystkich testów)
    const resultCategories = [...new Set(quizzes.map(q => q.category).filter(Boolean))].sort();

    // Wspólny komponent paginacji
    const renderPagination = (pagination, onPageChange) => {
        if (!pagination) return null;
        const { page, total_pages, total } = pagination;
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px', marginTop: '1rem', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-dim)' }}>{total} wyników · strona {page} z {total_pages}</span>
                <button className="btn-edit" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>← Poprzednia</button>
                <button className="btn-edit" disabled={page >= total_pages} onClick={() => onPageChange(page + 1)}>Następna →</button>
            </div>
        );
    };

    const handleResultSort = (field) => {
        setResultSort(prev => prev.field === field
            ? { field, dir: prev.dir === 'asc' ? 'desc' : 'asc' }
            : { field, dir: 'asc' });
    };

    const handleToggleQuizStatus = async (quiz) => {
        const newStatus = quiz.is_active === 1 ? 0 : 1;
        const res = await apiFetch('/api/admin/quizzes/status', {
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
        if (!file || !quizId) return toast("Wybierz plik i upewnij się, że arkusz jest wybrany!", "warning");

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

            if (parsedQuestions.length === 0) return toast("Nie znaleziono poprawnych danych w pliku.", "warning");

            try {
                const res = await apiFetch('/api/admin/questions/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ quiz_id: quizId, questions: parsedQuestions })
                });

                const data = await res.json();
                if (data.success) {
                    toast(`Sukces! ${data.message}`, "success");
                    fetchQuestions(); // Odśwież bazę pytań
                } else {
                    toast("Błąd serwera: " + data.message, "error");
                }
            } catch (err) {
                toast("Błąd połączenia podczas importu.", "error");
            }
        };
        reader.readAsText(file, "UTF-8"); // Wymuszamy kodowanie UTF-8
    };

    // Funkcja usuwająca powiązanie
    const handleRemoveQuestionFromQuiz = (qId) => {
        openConfirm('Usuń z arkusza', 'Czy na pewno chcesz usunąć to pytanie z tego arkusza? (Pytanie pozostanie w ogólnej bazie)', async () => {
            const res = await apiFetch(`/api/admin/quizzes/remove-question?quiz_id=${selectedQuizId}&question_id=${qId}`, { method: 'DELETE' });
            if ((await res.json()).success) {
                fetchSelectedQuizQuestions(selectedQuizId); // Odśwież listę
                setMsg({ text: 'Pytanie usunięte z arkusza.', type: 'success' });
            }
        }, 'Usuń');
    };

    const handleDeleteQuestion = (qId) => {
        openConfirm('Usuń pytanie', 'Czy na pewno chcesz usunąć to pytanie z bazy?', async () => {
            await apiFetch(`/api/admin/quiz?id=${qId}`, { method: 'DELETE' });
            fetchQuestions();
        }, 'Usuń');
    };

    const handleAddQuizToCourse = async (courseId, quizId) => {
        const res = await apiFetch('/api/admin/courses/add-quiz', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ course_id: courseId, quiz_id: quizId })
        });
        if ((await res.json()).success) {
            setMsg({ text: 'Test przypisany do kursu!', type: 'success' });
        }
    };

    const handleAddMaterial = async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);

        const materialData = {
            course_id: parseInt(formData.get('course_id')), // Pobieramy z selecta w formularzu
            title: formData.get('title'),
            content_type: formData.get('content_type'),
            content_value: formData.get('content_value')
        };

        if (!materialData.course_id) {
            toast("Proszę wybrać kurs!", "warning");
            return;
        }

        try {
            const res = await apiFetch('/api/admin/materials', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(materialData)
            });
            const data = await res.json();
            if (data.success) {
                setMsg({ text: 'Materiał został pomyślnie dodany!', type: 'success' });
                e.target.reset(); // Czyści pola formularza
                fetchAllMaterials(); // Odświeża tabelę materiałów
            } else {
                setMsg({ text: 'Błąd: ' + data.error, type: 'error' });
            }
        } catch (err) {
            setMsg({ text: 'Błąd połączenia z serwerem.', type: 'error' });
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
                        <div className="section-header-flex">
                            <h3>Lista Kursów</h3>
                            <button className="btn-save" onClick={() => setShowCourseCreator(!showCourseCreator)}>
                                {showCourseCreator ? 'Anuluj' : '➕ Dodaj kurs'}
                            </button>
                        </div>

                        {showCourseCreator && (
                            <form className="admin-form" onSubmit={handleAddCourse} style={{ marginBottom: '1.5rem' }}>
                                <div className="quiz-grid">
                                    <div style={{ flex: 1 }}>
                                        <label>Nazwa kursu</label>
                                        <input name="name" placeholder="np. Programowanie aplikacji" required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Klucz zapisu (hasło dla uczniów)</label>
                                        <input name="enrollment_key" placeholder="np. kurs2026" required />
                                    </div>
                                </div>
                                <button type="submit" className="login-submit-btn" style={{ width: 'auto', padding: '0.8rem 2rem', marginTop: '1rem' }}>
                                    Dodaj kurs
                                </button>
                            </form>
                        )}

                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead><tr><th>ID</th><th>Nazwa</th><th>Hasło</th><th>Akcje</th></tr></thead>
                                <tbody>
                                {loadingCourses ? (
                                    <tr><td colSpan="4" className="loading-row"><Skeleton width="40%" height={14} style={{ margin: '0 auto' }} /></td></tr>
                                ) : courses.length === 0 ? (
                                    <tr><td colSpan="4" className="empty-state">Brak kursów.</td></tr>
                                ) : courses.map(c => (
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
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input className="search-input" placeholder="Szukaj: imię, nazwisko, email..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <select className="search-input" value={userFilterStatus} onChange={e => setUserFilterStatus(e.target.value)}>
                                    <option value="ALL">Wszystkie statusy</option>
                                    <option value="active">Aktywni</option>
                                    <option value="pending">Oczekujący</option>
                                </select>
                                <select className="search-input" value={userFilterRole} onChange={e => setUserFilterRole(e.target.value)}>
                                    <option value="ALL">Wszystkie role</option>
                                    <option value="student">Uczniowie</option>
                                    <option value="admin">Administratorzy</option>
                                </select>
                            </div>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th className="sortable" onClick={() => handleUserSort('id')}>ID {userSort.field === 'id' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleUserSort('name')}>Imię i Nazwisko {userSort.field === 'name' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleUserSort('email')}>Email {userSort.field === 'email' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleUserSort('role')}>Rola {userSort.field === 'role' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleUserSort('status')}>Status {userSort.field === 'status' ? (userSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th>Akcje</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loadingUsers ? (
                                    <tr><td colSpan="6" className="loading-row"><Skeleton width="40%" height={14} style={{ margin: '0 auto' }} /></td></tr>
                                ) : users.length === 0 ? (
                                    <tr><td colSpan="6" className="empty-state">Brak użytkowników.</td></tr>
                                ) : users.map(u => (
                                    editingUser?.id === u.id ? (
                                        <tr key={u.id}>
                                            <td colSpan="6">
                                                <div className="edit-question-box">
                                                    <div className="quiz-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                                                        <div className="form-field-group">
                                                            <label>Imię</label>
                                                            <input value={editingUser.first_name || ''} onChange={e => setEditingUser({ ...editingUser, first_name: e.target.value })} />
                                                        </div>
                                                        <div className="form-field-group">
                                                            <label>Nazwisko</label>
                                                            <input value={editingUser.last_name || ''} onChange={e => setEditingUser({ ...editingUser, last_name: e.target.value })} />
                                                        </div>
                                                    </div>
                                                    <div className="form-field-group">
                                                        <label>Email</label>
                                                        <input type="email" value={editingUser.email || ''} onChange={e => setEditingUser({ ...editingUser, email: e.target.value })} />
                                                    </div>
                                                    <div className="form-field-group">
                                                        <label>Rola</label>
                                                        <select value={editingUser.role || 'student'} onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}>
                                                            <option value="student">Uczeń</option>
                                                            <option value="admin">Administrator</option>
                                                        </select>
                                                    </div>
                                                    <div className="form-field-group">
                                                        <label>Nowe hasło (zostaw puste, by nie zmieniać)</label>
                                                        <input type="password" value={editingUser.password || ''} onChange={e => setEditingUser({ ...editingUser, password: e.target.value })} placeholder="Wpisz nowe hasło..." />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px' }}>
                                                        <button className="btn-cancel" onClick={() => setEditingUser(null)}>Anuluj</button>
                                                        <button className="btn-save" onClick={handleUpdateUser}>Zapisz zmiany</button>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        <tr key={u.id}>
                                            <td>{u.id}</td>
                                            <td>{u.first_name} {u.last_name}</td>
                                            <td>{u.email}</td>
                                            <td><span className={`tag tag-${u.role}`}>{u.role === 'admin' ? 'Administrator' : 'Uczeń'}</span></td>
                                            <td><span className={`tag tag-${u.status}`}>{u.status === 'active' ? 'Aktywny' : 'Oczekujący'}</span></td>
                                            <td style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                                <button className="btn-edit" onClick={() => setEditingUser({ ...u, password: '' })}>Edytuj</button>
                                                {u.status === 'pending' && <button className="btn-save" onClick={() => handleSetStatus(u.id, 'active')}>Akceptuj</button>}
                                                <button className="btn-delete" onClick={() => handleDeleteUser(u.id)}>Usuń</button>
                                            </td>
                                        </tr>
                                    )
                                ))}
                                </tbody>
                            </table>
                        </div>
                        {renderPagination(usersPagination, (p) => { setUsersPage(p); fetchUsers(p); })}

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
                                    const res = await apiFetch('/api/admin/quizzes', {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({
                                            title: e.target.title.value,
                                            category: e.target.category.value, // Nazwa kursu jako kategoria
                                            description: '',
                                            time_limit_minutes: parseInt(e.target.time_limit_minutes.value, 10) || 60
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
                                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px' }}>
                                        <div style={{ flex: 1 }}>
                                            <label>Limit czasu (minuty)</label>
                                            <input name="time_limit_minutes" type="number" min="1" defaultValue="60" required />
                                        </div>
                                    </div>
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
                                        <th>Czas</th>
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
                                                {editingTimeQuizId === qz.id ? (
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={editingTimeValue}
                                                            onChange={e => setEditingTimeValue(e.target.value)}
                                                            style={{ width: '70px', padding: '4px 8px' }}
                                                        />
                                                        <button className="btn-save" onClick={() => handleUpdateQuizTime(qz.id)}>✓</button>
                                                        <button className="btn-cancel" onClick={() => setEditingTimeQuizId(null)}>×</button>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                                                        <span>{qz.time_limit_minutes ?? 60} min</span>
                                                        <button
                                                            className="btn-edit"
                                                            title="Edytuj czas"
                                                            onClick={() => { setEditingTimeQuizId(qz.id); setEditingTimeValue(qz.time_limit_minutes ?? 60); }}
                                                        >✎</button>
                                                    </div>
                                                )}
                                            </td>
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
                                        padding: '12px',
                                        background: 'var(--surface-2)',
                                        color: 'var(--text)',
                                        borderRadius: '8px',
                                        border: '1px dashed var(--primary)',
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
                                const res = await apiFetch('/api/admin/quiz', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify(newQuiz)
                                });
                                if ((await res.json()).success) {
                                    fetchQuestions();
                                    // Czyścimy formularz
                                    setNewQuiz({...newQuiz, question: '', ans_a: '', ans_b: '', ans_c: '', ans_d: '', image_url: ''});
                                }
                            }}>
                                <textarea placeholder="Treść pytania" value={newQuiz.question} onChange={e => setNewQuiz({...newQuiz, question: e.target.value})} />

                                {/* NOWE POLE NA LINK DO ZDJĘCIA */}
                                <input
                                    type="text"
                                    placeholder="Link do zdjęcia (np. z R2) - zostaw puste jeśli brak"
                                    value={newQuiz.image_url}
                                    onChange={e => setNewQuiz({...newQuiz, image_url: e.target.value})}
                                    style={{ marginBottom: '0.5rem' }}
                                />
                                <button
                                    type="button"
                                    className="btn-edit"
                                    style={{ marginBottom: '1rem' }}
                                    onClick={() => { setR2PickerTarget('new'); setR2PickerOpen(true); }}
                                >
                                    🖼️ Wybierz z R2
                                </button>

                                <div className="quiz-grid">
                                    <input placeholder="Odp A" value={newQuiz.ans_a} onChange={e => setNewQuiz({...newQuiz, ans_a: e.target.value})} />
                                    <input placeholder="Odp B" value={newQuiz.ans_b} onChange={e => setNewQuiz({...newQuiz, ans_b: e.target.value})} />
                                    <input placeholder="Odp C" value={newQuiz.ans_c} onChange={e => setNewQuiz({...newQuiz, ans_c: e.target.value})} />
                                    <input placeholder="Odp D" value={newQuiz.ans_d} onChange={e => setNewQuiz({...newQuiz, ans_d: e.target.value})} />
                                    <select value={newQuiz.correct_ans} onChange={e => setNewQuiz({...newQuiz, correct_ans: e.target.value})}>
                                        <option value="A">A</option><option value="B">B</option><option value="C">C</option><option value="D">D</option>
                                    </select>
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
                                    {loadingQuestions ? (
                                        <tr><td colSpan="4" className="loading-row"><Skeleton width="40%" height={14} style={{ margin: '0 auto' }} /></td></tr>
                                    ) : questions.length === 0 ? (
                                        <tr><td colSpan="4" className="empty-state">Brak pytań.</td></tr>
                                    ) : questions.map(q => (
                                        <tr key={q.id}>
                                            {editingQuestion?.id === q.id ? (
                                                <td colSpan="4">
                                                    <div className="edit-question-box">
                                                        <div className="form-field-group">
                                                            <label>Treść pytania:</label>
                                                            <textarea
                                                                value={editingQuestion.question}
                                                                onChange={e => setEditingQuestion({...editingQuestion, question: e.target.value})}
                                                            />
                                                        </div>

                                                        <div className="form-field-group">
                                                            <label>Link do grafiki (R2 / URL):</label>
                                                            <input
                                                                type="text"
                                                                className="edit-image-input"
                                                                placeholder="Wklej URL zdjęcia..."
                                                                value={editingQuestion.image_url || ''}
                                                                onChange={e => setEditingQuestion({...editingQuestion, image_url: e.target.value})}
                                                            />
                                                            <button
                                                                type="button"
                                                                className="btn-edit"
                                                                style={{ marginTop: '6px' }}
                                                                onClick={() => { setR2PickerTarget('edit'); setR2PickerOpen(true); }}
                                                            >
                                                                🖼️ Wybierz z R2
                                                            </button>
                                                        </div>

                                                        <div className="quiz-grid">
                                                            <div className="form-field-group">
                                                                <label>Odp A</label>
                                                                <input value={editingQuestion.ans_a} onChange={e => setEditingQuestion({...editingQuestion, ans_a: e.target.value})} />
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Odp B</label>
                                                                <input value={editingQuestion.ans_b} onChange={e => setEditingQuestion({...editingQuestion, ans_b: e.target.value})} />
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Odp C</label>
                                                                <input value={editingQuestion.ans_c} onChange={e => setEditingQuestion({...editingQuestion, ans_c: e.target.value})} />
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Odp D</label>
                                                                <input value={editingQuestion.ans_d} onChange={e => setEditingQuestion({...editingQuestion, ans_d: e.target.value})} />
                                                            </div>
                                                        </div>

                                                        <div className="quiz-grid" style={{gridTemplateColumns: '1fr 1fr'}}>
                                                            <div className="form-field-group">
                                                                <label>Kategoria / Kurs</label>
                                                                <select value={editingQuestion.category} onChange={e => setEditingQuestion({...editingQuestion, category: e.target.value})}>
                                                                    <option value="INF.03">INF.03</option>
                                                                    <option value="INF.04">INF.04</option>
                                                                    {courses.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                                                </select>
                                                            </div>
                                                            <div className="form-field-group">
                                                                <label>Poprawna</label>
                                                                <select value={editingQuestion.correct_ans} onChange={e => setEditingQuestion({...editingQuestion, correct_ans: e.target.value})}>
                                                                    <option value="A">A</option><option value="B">B</option>
                                                                    <option value="C">C</option><option value="D">D</option>
                                                                </select>
                                                            </div>
                                                        </div>

                                                        <div style={{display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '10px'}}>
                                                            <button className="btn-cancel" onClick={() => setEditingQuestion(null)}>Anuluj</button>
                                                            <button className="btn-save" onClick={() => handleUpdateQuestion(editingQuestion)}>Zapisz zmiany</button>
                                                        </div>
                                                    </div>
                                                </td>
                                            ) : (
                                                <>
                                                    {/*<td>{q.category}</td><td style={{fontSize:'0.8rem'}}>{q.question}</td><td>{q.correct_ans}</td>*/}
                                                    <td>{q.category}</td>
                                                    <td style={{ fontSize: '0.8rem' }}>
                                                        {q.question}
                                                        {q.image_url && (
                                                            <div style={{ color: 'var(--primary)', fontSize: '0.7rem', marginTop: '5px', fontWeight: 'bold' }}>
                                                                🖼️ Zawiera grafikę
                                                            </div>
                                                        )}
                                                    </td>
                                                    <td>{q.correct_ans}</td>
                                                    <td>
                                                        <button className="btn-edit" onClick={() => setEditingQuestion({...q})}>Edytuj</button>
                                                        <button className="btn-save" disabled={!selectedQuizId} onClick={() => handleAddQuestionToQuiz(q.id)}>➕</button>
                                                        <button className="btn-delete" onClick={() => handleDeleteQuestion(q.id)}>Usuń</button>
                                                    </td>
                                                </>
                                            )}
                                        </tr>
                                    ))}
                                    </tbody>
                                </table>
                            </div>
                        {renderPagination(questionsPagination, (p) => { setQuestionsPage(p); fetchQuestions(p); })}

                        </section>
                    </div>
                )}

                {activeTab === 'results' && (
                    <section className="admin-form-section">
                        <div className="section-header-flex">
                            <h3>📊 Wyniki Egzaminów</h3>
                            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                <input className="search-input" placeholder="Szukaj ucznia/testu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                                <select className="search-input" value={resultFilterStatus} onChange={e => setResultFilterStatus(e.target.value)}>
                                    <option value="ALL">Wszystkie statusy</option>
                                    <option value="completed">Zakończone</option>
                                    <option value="reset_requested">Prośby o reset</option>
                                </select>
                                <select className="search-input" value={resultFilterQuiz} onChange={e => setResultFilterQuiz(e.target.value)}>
                                    <option value="ALL">Wszystkie testy</option>
                                    {quizzes.map(qz => (
                                        <option key={qz.id} value={qz.id}>{qz.title}</option>
                                    ))}
                                </select>
                                <select className="search-input" value={resultFilterCategory} onChange={e => setResultFilterCategory(e.target.value)}>
                                    <option value="ALL">Wszystkie kursy/kategorie</option>
                                    {resultCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <div className="admin-table-container">
                            <table className="admin-table">
                                <thead>
                                <tr>
                                    <th className="sortable" onClick={() => handleResultSort('student')}>Uczeń {resultSort.field === 'student' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleResultSort('quiz')}>Test {resultSort.field === 'quiz' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleResultSort('category')}>Kategoria {resultSort.field === 'category' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleResultSort('score')}>Punkty {resultSort.field === 'score' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleResultSort('percent')}>% {resultSort.field === 'percent' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th className="sortable" onClick={() => handleResultSort('date')}>Data {resultSort.field === 'date' ? (resultSort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                                    <th>Akcje</th>
                                </tr>
                                </thead>
                                <tbody>
                                {loadingResults ? (
                                    <tr><td colSpan="7" className="loading-row"><Skeleton width="40%" height={14} style={{ margin: '0 auto' }} /></td></tr>
                                ) : allResults.length === 0 ? (
                                    <tr><td colSpan="7" className="empty-state">Brak wyników.</td></tr>
                                ) : allResults.map(r => (
                                    <tr key={r.id} className={r.status === 'reset_requested' ? 'row-highlight-warning' : ''}>
                                        <td><strong>{r.first_name} {r.last_name}</strong></td>
                                        <td>{r.quiz_title}</td>
                                        <td><span className="tag">{r.quiz_category || '—'}</span></td>
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
                        {renderPagination(resultsPagination, (p) => { setResultsPage(p); fetchAllResults(p); })}

                    </section>
                )}

                {activeTab === 'materials' && (
                    <div className="materials-admin-container">
                        <header className="panel-header"><h2>Zarządzanie Materiałami 📂</h2></header>

                        {/* SEKCOJA DODAWANIA */}
                        <section className="admin-form-section" style={{ marginBottom: '2rem' }}>
                            <h3>➕ Dodaj nowy materiał</h3>
                            <form className="admin-form" onSubmit={handleAddMaterial}>
                                <div className="quiz-grid">
                                    <div style={{ flex: 1 }}>
                                        <label>Tytuł materiału</label>
                                        <input type="text" name="title" placeholder="np. Wykład 1: Wstęp" required />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <label>Przypisz do kursu</label>
                                        <select name="course_id" required className="search-input">
                                            <option value="">-- Wybierz kurs --</option>
                                            {courses.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="quiz-grid" style={{ marginTop: '1rem' }}>
                                    <div style={{ flex: 1 }}>
                                        <label>Typ treści</label>
                                        <select name="content_type" className="search-input">
                                            <option value="link">🔗 Link (Dysk Google / URL)</option>
                                            <option value="html">📄 Notatka (Tekst/HTML)</option>
                                        </select>
                                    </div>
                                </div>

                                <div style={{ marginTop: '1rem' }}>
                                    <label>Treść lub Link</label>
                                    <textarea
                                        name="content_value"
                                        placeholder="Wklej link do Google Drive lub wpisz treść notatki..."
                                        required
                                        style={{ minHeight: '120px' }}
                                    />
                                </div>

                                <div style={{ marginTop: '1rem', display: 'flex', gap: '10px' }}>
                                    <button type="submit" className="login-submit-btn">
                                        Opublikuj materiał
                                    </button>

                                    <button
                                        type="button"
                                        className="btn-edit"
                                        style={{ marginTop: '1rem' }}
                                        onClick={handleShowPreview}
                                    >
                                        👁️ Podgląd na żywo
                                    </button>
                                </div>
                            </form>
                        </section>

                        {/* LISTA MATERIAŁÓW — tabela z paginacją */}
                        <section className="admin-form-section">
                            <div className="section-header-flex">
                                <h3>Lista opublikowanych materiałów</h3>
                                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                                    <input className="search-input" placeholder="Szukaj po tytule..." value={materialSearch} onChange={e => setMaterialSearch(e.target.value)} />
                                    <select className="search-input" value={materialCourseFilter} onChange={e => setMaterialCourseFilter(e.target.value)}>
                                        <option value="ALL">Wszystkie kursy</option>
                                        {courses.map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="admin-table-container">
                                <table className="admin-table">
                                    <thead>
                                    <tr>
                                        <th>Kurs</th>
                                        <th>Tytuł</th>
                                        <th>Typ</th>
                                        <th>Akcje</th>
                                    </tr>
                                    </thead>
                                    <tbody>
                                    {loadingMaterials ? (
                                        <tr><td colSpan="4" className="loading-row"><Skeleton width="40%" height={14} style={{ margin: '0 auto' }} /></td></tr>
                                    ) : allMaterials.length === 0 ? (
                                        <tr><td colSpan="4" className="empty-state">Brak materiałów.</td></tr>
                                    ) : (
                                        allMaterials.map(m => (
                                            <tr key={m.id}>
                                                <td><span className="tag tag-active">{m.course_name || 'Bez kursu'}</span></td>
                                                <td>{m.title}</td>
                                                <td>{m.content_type === 'link' ? '🔗 Link' : '📄 HTML'}</td>
                                                <td>
                                                    <button className="btn-delete" onClick={() => handleDeleteMaterial(m.id)}>Usuń</button>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                    </tbody>
                                </table>
                            </div>
                            {renderPagination(materialsPagination, (p) => { setMaterialsPage(p); fetchAllMaterials(p); })}
                        </section>
                    </div>
                )}

                {previewData && (
                    <div className="modal-overlay" onClick={() => setPreviewData(null)}>
                        <div className="modal-content" style={{ width: '80%', height: '80vh' }} onClick={e => e.stopPropagation()}>
                            <header className="section-header-flex">
                                <h3>Podgląd: {previewData.title || 'Bez tytułu'}</h3>
                                <button className="close-modal" onClick={() => setPreviewData(null)}>×</button>
                            </header>
                            <div style={{ flex: 1, height: '90%', marginTop: '10px' }}>
                                {previewData.content_type === 'link' ? (
                                    <iframe
                                        src={getEmbedUrl(previewData.content_value)}
                                        width="100%"
                                        height="100%"
                                        style={{ border: '2px dashed var(--border-strong)', borderRadius: '8px' }}
                                    ></iframe>
                                ) : (
                                    <div
                                        className="html-render"
                                        style={{ background: 'white', color: 'black', padding: '20px', borderRadius: '8px' }}
                                        dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(previewData.content_value) }}
                                    />
                                )}
                            </div>
                            <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center' }}>
                                Jeśli widzisz błąd logowania Google, upewnij się, że plik ma uprawnienia: "Każda osoba mająca link".
                            </p>
                        </div>
                    </div>
                )}
            <ConfirmModal
                open={!!confirmState}
                title={confirmState?.title}
                message={confirmState?.message}
                confirmLabel={confirmState?.confirmLabel}
                onConfirm={() => {
                    const fn = confirmState?.onConfirm;
                    closeConfirm();
                    if (fn) fn();
                }}
                onCancel={closeConfirm}
            />
            <R2ImagePicker
                open={r2PickerOpen}
                onClose={() => setR2PickerOpen(false)}
                onSelect={handleR2Select}
            />
            </main>
        </div>
    );
};

export default AdminPanel;