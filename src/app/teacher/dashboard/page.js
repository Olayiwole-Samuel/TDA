"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
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
    grid: (
        <>
            <rect x="3" y="3" width="7" height="7" rx="1.5" />
            <rect x="14" y="3" width="7" height="7" rx="1.5" />
            <rect x="3" y="14" width="7" height="7" rx="1.5" />
            <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
    ),
    book: (
        <>
            <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v17H6.5A2.5 2.5 0 0 0 4 22V5.5Z" />
            <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
        </>
    ),
    users: (
        <>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
    ),
    clipboard: (
        <>
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 4V2h6v2" />
            <path d="M9 10h6" />
            <path d="M9 14h6" />
            <path d="M9 18h4" />
        </>
    ),
    chart: (
        <>
            <path d="M4 19V5" />
            <path d="M4 19h17" />
            <path d="m7 15 4-4 3 2 5-6" />
        </>
    ),
    message: (
        <>
            <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9.4 9.4 0 0 1-4-.9L3 21l1.8-4A8.2 8.2 0 0 1 3 11.5 8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 9 8.5Z" />
            <path d="M8 12h.01" />
            <path d="M12 12h.01" />
            <path d="M16 12h.01" />
        </>
    ),
    bell: (
        <>
            <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
            <path d="M10 21h4" />
        </>
    ),
    arrow: (
        <>
            <path d="M5 12h14" />
            <path d="m13 6 6 6-6 6" />
        </>
    ),
    logout: (
        <>
            <path d="M10 17l5-5-5-5" />
            <path d="M15 12H3" />
            <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
        </>
    ),
    refresh: (
        <>
            <path d="M20 11a8 8 0 0 0-14.8-4L3 10" />
            <path d="M3 5v5h5" />
            <path d="M4 13a8 8 0 0 0 14.8 4L21 14" />
            <path d="M21 19v-5h-5" />
        </>
    ),
    plus: (
        <>
            <path d="M12 5v14" />
            <path d="M5 12h14" />
        </>
    ),
};

return <svg {...common}>{icons[name]}</svg>;

}

function getFirstName(name) {
if (!name || typeof name !== "string") return "Teacher";
return name.trim().split(/\s+/)[0] || "Teacher";
}

function normalizeArray(value) {
if (Array.isArray(value)) return value;

if (value && typeof value === "object") {
    return (
        value.data ||
        value.items ||
        value.results ||
        value.classes ||
        value.students ||
        value.tests ||
        []
    );
}

return [];

}

function getCount(value) {
if (typeof value === "number") return value;

if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
}

return 0;

}

function getValue(object, keys, fallback = null) {
if (!object || typeof object !== "object") return fallback;

for (const key of keys) {
    if (
        object[key] !== undefined &&
        object[key] !== null
    ) {
        return object[key];
    }
}

return fallback;

}

function formatDate(value) {
if (!value) return "—";

const date = new Date(value);

if (Number.isNaN(date.getTime())) return "—";

return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
}).format(date);

}

