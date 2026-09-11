"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Check,
    CheckCircle2,
    Clock3,
    Flag,
    Loader2,
    ShieldCheck,
    AlertTriangle,
    Send,
    X,
} from "lucide-react";

import { supabase } from "@/lib/supabase/client";

function unwrap(value) {
    if (value == null) return null;

    if (Array.isArray(value)) {
        if (value.length === 1) return unwrap(value[0]);
        return value;
    }

    if (typeof value === "object") {
        if (value.data !== undefined) return unwrap(value.data);
        if (value.result !== undefined) return unwrap(value.result);
        return value;
    }

    return value;
}

function normalizeExam(value) {
    const exam = unwrap(value);

    if (!exam || Array.isArray(exam)) return null;

    return {
        id: exam.id || exam.examination_id,
        title:
            exam.title ||
            exam.examination_title ||
            "Final Examination",
        description: exam.description || "",
        durationMinutes: Number(
            exam.duration_minutes ??
                exam.durationMinutes ??
                exam.duration ??
                60
        ),
        questionCount: Number(
            exam.question_count ??
                exam.questionCount ??
                exam.questions_count ??
                0
        ),
        passMark: Number(
            exam.pass_mark ??
                exam.passMark ??
                50
        ),
        levelName:
            exam.level_name ||
            exam.level ||
            exam.level_title ||
            "",
        scheduledStart:
            exam.scheduled_start ||
            exam.scheduledStart ||
            null,
        scheduledEnd:
            exam.scheduled_end ||
            exam.scheduledEnd ||
            null,
        isPublished:
            exam.is_published ??
            exam.isPublished ??
            true,
        isFinalized:
            exam.is_finalized ??
            exam.isFinalized ??
            false,
        attemptId:
            exam.attempt_id ||
            exam.exam_attempt_id ||
            null,
        attemptStatus:
            exam.attempt_status ||
            exam.status ||
            null,
        startedAt:
            exam.started_at ||
            exam.startedAt ||
            null,
        submittedAt:
            exam.submitted_at ||
            exam.submittedAt ||
            null,
        remainingSeconds:
            exam.remaining_seconds ??
            exam.remainingSeconds ??
            null,
    };
}

function normalizeQuestion(item, index) {
    const question = item?.question || item;

    return {
        id:
            question?.id ||
            question?.question_id,
        questionText:
            question?.question_text ||
            question?.questionText ||
            question?.text ||
            "",
        optionA:
            question?.option_a ||
            question?.optionA ||
            "",
        optionB:
            question?.option_b ||
            question?.optionB ||
            "",
        optionC:
            question?.option_c ||
            question?.optionC ||
            "",
        optionD:
            question?.option_d ||
            question?.optionD ||
            "",
        order:
            question?.question_order ??
            question?.questionOrder ??
            index + 1,
        points: Number(
            question?.points ?? 1
        ),
    };
}

function normalizeQuestions(value) {
    const unwrapped = unwrap(value);

    let list = [];

    if (Array.isArray(unwrapped)) {
        list = unwrapped;
    } else if (unwrapped?.questions) {
        list = Array.isArray(unwrapped.questions)
            ? unwrapped.questions
            : [];
    } else if (unwrapped?.items) {
        list = Array.isArray(unwrapped.items)
            ? unwrapped.items
            : [];
    } else if (unwrapped?.data) {
        list = Array.isArray(unwrapped.data)
            ? unwrapped.data
            : [];
    }

    return list
        .map(normalizeQuestion)
        .filter(
            (question) =>
                question.id &&
                question.questionText
        )
        .sort(
            (a, b) =>
                Number(a.order) -
                Number(b.order)
        );
}

function formatTime(seconds) {
    const safeSeconds = Math.max(
        0,
        Number(seconds) || 0
    );

    const hours = Math.floor(
        safeSeconds / 3600
    );

    const minutes = Math.floor(
        (safeSeconds % 3600) / 60
    );

    const remainingSeconds =
        safeSeconds % 60;

    if (hours > 0) {
        return `${String(hours).padStart(
            2,
            "0"
        )}:${String(minutes).padStart(
            2,
            "0"
        )}:${String(
            remainingSeconds
        ).padStart(2, "0")}`;
    }

    return `${String(minutes).padStart(
        2,
        "0"
    )}:${String(
        remainingSeconds
    ).padStart(2, "0")}`;
}

function getErrorMessage(
    error,
    fallback = "Something went wrong."
) {
    if (!error) return fallback;

    if (typeof error === "string") {
        return error;
    }

    return (
        error.message ||
        error.error_description ||
        error.details ||
        fallback
    );
}

