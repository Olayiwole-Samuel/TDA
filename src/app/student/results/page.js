"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Award,
    BookOpen,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileText,
    GraduationCap,
    Loader2,
    Lock,
    TrendingUp,
    XCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function unwrap(value) {
    if (value == null) return null;

    if (Array.isArray(value)) {
        if (value.length === 1) return unwrap(value[0]);
        return value;
    }

    if (typeof value === "object") {
        if (value.data !== undefined) {
            return unwrap(value.data);
        }

        if (value.result !== undefined) {
            return unwrap(value.result);
        }

        return value;
    }

    return value;
}

function normalizePerformance(value) {
    const raw = unwrap(value);

    if (!raw) {
        return {
            levels: [],
            results: [],
            attendance: [],
            classPerformance: [],
            tests: [],
            examinations: [],
            promotions: [],
            certificates: [],
        };
    }

    const source =
        raw.performance ||
        raw.academic_performance ||
        raw;

    return {
        levels:
            source.levels ||
            source.academic_levels ||
            [],

        results:
            source.results ||
            source.level_results ||
            [],

        attendance:
            source.attendance ||
            [],

        classPerformance:
            source.class_performance ||
            source.classPerformance ||
            [],

        tests:
            source.tests ||
            source.test_attempts ||
            [],

        examinations:
            source.examinations ||
            source.exam_attempts ||
            [],

        promotions:
            source.promotions ||
            [],

        certificates:
            source.certificates ||
            [],
    };
}

function firstResult(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    if (data.result) {
        return firstResult(data.result);
    }

    if (data.results) {
        return Array.isArray(data.results)
            ? data.results[0] || null
            : data.results;
    }

    return data;
}

function number(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed)
        ? parsed
        : 0;
}

function formatScore(value) {
    return number(value).toFixed(1);
}

function getGrade(score) {
    const value = number(score);

    if (value >= 70) return "A";
    if (value >= 60) return "B";
    if (value >= 50) return "C";
    if (value >= 45) return "D";

    return "F";
}

function getGradeLabel(grade) {
    const labels = {
        A: "Excellent",
        B: "Very Good",
        C: "Good",
        D: "Pass",
        F: "Needs Improvement",
    };

    return labels[grade] || "Pending";
}

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
}

function normalizeResult(result) {
    if (!result) return null;

    return {
        id: result.id,
        levelId:
            result.level_id ||
            result.levelId,

        levelName:
            result.level_name ||
            result.level ||
            result.level_title ||
            "",

        sessionName:
            result.session_name ||
            result.session ||
            "",

        averageScore: number(
            result.average_score
        ),

        classPerformanceScore: number(
            result.class_performance_score
        ),

        testScore: number(
            result.test_score
        ),

        examinationScore: number(
            result.examination_score
        ),

        overallScore: number(
            result.overall_score
        ),

        grade:
            result.grade ||
            getGrade(
                result.overall_score
            ),

        status:
            result.status ||
            "pending",

        comments:
            result.comments ||
            "",

        finalizedAt:
            result.finalized_at ||
            null,
    };
}

