"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    Award,
    BarChart3,
    BookOpen,
    CalendarCheck2,
    CheckCircle2,
    ChevronRight,
    Clock3,
    FileText,
    GraduationCap,
    Loader2,
    Target,
    TrendingUp,
    Trophy,
    XCircle,
} from "lucide-react";

import { supabase } from "@/lib/supabase";

function unwrap(value) {
    if (value == null) return null;

    if (Array.isArray(value)) {
        if (value.length === 1) {
            return unwrap(value[0]);
        }

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

function asArray(value) {
    if (Array.isArray(value)) {
        return value;
    }

    if (!value) {
        return [];
    }

    return [value];
}

function toNumber(value) {
    const parsed = Number(value);

    return Number.isFinite(parsed)
        ? parsed
        : 0;
}

function formatScore(value) {
    return toNumber(value).toFixed(1);
}

function clamp(value) {
    return Math.min(
        100,
        Math.max(0, toNumber(value))
    );
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

function capitalize(value) {
    if (!value) return "—";

    return (
        value.charAt(0).toUpperCase() +
        value.slice(1)
    );
}

function getGrade(score) {
    const value = toNumber(score);

    if (value >= 70) return "A";
    if (value >= 60) return "B";
    if (value >= 50) return "C";
    if (value >= 45) return "D";

    return "F";
}

function getGradeDescription(grade) {
    const descriptions = {
        A: "Excellent performance",
        B: "Very good performance",
        C: "Good performance",
        D: "Pass",
        F: "Needs improvement",
    };

    return (
        descriptions[grade] ||
        "Academic performance"
    );
}

function normalizePerformance(value) {
    const raw = unwrap(value);

    if (!raw) {
        return {
            level: null,
            enrollment: null,
            result: null,
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

    const result =
        unwrap(
            source.result ||
                source.results
        );

    return {
        level:
            unwrap(
                source.level ||
                    source.current_level
            ),

        enrollment:
            unwrap(
                source.enrollment ||
                    source.current_enrollment
            ),

        result:
            Array.isArray(result)
                ? result[0] || null
                : result,

        attendance:
            asArray(
                source.attendance
            ),

        classPerformance:
            asArray(
                source.class_performance ||
                    source.classPerformance
            ),

        tests:
            asArray(
                source.tests ||
                    source.test_attempts
            ),

        examinations:
            asArray(
                source.examinations ||
                    source.exam_attempts
            ),

        promotions:
            asArray(
                source.promotions
            ),

        certificates:
            asArray(
                source.certificates
            ),
    };
}

function normalizeResult(result) {
    if (!result) return null;

    return {
        overallScore: toNumber(
            result.overall_score ??
                result.overallScore
        ),

        classPerformanceScore:
            toNumber(
                result.class_performance_score ??
                    result.classPerformanceScore
            ),

        testScore: toNumber(
            result.test_score ??
                result.testScore
        ),

        examinationScore:
            toNumber(
                result.examination_score ??
                    result.examinationScore
            ),

        grade:
            result.grade ||
            getGrade(
                result.overall_score ??
                    result.overallScore
            ),

        status:
            result.status ||
            "pending",

        levelName:
            result.level_name ||
            result.level ||
            result.level_title ||
            "",

        sessionName:
            result.session_name ||
            result.session ||
            "",

        finalizedAt:
            result.finalized_at ||
            null,

        comments:
            result.comments ||
            "",
    };
}

function normalizeAttendance(item) {
    return {
        id: item.id,
        className:
            item.class_name ||
            item.class_title ||
            item.title ||
            "Class",

        topicName:
            item.topic_name ||
            item.topic_title ||
            "",

        status:
            item.attendance_status ||
            item.status ||
            "present",

        date:
            item.attendance_date ||
            item.date ||
            item.created_at,
    };
}

function normalizeClassPerformance(item) {
    const points = toNumber(
        item.points
    );

    const cooperation = toNumber(
        item.cooperation
    );

    const attentiveness =
        toNumber(
            item.attentiveness
        );

    const contribution =
        toNumber(
            item.contribution
        );

    const average =
        item.average_score ??
        item.average ??
        (
            points +
            cooperation +
            attentiveness +
            contribution
        ) /
            4;

    return {
        id: item.id,

        className:
            item.class_name ||
            item.class_title ||
            item.title ||
            "Class",

        topicName:
            item.topic_name ||
            item.topic_title ||
            "",

        points,
        cooperation,
        attentiveness,
        contribution,
        average: clamp(
            average
        ),

        comments:
            item.comments ||
            "",
    };
}

function normalizeTest(item) {
    return {
        id: item.id,

        title:
            item.test_title ||
            item.title ||
            "Class Test",

        className:
            item.class_name ||
            item.class_title ||
            "",

        score: toNumber(
            item.score ??
                item.percentage
        ),

        status:
            item.status ||
            "submitted",

        submittedAt:
            item.submitted_at ||
            item.completed_at ||
            null,
    };
}

function normalizeExamination(item) {
    return {
        id: item.id,

        title:
            item.examination_title ||
            item.title ||
            "Examination",

        levelName:
            item.level_name ||
            item.level ||
            "",

        score: toNumber(
            item.percentage ??
                item.score
        ),

        passed:
            item.passed === true ||
            toNumber(
                item.percentage ??
                    item.score
            ) >= 50,

        status:
            item.status ||
            "submitted",

        submittedAt:
            item.submitted_at ||
            null,
    };
}

export default function StudentPerformancePage() {
    const [performance, setPerformance] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const loadPerformance =
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
                    data,
                    error: rpcError,
                } =
                    await supabase.rpc(
                        "get_my_academic_performance"
                    );

                if (rpcError) {
                    throw rpcError;
                }

                setPerformance(
                    normalizePerformance(
                        data
                    )
                );
            } catch (err) {
                console.error(
                    "Performance loading error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load your academic performance."
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        loadPerformance();
    }, [loadPerformance]);

    const result = useMemo(
        () =>
            normalizeResult(
                performance?.result
            ),
        [performance]
    );

    const attendance =
        useMemo(
            () =>
                performance?.attendance
                    ?.map(
                        normalizeAttendance
                    ) || [],
            [performance]
        );

    const classPerformance =
        useMemo(
            () =>
                performance?.classPerformance
                    ?.map(
                        normalizeClassPerformance
                    ) || [],
            [performance]
        );

    const tests =
        useMemo(
            () =>
                performance?.tests
                    ?.map(
                        normalizeTest
                    ) || [],
            [performance]
        );

    const examinations =
        useMemo(
            () =>
                performance?.examinations
                    ?.map(
                        normalizeExamination
                    ) || [],
            [performance]
        );

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={loadPerformance}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
                <PageHeader />

                <PerformanceOverview
                    level={
                        performance?.level
                    }
                    enrollment={
                        performance?.enrollment
                    }
                    result={result}
                />

                <MetricGrid
                    result={result}
                    attendance={
                        attendance
                    }
                    classPerformance={
                        classPerformance
                    }
                    tests={tests}
                    examinations={
                        examinations
                    }
                />

                <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
                    <ClassPerformanceSection
                        items={
                            classPerformance
                        }
                    />

                    <AssessmentPerformance
                        tests={tests}
                        examinations={
                            examinations
                        }
                    />
                </section>

                <section className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
                    <AttendanceSection
                        attendance={
                            attendance
                        }
                    />

                    <AcademicSnapshot
                        result={result}
                        promotions={
                            performance?.promotions ||
                            []
                        }
                        certificates={
                            performance?.certificates ||
                            []
                        }
                    />
                </section>
            </main>
        </div>
    );
}

function PageHeader() {
    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 14,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
        >
            <Link
                href="/student/dashboard"
                className="inline-flex items-center gap-2 text-sm font-medium text-[var(--muted)] transition hover:text-[var(--foreground)]"
            >
                <ArrowLeft className="h-4 w-4" />
                Back to Dashboard
            </Link>

            <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                    Academic progress
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Performance
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    See how you are progressing
                    across your classes,
                    assessments and academic
                    activities.
                </p>
            </div>
        </motion.div>
    );
}

function PerformanceOverview({
    level,
    enrollment,
    result,
}) {
    const score =
        result?.overallScore || 0;

    const grade =
        result?.grade ||
        getGrade(score);

    const hasResult =
        Boolean(result);

    const levelName =
        level?.name ||
        level?.title ||
        result?.levelName ||
        "Current Level";

    const sessionName =
        enrollment?.session_name ||
        enrollment?.session ||
        result?.sessionName ||
        "";

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
            <div className="relative p-6 sm:p-8 lg:p-10">
                <div className="pointer-events-none absolute -right-20 -top-28 h-80 w-80 rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                                {levelName}
                            </span>

                            {sessionName && (
                                <span className="text-xs text-[var(--muted)]">
                                    {
                                        sessionName
                                    }
                                </span>
                            )}
                        </div>

                        <h2 className="mt-5 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Your learning journey
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                            Your performance combines
                            the different parts of
                            your academy experience.
                            Keep learning, participating
                            and building consistency.
                        </p>

                        <div className="mt-6 flex flex-wrap gap-3">
                            {hasResult ? (
                                <span
                                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold ${
                                        score >=
                                        50
                                            ? "bg-[var(--success)]/10 text-[var(--success)]"
                                            : "bg-[var(--danger)]/10 text-[var(--danger)]"
                                    }`}
                                >
                                    {score >=
                                    50 ? (
                                        <CheckCircle2 className="h-3.5 w-3.5" />
                                    ) : (
                                        <XCircle className="h-3.5 w-3.5" />
                                    )}

                                    {score >=
                                    50
                                        ? "Currently passing"
                                        : "Below passing mark"}
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-2 rounded-full bg-[var(--surface-secondary)] px-3 py-1.5 text-xs font-semibold text-[var(--muted)]">
                                    <Clock3 className="h-3.5 w-3.5" />
                                    Result not available
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full border-8 border-[var(--accent-soft)] sm:h-36 sm:w-36">
                            <div className="text-center">
                                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {hasResult
                                        ? formatScore(
                                              score
                                          )
                                        : "—"}
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
                                {hasResult
                                    ? grade
                                    : "—"}
                            </p>

                            <p className="mt-1 max-w-28 text-xs leading-5 text-[var(--muted)]">
                                {hasResult
                                    ? getGradeDescription(
                                          grade
                                      )
                                    : "Awaiting academic result"}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function MetricGrid({
    result,
    attendance,
    classPerformance,
    tests,
    examinations,
}) {
    const attendanceRate =
        getAttendanceRate(
            attendance
        );

    const classScore =
        result?.classPerformanceScore ??
        getAverage(
            classPerformance.map(
                (item) =>
                    item.average
            )
        );

    const testScore =
        result?.testScore ??
        getAverage(
            tests.map(
                (item) =>
                    item.score
            )
        );

    const examinationScore =
        result?.examinationScore ??
        getAverage(
            examinations.map(
                (item) =>
                    item.score
            )
        );

    const metrics = [
        {
            label: "Class performance",
            value:
                classPerformance.length ||
                result
                    ? `${formatScore(
                          classScore
                      )}%`
                    : "—",
            description:
                "Participation and class work",
            icon: BookOpen,
        },
        {
            label: "Class tests",
            value:
                tests.length ||
                result
                    ? `${formatScore(
                          testScore
                      )}%`
                    : "—",
            description:
                `${tests.length} ${
                    tests.length ===
                    1
                        ? "assessment"
                        : "assessments"
                } recorded`,
            icon: FileText,
        },
        {
            label: "Final examination",
            value:
                examinations.length ||
                result
                    ? `${formatScore(
                          examinationScore
                      )}%`
                    : "—",
            description:
                `${examinations.length} ${
                    examinations.length ===
                    1
                        ? "examination"
                        : "examinations"
                } recorded`,
            icon: GraduationCap,
        },
        {
            label: "Attendance",
            value:
                attendance.length
                    ? `${formatScore(
                          attendanceRate
                      )}%`
                    : "—",
            description:
                attendance.length
                    ? `${attendance.filter(
                          (item) =>
                              item.status ===
                              "present"
                      ).length} present`
                    : "No attendance recorded",
            icon: CalendarCheck2,
        },
    ];

    return (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {metrics.map(
                (
                    metric,
                    index
                ) => {
                    const Icon =
                        metric.icon;

                    return (
                        <motion.div
                            key={
                                metric.label
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
                                    0.1 +
                                    index *
                                        0.05,
                            }}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                        >
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                                <Icon className="h-4 w-4 text-[var(--primary)]" />
                            </div>

                            <p className="mt-5 text-sm font-semibold">
                                {
                                    metric.label
                                }
                            </p>

                            <p className="mt-2 text-2xl font-semibold tracking-tight">
                                {
                                    metric.value
                                }
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                                {
                                    metric.description
                                }
                            </p>
                        </motion.div>
                    );
                }
            )}
        </section>
    );
}

function ClassPerformanceSection({
    items,
}) {
    return (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <SectionHeading
                icon={BookOpen}
                eyebrow="Classroom"
                title="Class performance"
            />

            {items.length === 0 ? (
                <SmallEmptyState
                    icon={BookOpen}
                    text="No class performance has been recorded yet."
                />
            ) : (
                <div className="mt-6 space-y-3">
                    {items
                        .slice(0, 8)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <motion.div
                                    key={
                                        item.id ||
                                        index
                                    }
                                    initial={{
                                        opacity: 0,
                                        x: -8,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        x: 0,
                                    }}
                                    transition={{
                                        delay:
                                            index *
                                            0.04,
                                    }}
                                    className="rounded-xl border border-[var(--border)] p-4"
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-semibold">
                                                {
                                                    item.className
                                                }
                                            </p>

                                            {item.topicName && (
                                                <p className="mt-1 truncate text-xs text-[var(--muted)]">
                                                    {
                                                        item.topicName
                                                    }
                                                </p>
                                            )}
                                        </div>

                                        <p className="shrink-0 text-sm font-semibold text-[var(--primary)]">
                                            {formatScore(
                                                item.average
                                            )}
                                            %
                                        </p>
                                    </div>

                                    <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[var(--surface-secondary)]">
                                        <motion.div
                                            initial={{
                                                width: 0,
                                            }}
                                            animate={{
                                                width: `${clamp(
                                                    item.average
                                                )}%`,
                                            }}
                                            transition={{
                                                duration: 0.65,
                                                delay:
                                                    0.1 +
                                                    index *
                                                        0.04,
                                            }}
                                            className="h-full rounded-full bg-[var(--primary)]"
                                        />
                                    </div>

                                    <div className="mt-4 grid grid-cols-4 gap-2">
                                        <MiniScore
                                            label="Points"
                                            value={
                                                item.points
                                            }
                                        />

                                        <MiniScore
                                            label="Cooperation"
                                            value={
                                                item.cooperation
                                            }
                                        />

                                        <MiniScore
                                            label="Attention"
                                            value={
                                                item.attentiveness
                                            }
                                        />

                                        <MiniScore
                                            label="Contribution"
                                            value={
                                                item.contribution
                                            }
                                        />
                                    </div>
                                </motion.div>
                            )
                        )}
                </div>
            )}

            {items.length >
                8 && (
                <p className="mt-4 text-xs text-[var(--muted)]">
                    Showing the latest 8
                    recorded classes.
                </p>
            )}
        </section>
    );
}

function MiniScore({
    label,
    value,
}) {
    return (
        <div className="rounded-lg bg-[var(--surface-secondary)] p-2">
            <p className="truncate text-[9px] uppercase tracking-wide text-[var(--muted)]">
                {label}
            </p>

            <p className="mt-1 text-xs font-semibold">
                {formatScore(value)}
            </p>
        </div>
    );
}

function AssessmentPerformance({
    tests,
    examinations,
}) {
    return (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <SectionHeading
                icon={BarChart3}
                eyebrow="Assessments"
                title="Assessment performance"
            />

            <div className="mt-6 space-y-6">
                <AssessmentGroup
                    title="Class tests"
                    icon={FileText}
                    items={tests}
                    emptyText="No completed class tests yet."
                />

                <AssessmentGroup
                    title="Examinations"
                    icon={GraduationCap}
                    items={examinations}
                    emptyText="No completed examinations yet."
                    examination
                />
            </div>
        </section>
    );
}

function AssessmentGroup({
    title,
    icon: Icon,
    items,
    emptyText,
    examination = false,
}) {
    return (
        <div>
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[var(--primary)]" />

                    <p className="text-sm font-semibold">
                        {title}
                    </p>
                </div>

                <span className="text-xs text-[var(--muted)]">
                    {items.length}
                </span>
            </div>

            {items.length ===
            0 ? (
                <p className="mt-3 rounded-xl bg-[var(--surface-secondary)] px-4 py-3 text-xs text-[var(--muted)]">
                    {emptyText}
                </p>
            ) : (
                <div className="mt-3 space-y-2">
                    {items
                        .slice(0, 5)
                        .map(
                            (
                                item,
                                index
                            ) => (
                                <div
                                    key={
                                        item.id ||
                                        index
                                    }
                                    className="flex items-center justify-between gap-4 rounded-xl border border-[var(--border)] px-4 py-3"
                                >
                                    <div className="min-w-0">
                                        <p className="truncate text-sm font-medium">
                                            {
                                                item.title
                                            }
                                        </p>

                                        <p className="mt-1 truncate text-xs text-[var(--muted)]">
                                            {examination
                                                ? item.levelName ||
                                                  "Examination"
                                                : item.className ||
                                                  "Class test"}
                                        </p>
                                    </div>

                                    <div className="shrink-0 text-right">
                                        <p className="text-sm font-semibold">
                                            {formatScore(
                                                item.score
                                            )}
                                            %
                                        </p>

                                        <p
                                            className={`mt-0.5 text-[10px] font-medium ${
                                                item.score >=
                                                50
                                                    ? "text-[var(--success)]"
                                                    : "text-[var(--danger)]"
                                            }`}
                                        >
                                            {item.score >=
                                            50
                                                ? "Pass"
                                                : "Below pass"}
                                        </p>
                                    </div>
                                </div>
                            )
                        )}
                </div>
            )}
        </div>
    );
}

function AttendanceSection({
    attendance,
}) {
    const rate =
        getAttendanceRate(
            attendance
        );

    const present =
        attendance.filter(
            (item) =>
                item.status ===
                "present"
        ).length;

    const absent =
        attendance.filter(
            (item) =>
                item.status ===
                "absent"
        ).length;

    const excused =
        attendance.filter(
            (item) =>
                item.status ===
                "excused"
        ).length;

    return (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <SectionHeading
                icon={CalendarCheck2}
                eyebrow="Participation"
                title="Attendance"
            />

            {attendance.length ===
            0 ? (
                <SmallEmptyState
                    icon={CalendarCheck2}
                    text="Attendance records will appear here when they are entered by the academy."
                />
            ) : (
                <>
                    <div className="mt-6 rounded-2xl bg-[var(--surface-secondary)] p-5">
                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-xs text-[var(--muted)]">
                                    Attendance rate
                                </p>

                                <p className="mt-1 text-3xl font-semibold">
                                    {formatScore(
                                        rate
                                    )}
                                    %
                                </p>
                            </div>

                            <Target className="h-6 w-6 text-[var(--primary)]" />
                        </div>

                        <div className="mt-4 h-2 overflow-hidden rounded-full bg-[var(--surface)]">
                            <motion.div
                                initial={{
                                    width: 0,
                                }}
                                animate={{
                                    width: `${clamp(
                                        rate
                                    )}%`,
                                }}
                                transition={{
                                    duration: 0.8,
                                }}
                                className="h-full rounded-full bg-[var(--primary)]"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-3 gap-2">
                        <AttendanceStat
                            label="Present"
                            value={
                                present
                            }
                        />

                        <AttendanceStat
                            label="Absent"
                            value={
                                absent
                            }
                        />

                        <AttendanceStat
                            label="Excused"
                            value={
                                excused
                            }
                        />
                    </div>

                    <div className="mt-5 space-y-2">
                        {attendance
                            .slice(0, 5)
                            .map(
                                (
                                    item,
                                    index
                                ) => (
                                    <div
                                        key={
                                            item.id ||
                                            index
                                        }
                                        className="flex items-center justify-between gap-3 border-b border-[var(--border)] py-3 last:border-0"
                                    >
                                        <div className="min-w-0">
                                            <p className="truncate text-sm font-medium">
                                                {
                                                    item.className
                                                }
                                            </p>

                                            <p className="mt-1 text-xs text-[var(--muted)]">
                                                {formatDate(
                                                    item.date
                                                )}
                                            </p>
                                        </div>

                                        <AttendanceBadge
                                            status={
                                                item.status
                                            }
                                        />
                                    </div>
                                )
                            )}
                    </div>
                </>
            )}
        </section>
    );
}

function AttendanceStat({
    label,
    value,
}) {
    return (
        <div className="rounded-xl border border-[var(--border)] p-3 text-center">
            <p className="text-lg font-semibold">
                {value}
            </p>

            <p className="mt-1 text-[10px] text-[var(--muted)]">
                {label}
            </p>
        </div>
    );
}

function AttendanceBadge({
    status,
}) {
    const config = {
        present: {
            label: "Present",
            className:
                "bg-[var(--success)]/10 text-[var(--success)]",
        },

        absent: {
            label: "Absent",
            className:
                "bg-[var(--danger)]/10 text-[var(--danger)]",
        },

        excused: {
            label: "Excused",
            className:
                "bg-[var(--warning)]/10 text-[var(--warning)]",
        },
    };

    const current =
        config[status] ||
        {
            label: capitalize(
                status
            ),
            className:
                "bg-[var(--surface-secondary)] text-[var(--muted)]",
        };

    return (
        <span
            className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${current.className}`}
        >
            {current.label}
        </span>
    );
}

function AcademicSnapshot({
    result,
    promotions,
    certificates,
}) {
    const latestPromotion =
        promotions[
            promotions.length - 1
        ];

    const latestCertificate =
        certificates[
            certificates.length - 1
        ];

    const hasPassed =
        result &&
        (
            result.status ===
                "passed" ||
            result.status ===
                "finalized" ||
            result.overallScore >=
                50
        );

    return (
        <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-6">
            <SectionHeading
                icon={Trophy}
                eyebrow="Academic journey"
                title="Your progress"
            />

            <div className="mt-6 space-y-3">
                <JourneyRow
                    icon={BarChart3}
                    title="Current result"
                    description={
                        result
                            ? `${formatScore(
                                  result.overallScore
                              )}% · Grade ${
                                  result.grade
                              }`
                            : "No finalized result yet"
                    }
                    positive={
                        Boolean(
                            result
                        )
                    }
                />

                <JourneyRow
                    icon={TrendingUp}
                    title="Promotion"
                    description={
                        latestPromotion
                            ? capitalize(
                                  latestPromotion.status
                              )
                            : "No promotion record yet"
                    }
                    positive={
                        latestPromotion?.status ===
                        "approved"
                    }
                />

                <JourneyRow
                    icon={Award}
                    title="Certificate"
                    description={
                        latestCertificate
                            ? capitalize(
                                  latestCertificate.status
                              )
                            : "No certificate issued yet"
                    }
                    positive={
                        latestCertificate?.status ===
                        "issued"
                    }
                />
            </div>

            <div className="mt-6 rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                    Keep going
                </p>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {hasPassed
                        ? "Your current performance meets the passing requirement. Continue building consistency across every part of your learning experience."
                        : result
                          ? "Focus on your classes and assessments, and keep improving consistently throughout the level."
                          : "Your detailed academic performance will become clearer as classes, assessments and results are recorded."}
                </p>
            </div>
        </section>
    );
}

function JourneyRow({
    icon: Icon,
    title,
    description,
    positive,
}) {
    return (
        <div className="flex items-center gap-3 rounded-xl border border-[var(--border)] p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                <Icon className="h-4 w-4 text-[var(--primary)]" />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold">
                    {title}
                </p>

                <p className="mt-1 truncate text-xs text-[var(--muted)]">
                    {description}
                </p>
            </div>

            {positive ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-[var(--success)]" />
            ) : (
                <ChevronRight className="h-4 w-4 shrink-0 text-[var(--muted)]" />
            )}
        </div>
    );
}

