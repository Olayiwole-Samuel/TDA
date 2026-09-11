"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
    ArrowRight,
    BookOpen,
    CalendarDays,
    CheckCircle2,
    Clock3,
    GraduationCap,
    Loader2,
    MessageCircle,
    PlayCircle,
    Sparkles,
    Trophy,
    Video,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

function getFirstName(name) {
    if (!name || typeof name !== "string") return "Student";

    const trimmed = name.trim();

    if (!trimmed) return "Student";

    return trimmed.split(/\s+/)[0];
}

function normalizeObject(value) {
    if (!value) return null;

    if (Array.isArray(value)) {
        return value[0] || null;
    }

    if (typeof value === "object") {
        return value;
    }

    return null;
}

function normalizeOverview(data) {
    if (!data) return {};

    if (Array.isArray(data)) {
        return data[0] || {};
    }

    if (typeof data === "object") {
        return data;
    }

    return {};
}

function formatDate(value) {
    if (!value) return "Not available";

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return "Not available";
    }

    return new Intl.DateTimeFormat("en", {
        day: "numeric",
        month: "short",
        year: "numeric",
    }).format(date);
}

function getStatusLabel(value) {
    if (!value) return "Not started";

    return String(value)
        .replace(/_/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function getProgressValue(value) {
    const number = Number(value);

    if (Number.isNaN(number)) return 0;

    return Math.min(100, Math.max(0, number));
}

function StatusPill({ status }) {
    const normalized = String(status || "").toLowerCase();

    const positive =
        normalized.includes("active") ||
        normalized.includes("complete") ||
        normalized.includes("passed") ||
        normalized.includes("approved") ||
        normalized.includes("ongoing");

    const warning =
        normalized.includes("pending") ||
        normalized.includes("waiting") ||
        normalized.includes("progress");

    const classes = positive
        ? "bg-purple-bright/10 text-purple-bright border-purple-bright/20"
        : warning
          ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          : "bg-surface-secondary text-muted border-border";

    return (
        <span
            className={`inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-medium ${classes}`}
        >
            {getStatusLabel(status)}
        </span>
    );
}

function QuickAction({
    href,
    icon: Icon,
    title,
    description,
}) {
    return (
        <Link href={href} className="group block">
            <motion.div
                whileHover={{ y: -3 }}
                transition={{ duration: 0.2 }}
                className="
                    flex items-center gap-4
                    rounded-2xl
                    border border-border
                    bg-surface
                    p-4
                    transition-colors
                    hover:border-purple-bright/30
                    hover:bg-surface-secondary
                "
            >
                <div
                    className="
                        flex h-11 w-11 shrink-0 items-center justify-center
                        rounded-xl
                        bg-purple-bright/10
                        text-purple-bright
                        transition-colors
                        group-hover:bg-purple-bright
                        group-hover:text-white
                    "
                >
                    <Icon className="h-5 w-5" />
                </div>

                <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold">{title}</p>

                    <p className="mt-1 text-xs leading-5 text-muted">
                        {description}
                    </p>
                </div>

                <ArrowRight
                    className="
                        h-4 w-4 shrink-0
                        text-muted-light
                        transition-transform
                        group-hover:translate-x-1
                        group-hover:text-purple-bright
                    "
                />
            </motion.div>
        </Link>
    );
}

export default function StudentDashboardPage() {
    const [overview, setOverview] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        async function loadDashboard() {
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
                    if (mounted) {
                        setError("Your session could not be found.");
                    }

                    return;
                }

                const [
                    overviewResult,
                    profileResult,
                ] = await Promise.all([
                    supabase.rpc("get_my_academic_overview"),
                    supabase.rpc("get_my_profile"),
                ]);

                if (overviewResult.error) {
                    throw overviewResult.error;
                }

                if (!mounted) return;

                const normalizedOverview = normalizeOverview(
                    overviewResult.data
                );

                const normalizedProfile = normalizeObject(
                    profileResult.data
                );

                setOverview(normalizedOverview);
                setProfile(normalizedProfile);
            } catch (err) {
                console.error("Student dashboard error:", err);

                if (mounted) {
                    setError(
                        err?.message ||
                            "Unable to load your dashboard right now."
                    );
                }
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        }

        loadDashboard();

        return () => {
            mounted = false;
        };
    }, []);

    const dashboardData = useMemo(() => {
        const overviewProfile =
            normalizeObject(overview?.profile) ||
            normalizeObject(overview?.student);

        const session =
            normalizeObject(overview?.session) ||
            normalizeObject(overview?.academic_session);

        const enrollment = normalizeObject(overview?.enrollment);

        const level = normalizeObject(overview?.level);

        const result = normalizeObject(overview?.result);

        const promotion = normalizeObject(overview?.promotion);

        const waitingList =
            normalizeObject(overview?.waiting_list) ||
            normalizeObject(overview?.waitingList);

        const fullName =
            profile?.full_name ||
            overviewProfile?.full_name ||
            overview?.full_name ||
            "Student";

        return {
            fullName,
            session,
            enrollment,
            level,
            result,
            promotion,
            waitingList,
        };
    }, [overview, profile]);

    const firstName = getFirstName(dashboardData.fullName);

    const levelProgress = getProgressValue(
        dashboardData.enrollment?.progress ??
            dashboardData.enrollment?.completion_percentage ??
            dashboardData.level?.progress ??
            0
    );

    const levelName =
        dashboardData.level?.name ||
        dashboardData.level?.title ||
        dashboardData.enrollment?.level_name ||
        "Your current level";

    const enrollmentStatus =
        dashboardData.enrollment?.status ||
        dashboardData.enrollment?.enrollment_status ||
        "active";

    const sessionName =
        dashboardData.session?.name ||
        dashboardData.session?.title ||
        "Current Academic Session";

    const nextClass =
        normalizeObject(overview?.next_class) ||
        normalizeObject(overview?.nextClass);

    const recentClass =
        normalizeObject(overview?.recent_class) ||
        normalizeObject(overview?.recentClass);

    const stats = {
        classes:
            overview?.statistics?.classes ??
            overview?.stats?.classes ??
            overview?.classes_count ??
            0,

        completedClasses:
            overview?.statistics?.completed_classes ??
            overview?.stats?.completed_classes ??
            overview?.completed_classes ??
            0,

        tests:
            overview?.statistics?.tests ??
            overview?.stats?.tests ??
            overview?.tests_count ??
            0,

        average:
            dashboardData.result?.average ??
            dashboardData.result?.score ??
            overview?.statistics?.average ??
            overview?.stats?.average ??
            null,
    };

    if (loading) {
        return (
            <div className="flex min-h-[70vh] items-center justify-center">
                <div className="flex flex-col items-center">
                    <div
                        className="
                            flex h-12 w-12 items-center justify-center
                            rounded-2xl
                            bg-purple-bright/10
                            text-purple-bright
                        "
                    >
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>

                    <p className="mt-4 text-sm font-medium">
                        Loading your academy...
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        Preparing your learning space.
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-4 sm:p-6 lg:p-8">
                <div
                    className="
                        mx-auto max-w-xl
                        rounded-3xl
                        border border-border
                        bg-surface
                        p-8
                        text-center
                    "
                >
                    <div
                        className="
                            mx-auto flex h-12 w-12 items-center justify-center
                            rounded-2xl
                            bg-danger/10
                            text-danger
                        "
                    >
                        !
                    </div>

                    <h1 className="mt-5 text-xl font-semibold">
                        We couldn't load your dashboard
                    </h1>

                    <p className="mt-2 text-sm leading-6 text-muted">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() => window.location.reload()}
                        className="
                            mt-6 rounded-xl
                            bg-purple-bright
                            px-5 py-3
                            text-sm font-semibold text-white
                            transition-colors
                            hover:bg-purple-highlight
                        "
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 sm:p-6 lg:p-8">
            <div className="mx-auto max-w-7xl">
                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45 }}
                    className="
                        relative overflow-hidden
                        rounded-[2rem]
                        border border-border
                        bg-surface
                        p-6 sm:p-8 lg:p-10
                    "
                >
                    <div
                        className="
                            pointer-events-none
                            absolute -right-20 -top-24
                            h-72 w-72
                            rounded-full
                            bg-purple-bright/10
                            blur-3xl
                        "
                    />

                    <div
                        className="
                            pointer-events-none
                            absolute -bottom-32 left-1/3
                            h-64 w-64
                            rounded-full
                            bg-purple-soft/10
                            blur-3xl
                        "
                    />

                    <div className="relative">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className="
                                    inline-flex items-center gap-2
                                    rounded-full
                                    border border-purple-bright/20
                                    bg-purple-bright/10
                                    px-3 py-1.5
                                    text-[11px] font-medium
                                    text-purple-bright
                                "
                            >
                                <Sparkles className="h-3.5 w-3.5" />
                                Triumphant Discipleship Academy
                            </span>

                            {dashboardData.enrollment && (
                                <StatusPill status={enrollmentStatus} />
                            )}
                        </div>

                        <h1
                            className="
                                mt-5
                                max-w-3xl
                                text-3xl font-semibold
                                tracking-[-0.04em]
                                sm:text-4xl
                                lg:text-5xl
                            "
                        >
                            Welcome back,{" "}
                            <span className="text-purple-bright">
                                {firstName}
                            </span>
                            .
                        </h1>

                        <p
                            className="
                                mt-4 max-w-2xl
                                text-sm leading-6
                                text-muted
                                sm:text-base
                            "
                        >
                            Keep growing in knowledge, character, faith and
                            purpose. Your next step in the Academy is waiting
                            for you.
                        </p>

                        <div className="mt-7 flex flex-wrap gap-3">
                            <Link
                                href="/student/classes"
                                className="
                                    inline-flex items-center gap-2
                                    rounded-xl
                                    bg-purple-bright
                                    px-5 py-3
                                    text-sm font-semibold
                                    text-white
                                    shadow-lg
                                    shadow-purple-bright/15
                                    transition-all
                                    hover:-translate-y-0.5
                                    hover:bg-purple-highlight
                                "
                            >
                                <BookOpen className="h-4 w-4" />
                                Continue learning
                            </Link>

                            <Link
                                href="/student/performance"
                                className="
                                    inline-flex items-center gap-2
                                    rounded-xl
                                    border border-border
                                    bg-surface
                                    px-5 py-3
                                    text-sm font-semibold
                                    transition-colors
                                    hover:border-purple-bright/30
                                    hover:bg-surface-secondary
                                "
                            >
                                View performance
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    </div>
                </motion.section>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.08 }}
                    className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4"
                >
                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted">
                                    Current level
                                </p>

                                <p className="mt-2 text-lg font-semibold">
                                    {levelName}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                <GraduationCap className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted">
                                    Classes
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.classes}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                <BookOpen className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted">
                                    Completed
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.completedClasses}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                <CheckCircle2 className="h-5 w-5" />
                            </div>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-border bg-surface p-5">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs text-muted">
                                    Average score
                                </p>

                                <p className="mt-2 text-2xl font-semibold">
                                    {stats.average !== null &&
                                    stats.average !== undefined
                                        ? `${Number(stats.average).toFixed(0)}%`
                                        : "—"}
                                </p>
                            </div>

                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                <Trophy className="h-5 w-5" />
                            </div>
                        </div>
                    </div>
                </motion.div>

                <div className="mt-8 grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.14 }}
                        className="
                            rounded-3xl
                            border border-border
                            bg-surface
                            p-6
                            sm:p-7
                        "
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-purple-bright">
                                    Your progress
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    {levelName}
                                </h2>

                                <p className="mt-1 text-sm text-muted">
                                    {sessionName}
                                </p>
                            </div>

                            <Link
                                href="/student/performance"
                                className="
                                    hidden items-center gap-1
                                    text-xs font-medium
                                    text-purple-bright
                                    sm:flex
                                "
                            >
                                Details
                                <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                        </div>

                        <div className="mt-8">
                            <div className="flex items-center justify-between gap-4">
                                <span className="text-sm text-muted">
                                    Level progress
                                </span>

                                <span className="text-sm font-semibold">
                                    {levelProgress}%
                                </span>
                            </div>

                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-secondary">
                                <motion.div
                                    initial={{ width: 0 }}
                                    animate={{
                                        width: `${levelProgress}%`,
                                    }}
                                    transition={{
                                        duration: 0.8,
                                        ease: "easeOut",
                                    }}
                                    className="h-full rounded-full bg-purple-bright"
                                />
                            </div>
                        </div>

                        <div className="mt-8 grid gap-3 sm:grid-cols-3">
                            <div className="rounded-2xl bg-surface-secondary p-4">
                                <p className="text-xs text-muted">
                                    Session
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                    {sessionName}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-surface-secondary p-4">
                                <p className="text-xs text-muted">
                                    Enrollment
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                    {getStatusLabel(enrollmentStatus)}
                                </p>
                            </div>

                            <div className="rounded-2xl bg-surface-secondary p-4">
                                <p className="text-xs text-muted">
                                    Promotion
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                    {dashboardData.promotion
                                        ? getStatusLabel(
                                              dashboardData.promotion.status
                                          )
                                        : "Not available"}
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.2 }}
                        className="
                            rounded-3xl
                            border border-border
                            bg-surface
                            p-6
                            sm:p-7
                        "
                    >
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                <CalendarDays className="h-5 w-5" />
                            </div>

                            <div>
                                <p className="text-xs text-muted">
                                    Academic session
                                </p>

                                <h2 className="mt-1 text-base font-semibold">
                                    {sessionName}
                                </h2>
                            </div>
                        </div>

                        {dashboardData.session ? (
                            <div className="mt-6 space-y-4">
                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-muted">
                                        Start date
                                    </span>

                                    <span className="text-sm font-medium">
                                        {formatDate(
                                            dashboardData.session.start_date ||
                                                dashboardData.session.startDate
                                        )}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <span className="text-sm text-muted">
                                        End date
                                    </span>

                                    <span className="text-sm font-medium">
                                        {formatDate(
                                            dashboardData.session.end_date ||
                                                dashboardData.session.endDate
                                        )}
                                    </span>
                                </div>

                                <div className="border-t border-border pt-4">
                                    <StatusPill
                                        status={
                                            dashboardData.session.status ||
                                            "active"
                                        }
                                    />
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl bg-surface-secondary p-5">
                                <p className="text-sm font-medium">
                                    No active session information yet.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted">
                                    Your academic session details will appear
                                    here once they are available.
                                </p>
                            </div>
                        )}
                    </motion.section>
                </div>

                <div className="mt-8 grid gap-6 lg:grid-cols-2">
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.24 }}
                        className="
                            rounded-3xl
                            border border-border
                            bg-surface
                            p-6
                            sm:p-7
                        "
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-purple-bright">
                                    Up next
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    Next class
                                </h2>
                            </div>

                            <Clock3 className="h-5 w-5 text-muted" />
                        </div>

                        {nextClass ? (
                            <div className="mt-6 rounded-2xl bg-surface-secondary p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                        <PlayCircle className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold">
                                            {nextClass.title ||
                                                nextClass.name ||
                                                "Upcoming class"}
                                        </h3>

                                        <p className="mt-1 text-xs leading-5 text-muted">
                                            {nextClass.topic ||
                                                nextClass.description ||
                                                "Your next learning session."}
                                        </p>

                                        {(nextClass.start_at ||
                                            nextClass.startAt ||
                                            nextClass.date) && (
                                            <p className="mt-3 text-xs font-medium text-purple-bright">
                                                {formatDate(
                                                    nextClass.start_at ||
                                                        nextClass.startAt ||
                                                        nextClass.date
                                                )}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl bg-surface-secondary p-6">
                                <p className="text-sm font-medium">
                                    No upcoming class yet.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted">
                                    New classes will appear here when they are
                                    scheduled.
                                </p>
                            </div>
                        )}
                    </motion.section>

                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.28 }}
                        className="
                            rounded-3xl
                            border border-border
                            bg-surface
                            p-6
                            sm:p-7
                        "
                    >
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-xs font-medium text-purple-bright">
                                    Continue
                                </p>

                                <h2 className="mt-1 text-xl font-semibold">
                                    Recent class
                                </h2>
                            </div>

                            <Video className="h-5 w-5 text-muted" />
                        </div>

                        {recentClass ? (
                            <div className="mt-6 rounded-2xl bg-surface-secondary p-5">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-purple-bright/10 text-purple-bright">
                                        <Video className="h-5 w-5" />
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="text-sm font-semibold">
                                            {recentClass.title ||
                                                recentClass.name ||
                                                "Recent class"}
                                        </h3>

                                        <p className="mt-1 text-xs leading-5 text-muted">
                                            {recentClass.description ||
                                                "Continue reviewing your recent learning content."}
                                        </p>

                                        <Link
                                            href={
                                                recentClass.id
                                                    ? `/student/classes/${recentClass.id}`
                                                    : "/student/classes"
                                            }
                                            className="
                                                mt-4 inline-flex items-center gap-2
                                                text-xs font-semibold
                                                text-purple-bright
                                            "
                                        >
                                            Open class
                                            <ArrowRight className="h-3.5 w-3.5" />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-6 rounded-2xl bg-surface-secondary p-6">
                                <p className="text-sm font-medium">
                                    No recent class yet.
                                </p>

                                <p className="mt-1 text-xs leading-5 text-muted">
                                    Your recently accessed classes will appear
                                    here.
                                </p>
                            </div>
                        )}
                    </motion.section>
                </div>

                {dashboardData.waitingList && (
                    <motion.section
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45, delay: 0.32 }}
                        className="
                            mt-8
                            rounded-3xl
                            border border-amber-500/20
                            bg-amber-500/5
                            p-6
                            sm:p-7
                        "
                    >
                        <div className="flex items-start gap-4">
                            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                <Clock3 className="h-5 w-5" />
                            </div>

                            <div>
                                <h2 className="text-base font-semibold">
                                    You are currently on the waiting list
                                </h2>

                                <p className="mt-1 max-w-2xl text-sm leading-6 text-muted">
                                    Your current level is closed for new
                                    participation. You will be able to continue
                                    when the current session has been completed.
                                </p>
                            </div>
                        </div>
                    </motion.section>
                )}

                <motion.section
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.45, delay: 0.36 }}
                    className="mt-8"
                >
                    <div className="mb-4">
                        <p className="text-xs font-medium text-purple-bright">
                            Quick access
                        </p>

                        <h2 className="mt-1 text-xl font-semibold">
                            Keep moving forward
                        </h2>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                        <QuickAction
                            href="/student/classes"
                            icon={BookOpen}
                            title="My classes"
                            description="Continue with your learning content."
                        />

                        <QuickAction
                            href="/student/tests"
                            icon={CheckCircle2}
                            title="Class tests"
                            description="Review available tests and assessments."
                        />

                        <QuickAction
                            href="/student/examinations"
                            icon={GraduationCap}
                            title="Examinations"
                            description="View your available examinations."
                        />

                        <QuickAction
                            href="/student/questions"
                            icon={MessageCircle}
                            title="Ask a question"
                            description="Reach out to the Academy team."
                        />
                    </div>
                </motion.section>
            </div>
        </div>
    );
}