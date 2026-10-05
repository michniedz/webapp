import React, { useState, useEffect } from 'react';
import { apiFetch } from '../lib/api';

const StudentQuiz = ({ user, quizId, onBack }) => {
    const [allQuizzes, setAllQuizzes] = useState([]);
    const [selectedCategory, setSelectedCategory] = useState(null);
    const [activeQuiz, setActiveQuiz] = useState(null);
    const [quizData, setQuizData] = useState([]);
    const [userResults, setUserResults] = useState({});
    const [currentStep, setCurrentStep] = useState(0);
    const [answers, setAnswers] = useState({});
    const [isFinished, setIsFinished] = useState(false);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(3600);
    const [serverResult, setServerResult] = useState(null);

    // --- FUNKCJE POMOCNICZE (MUSZĄ BYĆ NA GÓRZE) ---

    const fetchData = async () => {
        const [qRes, rRes] = await Promise.all([
            apiFetch('/api/quizzes'),
            apiFetch('/api/my-results')
        ]);
        const qData = await qRes.json();
        const rData = await rRes.json();

        if (qData.success) setAllQuizzes(qData.data);
        if (rData.success) {
            const resultsMap = {};
            rData.data.forEach(r => resultsMap[r.quiz_id] = r);
            setUserResults(resultsMap);
        }
    };

    const handleStartTest = async (quiz) => {
        if (quiz.is_active === 0) {
            alert("Ten egzamin jest jeszcze zablokowany!");
            return;
        }
        setLoading(true);
        try {
            const res = await apiFetch(`/api/quiz/questions?quiz_id=${quiz.id}`);
            const data = await res.json();
            if (data.success) {
                setQuizData(data.data);
                setActiveQuiz(quiz);
                setTimeLeft(3600);
                setAnswers({});
                setCurrentStep(0);
                setIsFinished(false);
            }
        } catch (err) {
            console.error("Błąd ładowania pytań:", err);
        }
        setLoading(false);
    };

    const finishAndSave = async () => {
        try {
            const res = await apiFetch('/api/quiz/submit', {
                method: 'POST',
                body: JSON.stringify({
                    quiz_id: activeQuiz.id,
                    answers
                })
            });
            const data = await res.json();
            if (data.success) {
                setQuizData(data.questions);        // pytania z kluczem (do analizy)
                setAnswers(data.your_answers || {}); // odpowiedzi ucznia
                setServerResult(data.result);
                setIsFinished(true);
                fetchData();
            } else {
                alert(data.error || "Błąd zapisu.");
            }
        } catch (err) { alert("Błąd zapisu."); }
    };

    const handlePreview = async (quiz) => {
        if (quiz.is_active === 0) {
            alert("Podgląd tego testu został zablokowany przez nauczyciela.");
            return;
        }
        setLoading(true);
        const res = await apiFetch(`/api/quiz/review?quiz_id=${quiz.id}`);
        const data = await res.json();
        if (data.success) {
            setQuizData(data.data);
            setActiveQuiz(quiz);
            setAnswers(data.your_answers || {});
            setServerResult(data.result || null);
            setIsFinished(true);
        }
        setLoading(false);
    };

    const requestReset = async (quizId) => {
        const res = await apiFetch('/api/quiz/request-reset', {
            method: 'POST',
            body: JSON.stringify({ quiz_id: quizId })
        });
        if ((await res.json()).success) {
            alert("Prośba o ponowne rozwiązanie została wysłana do administratora.");
            await fetchData();
        }
    };

    const formatTime = (seconds) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s < 10 ? '0' : ''}${s}`;
    };

    // --- EFFECTY ---

    useEffect(() => {
        fetchData();
        if (quizId) {
            autoStartQuiz(quizId);
        }
    }, [user.id, quizId]);

    useEffect(() => {
        if (!activeQuiz || isFinished) return;
        if (timeLeft <= 0) { finishAndSave(); return; }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [activeQuiz, isFinished, timeLeft]);


    // Nowa funkcja pomocnicza do automatycznego startu
    const autoStartQuiz = async (id) => {
        setLoading(true);
        try {
            // 1. Sprawdź na serwerze, czy uczeń już rozwiązał ten test (przez /api/quiz/review,
            //    które zwraca 403, jeśli wyniku jeszcze nie ma).
            const reviewRes = await apiFetch(`/api/quiz/review?quiz_id=${id}`);
            const reviewData = await reviewRes.json();

            if (reviewData.success) {
                // Uczeń już rozwiązał test — pokazujemy pełny podgląd wyniku.
                setQuizData(reviewData.data);
                setActiveQuiz({ id: id, title: "Wynik egzaminu" });
                setAnswers(reviewData.your_answers || {});
                setServerResult(reviewData.result || null);
                setIsFinished(true);
            } else {
                // 2. Brak wyniku — startujemy test normalnie (pytania BEZ klucza odpowiedzi).
                const res = await apiFetch(`/api/quiz/questions?quiz_id=${id}`);
                const data = await res.json();
                const quizInfo = allQuizzes.find(q => q.id === parseInt(id));
                if (data.success) {
                    setQuizData(data.data);
                    setActiveQuiz({ id: id, title: quizInfo ? quizInfo.title : "Egzamin" });
                    setTimeLeft(3600);
                    setAnswers({});
                    setCurrentStep(0);
                    setIsFinished(false);
                }
            }
        } catch (err) {
            console.error("Błąd auto-startu:", err);
        }
        setLoading(false);
    };

    // --- RENDERING (LOGIKA WYBORU EKRANU) ---

    if (loading) return <div className="loader">Ładowanie danych egzaminu...</div>;

    if (!selectedCategory && !activeQuiz) {
        return (
            <section className="quiz-selection-view">
                <h3>Wybierz kwalifikację:</h3>
                <div className="stats-grid">
                    <div className="stat-card clickable" onClick={() => setSelectedCategory('INF.03')}>
                        <p>Kwalifikacja</p><span>INF.03</span>
                    </div>
                    <div className="stat-card clickable" onClick={() => setSelectedCategory('INF.04')}>
                        <p>Kwalifikacja</p><span>INF.04</span>
                    </div>
                </div>
                <button className="back-link" onClick={onBack} style={{marginTop: '2rem'}}>← Wróć do pulpitu</button>
            </section>
        );
    }

    if (selectedCategory && !activeQuiz) {
        const filteredQuizzes = allQuizzes.filter(q => q.category === selectedCategory);
        return (
            <section className="quiz-selection-view">
                <h3>Dostępne testy {selectedCategory}:</h3>
                <div className="stats-grid">
                    {filteredQuizzes.map(quiz => {
                        const result = userResults[quiz.id];

                        const isDeactivated = quiz.is_active === 0;
                        const hasResult = !!result;
                        const isPendingReset = result && result.status === 'reset_requested';

                        // Styl dla zablokowanej karty (ale z widocznym wynikiem)
                        const cardStyle = isDeactivated ? { border: '1px solid var(--border-strong)', opacity: 0.8 } : {};

                        return (
                            <div key={quiz.id} className={`stat-card ${hasResult || isDeactivated ? 'locked' : 'clickable'}`} style={cardStyle}>
                                <p>Arkusz #{quiz.id}</p>
                                <h3>{quiz.title}</h3>

                                {/* SCENARIUSZ 1: Uczeń już rozwiązał test */}
                                {hasResult ? (
                                    <div className="quiz-result-tag">
                                        Wynik: <strong>{result.percent}%</strong>

                                        {isDeactivated ? (
                                            /* Test wyłączony - uczeń widzi wynik, ale nie może wejść w podgląd */
                                            <p style={{color: 'var(--text-dim)', fontSize: '0.75rem', marginTop: '8px'}}>
                                                🔒 Arkusz zamknięty przez nauczyciela (podgląd niedostępny)
                                            </p>
                                        ) : isPendingReset ? (
                                            /* Prośba o reset wysłana */
                                            <div style={{marginTop: '10px', color: 'var(--warning)', fontSize: '0.8rem'}}>
                                                ⌛ Oczekiwanie na reset...
                                            </div>
                                        ) : (
                                            /* Test aktywny - uczeń może wejść w podgląd lub poprosić o reset */
                                            <div style={{marginTop: '10px', display: 'flex', gap: '5px'}}>
                                                <button className="btn-small" onClick={() => handlePreview(quiz)}>👁️ Podgląd</button>
                                                <button className="btn-small btn-secondary" onClick={() => requestReset(quiz.id)}>🔄 Reset</button>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    /* SCENARIUSZ 2: Uczeń jeszcze nie rozwiązał testu */
                                    <>
                                        {isDeactivated ? (
                                            <div className="quiz-result-tag" style={{background: 'rgba(220, 38, 38, 0.08)', color: 'var(--danger)'}}>
                                                🔒 Test obecnie nieaktywny
                                            </div>
                                        ) : (
                                            <span onClick={() => handleStartTest(quiz)}>Rozpocznij egzamin →</span>
                                        )}
                                    </>
                                )}
                            </div>
                        );
                    })}
                </div>
                <button className="back-link" onClick={() => setSelectedCategory(null)}>← Zmień kategorię</button>
            </section>
        );
    }

    if (isFinished) {
        const savedResult = userResults[activeQuiz?.id] || serverResult;
        const displayResult = savedResult ? {
            percent: savedResult.percent,
            score: savedResult.score,
            total: savedResult.total_questions
        } : { percent: 0, score: 0, total: 0 };

        return (
            <section className="quiz-results">
                <div className="admin-form-section" style={{textAlign: 'center', marginBottom: '2rem'}}>
                    <h2 style={{fontSize: '3rem'}}>{displayResult.percent}%</h2>
                    <p>Wynik: {displayResult.score} / {displayResult.total}</p>
                    <button className="login-submit-btn" onClick={() => {
                        setActiveQuiz(null);
                        setIsFinished(false);
                        setAnswers({});
                    }}>Zamknij podgląd</button>
                </div>

                <h3>Szczegółowa analiza:</h3>
                <div className="review-list">
                    {quizData.map((q, index) => {
                        const studentAns = (answers[q.id] || '').toUpperCase();
                        const correctAns = q.correct_ans?.toUpperCase();

                        // Sprawdzamy czy uczeń w ogóle odpowiedział i czy poprawnie
                        const isCorrect = studentAns === correctAns;
                        const isUnanswered = !studentAns;

                        // Ustalamy klasę obramowania
                        let itemStatusClass = "unanswered-border"; // domyślnie dla braku odpowiedzi
                        if (!isUnanswered) {
                            itemStatusClass = isCorrect ? "correct-border" : "wrong-border";
                        }

                        return (
                            <div key={index} className={`review-item ${itemStatusClass}`}>
                                <p className="question-number">
                                    Pytanie {index + 1}
                                    {isCorrect ? " ✅" : isUnanswered ? " ⚪ (Brak odpowiedzi)" : " ❌"}
                                </p>
                                <p className="question-text"><strong>{q.question}</strong></p>

                                {q.image_url && (
                                    <div style={{ marginBottom: '1rem', textAlign: 'left' }}>
                                        <img
                                            src={q.image_url}
                                            alt="Podgląd"
                                            style={{
                                                maxWidth: '200px', // Mniejsze w podglądzie wyników
                                                maxHeight: '150px',
                                                borderRadius: '6px',
                                                border: '1px solid var(--border)'
                                            }}
                                        />
                                    </div>
                                )}

                                <div className="review-options">
                                    {['A', 'B', 'C', 'D'].map(opt => {
                                        const isThisCorrect = correctAns === opt;
                                        const isThisStudentChoice = studentAns === opt;

                                        let statusClass = "";
                                        if (isThisCorrect) statusClass = "opt-correct";
                                        if (isThisStudentChoice && !isThisCorrect) statusClass = "opt-wrong";

                                        return (
                                            <div key={opt} className={`review-opt ${statusClass}`}>
                                                <strong>{opt}:</strong> {q[`ans_${opt.toLowerCase()}`]}
                                                {isThisStudentChoice && " (Twój wybór)"}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>
        );
    }

    // --- EKRAN AKTYWNEGO PYTANIA ---
    const q = quizData[currentStep];
    return (
        <section className="quiz-active">
            <div className="quiz-header">
                <div><span className="tag-pending">{activeQuiz?.title}</span><span> Pytanie {currentStep + 1} / {quizData.length}</span></div>
                <div className={`timer-badge ${timeLeft < 300 ? 'urgent' : ''}`}>⏱️ {formatTime(timeLeft)}</div>
            </div>
            <div className="question-box">
                <h4 className="quiz-question-text">{q?.question}</h4>
                {q?.image_url && (
                    <div className="quiz-image-wrapper" style={{
                        textAlign: 'center',
                        marginBottom: '1.5rem',
                        padding: '10px',
                        background: 'rgba(15, 23, 42, 0.02)',
                        borderRadius: '12px',
                        border: '1px solid var(--border)'
                    }}>
                        <img
                            src={q.image_url}
                            alt="Ilustracja do pytania"
                            style={{
                                maxWidth: '100%',
                                maxHeight: '350px',
                                borderRadius: '8px',
                                display: 'block',
                                margin: '0 auto'
                            }}
                        />
                    </div>
                )}
                <div className="quiz-options-list">
                    {['A', 'B', 'C', 'D'].map(key => (
                        <button key={key} className={`quiz-option-btn ${answers[q?.id] === key ? 'selected' : ''}`}
                                onClick={() => setAnswers({ ...answers, [q?.id]: key })}>
                            <strong>{key}.</strong> {q?.[`ans_${key.toLowerCase()}`]}
                        </button>
                    ))}
                </div>
            </div>
            <div className="quiz-navigation">
                <button disabled={currentStep === 0} onClick={() => setCurrentStep(currentStep - 1)}>Poprzednie</button>
                {currentStep === quizData.length - 1 ? (
                    <button className="btn-save" onClick={finishAndSave}>Zakończ egzamin</button>
                ) : (
                    <button onClick={() => setCurrentStep(currentStep + 1)}>Następne</button>
                )}
            </div>
        </section>
    );
};

export default StudentQuiz;