"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

function Icon({ name, size = 20 }) {
    const common = {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: 1.8,
        strokeLinecap: "round",
        strokeLinejoin: "round",
    };

    const icons = {
        arrow: (
            <svg {...common}>
                <path d="M19 12H5" />
                <path d="m12 19-7-7 7-7" />
            </svg>
        ),
        clock: (
            <svg {...common}>
                <circle cx="12" cy="12" r="9" />
                <path d="M12 7v5l3 2" />
            </svg>
        ),
        check: (
            <svg {...common}>
                <path d="m5 12 4 4 10-10" />
            </svg>
        ),
        alert: (
            <svg {...common}>
                <path d="M10.3 4.1 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </svg>
        ),
        chevronLeft: (
            <svg {...common}>
                <path d="m15 18-6-6 6-6" />
            </svg>
        ),
        chevronRight: (
            <svg {...common}>
                <path d="m9 18 6-6-6-6" />
            </svg>
        ),
        flag: (
            <svg {...common}>
                <path d="M5 21V4" />
                <path d="M5 4c4-3 7 3 14 0v10c-7 3-10-3-14 0" />
            </svg>
        ),
        shield: (
            <svg {...common}>
                <path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Z" />
                <path d="m9 12 2 2 4-4" />
            </svg>
        ),
    };

    return icons[name] || null;
}

function normalizeQuestions(data) {
    if (!data) return [];

    if (Array.isArray(data)) {
        return data;
    }

    if (Array.isArray(data.questions)) {
        return data.questions;
    }

    if (Array.isArray(data.test_questions)) {
        return data.test_questions;
    }

    if (Array.isArray(data.data)) {
        return data.data;
    }

    return [];
}

function normalizeTest(data) {
    if (!data) return null;

    const source = Array.isArray(data) ? data[0] : data;

    if (!source || typeof source !== "object") {
        return null;
    }

    return source.test || source.assessment || source;
}

function getQuestionId(question) {
    return (
        question.id ||
        question.question_id
    );
}

function getQuestionText(question) {
    return (
        question.question_text ||
        question.text ||
        question.question ||
        ""
    );
}

function getOptions(question) {
    return [
        {
            key: "a",
            text: question.option_a || question.options?.a || "",
        },
        {
            key: "b",
            text: question.option_b || question.options?.b || "",
        },
        {
            key: "c",
            text: question.option_c || question.options?.c || "",
        },
        {
            key: "d",
            text: question.option_d || question.options?.d || "",
        },
    ];
}