export default function ExaminationStartPage() {
    const { examId } = useParams();
    const router = useRouter();

    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [answers, setAnswers] = useState({});
    const [currentQuestion, setCurrentQuestion] =
        useState(0);

    const [loading, setLoading] = useState(true);
    const [starting, setStarting] =
        useState(false);
    const [submitting, setSubmitting] =
        useState(false);

    const [started, setStarted] =
        useState(false);
    const [submitted, setSubmitted] =
        useState(false);

    const [attemptId, setAttemptId] =
        useState(null);

    const [timeLeft, setTimeLeft] =
        useState(0);

    const [showSubmitModal, setShowSubmitModal] =
        useState(false);
    const [showExitModal, setShowExitModal] =
        useState(false);

    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const hasAutoSubmitted =
        useRef(false);

    const submittingRef =
        useRef(false);

    const loadExamQuestions =
        useCallback(async () => {
            if (!examId) return;

            const {
                data,
                error: rpcError,
            } = await supabase.rpc(
                "get_exam_questions",
                {
                    p_examination_id:
                        examId,
                }
            );

            if (rpcError) {
                throw rpcError;
            }

            const normalizedQuestions =
                normalizeQuestions(data);

            if (
                !normalizedQuestions.length
            ) {
                throw new Error(
                    "No examination questions are currently available."
                );
            }

            setQuestions(
                normalizedQuestions
            );
        }, [examId]);

    const loadExam = useCallback(
        async () => {
            if (!examId) return;

            setLoading(true);
            setError("");

            try {
                const {
                    data: {
                        user,
                    },
                } =
                    await supabase.auth.getUser();

                if (!user) {
                    router.replace(
                        "/login"
                    );
                    return;
                }

                const {
                    data,
                    error: rpcError,
                } =
                    await supabase.rpc(
                        "get_my_assessments"
                    );

                if (rpcError) {
                    throw rpcError;
                }

                const raw = unwrap(data);

                let examinations = [];

                if (
                    Array.isArray(raw)
                ) {
                    examinations = raw;
                } else if (
                    raw?.examinations
                ) {
                    examinations =
                        Array.isArray(
                            raw.examinations
                        )
                            ? raw.examinations
                            : [];
                } else if (
                    raw?.assessment
                        ?.examinations
                ) {
                    examinations =
                        Array.isArray(
                            raw.assessment
                                .examinations
                        )
                            ? raw.assessment
                                  .examinations
                            : [];
                }

                const matched =
                    examinations.find(
                        (item) =>
                            String(
                                item?.id ||
                                    item?.examination_id
                            ) ===
                            String(examId)
                    );

                const normalized =
                    normalizeExam(
                        matched
                    );

                if (!normalized) {
                    throw new Error(
                        "Examination could not be found."
                    );
                }

                setExam(normalized);

                if (
                    normalized.attemptStatus ===
                        "submitted" ||
                    normalized.submittedAt
                ) {
                    setSubmitted(true);
                    return;
                }

                if (
                    normalized.attemptId
                ) {
                    setAttemptId(
                        normalized.attemptId
                    );
                }

                if (
                    normalized.startedAt &&
                    normalized.attemptStatus ===
                        "in_progress"
                ) {
                    setStarted(true);

                    const seconds =
                        normalized.remainingSeconds !=
                        null
                            ? Number(
                                  normalized.remainingSeconds
                              )
                            : normalized.durationMinutes *
                              60;

                    setTimeLeft(
                        Math.max(
                            0,
                            seconds
                        )
                    );

                    await loadExamQuestions();
                }
            } catch (err) {
                console.error(
                    "Load examination error:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "Unable to load this examination."
                    )
                );
            } finally {
                setLoading(false);
            }
        },
        [
            examId,
            router,
            loadExamQuestions,
        ]
    );

    useEffect(() => {
        loadExam();
    }, [loadExam]);

    const answeredCount =
        useMemo(() => {
            return questions.filter(
                (question) =>
                    Boolean(
                        answers[
                            question.id
                        ]
                    )
            ).length;
        }, [questions, answers]);

    const unansweredCount =
        Math.max(
            0,
            questions.length -
                answeredCount
        );

    const current =
        questions[currentQuestion];

    const progress =
        questions.length > 0
            ? ((currentQuestion + 1) /
                  questions.length) *
              100
            : 0;

    const isLowTime =
        timeLeft <= 300;

    const isCriticalTime =
        timeLeft <= 60;

    const setAnswer = (
        questionId,
        answer
    ) => {
        if (
            submitting ||
            submitted
        ) {
            return;
        }

        setAnswers(
            (previous) => ({
                ...previous,
                [questionId]:
                    answer,
            })
        );
    };

    const startExamination =
        async () => {
            if (
                !examId ||
                starting
            ) {
                return;
            }

            setStarting(true);
            setError("");

            try {
                const {
                    data,
                    error: rpcError,
                } =
                    await supabase.rpc(
                        "start_exam_attempt",
                        {
                            p_examination_id:
                                examId,
                        }
                    );

                if (rpcError) {
                    throw rpcError;
                }

                const payload =
                    unwrap(data);

                if (
                    !payload ||
                    typeof payload !==
                        "object"
                ) {
                    throw new Error(
                        "The examination attempt could not be created."
                    );
                }

                const returnedAttemptId =
                    payload.attempt_id ||
                    payload.exam_attempt_id ||
                    payload.id ||
                    null;

                const returnedDuration =
                    Number(
                        payload.duration_minutes ??
                            payload.durationMinutes ??
                            exam?.durationMinutes ??
                            60
                    );

                const returnedRemaining =
                    payload.remaining_seconds ??
                    payload.remainingSeconds ??
                    returnedDuration * 60;

                if (
                    returnedAttemptId
                ) {
                    setAttemptId(
                        returnedAttemptId
                    );
                }

                setTimeLeft(
                    Math.max(
                        0,
                        Number(
                            returnedRemaining
                        )
                    )
                );

                setStarted(true);

                await loadExamQuestions();

                setCurrentQuestion(0);
            } catch (err) {
                console.error(
                    "Start examination error:",
                    err
                );

                setError(
                    getErrorMessage(
                        err,
                        "The examination could not be started."
                    )
                );
            } finally {
                setStarting(false);
            }
        };

    const submitExamination =
        useCallback(
            async (
                autoSubmit = false
            ) => {
                if (
                    !examId ||
                    submittingRef.current ||
                    submitted
                ) {
                    return;
                }

                submittingRef.current =
                    true;

                setSubmitting(true);
                setError("");

                try {
                    const payload =
                        questions.map(
                            (
                                question
                            ) => ({
                                question_id:
                                    question.id,
                                selected_answer:
                                    answers[
                                        question
                                            .id
                                    ] ||
                                    null,
                            })
                        );

                    const {
                        data,
                        error: rpcError,
                    } =
                        await supabase.rpc(
                            "submit_exam_attempt",
                            {
                                p_examination_id:
                                    examId,
                                p_answers:
                                    payload,
                            }
                        );

                    if (
                        rpcError
                    ) {
                        throw rpcError;
                    }

                    const submissionResult =
                        unwrap(data);

                    setResult(
                        submissionResult
                    );

                    setSubmitted(true);
                    setStarted(false);
                    setShowSubmitModal(
                        false
                    );

                    if (autoSubmit) {
                        hasAutoSubmitted.current =
                            true;
                    }
                } catch (err) {
                    console.error(
                        "Submit examination error:",
                        err
                    );

                    setError(
                        getErrorMessage(
                            err,
                            "Your examination could not be submitted."
                        )
                    );
                } finally {
                    submittingRef.current =
                        false;

                    setSubmitting(false);
                }
            },
            [
                answers,
                examId,
                questions,
                submitted,
            ]
        );

    useEffect(() => {
        if (
            !started ||
            submitted
        ) {
            return;
        }

        const timer =
            window.setInterval(() => {
                setTimeLeft(
                    (previous) => {
                        if (
                            previous <=
                            1
                        ) {
                            window.clearInterval(
                                timer
                            );

                            if (
                                !hasAutoSubmitted.current &&
                                !submittingRef.current
                            ) {
                                window.setTimeout(
                                    () => {
                                        submitExamination(
                                            true
                                        );
                                    },
                                    0
                                );
                            }

                            return 0;
                        }

                        return (
                            previous -
                            1
                        );
                    }
                );
            }, 1000);

        return () =>
            window.clearInterval(
                timer
            );
    }, [
        started,
        submitted,
        submitExamination,
    ]);

    useEffect(() => {
        const handleBeforeUnload =
            (event) => {
                if (
                    !started ||
                    submitted
                ) {
                    return;
                }

                event.preventDefault();

                event.returnValue =
                    "Your examination is currently in progress.";
            };

        window.addEventListener(
            "beforeunload",
            handleBeforeUnload
        );

        return () => {
            window.removeEventListener(
                "beforeunload",
                handleBeforeUnload
            );
        };
    }, [
        started,
        submitted,
    ]);

    const goToQuestion = (
        index
    ) => {
        if (
            index < 0 ||
            index >=
                questions.length
        ) {
            return;
        }

        setCurrentQuestion(
            index
        );

        window.scrollTo({
            top: 0,
            behavior: "smooth",
        });
    };

    const nextQuestion = () => {
        if (
            currentQuestion <
            questions.length - 1
        ) {
            goToQuestion(
                currentQuestion + 1
            );
        }
    };

    const previousQuestion =
        () => {
            if (
                currentQuestion >
                0
            ) {
                goToQuestion(
                    currentQuestion -
                        1
                );
            }
        };

    const confirmExit = () => {
        setShowExitModal(
            false
        );

        router.push(
            `/student/examinations/${examId}`
        );
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
                <div className="text-center">
                    <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                        <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                    </div>

                    <p className="text-sm font-semibold">
                        Preparing examination
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                        Please wait...
                    </p>
                </div>
            </div>
        );
    }

    if (
        error &&
        !exam
    ) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
                        <AlertTriangle className="h-7 w-7 text-[var(--danger)]" />
                    </div>

                    <h1 className="text-xl font-semibold">
                        Examination unavailable
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                        {error}
                    </p>

                    <Link
                        href={`/student/examinations/${examId}`}
                        className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Back to Examination
                    </Link>
                </div>
            </div>
        );
    }

    if (!exam) {
        return null;
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center justify-center px-5 py-12">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        className="w-full text-center"
                    >
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-[28px] bg-[var(--success)]/10">
                            <CheckCircle2 className="h-10 w-10 text-[var(--success)]" />
                        </div>

                        <p className="mt-7 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                            Examination submitted
                        </p>

                        <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
                            Your examination is complete.
                        </h1>

                        <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-[var(--muted)]">
                            Your answers have been
                            submitted successfully.
                            Your result is now recorded
                            by the academy.
                        </p>

                        {result &&
                            typeof result ===
                                "object" && (
                                <div className="mx-auto mt-8 grid max-w-lg grid-cols-2 gap-3">
                                    {result.percentage !=
                                        null && (
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                            <p className="text-xs text-[var(--muted)]">
                                                Score
                                            </p>

                                            <p className="mt-2 text-2xl font-semibold">
                                                {Number(
                                                    result.percentage
                                                ).toFixed(
                                                    1
                                                )}
                                                %
                                            </p>
                                        </div>
                                    )}

                                    {result.passed !=
                                        null && (
                                        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
                                            <p className="text-xs text-[var(--muted)]">
                                                Result
                                            </p>

                                            <p
                                                className={`mt-2 text-2xl font-semibold ${
                                                    result.passed
                                                        ? "text-[var(--success)]"
                                                        : "text-[var(--danger)]"
                                                }`}
                                            >
                                                {result.passed
                                                    ? "Passed"
                                                    : "Not Passed"}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                        <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                            <Link
                                href="/student/results"
                                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                            >
                                View Results
                                <ArrowRight className="h-4 w-4" />
                            </Link>

                            <Link
                                href="/student/examinations"
                                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-3 text-sm font-semibold"
                            >
                                Back to Examinations
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        );
    }

    if (!started) {
        return (
            <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
                <header className="border-b border-[var(--border)] bg-[var(--surface)]">
                    <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
                        <Link
                            href={`/student/examinations/${examId}`}
                            className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
                        >
                            <ArrowLeft className="h-4 w-4" />
                            Back
                        </Link>

                        <div className="flex items-center gap-2 text-xs font-medium text-[var(--muted)]">
                            <ShieldCheck className="h-4 w-4 text-[var(--primary)]" />
                            Secure Examination
                        </div>
                    </div>
                </header>

                <main className="mx-auto max-w-4xl px-5 py-10 sm:py-16">
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: 20,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                    >
                        <div className="mb-8">
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                                {exam.levelName ||
                                    "Academy Examination"}
                            </p>

                            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-5xl">
                                {exam.title}
                            </h1>

                            {exam.description && (
                                <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                                    {
                                        exam.description
                                    }
                                </p>
                            )}
                        </div>

                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                            <InfoCard
                                icon={
                                    Clock3
                                }
                                label="Duration"
                                value={`${exam.durationMinutes} min`}
                            />

                            <InfoCard
                                icon={
                                    Flag
                                }
                                label="Questions"
                                value={
                                    exam.questionCount ||
                                    "Configured"
                                }
                            />

                            <InfoCard
                                icon={
                                    ShieldCheck
                                }
                                label="Attempts"
                                value="1 attempt"
                            />

                            <InfoCard
                                icon={
                                    CheckCircle2
                                }
                                label="Pass mark"
                                value={`${exam.passMark}%`}
                            />
                        </div>

                        <div className="mt-6 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-8">
                            <div className="flex items-start gap-4">
                                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                                    <AlertTriangle className="h-5 w-5 text-[var(--primary)]" />
                                </div>

                                <div>
                                    <h2 className="text-base font-semibold">
                                        Before you begin
                                    </h2>

                                    <p className="mt-1 text-sm leading-6 text-[var(--muted)]">
                                        Make sure you are
                                        ready before
                                        starting. Your
                                        attempt is limited
                                        and cannot simply
                                        be restarted.
                                    </p>
                                </div>
                            </div>

                            <div className="mt-7 space-y-4">
                                <Rule text="You have one attempt for this examination." />
                                <Rule text={`You have ${exam.durationMinutes} minutes to complete it.`} />
                                <Rule text="Your answers are submitted through the academy system." />
                                <Rule text="The examination may submit automatically when your time expires." />
                                <Rule text="Do not close or leave the examination while it is in progress." />
                                <Rule text="Make sure your internet connection is stable before beginning." />
                            </div>
                        </div>

                        {error && (
                            <div className="mt-5 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
                                {error}
                            </div>
                        )}

                        <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={
                                    startExamination
                                }
                                disabled={
                                    starting
                                }
                                className="inline-flex min-h-13 flex-1 items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[var(--primary)]/15 transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                {starting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Starting...
                                    </>
                                ) : (
                                    <>
                                        Start Examination
                                        <ArrowRight className="h-4 w-4" />
                                    </>
                                )}
                            </button>

                            <Link
                                href={`/student/examinations/${examId}`}
                                className="inline-flex min-h-13 items-center justify-center rounded-2xl border border-[var(--border-strong)] bg-[var(--surface)] px-6 py-4 text-sm font-semibold"
                            >
                                Not Yet
                            </Link>
                        </div>
                    </motion.div>
                </main>
            </div>
        );
    }

    if (!questions.length) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
                <div className="max-w-md text-center">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin text-[var(--primary)]" />

                    <h1 className="mt-5 text-xl font-semibold">
                        Loading questions
                    </h1>

                    <p className="mt-2 text-sm text-[var(--muted)]">
                        Preparing your examination.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-[var(--surface)]/95 backdrop-blur-xl">
                <div className="mx-auto max-w-7xl px-4 sm:px-6">
                    <div className="flex min-h-18 items-center justify-between gap-4">
                        <div className="min-w-0">
                            <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">
                                {exam.levelName ||
                                    "Examination"}
                            </p>

                            <h1 className="mt-1 truncate text-sm font-semibold sm:text-base">
                                {exam.title}
                            </h1>
                        </div>

                        <div
                            className={`flex shrink-0 items-center gap-2 rounded-2xl border px-3 py-2 sm:px-4 ${
                                isCriticalTime
                                    ? "border-[var(--danger)]/30 bg-[var(--danger)]/10 text-[var(--danger)]"
                                    : isLowTime
                                      ? "border-[var(--warning)]/30 bg-[var(--warning)]/10 text-[var(--warning)]"
                                      : "border-[var(--border)] bg-[var(--surface-secondary)]"
                            }`}
                        >
                            <Clock3 className="h-4 w-4" />

                            <div className="text-right">
                                <p className="hidden text-[10px] font-medium uppercase tracking-wider opacity-70 sm:block">
                                    Time remaining
                                </p>

                                <p className="font-mono text-sm font-bold tabular-nums sm:text-base">
                                    {formatTime(
                                        timeLeft
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="h-1 overflow-hidden bg-[var(--surface-secondary)]">
                        <motion.div
                            className="h-full bg-[var(--primary)]"
                            animate={{
                                width: `${progress}%`,
                            }}
                            transition={{
                                duration: 0.25,
                            }}
                        />
                    </div>
                </div>
            </header>

            <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
                <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
                    <section>
                        <div className="mb-5 flex items-center justify-between gap-4">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                    Question
                                </p>

                                <p className="mt-1 text-lg font-semibold">
                                    {currentQuestion +
                                        1}{" "}
                                    <span className="text-[var(--muted)]">
                                        /{" "}
                                        {
                                            questions.length
                                        }
                                    </span>
                                </p>
                            </div>

                            <div className="text-right">
                                <p className="text-xs text-[var(--muted)]">
                                    Answered
                                </p>

                                <p className="mt-1 text-sm font-semibold">
                                    {
                                        answeredCount
                                    }{" "}
                                    /{" "}
                                    {
                                        questions.length
                                    }
                                </p>
                            </div>
                        </div>

                        <AnimatePresence mode="wait">
                            <motion.div
                                key={
                                    current?.id
                                }
                                initial={{
                                    opacity: 0,
                                    x: 12,
                                }}
                                animate={{
                                    opacity: 1,
                                    x: 0,
                                }}
                                exit={{
                                    opacity: 0,
                                    x: -12,
                                }}
                                transition={{
                                    duration: 0.18,
                                }}
                                className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5 shadow-[var(--shadow-sm)] sm:p-8"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-sm font-bold text-[var(--primary)]">
                                        {
                                            currentQuestion +
                                            1
                                        }
                                    </span>

                                    <span className="text-xs text-[var(--muted)]">
                                        {
                                            current.points
                                        }{" "}
                                        {current.points ===
                                        1
                                            ? "point"
                                            : "points"}
                                    </span>
                                </div>

                                <h2 className="mt-7 text-xl font-semibold leading-8 tracking-tight sm:text-2xl sm:leading-9">
                                    {
                                        current.questionText
                                    }
                                </h2>

                                <div className="mt-8 space-y-3">
                                    <AnswerOption
                                        label="A"
                                        text={
                                            current.optionA
                                        }
                                        selected={
                                            answers[
                                                current
                                                    .id
                                            ] ===
                                            "a"
                                        }
                                        onClick={() =>
                                            setAnswer(
                                                current.id,
                                                "a"
                                            )
                                        }
                                    />

                                    <AnswerOption
                                        label="B"
                                        text={
                                            current.optionB
                                        }
                                        selected={
                                            answers[
                                                current
                                                    .id
                                            ] ===
                                            "b"
                                        }
                                        onClick={() =>
                                            setAnswer(
                                                current.id,
                                                "b"
                                            )
                                        }
                                    />

                                    <AnswerOption
                                        label="C"
                                        text={
                                            current.optionC
                                        }
                                        selected={
                                            answers[
                                                current
                                                    .id
                                            ] ===
                                            "c"
                                        }
                                        onClick={() =>
                                            setAnswer(
                                                current.id,
                                                "c"
                                            )
                                        }
                                    />

                                    <AnswerOption
                                        label="D"
                                        text={
                                            current.optionD
                                        }
                                        selected={
                                            answers[
                                                current
                                                    .id
                                            ] ===
                                            "d"
                                        }
                                        onClick={() =>
                                            setAnswer(
                                                current.id,
                                                "d"
                                            )
                                        }
                                    />
                                </div>
                            </motion.div>
                        </AnimatePresence>

                        {error && (
                            <div className="mt-5 rounded-2xl border border-[var(--danger)]/20 bg-[var(--danger)]/10 p-4 text-sm text-[var(--danger)]">
                                {error}
                            </div>
                        )}

                        <div className="mt-5 flex items-center justify-between gap-3">
                            <button
                                type="button"
                                onClick={
                                    previousQuestion
                                }
                                disabled={
                                    currentQuestion ===
                                    0
                                }
                                className="inline-flex items-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-35"
                            >
                                <ArrowLeft className="h-4 w-4" />

                                <span className="hidden sm:inline">
                                    Previous
                                </span>
                            </button>

                            {currentQuestion <
                            questions.length -
                                1 ? (
                                <button
                                    type="button"
                                    onClick={
                                        nextQuestion
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
                                >
                                    <span className="hidden sm:inline">
                                        Next Question
                                    </span>

                                    <span className="sm:hidden">
                                        Next
                                    </span>

                                    <ArrowRight className="h-4 w-4" />
                                </button>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSubmitModal(
                                            true
                                        )
                                    }
                                    disabled={
                                        submitting
                                    }
                                    className="inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:opacity-60"
                                >
                                    <Send className="h-4 w-4" />
                                    Submit Examination
                                </button>
                            )}
                        </div>
                    </section>

                    <aside className="hidden lg:block">
                        <div className="sticky top-28 rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                    Questions
                                </p>

                                <div className="mt-2 flex items-end justify-between">
                                    <p className="text-lg font-semibold">
                                        {
                                            answeredCount
                                        }
                                        <span className="text-[var(--muted)]">
                                            {" "}
                                            /{" "}
                                            {
                                                questions.length
                                            }
                                        </span>
                                    </p>

                                    <p className="text-xs text-[var(--muted)]">
                                        {
                                            unansweredCount
                                        }{" "}
                                        unanswered
                                    </p>
                                </div>
                            </div>

                            <div className="mt-5 grid grid-cols-5 gap-2">
                                {questions.map(
                                    (
                                        question,
                                        index
                                    ) => {
                                        const answered =
                                            Boolean(
                                                answers[
                                                    question
                                                        .id
                                                ]
                                            );

                                        const active =
                                            index ===
                                            currentQuestion;

                                        return (
                                            <button
                                                key={
                                                    question.id
                                                }
                                                type="button"
                                                onClick={() =>
                                                    goToQuestion(
                                                        index
                                                    )
                                                }
                                                className={`relative flex h-10 items-center justify-center rounded-xl text-xs font-semibold transition ${
                                                    active
                                                        ? "bg-[var(--primary)] text-white"
                                                        : answered
                                                          ? "bg-[var(--accent-soft)] text-[var(--primary)]"
                                                          : "bg-[var(--surface-secondary)] text-[var(--muted)] hover:text-[var(--foreground)]"
                                                }`}
                                            >
                                                {
                                                    index +
                                                    1
                                                }

                                                {answered &&
                                                    !active && (
                                                        <span className="absolute right-1 top-1">
                                                            <Check className="h-2.5 w-2.5" />
                                                        </span>
                                                    )}
                                            </button>
                                        );
                                    }
                                )}
                            </div>

                            <div className="mt-6 border-t border-[var(--border)] pt-5">
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowSubmitModal(
                                            true
                                        )
                                    }
                                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold transition hover:bg-[var(--surface-secondary)]"
                                >
                                    <Send className="h-4 w-4" />
                                    Submit
                                </button>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowExitModal(
                                            true
                                        )
                                    }
                                    className="mt-3 flex w-full items-center justify-center gap-2 px-4 py-2 text-xs font-medium text-[var(--muted)] transition hover:text-[var(--danger)]"
                                >
                                    <X className="h-3.5 w-3.5" />
                                    Leave examination
                                </button>
                            </div>
                        </div>
                    </aside>
                </div>

                <div className="mt-6 lg:hidden">
                    <div className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                                    Question map
                                </p>

                                <p className="mt-1 text-sm text-[var(--muted)]">
                                    {
                                        answeredCount
                                    }{" "}
                                    answered ·{" "}
                                    {
                                        unansweredCount
                                    }{" "}
                                    remaining
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowSubmitModal(
                                        true
                                    )
                                }
                                className="rounded-xl bg-[var(--primary)] px-3 py-2 text-xs font-semibold text-white"
                            >
                                Submit
                            </button>
                        </div>

                        <div className="mt-4 grid grid-cols-7 gap-2">
                            {questions.map(
                                (
                                    question,
                                    index
                                ) => {
                                    const answered =
                                        Boolean(
                                            answers[
                                                question
                                                    .id
                                            ]
                                        );

                                    const active =
                                        index ===
                                        currentQuestion;

                                    return (
                                        <button
                                            key={
                                                question.id
                                            }
                                            type="button"
                                            onClick={() =>
                                                goToQuestion(
                                                    index
                                                )
                                            }
                                            className={`h-9 rounded-lg text-xs font-semibold ${
                                                active
                                                    ? "bg-[var(--primary)] text-white"
                                                    : answered
                                                      ? "bg-[var(--accent-soft)] text-[var(--primary)]"
                                                      : "bg-[var(--surface-secondary)] text-[var(--muted)]"
                                            }`}
                                        >
                                            {
                                                index +
                                                1
                                            }
                                        </button>
                                    );
                                }
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showSubmitModal && (
                    <Modal
                        onClose={() =>
                            !submitting &&
                            setShowSubmitModal(
                                false
                            )
                        }
                        disabled={
                            submitting
                        }
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                            <Send className="h-5 w-5 text-[var(--primary)]" />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold">
                            Submit examination?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            You have answered{" "}
                            <strong>
                                {
                                    answeredCount
                                }
                            </strong>{" "}
                            of{" "}
                            <strong>
                                {
                                    questions.length
                                }
                            </strong>{" "}
                            questions.
                        </p>

                        {unansweredCount >
                            0 && (
                            <div className="mt-4 rounded-2xl border border-[var(--warning)]/20 bg-[var(--warning)]/10 p-4 text-sm text-[var(--warning)]">
                                You still have{" "}
                                <strong>
                                    {
                                        unansweredCount
                                    }
                                </strong>{" "}
                                unanswered
                                question
                                {unansweredCount ===
                                1
                                    ? ""
                                    : "s"}
                                .
                            </div>
                        )}

                        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowSubmitModal(
                                        false
                                    )
                                }
                                disabled={
                                    submitting
                                }
                                className="flex-1 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold disabled:opacity-50"
                            >
                                Continue
                            </button>

                            <button
                                type="button"
                                onClick={() =>
                                    submitExamination(
                                        false
                                    )
                                }
                                disabled={
                                    submitting
                                }
                                className="flex-1 rounded-xl bg-[var(--primary)] px-4 py-3 text-sm font-semibold text-white disabled:opacity-60"
                            >
                                {submitting ? (
                                    <span className="inline-flex items-center gap-2">
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Submitting...
                                    </span>
                                ) : (
                                    "Submit Now"
                                )}
                            </button>
                        </div>
                    </Modal>
                )}

                {showExitModal && (
                    <Modal
                        onClose={() =>
                            setShowExitModal(
                                false
                            )
                        }
                    >
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
                            <AlertTriangle className="h-5 w-5 text-[var(--danger)]" />
                        </div>

                        <h2 className="mt-5 text-xl font-semibold">
                            Leave examination?
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            Your examination is
                            currently in progress.
                            Leaving this page may
                            interrupt your attempt.
                        </p>

                        <div className="mt-6 flex gap-3">
                            <button
                                type="button"
                                onClick={() =>
                                    setShowExitModal(
                                        false
                                    )
                                }
                                className="flex-1 rounded-xl border border-[var(--border-strong)] px-4 py-3 text-sm font-semibold"
                            >
                                Stay
                            </button>

                            <button
                                type="button"
                                onClick={
                                    confirmExit
                                }
                                className="flex-1 rounded-xl bg-[var(--danger)] px-4 py-3 text-sm font-semibold text-white"
                            >
                                Leave
                            </button>
                        </div>
                    </Modal>
                )}
            </AnimatePresence>
        </div>
    );
}

