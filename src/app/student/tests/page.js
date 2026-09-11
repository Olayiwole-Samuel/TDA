"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
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
        test: (
            <svg {...common}>
                <path d="M8 3h8" />
                <path d="M9 3v4l-4 6.5A4 4 0 0 0 8.4 20h7.2A4 4 0 0 0 19 13.5L15 7V3" />
                <path d="M8 13h8" />
            </svg>
        ),
        exam: (
            <svg {...common}>
                <path d="M6 3h12a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                <path d="M8 7h8" />
                <path d="M8 11h2" />
                <path d="M14 11h2" />
                <path d="M8 15h2" />
                <path d="M14 15h2" />
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
                <path d="m5 12 4 4L19 6" />
            </svg>
        ),
        lock: (
            <svg {...common}>
                <rect x="5" y="10" width="14" height="10" rx="2" />
                <path d="M8 10V7a4 4 0 0 1 8 0v3" />
            </svg>
        ),
        play: (
            <svg {...common}>
                <path d="m9 7 8 5-8 5V7Z" />
            </svg>
        ),
        chevron: (
            <svg {...common}>
                <path d="m9 18 6-6-6-6" />
            </svg>
        ),
        refresh: (
            <svg {...common}>
                <path d="M20 11a8.1 8.1 0 0 0-15.5-2" />
                <path d="M4 5v4h4" />
                <path d="M4 13a8.1 8.1 0 0 0 15.5 2" />
                <path d="M20 19v-4h-4" />
            </svg>
        ),
        alert: (
            <svg {...common}>
                <path d="M10.3 4.1 2.8 17a2 2 0 0 0 1.7 3h15a2 2 0 0 0 1.7-3L13.7 4.1a2 2 0 0 0-3.4 0Z" />
                <path d="M12 9v4" />
                <path d="M12 17h.01" />
            </svg>
        ),
    };

    return icons[name] || null;
}

function normalizeAssessmentResponse(response) {
    if (!response) {
        return {
            tests: [],
            examinations: [],
        };
    }

    const data = Array.isArray(response) ? response[0] : response;

    if (!data || typeof data !== "object") {
        return {
            tests: [],
            examinations: [],
        };
    }

    const tests =
        data.tests ||
        data.class_tests ||
        data.assessments ||
        data.test_assessments ||
        [];

    const examinations =
        data.examinations ||
        data.exams ||
        data.final_examinations ||
        data.examination_assessments ||
        [];

    return {
        tests: Array.isArray(tests) ? tests : [],
        examinations: Array.isArray(examinations)
            ? examinations
            : [],
    };
}

function getAttemptStatus(item) {
    const attempt =
        item.attempt ||
        item.test_attempt ||
        item.exam_attempt ||
        item.attempts?.[0] ||
        null;

    if (!attempt) {
        return {
            type: "not_started",
            label: "Not started",
        };
    }

    const status = String(attempt.status || "").toLowerCase();

    if (status === "submitted") {
        return {
            type: "completed",
            label: "Completed",
            attempt,
        };
    }

    if (status === "abandoned") {
        return {
            type: "locked",
            label: "Attempt used",
            attempt,
        };
    }

    if (status === "in_progress") {
        return {
            type: "in_progress",
            label: "In progress",
            attempt,
        };
    }

    return {
        type: "not_started",
        label: "Not started",
        attempt,
    };
}

function getAssessmentTitle(item) {
    return (
        item.title ||
        item.test_title ||
        item.examination_title ||
        item.name ||
        "Assessment"
    );
}

function getDescription(item) {
    return (
        item.description ||
        item.test_description ||
        item.examination_description ||
        ""
    );
}

function getDuration(item) {
    const duration =
        item.duration_minutes ||
        item.duration ||
        item.test_duration_minutes;

    return duration ? `${duration} min` : null;
}

function getQuestionCount(item) {
    const count =
        item.question_count ||
        item.questions_count ||
        item.number_of_questions;

    return count ? `${count} questions` : null;
}

function getContext(item, type) {
    if (type === "exam") {
        return (
            item.level_name ||
            item.level?.name ||
            item.level ||
            "Final examination"
        );
    }

    return (
        item.class_title ||
        item.class_name ||
        item.class?.title ||
        item.topic_title ||
        item.topic_name ||
        item.topic?.title ||
        "Class assessment"
    );
}

function getScore(attempt) {
    if (!attempt) return null;

    const score =
        attempt.percentage ??
        attempt.score ??
        attempt.result?.percentage ??
        attempt.result?.score;

    if (score === null || score === undefined || score === "") {
        return null;
    }

    const numericScore = Number(score);

    if (Number.isNaN(numericScore)) {
        return null;
    }

    return Math.round(numericScore);
}