export default function StudentResultsPage() {
    const [data, setData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [selectedResult, setSelectedResult] =
        useState(0);

    const loadResults =
        useCallback(async () => {
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
                    window.location.href =
                        "/login";
                    return;
                }

                const {
                    data: performance,
                    error: rpcError,
                } =
                    await supabase.rpc(
                        "get_my_academic_performance"
                    );

                if (rpcError) {
                    throw rpcError;
                }

                setData(
                    normalizePerformance(
                        performance
                    )
                );
            } catch (err) {
                console.error(
                    "Results loading error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load your academic results."
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        loadResults();
    }, [loadResults]);

    if (loading) {
        return (
            <LoadingState />
        );
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={loadResults}
            />
        );
    }

    const results = (
        data?.results || []
    )
        .map(normalizeResult)
        .filter(Boolean);

    const currentResult =
        results[
            selectedResult
        ] || null;

    const hasResults =
        results.length > 0;

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 15,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                >
                    <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <Link
                                href="/student/dashboard"
                                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
                            >
                                <ArrowLeft className="h-4 w-4" />
                                Back to Dashboard
                            </Link>

                            <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                                Academic record
                            </p>

                            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                                Results
                            </h1>

                            <p className="mt-3 max-w-xl text-sm leading-6 text-[var(--muted)]">
                                Review your academic
                                performance and results
                                throughout your
                                discipleship journey.
                            </p>
                        </div>

                        {hasResults && (
                            <div className="relative">
                                <label className="mb-2 block text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                                    Academic level
                                </label>

                                <div className="relative">
                                    <select
                                        value={
                                            selectedResult
                                        }
                                        onChange={(event) =>
                                            setSelectedResult(
                                                Number(
                                                    event
                                                        .target
                                                        .value
                                                )
                                            )
                                        }
                                        className="min-w-48 appearance-none rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 pr-10 text-sm font-semibold outline-none transition focus:border-[var(--primary)]"
                                    >
                                        {results.map(
                                            (
                                                result,
                                                index
                                            ) => (
                                                <option
                                                    key={
                                                        result.id ||
                                                        index
                                                    }
                                                    value={
                                                        index
                                                    }
                                                >
                                                    {result.levelName ||
                                                        `Level ${
                                                            index +
                                                            1
                                                        }`}
                                                </option>
                                            )
                                        )}
                                    </select>

                                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                                </div>
                            </div>
                        )}
                    </div>
                </motion.div>

                {!hasResults ? (
                    <EmptyResults />
                ) : (
                    <>
                        <ResultHero
                            result={
                                currentResult
                            }
                        />

                        <ScoreBreakdown
                            result={
                                currentResult
                            }
                        />

                        <AcademicStatus
                            result={
                                currentResult
                            }
                        />

                        <ResultDetails
                            result={
                                currentResult
                            }
                        />

                        <AcademicJourney
                            results={
                                results
                            }
                            selectedResult={
                                selectedResult
                            }
                            onSelect={
                                setSelectedResult
                            }
                        />
                    </>
                )}
            </main>
        </div>
    );
}

