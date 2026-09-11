"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
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
        "Untitled Examination"
    );
}

function getDescription(exam) {
    return (
        exam.description ||
        exam.examination_description ||
        exam.exam_description ||
        "Your examination details will appear here."
    );
}

function getLevel(exam) {
    if (exam.level_name) return exam.level_name;
    if (exam.level_number) return `${exam.level_number} Level`;

    if (exam.level?.name) return exam.level.name;
    if (exam.level?.level_number) {
        return `${exam.level.level_number} Level`;
    }

    return "Academy Examination";
}

function getDuration(exam) {
    const duration =
        exam.duration_minutes ||
        exam.examination_duration_minutes ||
        exam.exam_duration_minutes;

    return duration ? `${duration} min` : "Timed";
}

function getQuestionCount(exam) {
    const count =
        exam.question_count ||
        exam.examination_question_count ||
        exam.exam_question_count;

    return count ? `${count} questions` : "Questions available";
}

function getAttempt(exam) {
    return exam.attempt || exam.attempt_data || exam.my_attempt || null;
}

function getStatus(exam) {
    const attempt = getAttempt(exam);

    if (!attempt) {
        if (
            exam.attempt_status === "submitted" ||
            exam.status === "completed"
        ) {
            return "completed";
        }

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

function getScore(exam) {
    const attempt = getAttempt(exam);

    return (
        attempt?.percentage ??
        attempt?.score ??
        exam.percentage ??
        exam.score ??
        null
    );
}

function getSchedule(exam) {
    const start =
        exam.scheduled_start ||
        exam.start_time ||
        exam.starts_at ||
        null;

    const end =
        exam.scheduled_end ||
        exam.end_time ||
        exam.ends_at ||
        null;

    return { start, end };
}

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
    }).format(date);
}