function AssessmentRow({ item, type }) {
    const status = getAttemptStatus(item);
    const title = getAssessmentTitle(item);
    const description = getDescription(item);
    const duration = getDuration(item);
    const questionCount = getQuestionCount(item);
    const context = getContext(item, type);

    const id =
        item.id ||
        item.test_id ||
        item.examination_id;

    const score = getScore(status.attempt);

    const href =
        type === "exam"
            ? `/student/examinations/${id}`
            : `/student/tests/${id}`;

    const isCompleted = status.type === "completed";
    const isInProgress = status.type === "in_progress";
    const isLocked = status.type === "locked";

    return (
        <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="group border-b border-border last:border-b-0"
        >
            <div className="flex items-center gap-4 px-1 py-5 sm:px-3">
                <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                        type === "exam"
                            ? "bg-primary text-primary-foreground"
                            : "bg-accent-soft text-primary"
                    }`}
                >
                    <Icon name={type === "exam" ? "exam" : "test"} size={19} />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate text-[15px] font-semibold text-foreground">
                            {title}
                        </h3>

                        {isCompleted && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2 py-1 text-[11px] font-medium text-success">
                                <Icon name="check" size={12} />
                                Completed
                            </span>
                        )}

                        {isInProgress && (
                            <span className="rounded-full bg-accent-soft px-2 py-1 text-[11px] font-medium text-primary">
                                In progress
                            </span>
                        )}
                    </div>

                    <p className="mt-1 text-sm text-muted">
                        {context}
                    </p>

                    <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-light">
                        {duration && (
                            <span className="inline-flex items-center gap-1.5">
                                <Icon name="clock" size={13} />
                                {duration}
                            </span>
                        )}

                        {questionCount && (
                            <span>{questionCount}</span>
                        )}
                    </div>

                    {description && (
                        <p className="mt-2 line-clamp-1 text-xs text-muted-light">
                            {description}
                        </p>
                    )}
                </div>

                <div className="hidden shrink-0 items-center gap-5 sm:flex">
                    {isCompleted && score !== null && (
                        <div className="text-right">
                            <p className="text-lg font-semibold text-foreground">
                                {score}%
                            </p>
                            <p className="text-[11px] text-muted-light">
                                Result
                            </p>
                        </div>
                    )}

                    {id && !isLocked ? (
                        <Link
                            href={href}
                            className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3.5 text-sm font-medium text-foreground transition hover:border-border-strong hover:bg-surface-secondary"
                        >
                            {isCompleted ? "View result" : isInProgress ? "Continue" : "Start"}
                            <Icon name="chevron" size={15} />
                        </Link>
                    ) : (
                        <div className="flex h-10 items-center gap-2 rounded-xl border border-border px-3.5 text-sm text-muted">
                            <Icon name="lock" size={15} />
                            Unavailable
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center justify-between pb-5 sm:hidden">
                <div>
                    {isCompleted && score !== null ? (
                        <span className="text-sm font-semibold text-foreground">
                            Result: {score}%
                        </span>
                    ) : (
                        <span className="text-xs text-muted">
                            {status.label}
                        </span>
                    )}
                </div>

                {id && !isLocked ? (
                    <Link
                        href={href}
                        className="flex h-9 items-center gap-2 rounded-xl bg-primary px-3.5 text-xs font-medium text-primary-foreground"
                    >
                        {isCompleted ? "View result" : isInProgress ? "Continue" : "Start"}
                        <Icon name="chevron" size={14} />
                    </Link>
                ) : (
                    <span className="flex items-center gap-1.5 text-xs text-muted">
                        <Icon name="lock" size={14} />
                        Attempt used
                    </span>
                )}
            </div>
        </motion.div>
    );
}

function EmptyState({ type }) {
    return (
        <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                <Icon name={type === "exam" ? "exam" : "test"} size={23} />
            </div>

            <h3 className="mt-5 text-base font-semibold text-foreground">
                No {type === "exam" ? "examinations" : "tests"} available
            </h3>

            <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
                {type === "exam"
                    ? "Final examinations will appear here when they are published for your level."
                    : "Class tests will appear here when your teachers publish them."}
            </p>
        </div>
    );
}

export default function StudentTestsPage() {
    const [assessments, setAssessments] = useState({
        tests: [],
        examinations: [],
    });
    const [activeTab, setActiveTab] = useState("tests");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadAssessments() {
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
                    throw new Error("You need to be signed in.");
                }

                const { data, error: rpcError } =
                    await supabase.rpc("get_my_assessments");

                if (rpcError) {
                    throw rpcError;
                }

                if (!mounted) return;

                setAssessments(
                    normalizeAssessmentResponse(data)
                );
            } catch (err) {
                if (!mounted) return;

                setError(
                    err?.message ||
                        "Unable to load your assessments."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadAssessments();

        return () => {
            mounted = false;
        };
    }, []);

    const currentItems = useMemo(() => {
        return activeTab === "tests"
            ? assessments.tests
            : assessments.examinations;
    }, [activeTab, assessments]);

    const totalAssessments =
        assessments.tests.length +
        assessments.examinations.length;

    const completedTests = assessments.tests.filter(
        (item) =>
            getAttemptStatus(item).type === "completed"
    ).length;

    const completedExams = assessments.examinations.filter(
        (item) =>
            getAttemptStatus(item).type === "completed"
    ).length;

    return (
        <main className="min-h-full bg-background">
            <div className="mx-auto w-full max-w-6xl px-5 py-8 sm:px-8 lg:px-10 lg:py-10">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <Link
                        href="/student/dashboard"
                        className="mb-8 inline-flex items-center gap-2 text-sm font-medium text-muted transition hover:text-foreground"
                    >
                        <Icon name="arrow" size={16} />
                        Dashboard
                    </Link>

                    <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                        <div>
                            <p className="text-sm font-medium text-primary">
                                Assessment
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                                Tests & Exams
                            </h1>

                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                                Complete your class assessments and final
                                examinations from one place.
                            </p>
                        </div>

                        {!loading && !error && (
                            <div className="flex items-center gap-6 border-t border-border pt-4 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
                                <div>
                                    <p className="text-2xl font-semibold text-foreground">
                                        {totalAssessments}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Available
                                    </p>
                                </div>

                                <div className="h-9 w-px bg-border" />

                                <div>
                                    <p className="text-2xl font-semibold text-foreground">
                                        {completedTests +
                                            completedExams}
                                    </p>
                                    <p className="mt-1 text-xs text-muted">
                                        Completed
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {error && (
                    <motion.div
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-8 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4"
                    >
                        <div className="mt-0.5 text-danger">
                            <Icon name="alert" size={18} />
                        </div>

                        <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                                Unable to load assessments
                            </p>
                            <p className="mt-1 text-xs leading-5 text-muted">
                                {error}
                            </p>
                        </div>

                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-1.5 text-xs font-medium text-primary"
                        >
                            <Icon name="refresh" size={14} />
                            Retry
                        </button>
                    </motion.div>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="mt-9 overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm"
                >
                    <div className="flex border-b border-border px-2 pt-2 sm:px-4">
                        <button
                            onClick={() => setActiveTab("tests")}
                            className={`relative flex min-h-12 items-center gap-2 px-4 text-sm font-medium transition ${
                                activeTab === "tests"
                                    ? "text-primary"
                                    : "text-muted hover:text-foreground"
                            }`}
                        >
                            <Icon name="test" size={17} />
                            Class Tests

                            {!loading &&
                                assessments.tests.length > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                                            activeTab === "tests"
                                                ? "bg-accent-soft text-primary"
                                                : "bg-surface-secondary text-muted"
                                        }`}
                                    >
                                        {assessments.tests.length}
                                    </span>
                                )}

                            {activeTab === "tests" && (
                                <motion.div
                                    layoutId="assessment-tab"
                                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>

                        <button
                            onClick={() => setActiveTab("exams")}
                            className={`relative flex min-h-12 items-center gap-2 px-4 text-sm font-medium transition ${
                                activeTab === "exams"
                                    ? "text-primary"
                                    : "text-muted hover:text-foreground"
                            }`}
                        >
                            <Icon name="exam" size={17} />
                            Examinations

                            {!loading &&
                                assessments.examinations.length > 0 && (
                                    <span
                                        className={`rounded-full px-2 py-0.5 text-[10px] ${
                                            activeTab === "exams"
                                                ? "bg-accent-soft text-primary"
                                                : "bg-surface-secondary text-muted"
                                        }`}
                                    >
                                        {assessments.examinations.length}
                                    </span>
                                )}

                            {activeTab === "exams" && (
                                <motion.div
                                    layoutId="assessment-tab"
                                    className="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-primary"
                                />
                            )}
                        </button>
                    </div>

                    <div className="px-4 sm:px-7">
                        {loading ? (
                            <div className="space-y-0">
                                {[1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className="flex items-center gap-4 border-b border-border py-5 last:border-0"
                                    >
                                        <div className="h-11 w-11 shrink-0 animate-pulse rounded-2xl bg-surface-secondary" />

                                        <div className="flex-1">
                                            <div className="h-4 w-1/2 animate-pulse rounded bg-surface-secondary" />
                                            <div className="mt-2 h-3 w-1/3 animate-pulse rounded bg-surface-secondary" />
                                            <div className="mt-3 h-3 w-1/4 animate-pulse rounded bg-surface-secondary" />
                                        </div>

                                        <div className="hidden h-9 w-24 animate-pulse rounded-xl bg-surface-secondary sm:block" />
                                    </div>
                                ))}
                            </div>
                        ) : currentItems.length === 0 ? (
                            <EmptyState
                                type={
                                    activeTab === "exams"
                                        ? "exam"
                                        : "test"
                                }
                            />
                        ) : (
                            <div>
                                {currentItems.map((item, index) => (
                                    <AssessmentRow
                                        key={
                                            item.id ||
                                            item.test_id ||
                                            item.examination_id ||
                                            index
                                        }
                                        item={item}
                                        type={
                                            activeTab === "exams"
                                                ? "exam"
                                                : "test"
                                        }
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </motion.section>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="mt-6 flex items-start gap-3 px-1"
                >
                    <div className="mt-0.5 text-muted-light">
                        <Icon name="clock" size={16} />
                    </div>

                    <p className="max-w-2xl text-xs leading-5 text-muted-light">
                        Class tests have a limited time and one attempt.
                        Make sure you are ready before starting an
                        assessment.
                    </p>
                </motion.div>
            </div>
        </main>
    );
}