function ResultHero({
    result,
}) {
    const score = number(
        result?.overallScore
    );

    const grade =
        result?.grade ||
        getGrade(score);

    const passed =
        result?.status ===
            "passed" ||
        result?.status ===
            "finalized" ||
        score >= 50;

    const finalized =
        result?.status ===
            "finalized";

    return (
        <motion.section
            initial={{
                opacity: 0,
                y: 18,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay: 0.05,
            }}
            className="mt-8 overflow-hidden rounded-[30px] border border-[var(--border)] bg-[var(--surface)]"
        >
            <div className="relative overflow-hidden p-6 sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                                {result?.levelName ||
                                    "Academic Result"}
                            </span>

                            {result?.sessionName && (
                                <span className="text-xs font-medium text-[var(--muted)]">
                                    {
                                        result.sessionName
                                    }
                                </span>
                            )}
                        </div>

                        <h2 className="mt-5 max-w-2xl text-2xl font-semibold tracking-tight sm:text-3xl">
                            Your academic
                            performance
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                            Your result brings
                            together your class
                            performance, assessments
                            and final examination
                            performance for this
                            level.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            <StatusPill
                                passed={passed}
                                finalized={
                                    finalized
                                }
                            />

                            {result?.finalizedAt && (
                                <span className="inline-flex items-center gap-2 rounded-full border border-[var(--border)] px-3 py-1.5 text-xs font-medium text-[var(--muted)]">
                                    <Lock className="h-3 w-3" />
                                    Finalized{" "}
                                    {formatDate(
                                        result.finalizedAt
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-5 lg:gap-7">
                        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-8 border-[var(--accent-soft)] sm:h-40 sm:w-40">
                            <div className="absolute inset-2 rounded-full border border-[var(--border)]" />

                            <div className="text-center">
                                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {formatScore(
                                        score
                                    )}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                                    Overall
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                                Grade
                            </p>

                            <p className="mt-1 text-5xl font-semibold text-[var(--primary)]">
                                {grade}
                            </p>

                            <p className="mt-1 text-xs font-medium text-[var(--muted)]">
                                {getGradeLabel(
                                    grade
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function StatusPill({
    passed,
    finalized,
}) {
    if (finalized) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Result finalized
            </span>
        );
    }

    if (passed) {
        return (
            <span className="inline-flex items-center gap-2 rounded-full bg-[var(--success)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--success)]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                Passed
            </span>
        );
    }

    return (
        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--danger)]/10 px-3 py-1.5 text-xs font-semibold text-[var(--danger)]">
            <XCircle className="h-3.5 w-3.5" />
            Not passed
        </span>
    );
}

function ScoreBreakdown({
    result,
}) {
    const items = [
        {
            label: "Class Performance",
            value:
                result?.classPerformanceScore,
            weight: "20%",
            icon: BookOpen,
        },
        {
            label: "Class Tests",
            value:
                result?.testScore,
            weight: "30%",
            icon: FileText,
        },
        {
            label: "Final Examination",
            value:
                result?.examinationScore,
            weight: "50%",
            icon: GraduationCap,
        },
    ];

    return (
        <section className="mt-6">
            <div className="mb-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Score breakdown
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                    How your result was calculated
                </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                {items.map(
                    (
                        item,
                        index
                    ) => {
                        const Icon =
                            item.icon;

                        return (
                            <motion.div
                                key={
                                    item.label
                                }
                                initial={{
                                    opacity: 0,
                                    y: 12,
                                }}
                                animate={{
                                    opacity: 1,
                                    y: 0,
                                }}
                                transition={{
                                    delay:
                                        0.08 +
                                        index *
                                            0.05,
                                }}
                                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                                        <Icon className="h-4 w-4 text-[var(--primary)]" />
                                    </div>

                                    <span className="rounded-full bg-[var(--surface-secondary)] px-2.5 py-1 text-[10px] font-bold text-[var(--muted)]">
                                        {
                                            item.weight
                                        }
                                    </span>
                                </div>

                                <p className="mt-5 text-sm font-semibold">
                                    {
                                        item.label
                                    }
                                </p>

                                <div className="mt-3 flex items-end justify-between gap-3">
                                    <p className="text-2xl font-semibold">
                                        {formatScore(
                                            item.value
                                        )}
                                        %
                                    </p>

                                    <span className="text-xs text-[var(--muted)]">
                                        Score
                                    </span>
                                </div>

                                <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                                    <motion.div
                                        initial={{
                                            width: 0,
                                        }}
                                        animate={{
                                            width: `${Math.min(
                                                100,
                                                Math.max(
                                                    0,
                                                    number(
                                                        item.value
                                                    )
                                                )
                                            )}%`,
                                        }}
                                        transition={{
                                            duration: 0.7,
                                            delay:
                                                0.15 +
                                                index *
                                                    0.05,
                                        }}
                                        className="h-full rounded-full bg-[var(--primary)]"
                                    />
                                </div>
                            </motion.div>
                        );
                    }
                )}
            </div>
        </section>
    );
}

function AcademicStatus({
    result,
}) {
    const score = number(
        result?.overallScore
    );

    const passed =
        score >= 50 ||
        result?.status ===
            "passed" ||
        result?.status ===
            "finalized";

    return (
        <section className="mt-6 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <div className="flex items-start gap-4">
                    <div
                        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
                            passed
                                ? "bg-[var(--success)]/10"
                                : "bg-[var(--danger)]/10"
                        }`}
                    >
                        {passed ? (
                            <TrendingUp className="h-5 w-5 text-[var(--success)]" />
                        ) : (
                            <XCircle className="h-5 w-5 text-[var(--danger)]" />
                        )}
                    </div>

                    <div>
                        <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                            Academic outcome
                        </p>

                        <h3 className="mt-1 text-lg font-semibold">
                            {passed
                                ? "You have passed this level."
                                : "This level has not been passed."}
                        </h3>

                        <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                            {result?.comments ||
                                (passed
                                    ? "Your result meets the current passing requirement."
                                    : "Review your performance and speak with the academy if you need guidance.")}
                        </p>
                    </div>
                </div>
            </div>

            <div className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Passing requirement
                </p>

                <div className="mt-4 flex items-end justify-between">
                    <div>
                        <p className="text-3xl font-semibold">
                            50%
                        </p>

                        <p className="mt-1 text-xs text-[var(--muted)]">
                            Minimum overall score
                        </p>
                    </div>

                    <div className="text-right">
                        <p className="text-xs text-[var(--muted)]">
                            Your score
                        </p>

                        <p
                            className={`mt-1 text-lg font-semibold ${
                                passed
                                    ? "text-[var(--success)]"
                                    : "text-[var(--danger)]"
                            }`}
                        >
                            {formatScore(
                                score
                            )}
                            %
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

function ResultDetails({
    result,
}) {
    return (
        <section className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6 sm:p-7">
            <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                    <Award className="h-4 w-4 text-[var(--primary)]" />
                </div>

                <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                        Result details
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                        Academic record
                    </h2>
                </div>
            </div>

            <div className="mt-6 grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
                <Detail
                    label="Level"
                    value={
                        result?.levelName ||
                        "—"
                    }
                />

                <Detail
                    label="Session"
                    value={
                        result?.sessionName ||
                        "—"
                    }
                />

                <Detail
                    label="Grade"
                    value={
                        result?.grade ||
                        getGrade(
                            result?.overallScore
                        )
                    }
                />

                <Detail
                    label="Status"
                    value={
                        result?.status
                            ? capitalize(
                                  result.status
                              )
                            : "Pending"
                    }
                />

                <Detail
                    label="Overall score"
                    value={`${formatScore(
                        result?.overallScore
                    )}%`}
                />

                <Detail
                    label="Class performance"
                    value={`${formatScore(
                        result?.classPerformanceScore
                    )}%`}
                />

                <Detail
                    label="Class tests"
                    value={`${formatScore(
                        result?.testScore
                    )}%`}
                />

                <Detail
                    label="Final examination"
                    value={`${formatScore(
                        result?.examinationScore
                    )}%`}
                />
            </div>
        </section>
    );
}

function Detail({
    label,
    value,
}) {
    return (
        <div>
            <p className="text-xs text-[var(--muted)]">
                {label}
            </p>

            <p className="mt-1 text-sm font-semibold">
                {value}
            </p>
        </div>
    );
}

function AcademicJourney({
    results,
    selectedResult,
    onSelect,
}) {
    if (results.length <= 1) {
        return null;
    }

    return (
        <section className="mt-10">
            <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                    Academic history
                </p>

                <h2 className="mt-1 text-lg font-semibold">
                    Your journey so far
                </h2>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {results.map(
                    (
                        result,
                        index
                    ) => {
                        const active =
                            index ===
                            selectedResult;

                        const score =
                            number(
                                result.overallScore
                            );

                        return (
                            <button
                                key={
                                    result.id ||
                                    index
                                }
                                type="button"
                                onClick={() =>
                                    onSelect(
                                        index
                                    )
                                }
                                className={`rounded-2xl border p-5 text-left transition ${
                                    active
                                        ? "border-[var(--primary)] bg-[var(--accent-soft)]"
                                        : "border-[var(--border)] bg-[var(--surface)] hover:border-[var(--border-strong)]"
                                }`}
                            >
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                                        {
                                            result.levelName
                                        }
                                    </span>

                                    <ArrowRight
                                        className={`h-4 w-4 ${
                                            active
                                                ? "text-[var(--primary)]"
                                                : "text-[var(--muted)]"
                                        }`}
                                    />
                                </div>

                                <p className="mt-6 text-2xl font-semibold">
                                    {formatScore(
                                        score
                                    )}
                                    %
                                </p>

                                <p className="mt-1 text-xs text-[var(--muted)]">
                                    Grade{" "}
                                    {
                                        result.grade
                                    }
                                </p>
                            </button>
                        );
                    }
                )}
            </div>
        </section>
    );
}

function EmptyResults() {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className="mt-10 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12"
        >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <GraduationCap className="h-7 w-7 text-[var(--primary)]" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
                Your results are not available yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                Once your academic result has
                been calculated and released by
                the academy, it will appear here.
            </p>

            <Link
                href="/student/dashboard"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
                Back to Dashboard
                <ArrowRight className="h-4 w-4" />
            </Link>
        </motion.div>
    );
}

function LoadingState() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
            <div className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--primary)]" />
                </div>

                <p className="mt-5 text-sm font-semibold">
                    Loading your results
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                    Preparing your academic record...
                </p>
            </div>
        </div>
    );
}

function ErrorState({
    message,
    onRetry,
}) {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[var(--background)] px-5 text-[var(--foreground)]">
            <div className="w-full max-w-md text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--danger)]/10">
                    <XCircle className="h-7 w-7 text-[var(--danger)]" />
                </div>

                <h1 className="mt-5 text-xl font-semibold">
                    Unable to load results
                </h1>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {message}
                </p>

                <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
                    <button
                        type="button"
                        onClick={onRetry}
                        className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white"
                    >
                        Try Again
                    </button>

                    <Link
                        href="/student/dashboard"
                        className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-5 py-3 text-sm font-semibold"
                    >
                        <ArrowLeft className="h-4 w-4" />
                        Dashboard
                    </Link>
                </div>
            </div>
        </div>
    );
}

function capitalize(value) {
    if (!value) return "";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

