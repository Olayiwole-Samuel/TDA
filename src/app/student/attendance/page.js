"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import {
    ArrowLeft,
    ArrowRight,
    CalendarCheck2,
    CheckCircle2,
    ChevronDown,
    Clock3,
    FileText,
    Loader2,
    Search,
    Target,
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

function formatDate(value) {
    if (!value) return "—";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "—";
    }

    return date.toLocaleDateString(
        undefined,
        {
            weekday: "short",
            day: "numeric",
            month: "short",
            year: "numeric",
        }
    );
}

function getDateValue(value) {
    if (!value) return 0;

    const date = new Date(value);

    return Number.isNaN(date.getTime())
        ? 0
        : date.getTime();
}

function normalizeAttendance(item) {
    return {
        id: item.id,

        className:
            item.class_name ||
            item.class_title ||
            item.class ||
            item.title ||
            "Class",

        topicName:
            item.topic_name ||
            item.topic_title ||
            item.topic ||
            "",

        status:
            String(
                item.attendance_status ||
                    item.status ||
                    "present"
            ).toLowerCase(),

        date:
            item.attendance_date ||
            item.date ||
            item.created_at ||
            null,

        notes:
            item.notes ||
            "",
    };
}

function normalizePerformance(value) {
    const raw = unwrap(value);

    if (!raw) {
        return {
            attendance: [],
            level: null,
            enrollment: null,
        };
    }

    const source =
        raw.performance ||
        raw.academic_performance ||
        raw;

    return {
        attendance: asArray(
            source.attendance
        ).map(
            normalizeAttendance
        ),

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
    };
}

export default function StudentAttendancePage() {
    const [data, setData] =
        useState(null);

    const [loading, setLoading] =
        useState(true);

    const [error, setError] =
        useState("");

    const [filter, setFilter] =
        useState("all");

    const [search, setSearch] =
        useState("");

    const loadAttendance =
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
                    "Attendance loading error:",
                    err
                );

                setError(
                    err?.message ||
                        "Unable to load your attendance."
                );
            } finally {
                setLoading(false);
            }
        }, []);

    useEffect(() => {
        loadAttendance();
    }, [loadAttendance]);

    const attendance =
        useMemo(() => {
            const records =
                data?.attendance || [];

            return [...records].sort(
                (a, b) =>
                    getDateValue(
                        b.date
                    ) -
                    getDateValue(
                        a.date
                    )
            );
        }, [data]);

    const filteredAttendance =
        useMemo(() => {
            const normalizedSearch =
                search
                    .trim()
                    .toLowerCase();

            return attendance.filter(
                (item) => {
                    const matchesFilter =
                        filter === "all" ||
                        item.status ===
                            filter;

                    if (
                        !matchesFilter
                    ) {
                        return false;
                    }

                    if (
                        !normalizedSearch
                    ) {
                        return true;
                    }

                    return (
                        item.className
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            ) ||
                        item.topicName
                            .toLowerCase()
                            .includes(
                                normalizedSearch
                            )
                    );
                }
            );
        }, [
            attendance,
            filter,
            search,
        ]);

    const stats =
        useMemo(() => {
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

            const total =
                attendance.length;

            const rate =
                total > 0
                    ? (present /
                          total) *
                      100
                    : 0;

            return {
                present,
                absent,
                excused,
                total,
                rate,
            };
        }, [attendance]);

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <ErrorState
                message={error}
                onRetry={loadAttendance}
            />
        );
    }

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)]">
            <main className="mx-auto w-full max-w-7xl px-5 py-8 sm:px-7 lg:px-10 lg:py-10">
                <PageHeader
                    level={data?.level}
                    enrollment={
                        data?.enrollment
                    }
                />

                <AttendanceHero
                    stats={stats}
                />

                <StatsGrid
                    stats={stats}
                />

                {attendance.length ===
                0 ? (
                    <EmptyAttendance />
                ) : (
                    <AttendanceRecords
                        records={
                            filteredAttendance
                        }
                        total={
                            attendance.length
                        }
                        filter={filter}
                        setFilter={
                            setFilter
                        }
                        search={search}
                        setSearch={
                            setSearch
                        }
                    />
                )}
            </main>
        </div>
    );
}

function PageHeader({
    level,
    enrollment,
}) {
    const levelName =
        level?.name ||
        level?.title ||
        "";

    const sessionName =
        enrollment?.session_name ||
        enrollment?.session ||
        "";

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
                <div className="flex flex-wrap items-center gap-2">
                    {levelName && (
                        <span className="rounded-full bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-semibold text-[var(--primary)]">
                            {levelName}
                        </span>
                    )}

                    {sessionName && (
                        <span className="text-xs text-[var(--muted)]">
                            {sessionName}
                        </span>
                    )}
                </div>

                <p className="mt-5 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--primary)]">
                    Participation
                </p>

                <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
                    Attendance
                </h1>

                <p className="mt-3 max-w-2xl text-sm leading-7 text-[var(--muted)]">
                    Keep track of your class
                    attendance and participation
                    throughout your academy
                    journey.
                </p>
            </div>
        </motion.div>
    );
}