function getScheduleState(exam) {
    const { start, end } = getSchedule(exam);

    if (!start && !end) {
        return "available";
    }

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

function StatusBadge({ status }) {
    const styles = {
        available:
            "bg-purple-100 text-purple-700 dark:bg-purple-500/15 dark:text-purple-300",
        in_progress:
            "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
        completed:
            "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
        abandoned:
            "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
        upcoming:
            "bg-blue-100 text-blue-700 dark:bg-blue-500/15 dark:text-blue-300",
        closed:
            "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300",
    };

    const labels = {
        available: "Available",
        in_progress: "In progress",
        completed: "Completed",
        abandoned: "Attempt ended",
        upcoming: "Upcoming",
        closed: "Closed",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${
                styles[status] || styles.available
            }`}
        >
            {labels[status] || "Available"}
        </span>
    );
}

function ClipboardIcon() {
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
            className="h-4 w-4"
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

function BookIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            className="h-4 w-4"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5.25 5.75A2.25 2.25 0 0 1 7.5 3.5h10.25v16.75H7.5a2.25 2.25 0 0 0-2.25 2.25V5.75Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M17.75 3.5v16.75H7.5a2.25 2.25 0 0 0-2.25 2.25"
            />
        </svg>
    );
}

function ArrowIcon() {
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
                d="M5 12h13M13 6l6 6-6 6"
            />
        </svg>
    );
}

function EmptyIcon() {
    return (
        <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-10 w-10"
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7 3.75h8.5L19 7.25v12A1.75 1.75 0 0 1 17.25 21h-10.5A1.75 1.75 0 0 1 5 19.25V5.5a1.75 1.75 0 0 1 1.75-1.75Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15 3.75V7.5h3.75M8.5 11h7M8.5 14.5h7M8.5 18h4"
            />
        </svg>
    );
}

export default function StudentExaminationsPage() {
    const [examinations, setExaminations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const loadExaminations = useCallback(async () => {
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
                throw new Error("Your session has expired. Please log in again.");
            }

            const { data, error: rpcError } = await supabase.rpc(
                "get_my_assessments"
            );

            if (rpcError) {
                throw rpcError;
            }

            const normalized = normalizeAssessments(data);

            setExaminations(normalized);
        } catch (err) {
            console.error("Failed to load examinations:", err);
            setError(
                err?.message ||
                    "Unable to load your examinations right now."
            );
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExaminations();
    }, [loadExaminations]);

    const stats = useMemo(() => {
        const available = examinations.filter((exam) => {
            const status = getStatus(exam);
            const schedule = getScheduleState(exam);

            return (
                status === "available" &&
                schedule !== "closed" &&
                schedule !== "upcoming"
            );
        }).length;

        const completed = examinations.filter(
            (exam) => getStatus(exam) === "completed"
        ).length;

        const inProgress = examinations.filter(
            (exam) => getStatus(exam) === "in_progress"
        ).length;

        return {
            total: examinations.length,
            available,
            completed,
            inProgress,
        };
    }, [examinations]);

    return (
        <main className="min-h-full pb-12">
            <div className="mx-auto max-w-6xl">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4 }}
                    className="mb-8"
                >
                    <div className="mb-5 flex items-center gap-2 text-sm text-muted">
                        <Link
                            href="/student/dashboard"
                            className="transition-colors hover:text-primary"
                        >
                            Dashboard
                        </Link>

                        <span>/</span>

                        <span className="text-foreground">
                            Examinations
                        </span>
                    </div>

                    <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
                        <div className="max-w-2xl">
                            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                                <ClipboardIcon />
                            </div>

                            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.16em] text-primary">
                                Academic assessment
                            </p>

                            <h1 className="text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                                Examinations
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                                Your level examinations will appear here when
                                they are published and available for you to
                                take.
                            </p>
                        </div>

                        <Link
                            href="/student/tests"
                            className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium text-foreground shadow-sm transition hover:border-border-strong hover:bg-surface-secondary"
                        >
                            <span>View class tests</span>
                            <ArrowIcon />
                        </Link>
                    </div>
                </motion.div>

                {!loading && !error && examinations.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.05 }}
                        className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-4"
                    >
                        {[
                            ["Examinations", stats.total],
                            ["Available", stats.available],
                            ["In progress", stats.inProgress],
                            ["Completed", stats.completed],
                        ].map(([label, value]) => (
                            <div
                                key={label}
                                className="bg-surface px-4 py-4 sm:px-5"
                            >
                                <p className="text-xs font-medium text-muted">
                                    {label}
                                </p>
                                <p className="mt-1 text-xl font-semibold tracking-tight text-foreground">
                                    {value}
                                </p>
                            </div>
                        ))}
                    </motion.div>
                )}

                {loading && (
                    <div className="space-y-4">
                        {[1, 2].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-3xl border border-border bg-surface p-6"
                            >
                                <div className="h-4 w-24 rounded-full bg-surface-secondary" />
                                <div className="mt-4 h-6 w-2/3 rounded-lg bg-surface-secondary" />
                                <div className="mt-3 h-4 w-full max-w-xl rounded-lg bg-surface-secondary" />
                                <div className="mt-6 h-10 w-32 rounded-full bg-surface-secondary" />
                            </div>
                        ))}
                    </div>
                )}

                {!loading && error && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-3xl border border-red-200 bg-red-50 p-6 dark:border-red-400/20 dark:bg-red-500/10"
                    >
                        <h2 className="font-semibold text-red-700 dark:text-red-300">
                            Unable to load examinations
                        </h2>

                        <p className="mt-2 text-sm leading-6 text-red-600 dark:text-red-300/80">
                            {error}
                        </p>

                        <button
                            type="button"
                            onClick={loadExaminations}
                            className="mt-5 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                        >
                            Try again
                        </button>
                    </motion.div>
                )}

                {!loading &&
                    !error &&
                    examinations.length === 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="rounded-3xl border border-border bg-surface px-6 py-16 text-center shadow-sm"
                        >
                            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-soft text-primary">
                                <EmptyIcon />
                            </div>

                            <h2 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
                                No examinations yet
                            </h2>

                            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                                There are currently no published examinations
                                available for your academic level. When one is
                                released, it will appear here.
                            </p>

                            <Link
                                href="/student/dashboard"
                                className="mt-6 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                            >
                                Back to dashboard
                                <ArrowIcon />
                            </Link>
                        </motion.div>
                    )}

                {!loading &&
                    !error &&
                    examinations.length > 0 && (
                        <div className="space-y-4">
                            {examinations.map((exam, index) => {
                                const id = getId(exam);
                                const title = getTitle(exam);
                                const description = getDescription(exam);
                                const level = getLevel(exam);
                                const status = getStatus(exam);
                                const scheduleState = getScheduleState(exam);
                                const score = getScore(exam);
                                const schedule = getSchedule(exam);

                                const effectiveStatus =
                                    scheduleState === "upcoming" ||
                                    scheduleState === "closed"
                                        ? scheduleState
                                        : status;

                                const canOpen =
                                    Boolean(id) &&
                                    scheduleState !== "closed";

                                return (
                                    <motion.article
                                        key={id || index}
                                        initial={{
                                            opacity: 0,
                                            y: 14,
                                        }}
                                        animate={{
                                            opacity: 1,
                                            y: 0,
                                        }}
                                        transition={{
                                            duration: 0.35,
                                            delay: index * 0.04,
                                        }}
                                        className="group rounded-3xl border border-border bg-surface p-5 shadow-sm transition hover:border-border-strong hover:shadow-md sm:p-6"
                                    >
                                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                                            <div className="min-w-0">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <StatusBadge
                                                        status={
                                                            effectiveStatus
                                                        }
                                                    />

                                                    <span className="text-xs text-muted">
                                                        {level}
                                                    </span>
                                                </div>

                                                <h2 className="mt-3 text-xl font-semibold tracking-tight text-foreground">
                                                    {title}
                                                </h2>

                                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                                    {description}
                                                </p>

                                                <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs font-medium text-muted">
                                                    <span className="inline-flex items-center gap-1.5">
                                                        <ClockIcon />
                                                        {getDuration(exam)}
                                                    </span>

                                                    <span className="inline-flex items-center gap-1.5">
                                                        <BookIcon />
                                                        {getQuestionCount(
                                                            exam
                                                        )}
                                                    </span>
                                                </div>

                                                {(schedule.start ||
                                                    schedule.end) && (
                                                    <div className="mt-4 text-xs leading-5 text-muted">
                                                        {schedule.start && (
                                                            <p>
                                                                Starts:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {formatDate(
                                                                        schedule.start
                                                                    ) ||
                                                                        "Scheduled"}
                                                                </span>
                                                            </p>
                                                        )}

                                                        {schedule.end && (
                                                            <p>
                                                                Closes:{" "}
                                                                <span className="font-medium text-foreground">
                                                                    {formatDate(
                                                                        schedule.end
                                                                    ) ||
                                                                        "Scheduled"}
                                                                </span>
                                                            </p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="flex shrink-0 flex-col items-start gap-3 lg:items-end">
                                                {score !== null &&
                                                    score !== undefined && (
                                                        <div className="text-left lg:text-right">
                                                            <p className="text-xs font-medium text-muted">
                                                                Result
                                                            </p>
                                                            <p className="mt-0.5 text-2xl font-semibold tracking-tight text-foreground">
                                                                {Number(
                                                                    score
                                                                ).toFixed(1)}
                                                                %
                                                            </p>
                                                        </div>
                                                    )}

                                                {canOpen ? (
                                                    <Link
                                                        href={`/student/examinations/${id}`}
                                                        className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                                                    >
                                                        {status ===
                                                        "in_progress"
                                                            ? "Continue examination"
                                                            : status ===
                                                                "completed"
                                                              ? "View examination"
                                                              : "View examination"}

                                                        <ArrowIcon />
                                                    </Link>
                                                ) : (
                                                    <span className="inline-flex items-center rounded-full bg-surface-secondary px-5 py-2.5 text-sm font-semibold text-muted">
                                                        {scheduleState ===
                                                        "upcoming"
                                                            ? "Not started"
                                                            : "Closed"}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
            </div>
        </main>
    );
}