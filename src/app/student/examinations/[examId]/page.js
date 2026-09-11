"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

function normalizeAssessments(data) {
    if (Array.isArray(data)) return data;

    if (!data || typeof data !== "object") {
        return [];
    }

    if (Array.isArray(data.examinations)) {
        return data.examinations;
    }

    if (Array.isArray(data.exams)) {
        return data.exams;
    }

    if (Array.isArray(data.assessments)) {
        return data.assessments.filter(
            (item) =>
                item.type === "examination" ||
                item.assessment_type === "examination" ||
                item.examination_id ||
                item.exam_id
        );
    }

    return [];
}

function getId(exam) {
    return exam.examination_id || exam.exam_id || exam.id;
}

function getTitle(exam) {
    return (
        exam.title ||
        exam.examination_title ||
        exam.exam_title ||
        "Examination"
    );
}

function getDescription(exam) {
    return (
        exam.description ||
        exam.examination_description ||
        exam.exam_description ||
        "This examination assesses your understanding of the academic material covered in your level."
    );
}

function getLevel(exam) {
    if (exam.level_name) return exam.level_name;

    if (exam.level_number) {
        return `${exam.level_number} Level`;
    }

    if (exam.level?.name) {
        return exam.level.name;
    }

    if (exam.level?.level_number) {
        return `${exam.level.level_number} Level`;
    }

    return "Academy Examination";
}

function getDuration(exam) {
    return (
        exam.duration_minutes ||
        exam.examination_duration_minutes ||
        exam.exam_duration_minutes ||
        60
    );
}

function getQuestionCount(exam) {
    return (
        exam.question_count ||
        exam.examination_question_count ||
        exam.exam_question_count ||
        null
    );
}

function getPassMark(exam) {
    return (
        exam.pass_mark ||
        exam.passing_mark ||
        exam.examination_pass_mark ||
        50
    );
}

function getAttempt(exam) {
    return exam.attempt || exam.attempt_data || exam.my_attempt || null;
}

function getStatus(exam) {
    const attempt = getAttempt(exam);

    if (!attempt) {
        return "available";
    }

    if (
        attempt.status === "submitted" ||
        attempt.submitted_at ||
        attempt.completed_at
    ) {
        return "completed";
    }

    if (attempt.status === "in_progress") {
        return "in_progress";
    }

    if (attempt.status === "abandoned") {
        return "abandoned";
    }

    return "available";
}

function getSchedule(exam) {
    return {
        start:
            exam.scheduled_start ||
            exam.start_time ||
            exam.starts_at ||
            null,

        end:
            exam.scheduled_end ||
            exam.end_time ||
            exam.ends_at ||
            null,
    };
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {
        weekday: "short",
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function getScheduleState(exam) {
    const { start, end } = getSchedule(exam);
    const now = new Date();

    if (start) {
        const startDate = new Date(start);

        if (!Number.isNaN(startDate.getTime()) && now < startDate) {
            return "upcoming";
        }
    }

    if (end) {
        const endDate = new Date(end);

        if (!Number.isNaN(endDate.getTime()) && now > endDate) {
            return "closed";
        }
    }

    return "available";
}

function ClipboardIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="h-6 w-6"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 5.25h6M9.75 3.75h4.5A1.5 1.5 0 0 1 15.75 5.25v.75h1.5A1.5 1.5 0 0 1 18.75 7.5v12A1.5 1.5 0 0 1 17.25 21h-10.5a1.5 1.5 0 0 1-1.5-1.5v-12A1.5 1.5 0 0 1 6.75 6h1.5v-.75a1.5 1.5 0 0 1 1.5-1.5Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8.25 10.5h7.5M8.25 14h7.5M8.25 17.5h4.5"
            />
        </svg>
    );
}

function ClockIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <circle cx="12" cy="12" r="8.25" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 7.5v4.75l3 1.75"
            />
        </svg>
    );
}

function QuestionsIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.75 4.5h10.5A2.25 2.25 0 0 1 19.5 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25H6.75A2.25 2.25 0 0 1 4.5 17.25V6.75A2.25 2.25 0 0 1 6.75 4.5Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M8 9h8M8 12h8M8 15h5"
            />
        </svg>
    );
}

function PassIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <circle cx="12" cy="12" r="8.5" />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m8.5 12 2.25 2.25L15.75 9"
            />
        </svg>
    );
}

function ShieldIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3.5 19 6v5.5c0 4.5-2.85 7.55-7 9-4.15-1.45-7-4.5-7-9V6l7-2.5Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m9.5 12 1.65 1.65L14.75 10"
            />
        </svg>
    );
}

function ArrowLeftIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M19 12H5M11 18l-6-6 6-6"
            />
        </svg>
    );
}

function ArrowRightIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            className="h-4 w-4"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 12h14M13 6l6 6-6 6"
            />
        </svg>
    );
}

function AlertIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-5 w-5"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 3.5 21 20H3L12 3.5Z"
            />
            <path
                strokeLinecap="round"
                d="M12 9v4"
            />
            <path
                strokeLinecap="round"
                d="M12 16.5h.01"
            />
        </svg>
    );
}

export default function StudentExaminationPage() {
    const params = useParams();
    const router = useRouter();

    const examId = params?.examId;

    const [exam, setExam] = useState(null);
    const [loading, setLoading] = useState(true);
    const [starting, setStarting] = useState(false);
    const [error, setError] = useState("");

    const loadExam = useCallback(async () => {
        if (!examId) return;

        try {
            setLoading(true);
            setError("");

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

            const { data, error: rpcError } = await supabase.rpc(
                "get_my_assessments"
            );

            if (rpcError) {
                throw rpcError;
            }

            const assessments = normalizeAssessments(data);

            const found = assessments.find(
                (item) => String(getId(item)) === String(examId)
            );

            if (!found) {
                throw new Error(
                    "This examination could not be found or is not available to you."
                );
            }

            setExam(found);
        } catch (err) {
            console.error("Failed to load examination:", err);

            setError(
                err?.message ||
                    "Unable to load this examination right now."
            );
        } finally {
            setLoading(false);
        }
    }, [examId, router]);

    useEffect(() => {
        loadExam();
    }, [loadExam]);

    const status = useMemo(
        () => (exam ? getStatus(exam) : null),
        [exam]
    );

    const scheduleState = useMemo(
        () => (exam ? getScheduleState(exam) : null),
        [exam]
    );

    const schedule = exam ? getSchedule(exam) : null;

    const canStart =
        exam &&
        scheduleState !== "closed" &&
        scheduleState !== "upcoming" &&
        status !== "completed";

    const handleStart = async () => {
        if (!exam || !examId || !canStart) {
            return;
        }

        try {
            setStarting(true);
            setError("");

            router.push(`/student/examinations/${examId}/start`);
        } catch (err) {
            console.error("Failed to start examination:", err);

            setError(
                err?.message ||
                    "Unable to start the examination."
            );

            setStarting(false);
        }
    };

    if (loading) {
        return (
            <main className="min-h-full pb-12">
                <div className="mx-auto max-w-5xl">
                    <div className="mb-8 h-5 w-36 animate-pulse rounded-full bg-surface-secondary" />

                    <div className="animate-pulse rounded-[32px] border border-border bg-surface p-7 sm:p-10">
                        <div className="h-4 w-24 rounded-full bg-surface-secondary" />
                        <div className="mt-5 h-10 w-3/4 rounded-xl bg-surface-secondary" />
                        <div className="mt-4 h-4 w-full max-w-2xl rounded-lg bg-surface-secondary" />
                        <div className="mt-2 h-4 w-2/3 rounded-lg bg-surface-secondary" />

                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <div className="h-20 rounded-2xl bg-surface-secondary" />
                            <div className="h-20 rounded-2xl bg-surface-secondary" />
                            <div className="h-20 rounded-2xl bg-surface-secondary" />
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (error && !exam) {
        return (
            <main className="min-h-full pb-12">
                <div className="mx-auto max-w-5xl">
                    <Link
                        href="/student/examinations"
                        className="mb-7 inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
                    >
                        <ArrowLeftIcon />
                        Back to examinations
                    </Link>

                    <div className="rounded-[32px] border border-red-200 bg-red-50 p-7 dark:border-red-400/20 dark:bg-red-500/10 sm:p-10">
                        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300">
                            <AlertIcon />
                        </div>

                        <h1 className="mt-5 text-xl font-semibold text-red-800 dark:text-red-200">
                            Unable to load examination
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-red-700/80 dark:text-red-200/70">
                            {error}
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <button
                                type="button"
                                onClick={loadExam}
                                className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                            >
                                Try again
                            </button>

                            <Link
                                href="/student/examinations"
                                className="rounded-full border border-border bg-surface px-5 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
                            >
                                Back to examinations
                            </Link>
                        </div>
                    </div>
                </div>
            </main>
        );
    }

    if (!exam) {
        return null;
    }

    return (
        <main className="min-h-full pb-12">
            <div className="mx-auto max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="mb-7"
                >
                    <Link
                        href="/student/examinations"
                        className="inline-flex items-center gap-2 text-sm font-medium text-muted transition-colors hover:text-foreground"
                    >
                        <ArrowLeftIcon />
                        Back to examinations
                    </Link>
                </motion.div>

                <motion.section
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="overflow-hidden rounded-[32px] border border-border bg-surface shadow-sm"
                >
                    <div className="relative overflow-hidden px-6 pb-8 pt-8 sm:px-10 sm:pb-10 sm:pt-10">
                        <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-purple-bright/10 blur-3xl" />

                        <div className="relative">
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="rounded-full bg-purple-bright/10 px-3 py-1 text-xs font-semibold text-purple-bright">
                                    {getLevel(exam)}
                                </span>

                                {status === "in_progress" && (
                                    <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                                        In progress
                                    </span>
                                )}

                                {status === "completed" && (
                                    <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                                        Completed
                                    </span>
                                )}

                                {scheduleState === "upcoming" && (
                                    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                                        Upcoming
                                    </span>
                                )}

                                {scheduleState === "closed" && (
                                    <span className="rounded-full bg-surface-secondary px-3 py-1 text-xs font-semibold text-muted">
                                        Closed
                                    </span>
                                )}
                            </div>

                            <div className="mt-6 flex gap-5">
                                <div className="hidden h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm sm:flex">
                                    <ClipboardIcon />
                                </div>

                                <div>
                                    <p className="mb-2 text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                                        Level examination
                                    </p>

                                    <h1 className="max-w-3xl text-3xl font-semibold tracking-[-0.04em] text-foreground sm:text-4xl">
                                        {getTitle(exam)}
                                    </h1>

                                    <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                                        {getDescription(exam)}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-8 grid gap-3 sm:grid-cols-3">
                                <div className="rounded-2xl border border-border bg-surface-secondary/60 p-4">
                                    <div className="flex items-center gap-2 text-muted">
                                        <ClockIcon />
                                        <span className="text-xs font-medium">
                                            Duration
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base font-semibold text-foreground">
                                        {getDuration(exam)} minutes
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border bg-surface-secondary/60 p-4">
                                    <div className="flex items-center gap-2 text-muted">
                                        <QuestionsIcon />
                                        <span className="text-xs font-medium">
                                            Questions
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base font-semibold text-foreground">
                                        {getQuestionCount(exam) ||
                                            "Configured by academy"}
                                    </p>
                                </div>

                                <div className="rounded-2xl border border-border bg-surface-secondary/60 p-4">
                                    <div className="flex items-center gap-2 text-muted">
                                        <PassIcon />
                                        <span className="text-xs font-medium">
                                            Pass mark
                                        </span>
                                    </div>

                                    <p className="mt-2 text-base font-semibold text-foreground">
                                        {getPassMark(exam)}%
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-border/70 px-6 py-7 sm:px-10">
                        <div className="grid gap-8 lg:grid-cols-[1fr_300px]">
                            <div>
                                <h2 className="text-lg font-semibold tracking-tight text-foreground">
                                    Before you begin
                                </h2>

                                <div className="mt-5 space-y-4">
                                    {[
                                        "Make sure you have enough uninterrupted time to complete the examination.",
                                        "The examination is timed. Your time begins when your attempt starts.",
                                        "You may move backwards and forwards between questions.",
                                        "Your answers should be reviewed before submitting the examination.",
                                        "Once your examination has been submitted, you cannot start another attempt.",
                                    ].map((text, index) => (
                                        <div
                                            key={text}
                                            className="flex gap-3"
                                        >
                                            <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-purple-bright/10 text-xs font-semibold text-purple-bright">
                                                {index + 1}
                                            </div>

                                            <p className="text-sm leading-6 text-muted">
                                                {text}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="rounded-2xl border border-border bg-surface-secondary/50 p-5">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                        <ShieldIcon />
                                    </div>

                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Examination rules
                                        </p>

                                        <p className="text-xs text-muted">
                                            Please read before starting.
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-5 space-y-3 text-xs leading-5 text-muted">
                                    <p>
                                        Your attempt is recorded when you
                                        start.
                                    </p>

                                    <p>
                                        Closing the examination does not create
                                        a new attempt.
                                    </p>

                                    <p>
                                        Your final score is calculated by the
                                        academy system after submission.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {(schedule.start || schedule.end) && (
                        <div className="border-t border-border/70 bg-surface-secondary/30 px-6 py-5 sm:px-10">
                            <div className="grid gap-3 sm:grid-cols-2">
                                {schedule.start && (
                                    <div>
                                        <p className="text-xs font-medium text-muted">
                                            Examination opens
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {formatDate(schedule.start)}
                                        </p>
                                    </div>
                                )}

                                {schedule.end && (
                                    <div>
                                        <p className="text-xs font-medium text-muted">
                                            Examination closes
                                        </p>

                                        <p className="mt-1 text-sm font-semibold text-foreground">
                                            {formatDate(schedule.end)}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="border-t border-border/70 px-6 py-6 sm:px-10">
                        {error && (
                            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-400/20 dark:bg-red-500/10 dark:text-red-300">
                                {error}
                            </div>
                        )}

                        {scheduleState === "upcoming" ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        This examination has not opened yet.
                                    </p>

                                    {schedule.start && (
                                        <p className="mt-1 text-sm text-muted">
                                            It opens on{" "}
                                            {formatDate(schedule.start)}.
                                        </p>
                                    )}
                                </div>

                                <Link
                                    href="/student/examinations"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
                                >
                                    Back to examinations
                                </Link>
                            </div>
                        ) : scheduleState === "closed" ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        This examination is closed.
                                    </p>

                                    <p className="mt-1 text-sm text-muted">
                                        The examination window has ended.
                                    </p>
                                </div>

                                <Link
                                    href="/student/examinations"
                                    className="inline-flex items-center justify-center gap-2 rounded-full border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground transition hover:bg-surface-secondary"
                                >
                                    Back to examinations
                                </Link>
                            </div>
                        ) : status === "completed" ? (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        You have completed this examination.
                                    </p>

                                    <p className="mt-1 text-sm text-muted">
                                        Your examination attempt has already
                                        been submitted.
                                    </p>
                                </div>

                                <Link
                                    href="/student/results"
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                                >
                                    View results
                                    <ArrowRightIcon />
                                </Link>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <div>
                                    <p className="font-semibold text-foreground">
                                        Ready to begin?
                                    </p>

                                    <p className="mt-1 text-sm text-muted">
                                        Make sure you are prepared before
                                        starting your attempt.
                                    </p>
                                </div>

                                <button
                                    type="button"
                                    onClick={handleStart}
                                    disabled={starting || !canStart}
                                    className="inline-flex items-center justify-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    {starting
                                        ? "Opening examination..."
                                        : status === "in_progress"
                                          ? "Continue examination"
                                          : "Start examination"}

                                    {!starting && <ArrowRightIcon />}
                                </button>
                            </div>
                        )}
                    </div>
                </motion.section>
            </div>
        </main>
    );
}