function SectionHeading({
    icon: Icon,
    eyebrow,
    title,
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                <Icon className="h-4 w-4 text-[var(--primary)]" />
            </div>

            <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--muted)]">
                    {eyebrow}
                </p>

                <h2 className="mt-0.5 text-lg font-semibold">
                    {title}
                </h2>
            </div>
        </div>
    );
}

function SmallEmptyState({
    icon: Icon,
    text,
}) {
    return (
        <div className="mt-6 rounded-xl bg-[var(--surface-secondary)] p-5">
            <Icon className="h-5 w-5 text-[var(--muted)]" />

            <p className="mt-3 text-xs leading-5 text-[var(--muted)]">
                {text}
            </p>
        </div>
    );
}

function getAverage(values) {
    const valid = values.filter(
        (value) =>
            Number.isFinite(
                Number(value)
            )
    );

    if (!valid.length) {
        return 0;
    }

    return (
        valid.reduce(
            (sum, value) =>
                sum + Number(value),
            0
        ) / valid.length
    );
}

function getAttendanceRate(
    attendance
) {
    if (!attendance.length) {
        return 0;
    }

    const present =
        attendance.filter(
            (item) =>
                item.status ===
                "present"
        ).length;

    return (
        (present /
            attendance.length) *
        100
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
                    Loading your performance
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                    Preparing your academic overview...
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
                    Unable to load performance
                </h1>

                <p className="mt-2 text-sm leading-6 text-[var(--muted)]">
                    {message}
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-center">
                    <button
                        type="button"
                        onClick={
                            onRetry
                        }
                        className="rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
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