export default function TeacherDashboard() {
const [dashboard, setDashboard] = useState(null);
const [overview, setOverview] = useState(null);
const [notifications, setNotifications] = useState([]);
const [profile, setProfile] = useState(null);

const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState("");

const loadDashboard = async (isRefresh = false) => {
    try {
        if (isRefresh) {
            setRefreshing(true);
        } else {
            setLoading(true);
        }

        setError("");

        const {
            data: { user },
            error: authError,
        } = await supabase.auth.getUser();

        if (authError || !user) {
            window.location.href = "/login";
            return;
        }

        const [
            dashboardResult,
            overviewResult,
            notificationResult,
            profileResult,
        ] = await Promise.all([
            supabase.rpc("get_my_teacher_dashboard"),
            supabase.rpc("get_my_teacher_academic_overview"),
            supabase.rpc("get_my_teacher_notifications"),
            supabase.rpc("get_my_profile"),
        ]);

        if (dashboardResult.error) {
            throw dashboardResult.error;
        }

        if (overviewResult.error) {
            throw overviewResult.error;
        }

        if (notificationResult.error) {
            throw notificationResult.error;
        }

        if (profileResult.error) {
            throw profileResult.error;
        }

        setDashboard(dashboardResult.data || {});
        setOverview(overviewResult.data || {});
        setNotifications(
            normalizeArray(notificationResult.data)
        );

        const profileData = profileResult.data;

        setProfile(
            Array.isArray(profileData)
                ? profileData[0] || null
                : profileData || null
        );
    } catch (err) {
        console.error("Teacher dashboard error:", err);

        setError(
            err?.message ||
                "Unable to load the teacher dashboard."
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
};

useEffect(() => {
    loadDashboard();
}, []);

const teacherName = useMemo(() => {
    return getFirstName(
        getValue(
            profile,
            ["full_name", "fullName"],
            ""
        )
    );
}, [profile]);

const classes = useMemo(() => {
    return normalizeArray(
        getValue(
            dashboard,
            ["classes", "assigned_classes"],
            []
        )
    );
}, [dashboard]);

const students = useMemo(() => {
    return normalizeArray(
        getValue(
            dashboard,
            ["students", "active_students"],
            []
        )
    );
}, [dashboard]);

const tests = useMemo(() => {
    return normalizeArray(
        getValue(
            dashboard,
            ["tests", "teacher_tests"],
            []
        )
    );
}, [dashboard]);

const summary = useMemo(() => {
    const dashboardSummary =
        getValue(
            dashboard,
            ["summary", "statistics", "stats"],
            {}
        ) || {};

    return {
        classes: getCount(
            getValue(
                dashboardSummary,
                [
                    "classes",
                    "assigned_classes",
                    "class_count",
                ],
                classes.length
            )
        ),

        students: getCount(
            getValue(
                dashboardSummary,
                [
                    "students",
                    "active_students",
                    "student_count",
                ],
                students.length
            )
        ),

        tests: getCount(
            getValue(
                dashboardSummary,
                ["tests", "test_count"],
                tests.length
            )
        ),

        publishedTests: getCount(
            getValue(
                dashboardSummary,
                [
                    "published_tests",
                    "publishedTestCount",
                ],
                0
            )
        ),
    };
}, [dashboard, classes.length, students.length, tests.length]);

const academicLevel =
    getValue(
        overview,
        ["level", "current_level"],
        null
    );

const academicSession =
    getValue(
        overview,
        ["session", "current_session"],
        null
    );

const levelName =
    typeof academicLevel === "object"
        ? getValue(
              academicLevel,
              ["name", "title"],
              "Current Level"
          )
        : academicLevel || "Current Level";

const sessionName =
    typeof academicSession === "object"
        ? getValue(
              academicSession,
              ["name", "title"],
              "Current Session"
          )
        : academicSession || "Current Session";

const unreadNotifications = notifications.filter(
    (notification) =>
        !notification?.is_read &&
        !notification?.isRead
).length;

const recentClasses = classes.slice(0, 4);

const recentTests = tests.slice(0, 4);

const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
};

if (loading) {
    return (
        <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
            <div className="mx-auto max-w-7xl">
                <div className="animate-pulse space-y-8">
                    <div className="h-5 w-32 rounded-full bg-surface-secondary" />
                    <div className="h-12 w-80 rounded-2xl bg-surface-secondary" />
                    <div className="h-5 w-96 max-w-full rounded-full bg-surface-secondary" />

                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        {[1, 2, 3, 4].map((item) => (
                            <div
                                key={item}
                                className="h-36 rounded-3xl border border-border bg-surface"
                            />
                        ))}
                    </div>

                    <div className="grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
                        <div className="h-80 rounded-3xl border border-border bg-surface" />
                        <div className="h-80 rounded-3xl border border-border bg-surface" />
                    </div>
                </div>
            </div>
        </main>
    );
}

if (error) {
    return (
        <main className="min-h-screen bg-background px-5 py-10 sm:px-8">
            <div className="mx-auto flex min-h-[70vh] max-w-2xl items-center justify-center">
                <div className="w-full rounded-[2rem] border border-border bg-surface p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-purple-bright">
                        <Icon name="refresh" size={24} />
                    </div>

                    <h1 className="mt-5 text-2xl font-semibold tracking-tight">
                        We couldn't load your dashboard
                    </h1>

                    <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-muted">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => loadDashboard()}
                        className="mt-7 inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                    >
                        Try again
                        <Icon name="refresh" size={17} />
                    </button>
                </div>
            </div>
        </main>
    );
}

return (
    <main className="min-h-screen bg-background px-5 py-7 sm:px-8 sm:py-10">
        <div className="mx-auto max-w-7xl">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"
            >
                <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-purple-bright">
                        <span className="h-2 w-2 rounded-full bg-purple-bright" />
                        Teacher Portal
                    </div>

                    <h1 className="mt-3 text-3xl font-semibold tracking-[-0.045em] sm:text-4xl lg:text-5xl">
                        Welcome back, {teacherName}.
                    </h1>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted sm:text-base">
                        Keep track of your classes, students,
                        assessments, and teaching activity from
                        one place.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => loadDashboard(true)}
                        disabled={refreshing}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-purple-primary/20 hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <span
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        >
                            <Icon
                                name="refresh"
                                size={16}
                            />
                        </span>
                        Refresh
                    </button>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-medium transition hover:border-purple-primary/20 hover:bg-surface-secondary"
                    >
                        <Icon name="logout" size={16} />
                        Sign out
                    </button>
                </div>
            </motion.header>

            {/* Academic Context */}
            <motion.section
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                    duration: 0.45,
                    delay: 0.08,
                }}
                className="mt-8 overflow-hidden rounded-[2rem] border border-purple-primary/15 bg-surface shadow-sm"
            >
                <div className="relative p-6 sm:p-8">
                    <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full bg-purple-bright/10 blur-3xl" />

                    <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                Current academic context
                            </p>

                            <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                                {levelName}
                            </h2>

                            <p className="mt-1 text-sm text-muted">
                                {sessionName}
                            </p>
                        </div>

                        <div className="flex flex-wrap gap-2">
                            <Link
                                href="/teacher/classes"
                                className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                            >
                                View my classes
                                <Icon
                                    name="arrow"
                                    size={16}
                                />
                            </Link>
                        </div>
                    </div>
                </div>
            </motion.section>

            {/* Summary */}
            <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Assigned classes",
                        value: summary.classes,
                        icon: "book",
                        href: "/teacher/classes",
                    },
                    {
                        label: "Active students",
                        value: summary.students,
                        icon: "users",
                        href: "/teacher/students",
                    },
                    {
                        label: "Your tests",
                        value: summary.tests,
                        icon: "clipboard",
                        href: "/teacher/assessments",
                    },
                    {
                        label: "Published tests",
                        value: summary.publishedTests,
                        icon: "chart",
                        href: "/teacher/assessments",
                    },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{
                            opacity: 0,
                            y: 14,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            duration: 0.4,
                            delay:
                                0.12 + index * 0.05,
                        }}
                    >
                        <Link
                            href={item.href}
                            className="group block rounded-3xl border border-border bg-surface p-5 shadow-sm transition duration-300 hover:-translate-y-0.5 hover:border-purple-primary/20 hover:shadow-md sm:p-6"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-accent-soft text-purple-bright">
                                    <Icon
                                        name={item.icon}
                                        size={21}
                                    />
                                </div>

                                <Icon
                                    name="arrow"
                                    size={17}
                                />
                            </div>

                            <p className="mt-6 text-sm text-muted">
                                {item.label}
                            </p>

                            <p className="mt-1 text-3xl font-semibold tracking-tight">
                                {item.value}
                            </p>
                        </Link>
                    </motion.div>
                ))}
            </section>

            {/* Main Content */}
            <section className="mt-6 grid gap-6 lg:grid-cols-[1.35fr_.65fr]">
                {/* Classes */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.45,
                        delay: 0.25,
                    }}
                    className="rounded-[2rem] border border-border bg-surface shadow-sm"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border p-6 sm:p-7">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-bright">
                                Teaching
                            </p>

                            <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                Your classes
                            </h2>
                        </div>

                        <Link
                            href="/teacher/classes"
                            className="text-sm font-semibold text-purple-bright transition hover:text-purple-highlight"
                        >
                            View all
                        </Link>
                    </div>

                    {recentClasses.length > 0 ? (
                        <div className="divide-y divide-border">
                            {recentClasses.map(
                                (item, index) => {
                                    const classId =
                                        getValue(
                                            item,
                                            [
                                                "id",
                                                "class_id",
                                            ],
                                            ""
                                        );

                                    const title =
                                        getValue(
                                            item,
                                            [
                                                "title",
                                                "class_title",
                                                "name",
                                            ],
                                            "Untitled class"
                                        );

                                    const topic =
                                        getValue(
                                            item,
                                            [
                                                "topic_title",
                                                "topic_name",
                                                "topic",
                                            ],
                                            ""
                                        );

                                    const level =
                                        getValue(
                                            item,
                                            [
                                                "level_name",
                                                "level",
                                            ],
                                            ""
                                        );

                                    return (
                                        <Link
                                            key={
                                                classId ||
                                                `${title}-${index}`
                                            }
                                            href={
                                                classId
                                                    ? `/teacher/classes/${classId}`
                                                    : "/teacher/classes"
                                            }
                                            className="flex items-center justify-between gap-4 p-5 transition hover:bg-surface-secondary sm:p-6"
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-purple-bright">
                                                    <Icon
                                                        name="book"
                                                        size={19}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">
                                                        {title}
                                                    </p>

                                                    <p className="mt-1 truncate text-xs text-muted">
                                                        {[
                                                            topic,
                                                            level,
                                                        ]
                                                            .filter(
                                                                Boolean
                                                            )
                                                            .join(
                                                                " · "
                                                            ) ||
                                                            "Assigned class"}
                                                    </p>
                                                </div>
                                            </div>

                                            <Icon
                                                name="arrow"
                                                size={17}
                                            />
                                        </Link>
                                    );
                                }
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center sm:p-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-muted">
                                <Icon
                                    name="book"
                                    size={21}
                                />
                            </div>

                            <h3 className="mt-4 text-base font-semibold">
                                No classes assigned yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                                Classes assigned to your teacher
                                account will appear here.
                            </p>
                        </div>
                    )}
                </motion.section>

                {/* Quick Actions */}
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.45,
                        delay: 0.3,
                    }}
                    className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm sm:p-7"
                >
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-bright">
                        Workspace
                    </p>

                    <h2 className="mt-1 text-xl font-semibold tracking-tight">
                        Quick access
                    </h2>

                    <div className="mt-6 space-y-2">
                        {[
                            {
                                label: "Manage classes",
                                description:
                                    "View your assigned classes",
                                href: "/teacher/classes",
                                icon: "book",
                            },
                            {
                                label: "Students",
                                description:
                                    "Review students in your classes",
                                href: "/teacher/students",
                                icon: "users",
                            },
                            {
                                label: "Assessments",
                                description:
                                    "Manage tests and examinations",
                                href: "/teacher/assessments",
                                icon: "clipboard",
                            },
                            {
                                label: "Progress",
                                description:
                                    "Monitor learning progress",
                                href: "/teacher/progress",
                                icon: "chart",
                            },
                            {
                                label: "Questions",
                                description:
                                    "Respond to student questions",
                                href: "/teacher/questions",
                                icon: "message",
                            },
                        ].map((item) => (
                            <Link
                                key={item.label}
                                href={item.href}
                                className="group flex items-center gap-3 rounded-2xl p-3 transition hover:bg-surface-secondary"
                            >
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-purple-bright">
                                    <Icon
                                        name={item.icon}
                                        size={18}
                                    />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold">
                                        {item.label}
                                    </p>

                                    <p className="mt-0.5 truncate text-xs text-muted">
                                        {item.description}
                                    </p>
                                </div>

                                <Icon
                                    name="arrow"
                                    size={16}
                                />
                            </Link>
                        ))}
                    </div>
                </motion.section>
            </section>

            {/* Tests + Notifications */}
            <section className="mt-6 grid gap-6 lg:grid-cols-[1fr_1fr]">
                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.45,
                        delay: 0.35,
                    }}
                    className="rounded-[2rem] border border-border bg-surface shadow-sm"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border p-6 sm:p-7">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-bright">
                                Assessments
                            </p>

                            <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                Recent tests
                            </h2>
                        </div>

                        <Link
                            href="/teacher/assessments"
                            className="text-sm font-semibold text-purple-bright transition hover:text-purple-highlight"
                        >
                            View all
                        </Link>
                    </div>

                    {recentTests.length > 0 ? (
                        <div className="divide-y divide-border">
                            {recentTests.map(
                                (test, index) => {
                                    const testId =
                                        getValue(
                                            test,
                                            [
                                                "id",
                                                "test_id",
                                            ],
                                            ""
                                        );

                                    const title =
                                        getValue(
                                            test,
                                            [
                                                "title",
                                                "test_title",
                                                "name",
                                            ],
                                            "Untitled test"
                                        );

                                    const classTitle =
                                        getValue(
                                            test,
                                            [
                                                "class_title",
                                                "class_name",
                                            ],
                                            ""
                                        );

                                    const published =
                                        getValue(
                                            test,
                                            [
                                                "is_published",
                                                "isPublished",
                                            ],
                                            false
                                        );

                                    return (
                                        <Link
                                            key={
                                                testId ||
                                                `${title}-${index}`
                                            }
                                            href={
                                                testId
                                                    ? `/teacher/assessments/tests/${testId}`
                                                    : "/teacher/assessments"
                                            }
                                            className="flex items-center justify-between gap-4 p-5 transition hover:bg-surface-secondary sm:p-6"
                                        >
                                            <div className="flex min-w-0 items-center gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-purple-bright">
                                                    <Icon
                                                        name="clipboard"
                                                        size={18}
                                                    />
                                                </div>

                                                <div className="min-w-0">
                                                    <p className="truncate text-sm font-semibold">
                                                        {title}
                                                    </p>

                                                    <p className="mt-1 truncate text-xs text-muted">
                                                        {classTitle ||
                                                            "Class test"}
                                                    </p>
                                                </div>
                                            </div>

                                            <span
                                                className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                                                    published
                                                        ? "bg-success/10 text-success"
                                                        : "bg-surface-secondary text-muted"
                                                }`}
                                            >
                                                {published
                                                    ? "Published"
                                                    : "Draft"}
                                            </span>
                                        </Link>
                                    );
                                }
                            )}
                        </div>
                    ) : (
                        <div className="p-8 text-center sm:p-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-muted">
                                <Icon
                                    name="clipboard"
                                    size={21}
                                />
                            </div>

                            <h3 className="mt-4 text-base font-semibold">
                                No tests yet
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                                Tests you create for your assigned
                                classes will appear here.
                            </p>
                        </div>
                    )}
                </motion.section>

                <motion.section
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                        duration: 0.45,
                        delay: 0.4,
                    }}
                    className="rounded-[2rem] border border-border bg-surface shadow-sm"
                >
                    <div className="flex items-center justify-between gap-4 border-b border-border p-6 sm:p-7">
                        <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-purple-bright">
                                Updates
                            </p>

                            <h2 className="mt-1 text-xl font-semibold tracking-tight">
                                Notifications
                            </h2>
                        </div>

                        <Link
                            href="/teacher/notifications"
                            className="relative flex h-9 w-9 items-center justify-center rounded-full transition hover:bg-surface-secondary"
                        >
                            <Icon
                                name="bell"
                                size={18}
                            />

                            {unreadNotifications > 0 && (
                                <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-purple-bright" />
                            )}
                        </Link>
                    </div>

                    {notifications.length > 0 ? (
                        <div className="divide-y divide-border">
                            {notifications
                                .slice(0, 4)
                                .map(
                                    (
                                        notification,
                                        index
                                    ) => {
                                        const title =
                                            getValue(
                                                notification,
                                                [
                                                    "title",
                                                    "notification_title",
                                                ],
                                                "Notification"
                                            );

                                        const message =
                                            getValue(
                                                notification,
                                                [
                                                    "message",
                                                    "content",
                                                ],
                                                ""
                                            );

                                        const createdAt =
                                            getValue(
                                                notification,
                                                [
                                                    "created_at",
                                                    "createdAt",
                                                ],
                                                null
                                            );

                                        const isRead =
                                            getValue(
                                                notification,
                                                [
                                                    "is_read",
                                                    "isRead",
                                                ],
                                                true
                                            );

                                        return (
                                            <Link
                                                key={
                                                    notification.id ||
                                                    `${title}-${index}`
                                                }
                                                href="/teacher/notifications"
                                                className="block p-5 transition hover:bg-surface-secondary sm:p-6"
                                            >
                                                <div className="flex gap-3">
                                                    <span
                                                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                                                            isRead
                                                                ? "bg-border-strong"
                                                                : "bg-purple-bright"
                                                        }`}
                                                    />

                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold">
                                                            {title}
                                                        </p>

                                                        {message && (
                                                            <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                                                                {
                                                                    message
                                                                }
                                                            </p>
                                                        )}

                                                        <p className="mt-2 text-[11px] text-muted">
                                                            {formatDate(
                                                                createdAt
                                                            )}
                                                        </p>
                                                    </div>
                                                </div>
                                            </Link>
                                        );
                                    }
                                )}
                        </div>
                    ) : (
                        <div className="p-8 text-center sm:p-12">
                            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-surface-secondary text-muted">
                                <Icon
                                    name="bell"
                                    size={21}
                                />
                            </div>

                            <h3 className="mt-4 text-base font-semibold">
                                You're all caught up
                            </h3>

                            <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
                                New academy notifications will
                                appear here.
                            </p>
                        </div>
                    )}
                </motion.section>
            </section>

            {/* Footer note */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{
                    duration: 0.45,
                    delay: 0.45,
                }}
                className="mt-8 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between"
            >
                <p>
                    {profile?.email ||
                        "Teacher account"}
                </p>

                <p>
                    {levelName} · {sessionName}
                </p>
            </motion.div>
        </div>
    </main>
);

}   