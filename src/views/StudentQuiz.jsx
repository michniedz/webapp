import React, { useState, useEffect } from 'react';

const StudentQuiz = ({ user, onBack }) => {
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

    // --- FUNKCJE POMOCNICZE (MUSZĄ BYĆ NA GÓRZE) ---

    const fetchData = async () => {
        const [qRes, rRes] = await Promise.all([
            fetch('https://backend-webapp.michniedz.workers.dev/api/quizzes'),
            fetch(`https://backend-webapp.michniedz.workers.dev/api/my-results?user_id=${user.id}`)
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
        setLoading(true);
        try {
            const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/quiz/questions?quiz_id=${quiz.id}`);
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

    const calculateResult = () => {
        let score = 0;
        quizData.forEach((q, index) => {
            if (answers[index]?.toUpperCase() === q.correct_ans?.toUpperCase()) score++;
        });
        return {
            score,
            total: quizData.length,
            percent: quizData.length > 0 ? Math.round((score / quizData.length) * 100) : 0
        };
    };

    const finishAndSave = async () => {
        const result = calculateResult();
        try {
            const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/quiz/save-result', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id, quiz_id: activeQuiz.id,
                    score: result.score, total: result.total, percent: result.percent
                })
            });
            if ((await res.json()).success) {
                setIsFinished(true);
                fetchData();
            }
        } catch (err) { alert("Błąd zapisu."); }
    };

    const handlePreview = async (quiz) => {
        setLoading(true);
        const res = await fetch(`https://backend-webapp.michniedz.workers.dev/api/quiz/questions?quiz_id=${quiz.id}`);
        const data = await res.json();
        if (data.success) {
            setQuizData(data.data);
            setActiveQuiz(quiz);
            setIsFinished(true);
        }
        setLoading(false);
    };

    const requestReset = async (quizId) => {
        const res = await fetch('https://backend-webapp.michniedz.workers.dev/api/quiz/request-reset', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ user_id: user.id, quiz_id: quizId })
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

    useEffect(() => { fetchData(); }, [user.id]);

    useEffect(() => {
        if (!activeQuiz || isFinished) return;
        if (timeLeft <= 0) { finishAndSave(); return; }
        const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(timer);
    }, [activeQuiz, isFinished, timeLeft]);


    // --- RENDERING (LOGIKA WYBORU EKRANU) ---

    if (loading) return <div className="loader">Ładowanie danych egzaminu...</div>;

    if (!selectedCategory) {
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
                        const isLocked = result && result.status !== 'reset_requested';
                        const isPendingReset = result && result.status === 'reset_requested';

                        return (
                            <div key={quiz.id} className={`stat-card ${isLocked || isPendingReset ? 'locked' : 'clickable'}`}>
                                <p>Arkusz #{quiz.id}</p>
                                <h3>{quiz.title}</h3>
                                {isPendingReset ? (
                                    <div className="quiz-result-tag" style={{background: 'rgba(234, 179, 8, 0.1)', color: '#eab308'}}>
                                        ⌛ Oczekiwanie na reset...
                                    </div>
                                ) : result ? (
                                    <div className="quiz-result-tag">
                                        Wynik: <strong>{result.percent}%</strong>
                                        <div style={{marginTop: '10px', display: 'flex', gap: '5px'}}>
                                            <button className="btn-small" onClick={() => handlePreview(quiz)}>👁️ Podgląd</button>
                                            <button className="btn-small btn-secondary" onClick={() => requestReset(quiz.id)}>🔄 Reset</button>
                                        </div>
                                    </div>
                                ) : (
                                    <span onClick={() => handleStartTest(quiz)}>Rozpocznij egzamin →</span>
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
        const savedResult = userResults[activeQuiz?.id];
        const displayResult = savedResult ? {
            percent: savedResult.percent,
            score: savedResult.score,
            total: savedResult.total_questions
        } : calculateResult();

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
                        const studentAns = answers[index]?.toUpperCase();
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
                <div className="quiz-options-list">
                    {['A', 'B', 'C', 'D'].map(key => (
                        <button key={key} className={`quiz-option-btn ${answers[currentStep] === key ? 'selected' : ''}`}
                                onClick={() => setAnswers({ ...answers, [currentStep]: key })}>
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