function AttendanceHero({
    stats,
}) {
    const rate = stats.rate;

    let message =
        "Your attendance record will appear here as classes are recorded.";

    if (stats.total > 0) {
        if (rate >= 90) {
            message =
                "Excellent consistency. Keep maintaining this level of participation.";
        } else if (rate >= 75) {
            message =
                "You are maintaining a good attendance record. Keep building consistency.";
        } else if (rate >= 50) {
            message =
                "There is room to improve your attendance. Stay consistent with your classes.";
        } else {
            message =
                "Your attendance is currently below the recommended level. Try to stay consistent with upcoming classes.";
        }
    }

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
                <div className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[var(--primary)]/10 blur-3xl" />

                <div className="relative grid gap-8 lg:grid-cols-[1fr_auto] lg:items-center">
                    <div>
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                            <CalendarCheck2 className="h-5 w-5 text-[var(--primary)]" />
                        </div>

                        <h2 className="mt-6 text-2xl font-semibold tracking-tight sm:text-3xl">
                            Showing up matters
                        </h2>

                        <p className="mt-3 max-w-xl text-sm leading-7 text-[var(--muted)]">
                            {message}
                        </p>
                    </div>

                    <div className="flex items-center gap-5">
                        <div className="relative flex h-32 w-32 shrink-0 items-center justify-center rounded-full border-8 border-[var(--accent-soft)] sm:h-40 sm:w-40">
                            <div
                                className="absolute inset-2 rounded-full border border-[var(--border)]"
                                style={{
                                    background: `conic-gradient(var(--primary) ${Math.min(
                                        100,
                                        Math.max(
                                            0,
                                            rate
                                        )
                                    )}%, transparent 0)`,
                                    mask: "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                                    WebkitMask:
                                        "radial-gradient(farthest-side, transparent calc(100% - 5px), #000 calc(100% - 4px))",
                                }}
                            />

                            <div className="text-center">
                                <p className="text-3xl font-semibold tracking-tight sm:text-4xl">
                                    {stats.total
                                        ? formatScore(
                                              rate
                                          )
                                        : "—"}
                                </p>

                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)]">
                                    Attendance
                                </p>
                            </div>
                        </div>

                        <div className="hidden sm:block">
                            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)]">
                                Classes recorded
                            </p>

                            <p className="mt-1 text-4xl font-semibold">
                                {
                                    stats.total
                                }
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </motion.section>
    );
}

function StatsGrid({
    stats,
}) {
    const items = [
        {
            label: "Present",
            value: stats.present,
            description:
                "Classes attended",
            icon: CheckCircle2,
            tone: "success",
        },
        {
            label: "Absent",
            value: stats.absent,
            description:
                "Classes missed",
            icon: XCircle,
            tone: "danger",
        },
        {
            label: "Excused",
            value: stats.excused,
            description:
                "Approved absences",
            icon: Clock3,
            tone: "warning",
        },
        {
            label: "Total classes",
            value: stats.total,
            description:
                "Attendance records",
            icon: FileText,
            tone: "primary",
        },
    ];

    return (
        <section className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {items.map(
                (
                    item,
                    index
                ) => {
                    const Icon =
                        item.icon;

                    const toneClasses = {
                        success:
                            "bg-[var(--success)]/10 text-[var(--success)]",
                        danger:
                            "bg-[var(--danger)]/10 text-[var(--danger)]",
                        warning:
                            "bg-[var(--warning)]/10 text-[var(--warning)]",
                        primary:
                            "bg-[var(--accent-soft)] text-[var(--primary)]",
                    };

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
                                    0.1 +
                                    index *
                                        0.05,
                            }}
                            className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5"
                        >
                            <div
                                className={`flex h-10 w-10 items-center justify-center rounded-xl ${toneClasses[item.tone]}`}
                            >
                                <Icon className="h-4 w-4" />
                            </div>

                            <p className="mt-5 text-sm font-semibold">
                                {item.label}
                            </p>

                            <p className="mt-2 text-2xl font-semibold">
                                {
                                    item.value
                                }
                            </p>

                            <p className="mt-1 text-xs text-[var(--muted)]">
                                {
                                    item.description
                                }
                            </p>
                        </motion.div>
                    );
                }
            )}
        </section>
    );
}