function formatTime(seconds) {
    const safeSeconds = Math.max(0, seconds);

    const minutes = Math.floor(safeSeconds / 60);
    const remainingSeconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

export default function StudentTestPage() {
    const params = useParams();
    const router = useRouter();

    const testId = params?.testId;

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const [test, setTest] = useState(null);
    const [questions, setQuestions] = useState([]);

    const [started, setStarted] = useState(false);
    const [attempt, setAttempt] = useState(null);

    const [currentIndex, setCurrentIndex] = useState(0);
    const [answers, setAnswers] = useState({});

    const [timeLeft, setTimeLeft] = useState(0);

    const [showSubmitModal, setShowSubmitModal] =
        useState(false);

    const [showQuestionMap, setShowQuestionMap] =
        useState(false);

    const [result, setResult] = useState(null);

    const currentQuestion = questions[currentIndex];

    const answeredCount = useMemo(
        () => Object.keys(answers).length,
        [answers]
    );

    const totalQuestions = questions.length;

    const isLastQuestion =
        currentIndex === totalQuestions - 1;

    const isFirstQuestion =
        currentIndex === 0;

    const progress =
        totalQuestions > 0
            ? ((currentIndex + 1) / totalQuestions) * 100
            : 0;

    const durationMinutes =
        Number(
            test?.duration_minutes ||
                test?.duration ||
                60
        );

    const loadTest = useCallback(async () => {
        if (!testId) return;

        setLoading(true);
        setError("");

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                router.replace("/login");
                return;
            }

            const { data: assessmentData, error: assessmentError } =
                await supabase.rpc(
                    "get_my_assessments"
                );

            if (assessmentError) {
                throw assessmentError;
            }

            const assessmentSource = Array.isArray(
                assessmentData
            )
                ? assessmentData[0]
                : assessmentData;

            const tests =
                assessmentSource?.tests ||
                assessmentSource?.assessments ||
                assessmentSource?.class_tests ||
                [];

            const foundTest = Array.isArray(tests)
                ? tests.find(
                      (item) =>
                          String(
                              item.id ||
                                  item.test_id
                          ) === String(testId)
                  )
                : null;

            if (!foundTest) {
                throw new Error(
                    "This test is not available to you."
                );
            }

            setTest(foundTest);

            const { data: questionData, error: questionError } =
                await supabase.rpc(
                    "get_test_questions",
                    {
                        p_test_id: testId,
                    }
                );

            if (questionError) {
                throw questionError;
            }

            const loadedQuestions =
                normalizeQuestions(questionData);

            if (!loadedQuestions.length) {
                throw new Error(
                    "This test does not have any available questions yet."
                );
            }

            setQuestions(loadedQuestions);

            const existingAttempt =
                foundTest.attempt ||
                foundTest.test_attempt ||
                foundTest.attempts?.[0] ||
                null;

            if (
                existingAttempt?.status ===
                "submitted"
            ) {
                setAttempt(existingAttempt);
                setResult(existingAttempt);
                return;
            }

            if (
                existingAttempt?.status ===
                "abandoned"
            ) {
                setAttempt(existingAttempt);
                return;
            }

            if (
                existingAttempt?.status ===
                "in_progress"
            ) {
                setAttempt(existingAttempt);
                setStarted(true);

                const startedAt = new Date(
                    existingAttempt.started_at
                ).getTime();

                const elapsed = Math.floor(
                    (Date.now() - startedAt) / 1000
                );

                const remaining =
                    Math.max(
                        0,
                        durationMinutes * 60 -
                            elapsed
                    );

                setTimeLeft(remaining);
            }
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to load this test."
            );
        } finally {
            setLoading(false);
        }
    }, [testId, router, durationMinutes]);

    useEffect(() => {
        loadTest();
    }, [loadTest]);

    useEffect(() => {
        if (!started || result || submitting) {
            return;
        }

        if (timeLeft <= 0) {
            setShowSubmitModal(true);
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((current) =>
                Math.max(0, current - 1)
            );
        }, 1000);

        return () => clearInterval(timer);
    }, [
        started,
        result,
        submitting,
        timeLeft,
    ]);

    useEffect(() => {
        if (
            started &&
            timeLeft === 0 &&
            !result &&
            !submitting
        ) {
            submitTest(true);
        }
    }, [
        timeLeft,
        started,
        result,
        submitting,
    ]);

    const startTest = async () => {
        if (!testId) return;

        setStarting(true);
        setError("");

        try {
            const { data, error: rpcError } =
                await supabase.rpc(
                    "start_test_attempt",
                    {
                        p_test_id: testId,
                    }
                );

            if (rpcError) {
                throw rpcError;
            }

            const newAttempt = Array.isArray(data)
                ? data[0]
                : data;

            setAttempt(newAttempt);
            setStarted(true);

            const startTime =
                newAttempt?.started_at
                    ? new Date(
                          newAttempt.started_at
                      ).getTime()
                    : Date.now();

            const remaining = Math.max(
                0,
                durationMinutes * 60 -
                    Math.floor(
                        (Date.now() -
                            startTime) /
                            1000
                    )
            );

            setTimeLeft(remaining);
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to start this test."
            );
        } finally {
            setStarting(false);
        }
    };

    const selectAnswer = (questionId, answer) => {
        if (submitting || result) return;

        setAnswers((current) => ({
            ...current,
            [questionId]: answer,
        }));
    };

    const submitTest = async (automatic = false) => {
        if (submitting || result) return;

        setSubmitting(true);
        setShowSubmitModal(false);
        setError("");

        try {
            const payload = Object.entries(
                answers
            ).map(([questionId, selectedAnswer]) => ({
                question_id: questionId,
                selected_answer: selectedAnswer,
            }));

            const { data, error: rpcError } =
                await supabase.rpc(
                    "submit_test_attempt",
                    {
                        p_test_id: testId,
                        p_answers: payload,
                    }
                );

            if (rpcError) {
                throw rpcError;
            }

            const submittedResult =
                Array.isArray(data)
                    ? data[0]
                    : data;

            setResult(
                submittedResult || {
                    status: "submitted",
                }
            );

            setAttempt(
                submittedResult || attempt
            );
        } catch (err) {
            setError(
                err?.message ||
                    "Unable to submit your test."
            );
        } finally {
            setSubmitting(false);
        }
    };

    const goNext = () => {
        if (!isLastQuestion) {
            setCurrentIndex(
                (current) => current + 1
            );
        } else {
            setShowSubmitModal(true);
        }
    };

    const goPrevious = () => {
        if (!isFirstQuestion) {
            setCurrentIndex(
                (current) => current - 1
            );
        }
    };

    const goToQuestion = (index) => {
        setCurrentIndex(index);
        setShowQuestionMap(false);
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto max-w-5xl px-5 py-10">
                    <div className="animate-pulse">
                        <div className="h-4 w-20 rounded bg-surface-secondary" />
                        <div className="mt-6 h-9 w-72 rounded bg-surface-secondary" />

                        <div className="mt-10 rounded-[28px] border border-border bg-surface p-8">
                            <div className="h-5 w-1/3 rounded bg-surface-secondary" />
                            <div className="mt-6 h-20 rounded bg-surface-secondary" />

                            <div className="mt-8 space-y-3">
                                <div className="h-14 rounded-2xl bg-surface-secondary" />
                                <div className="h-14 rounded-2xl bg-surface-secondary" />
                                <div className="h-14 rounded-2xl bg-surface-secondary" />
                                <div className="h-14 rounded-2xl bg-surface-secondary" />
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !test) {
        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto flex min-h-screen max-w-lg items-center px-5">
                    <div className="w-full rounded-[28px] border border-border bg-surface p-7 text-center shadow-sm">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
                            <Icon name="alert" size={24} />
                        </div>

                        <h1 className="mt-5 text-xl font-semibold text-foreground">
                            Test unavailable
                        </h1>

                        <p className="mt-2 text-sm leading-6 text-muted">
                            {error}
                        </p>

                        <Link
                            href="/student/tests"
                            className="mt-6 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                        >
                            <Icon name="arrow" size={16} />
                            Back to Tests
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    if (result) {
        const percentage =
            Number(
                result.percentage ??
                    result.score ??
                    result.result?.percentage
            );

        const passed =
            result.passed ??
            result.result?.passed ??
            (Number.isFinite(percentage)
                ? percentage >= 50
                : null);

        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="w-full"
                    >
                        <div className="text-center">
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-accent-soft text-primary">
                                <Icon
                                    name="check"
                                    size={30}
                                />
                            </div>

                            <p className="mt-6 text-sm font-medium text-primary">
                                Assessment complete
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
                                {test?.title ||
                                    "Test submitted"}
                            </h1>

                            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                                Your attempt has been
                                submitted. Your result is
                                shown below.
                            </p>
                        </div>

                        <div className="mt-10 rounded-[30px] border border-border bg-surface p-8 text-center shadow-sm">
                            {Number.isFinite(
                                percentage
                            ) ? (
                                <>
                                    <p className="text-6xl font-semibold tracking-tight text-foreground">
                                        {Math.round(
                                            percentage
                                        )}
                                        <span className="text-3xl text-muted">
                                            %
                                        </span>
                                    </p>

                                    <div
                                        className={`mx-auto mt-4 inline-flex items-center rounded-full px-3 py-1.5 text-xs font-medium ${
                                            passed
                                                ? "bg-success/10 text-success"
                                                : "bg-danger/10 text-danger"
                                        }`}
                                    >
                                        {passed
                                            ? "Passed"
                                            : "Not passed"}
                                    </div>
                                </>
                            ) : (
                                <p className="text-lg font-medium text-foreground">
                                    Submitted successfully
                                </p>
                            )}

                            <div className="mx-auto mt-8 grid max-w-md grid-cols-2 divide-x divide-border border-y border-border">
                                <div className="py-4">
                                    <p className="text-xl font-semibold text-foreground">
                                        {totalQuestions}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Questions
                                    </p>
                                </div>

                                <div className="py-4">
                                    <p className="text-xl font-semibold text-foreground">
                                        {answeredCount}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Answered
                                    </p>
                                </div>
                            </div>

                            <Link
                                href="/student/tests"
                                className="mt-8 inline-flex h-11 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground"
                            >
                                <Icon
                                    name="arrow"
                                    size={16}
                                />
                                Back to Tests
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </main>
        );
    }

    const existingAttemptStatus =
        attempt?.status;

    if (
        !started &&
        existingAttemptStatus !== "in_progress"
    ) {
        const isLocked =
            existingAttemptStatus === "abandoned";

        return (
            <main className="min-h-screen bg-background">
                <div className="mx-auto flex min-h-screen max-w-3xl items-center px-5 py-10">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 16,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="w-full"
                    >
                        <Link
                            href="/student/tests"
                            className="inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground"
                        >
                            <Icon
                                name="arrow"
                                size={16}
                            />
                            Back to Tests
                        </Link>

                        <div className="mt-8 rounded-[32px] border border-border bg-surface p-7 shadow-sm sm:p-10">
                            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                                <Icon
                                    name={
                                        isLocked
                                            ? "shield"
                                            : "clock"
                                    }
                                    size={25}
                                />
                            </div>

                            <p className="mt-7 text-sm font-medium text-primary">
                                Class assessment
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                {test?.title ||
                                    "Assessment"}
                            </h1>

                            {test?.description && (
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted">
                                    {test.description}
                                </p>
                            )}

                            <div className="mt-8 grid grid-cols-1 border-y border-border sm:grid-cols-3 sm:divide-x sm:divide-border">
                                <div className="py-5 sm:px-5">
                                    <p className="text-lg font-semibold text-foreground">
                                        {durationMinutes}
                                        <span className="ml-1 text-sm font-normal text-muted">
                                            min
                                        </span>
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Time limit
                                    </p>
                                </div>

                                <div className="py-5 sm:px-5">
                                    <p className="text-lg font-semibold text-foreground">
                                        {questions.length}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Questions
                                    </p>
                                </div>

                                <div className="py-5 sm:px-5">
                                    <p className="text-lg font-semibold text-foreground">
                                        1
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Attempt allowed
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 rounded-2xl bg-surface-secondary p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 text-primary">
                                        <Icon
                                            name="shield"
                                            size={18}
                                        />
                                    </div>

                                    <div>
                                        <p className="text-sm font-medium text-foreground">
                                            Before you begin
                                        </p>

                                        <ul className="mt-2 space-y-2 text-xs leading-5 text-muted">
                                            <li>
                                                • You have one attempt
                                                only.
                                            </li>
                                            <li>
                                                • The timer begins when
                                                you start.
                                            </li>
                                            <li>
                                                • Make sure you have a
                                                stable connection.
                                            </li>
                                            <li>
                                                • Review your answers
                                                before submitting.
                                            </li>
                                        </ul>
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/5 p-4 text-sm text-danger">
                                    {error}
                                </div>
                            )}

                            {isLocked ? (
                                <div className="mt-7 rounded-2xl border border-border bg-surface-secondary p-4 text-sm text-muted">
                                    This attempt has already been
                                    used and cannot be restarted.
                                </div>
                            ) : (
                                <button
                                    onClick={startTest}
                                    disabled={starting}
                                    className="mt-7 flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {starting
                                        ? "Starting test..."
                                        : "Start Test"}
                                </button>
                            )}
                        </div>
                    </motion.div>
                </div>
            </main>
        );
    }

    const options =
        currentQuestion
            ? getOptions(currentQuestion)
            : [];

    const currentQuestionId =
        currentQuestion
            ? getQuestionId(currentQuestion)
            : null;

    const selectedAnswer =
        currentQuestionId
            ? answers[currentQuestionId]
            : null;

    const timeIsLow = timeLeft <= 300;

    return (
        <main className="min-h-screen bg-background">
            <div className="mx-auto w-full max-w-6xl px-4 py-5 sm:px-6 lg:px-8">
                <header className="flex items-center justify-between gap-4 border-b border-border pb-5">
                    <div className="min-w-0">
                        <p className="text-xs font-medium text-primary">
                            Test in progress
                        </p>

                        <h1 className="mt-1 truncate text-base font-semibold text-foreground sm:text-lg">
                            {test?.title ||
                                "Class Test"}
                        </h1>
                    </div>

                    <div
                        className={`flex shrink-0 items-center gap-2 rounded-xl border px-3 py-2 ${
                            timeIsLow
                                ? "border-danger/30 bg-danger/10 text-danger"
                                : "border-border bg-surface text-foreground"
                        }`}
                    >
                        <Icon
                            name="clock"
                            size={17}
                        />

                        <span className="font-mono text-sm font-semibold tabular-nums">
                            {formatTime(timeLeft)}
                        </span>
                    </div>
                </header>

                <div className="mt-5 h-1 overflow-hidden rounded-full bg-surface-secondary">
                    <motion.div
                        className="h-full rounded-full bg-primary"
                        animate={{
                            width: `${progress}%`,
                        }}
                        transition={{
                            duration: 0.25,
                        }}
                    />
                </div>

                <div className="mt-7 grid gap-7 lg:grid-cols-[1fr_260px]">
                    <section>
                        <div className="rounded-[28px] border border-border bg-surface p-6 shadow-sm sm:p-8">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm font-medium text-primary">
                                    Question{" "}
                                    {currentIndex + 1}{" "}
                                    of {totalQuestions}
                                </span>

                                <button
                                    onClick={() =>
                                        setShowQuestionMap(
                                            true
                                        )
                                    }
                                    className="text-xs font-medium text-muted transition hover:text-foreground lg:hidden"
                                >
                                    View questions
                                </button>
                            </div>

                            <h2 className="mt-7 text-xl font-semibold leading-8 tracking-tight text-foreground sm:text-2xl">
                                {getQuestionText(
                                    currentQuestion
                                )}
                            </h2>

                            <div className="mt-8 space-y-3">
                                {options.map(
                                    (option) => {
                                        const selected =
                                            selectedAnswer ===
                                            option.key;

                                        return (
                                            <button
                                                key={
                                                    option.key
                                                }
                                                onClick={() =>
                                                    selectAnswer(
                                                        currentQuestionId,
                                                        option.key
                                                    )
                                                }
                                                className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition ${
                                                    selected
                                                        ? "border-primary bg-accent-soft"
                                                        : "border-border bg-background hover:border-border-strong hover:bg-surface-secondary"
                                                }`}
                                            >
                                                <span
                                                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold uppercase transition ${
                                                        selected
                                                            ? "border-primary bg-primary text-primary-foreground"
                                                            : "border-border text-muted group-hover:border-primary group-hover:text-primary"
                                                    }`}
                                                >
                                                    {
                                                        option.key
                                                    }
                                                </span>

                                                <span
                                                    className={`pt-1 text-sm leading-6 ${
                                                        selected
                                                            ? "font-medium text-foreground"
                                                            : "text-muted"
                                                    }`}
                                                >
                                                    {
                                                        option.text
                                                    }
                                                </span>
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-9 flex items-center justify-between gap-3 border-t border-border pt-5">
                                <button
                                    onClick={
                                        goPrevious
                                    }
                                    disabled={
                                        isFirstQuestion
                                    }
                                    className="flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-35"
                                >
                                    <Icon
                                        name="chevronLeft"
                                        size={16}
                                    />
                                    Previous
                                </button>

                                <button
                                    onClick={goNext}
                                    className="flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover"
                                >
                                    {isLastQuestion
                                        ? "Review & Submit"
                                        : "Next"}
                                    {!isLastQuestion && (
                                        <Icon
                                            name="chevronRight"
                                            size={16}
                                        />
                                    )}
                                </button>
                            </div>
                        </div>
                    </section>

                    <aside className="hidden lg:block">
                        <div className="sticky top-5 rounded-[26px] border border-border bg-surface p-5 shadow-sm">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-semibold text-foreground">
                                        Questions
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        {answeredCount} of{" "}
                                        {totalQuestions}{" "}
                                        answered
                                    </p>
                                </div>

                                <Icon
                                    name="flag"
                                    size={17}
                                />
                            </div>

                            <div className="mt-5 grid grid-cols-5 gap-2">
                                {questions.map(
                                    (
                                        question,
                                        index
                                    ) => {
                                        const id =
                                            getQuestionId(
                                                question
                                            );

                                        const answered =
                                            Boolean(
                                                answers[
                                                    id
                                                ]
                                            );

                                        const active =
                                            index ===
                                            currentIndex;

                                        return (
                                            <button
                                                key={id}
                                                onClick={() =>
                                                    goToQuestion(
                                                        index
                                                    )
                                                }
                                                className={`relative flex aspect-square items-center justify-center rounded-xl text-xs font-medium transition ${
                                                    active
                                                        ? "bg-primary text-primary-foreground"
                                                        : answered
                                                        ? "bg-accent-soft text-primary"
                                                        : "bg-surface-secondary text-muted hover:text-foreground"
                                                }`}
                                            >
                                                {index +
                                                    1}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-6 space-y-2 border-t border-border pt-5 text-xs text-muted">
                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-primary" />
                                    Current
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-accent-soft ring-1 ring-primary/20" />
                                    Answered
                                </div>

                                <div className="flex items-center gap-2">
                                    <span className="h-2.5 w-2.5 rounded-full bg-surface-secondary" />
                                    Unanswered
                                </div>
                            </div>

                            <button
                                onClick={() =>
                                    setShowSubmitModal(
                                        true
                                    )
                                }
                                className="mt-6 flex h-10 w-full items-center justify-center rounded-xl border border-border text-sm font-medium text-foreground transition hover:bg-surface-secondary"
                            >
                                Finish Test
                            </button>
                        </div>
                    </aside>
                </div>

                <div className="mt-5 flex items-center justify-center gap-2 text-[11px] text-muted-light">
                    <Icon
                        name="shield"
                        size={13}
                    />
                    Your assessment attempt is protected.
                </div>
            </div>

            <AnimatePresence>
                {showQuestionMap && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm lg:hidden"
                        onClick={() =>
                            setShowQuestionMap(false)
                        }
                    >
                        <motion.div
                            initial={{
                                opacity: 0,
                                y: 20,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                y: 20,
                            }}
                            onClick={(event) =>
                                event.stopPropagation()
                            }
                            className="absolute bottom-0 left-0 right-0 rounded-t-[28px] border border-border bg-surface p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <h2 className="font-semibold text-foreground">
                                        Questions
                                    </h2>
                                    <p className="mt-1 text-xs text-muted">
                                        {answeredCount} of{" "}
                                        {totalQuestions}{" "}
                                        answered
                                    </p>
                                </div>

                                <button
                                    onClick={() =>
                                        setShowQuestionMap(
                                            false
                                        )
                                    }
                                    className="text-sm text-muted"
                                >
                                    Close
                                </button>
                            </div>

                            <div className="mt-5 grid grid-cols-5 gap-2">
                                {questions.map(
                                    (
                                        question,
                                        index
                                    ) => {
                                        const id =
                                            getQuestionId(
                                                question
                                            );

                                        const answered =
                                            Boolean(
                                                answers[
                                                    id
                                                ]
                                            );

                                        const active =
                                            index ===
                                            currentIndex;

                                        return (
                                            <button
                                                key={id}
                                                onClick={() =>
                                                    goToQuestion(
                                                        index
                                                    )
                                                }
                                                className={`aspect-square rounded-xl text-xs font-medium ${
                                                    active
                                                        ? "bg-primary text-primary-foreground"
                                                        : answered
                                                        ? "bg-accent-soft text-primary"
                                                        : "bg-surface-secondary text-muted"
                                                }`}
                                            >
                                                {index +
                                                    1}
                                            </button>
                                        );
                                    }
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSubmitModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-5 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{
                                opacity: 0,
                                scale: 0.97,
                                y: 10,
                            }}
                            animate={{
                                opacity: 1,
                                scale: 1,
                                y: 0,
                            }}
                            exit={{
                                opacity: 0,
                                scale: 0.97,
                                y: 10,
                            }}
                            className="w-full max-w-md rounded-[28px] border border-border bg-surface p-6 shadow-lg sm:p-7"
                        >
                            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                                <Icon
                                    name="flag"
                                    size={22}
                                />
                            </div>

                            <h2 className="mt-5 text-xl font-semibold text-foreground">
                                Submit your test?
                            </h2>

                            <p className="mt-2 text-sm leading-6 text-muted">
                                You have answered{" "}
                                <strong className="text-foreground">
                                    {answeredCount}
                                </strong>{" "}
                                of{" "}
                                <strong className="text-foreground">
                                    {totalQuestions}
                                </strong>{" "}
                                questions.
                            </p>

                            {answeredCount <
                                totalQuestions && (
                                <div className="mt-4 rounded-2xl bg-warning/10 p-4 text-xs leading-5 text-warning">
                                    You still have unanswered
                                    questions. You can submit
                                    them, but unanswered
                                    questions will not receive
                                    marks.
                                </div>
                            )}

                            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                                <button
                                    onClick={() =>
                                        setShowSubmitModal(
                                            false
                                        )
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="h-11 rounded-xl border border-border px-5 text-sm font-medium text-foreground transition hover:bg-surface-secondary"
                                >
                                    Keep working
                                </button>

                                <button
                                    onClick={() =>
                                        submitTest()
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="h-11 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground transition hover:bg-primary-hover disabled:opacity-60"
                                >
                                    {submitting
                                        ? "Submitting..."
                                        : "Submit Test"}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {error && (
                <div className="fixed bottom-5 left-1/2 z-[60] w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-2xl border border-danger/20 bg-surface p-4 shadow-lg">
                    <div className="flex items-start gap-3">
                        <div className="text-danger">
                            <Icon
                                name="alert"
                                size={18}
                            />
                        </div>

                        <p className="flex-1 text-xs leading-5 text-muted">
                            {error}
                        </p>

                        <button
                            onClick={() =>
                                setError("")
                            }
                            className="text-xs font-medium text-foreground"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </main>
    );
}