function Modal({
    children,
    onClose,
    disabled = false,
}) {
    return (
        <motion.div
            initial={{
                opacity: 0,
            }}
            animate={{
                opacity: 1,
            }}
            exit={{
                opacity: 0,
            }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 px-4 py-6 backdrop-blur-sm"
            onMouseDown={(event) => {
                if (
                    event.target ===
                        event.currentTarget &&
                    !disabled
                ) {
                    onClose();
                }
            }}
        >
            <motion.div
                initial={{
                    opacity: 0,
                    y: 18,
                    scale: 0.98,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                    scale: 1,
                }}
                exit={{
                    opacity: 0,
                    y: 10,
                    scale: 0.98,
                }}
                transition={{
                    duration: 0.2,
                }}
                className="relative w-full max-w-md rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-6 text-[var(--foreground)] shadow-2xl sm:p-7"
                onMouseDown={(event) =>
                    event.stopPropagation()
                }
            >
                {!disabled && (
                    <button
                        type="button"
                        onClick={onClose}
                        className="absolute right-5 top-5 flex h-9 w-9 items-center justify-center rounded-xl text-[var(--muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
                        aria-label="Close"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}

                {children}
            </motion.div>
        </motion.div>
    );
}

function InfoCard({
    icon: Icon,
    label,
    value,
}) {
    return (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-4">
            <Icon className="h-4 w-4 text-[var(--primary)]" />

            <p className="mt-4 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold">
                {value}
            </p>
        </div>
    );
}

function Rule({ text }) {
    return (
        <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent-soft)]">
                <Check className="h-3 w-3 text-[var(--primary)]" />
            </div>

            <p className="text-sm leading-6 text-[var(--muted)]">
                {text}
            </p>
        </div>
    );
}

function AnswerOption({
    label,
    text,
    selected,
    onClick,
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition sm:p-5 ${
                selected
                    ? "border-[var(--primary)] bg-[var(--accent-soft)]"
                    : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-secondary)]"
            }`}
        >
            <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold transition ${
                    selected
                        ? "bg-[var(--primary)] text-white"
                        : "bg-[var(--surface-secondary)] text-[var(--muted)] group-hover:text-[var(--foreground)]"
                }`}
            >
                {label}
            </span>

            <span
                className={`pt-1 text-sm leading-6 sm:text-base ${
                    selected
                        ? "font-medium"
                        : "text-[var(--muted)]"
                }`}
            >
                {text}
            </span>

            {selected && (
                <Check className="ml-auto mt-1 h-5 w-5 shrink-0 text-[var(--primary)]" />
            )}
        </button>
    );
}