function AttendanceRecords({
    records,
    total,
    filter,
    setFilter,
    search,
    setSearch,
}) {
    return (
        <section className="mt-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--muted)]">
                        Attendance history
                    </p>

                    <h2 className="mt-1 text-lg font-semibold">
                        Your class records
                    </h2>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                        {total}{" "}
                        {total === 1
                            ? "record"
                            : "records"}{" "}
                        available
                    </p>
                </div>

                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative">
                        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />

                        <input
                            type="text"
                            value={
                                search
                            }
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event
                                        .target
                                        .value
                                )
                            }
                            placeholder="Search classes..."
                            className="w-full rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] py-3 pl-9 pr-4 text-sm outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] sm:w-56"
                        />
                    </div>

                    <div className="relative">
                        <select
                            value={
                                filter
                            }
                            onChange={(
                                event
                            ) =>
                                setFilter(
                                    event
                                        .target
                                        .value
                                )
                            }
                            className="w-full appearance-none rounded-xl border border-[var(--border-strong)] bg-[var(--surface)] px-4 py-3 pr-10 text-sm font-medium outline-none transition focus:border-[var(--primary)] sm:w-36"
                        >
                            <option value="all">
                                All
                            </option>

                            <option value="present">
                                Present
                            </option>

                            <option value="absent">
                                Absent
                            </option>

                            <option value="excused">
                                Excused
                            </option>
                        </select>

                        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />
                    </div>
                </div>
            </div>

            {records.length ===
            0 ? (
                <div className="mt-5 rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-8 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                        <Search className="h-5 w-5 text-[var(--primary)]" />
                    </div>

                    <p className="mt-4 text-sm font-semibold">
                        No matching records
                    </p>

                    <p className="mt-1 text-xs text-[var(--muted)]">
                        Try changing your
                        search or attendance
                        filter.
                    </p>
                </div>
            ) : (
                <div className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
                    <div className="hidden grid-cols-[1fr_0.7fr_0.5fr] gap-4 border-b border-[var(--border)] px-5 py-3 text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:grid">
                        <span>
                            Class
                        </span>

                        <span>
                            Date
                        </span>

                        <span>
                            Status
                        </span>
                    </div>

                    <div className="divide-y divide-[var(--border)]">
                        {records.map(
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
                                    }}
                                    animate={{
                                        opacity: 1,
                                    }}
                                    transition={{
                                        delay:
                                            index *
                                            0.03,
                                    }}
                                    className="grid gap-3 px-5 py-4 sm:grid-cols-[1fr_0.7fr_0.5fr] sm:items-center sm:gap-4"
                                >
                                    <div className="min-w-0">
                                        <div className="flex items-start gap-3">
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[var(--accent-soft)]">
                                                <CalendarCheck2 className="h-4 w-4 text-[var(--primary)]" />
                                            </div>

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
                                        </div>

                                        {item.notes && (
                                            <p className="mt-3 rounded-lg bg-[var(--surface-secondary)] px-3 py-2 text-xs leading-5 text-[var(--muted)]">
                                                {
                                                    item.notes
                                                }
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex items-center justify-between sm:block">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:hidden">
                                            Date
                                        </span>

                                        <p className="text-xs font-medium">
                                            {formatDate(
                                                item.date
                                            )}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between sm:block">
                                        <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--muted)] sm:hidden">
                                            Status
                                        </span>

                                        <AttendanceBadge
                                            status={
                                                item.status
                                            }
                                        />
                                    </div>
                                </motion.div>
                            )
                        )}
                    </div>
                </div>
            )}
        </section>
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
        config[status] || {
            label:
                status
                    .charAt(0)
                    .toUpperCase() +
                status.slice(1),
            className:
                "bg-[var(--surface-secondary)] text-[var(--muted)]",
        };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-semibold ${current.className}`}
        >
            {status ===
                "present" && (
                <CheckCircle2 className="h-3 w-3" />
            )}

            {status ===
                "absent" && (
                <XCircle className="h-3 w-3" />
            )}

            {status ===
                "excused" && (
                <Clock3 className="h-3 w-3" />
            )}

            {current.label}
        </span>
    );
}

function EmptyAttendance() {
    return (
        <motion.section
            initial={{
                opacity: 0,
                y: 15,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            className="mt-8 rounded-[28px] border border-[var(--border)] bg-[var(--surface)] p-8 text-center sm:p-12"
        >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent-soft)]">
                <CalendarCheck2 className="h-7 w-7 text-[var(--primary)]" />
            </div>

            <h2 className="mt-6 text-xl font-semibold">
                No attendance records yet
            </h2>

            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[var(--muted)]">
                Your attendance history will
                appear here once your class
                attendance has been recorded by
                the academy.
            </p>

            <Link
                href="/student/classes"
                className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--primary)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--primary-hover)]"
            >
                View My Classes
                <ArrowRight className="h-4 w-4" />
            </Link>
        </motion.section>
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
                    Loading attendance
                </p>

                <p className="mt-1 text-xs text-[var(--muted)]">
                    Preparing your attendance record...
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
                    Unable to load attendance
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

