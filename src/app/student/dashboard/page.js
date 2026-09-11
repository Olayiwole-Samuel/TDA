
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

function formatDate(value) {
    if (!value) return null;

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return null;

    return new Intl.DateTimeFormat("en", {
        month: "short",
        day: "numeric",
        year: "numeric",
    }).format(date);
}

function getFirstName(name) {
    if (!name) return "Student";
    return name.trim().split(/\s+/)[0];
}

function normalizeOverview(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    return data;
}

function ArrowIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 12h13" />
            <path d="m13 6 6 6-6 6" />
        </svg>
    );
}

function BookIcon({ size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v17H7.5A2.5 2.5 0 0 0 5 21.5z" />
            <path d="M5 4.5v17" />
            <path d="M8.5 6h7" />
            <path d="M8.5 10h7" />
        </svg>
    );
}

function TestIcon({ size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <rect x="5" y="3" width="14" height="18" rx="2" />
            <path d="M8.5 7h7" />
            <path d="m8.5 12 1.8 1.8 4.2-4.2" />
            <path d="M8.5 17h5" />
        </svg>
    );
}

function ChartIcon({ size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 19V14" />
            <path d="M10 19V10" />
            <path d="M16 19V6" />
            <path d="M22 19V3" />
        </svg>
    );
}

function MegaphoneIcon({ size = 18 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M4 13h3l9 4V7l-9 4H4a2 2 0 0 0 0 4Z" />
            <path d="M7 15v4" />
            <path d="M19 10c1 1.2 1 2.8 0 4" />
        </svg>
    );
}

function ClockIcon({ size = 17 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="8.5" />
            <path d="M12 7.5v5l3 2" />
        </svg>
    );
}

function CheckIcon({ size = 17 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6.5 12.5 3.5 3.5 7.5-8" />
        </svg>
    );
}

function StatusPill({ children, tone = "purple" }) {
    const styles = {
        purple:
            "bg-purple-bright/10 text-purple-bright",
        green:
            "bg-success/10 text-success",
        orange:
            "bg-warning/10 text-warning",
        red:
            "bg-danger/10 text-danger",
        neutral:
            "bg-surface-secondary text-muted",
    };

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium ${styles[tone]}`}
        >
            {children}
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
        <Link
            href={href}
            className="group flex items-center gap-4 py-4"
        >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright transition-transform duration-200 group-hover:scale-[1.04]">
                <Icon size={17} />
            </div>

            <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium">
                    {title}
                </p>

                <p className="mt-0.5 text-xs text-muted">
                    {description}
                </p>
            </div>

            <span className="text-muted-light transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-bright">
                <ArrowIcon size={16} />
            </span>
        </Link>
    );
}

export default function StudentDashboard() {
    const [overview, setOverview] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadOverview = async () => {
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
                    return;
                }

                const { data, error: overviewError } =
                    await supabase.rpc(
                        "get_my_academic_overview"
                    );

                if (overviewError) {
                    throw overviewError;
                }

                if (!mounted) return;

                setOverview(normalizeOverview(data));
            } catch (err) {
                console.error(
                    "Student overview error:",
                    err
                );

                if (!mounted) return;

                setError(
                    "We couldn't load your academic information right now."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadOverview();

        return () => {
            mounted = false;
        };
    }, []);

    if (loading) {
        return (
            <div className="space-y-10">
                <div className="space-y-3">
                    <div className="h-3 w-24 animate-pulse rounded-full bg-surface-secondary" />
                    <div className="h-10 w-72 animate-pulse rounded-xl bg-surface-secondary" />
                    <div className="h-4 w-96 max-w-full animate-pulse rounded-full bg-surface-secondary" />
                </div>

                <div className="h-52 animate-pulse rounded-[28px] bg-surface-secondary/70" />

                <div className="grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
                    <div className="h-64 animate-pulse rounded-[28px] bg-surface-secondary/70" />
                    <div className="h-64 animate-pulse rounded-[28px] bg-surface-secondary/70" />
                </div>
            </div>
        );
    }

    const profile =
        overview?.profile ||
        overview?.student ||
        null;

    const session =
        overview?.session ||
        overview?.academic_session ||
        null;

    const enrollment =
        overview?.enrollment ||
        null;

    const level =
        overview?.level ||
        null;

    const result =
        overview?.result ||
        null;

    const promotion =
        overview?.promotion ||
        null;

    const waitingList =
        overview?.waiting_list ||
        overview?.waitingList ||
        null;

    const fullName =
        profile?.full_name ||
        overview?.full_name ||
        "Student";

    const firstName = getFirstName(fullName);

    const isWaiting =
        enrollment?.status === "waiting" ||
        !!waitingList;

    const hasEnrollment =
        !!enrollment &&
        enrollment.status !== "waiting";

    const hasResult = !!result;

    const hasPromotion = !!promotion;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mx-auto max-w-6xl"
        >
            {/* Header */}
            <section className="pt-2 sm:pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-bright">
                    Student portal
                </p>

                <div className="mt-3 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="text-[32px] font-semibold tracking-[-0.045em] sm:text-[40px]">
                            Welcome back,{" "}
                            <span className="text-purple-bright">
                                {firstName}
                            </span>
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                            Keep moving forward in your
                            discipleship journey.
                        </p>
                    </div>

                    {session?.name && (
                        <div className="flex items-center gap-2 text-xs text-muted">
                            <span className="h-1.5 w-1.5 rounded-full bg-success" />
                            {session.name}
                        </div>
                    )}
                </div>
            </section>

            {/* Error */}
            {error && (
                <div className="mt-8 rounded-2xl bg-danger/[0.06] px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Waiting state */}
            {isWaiting && (
                <motion.section
                    initial={{
                        opacity: 0,
                        y: 8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="mt-10 border-y border-border py-8 sm:py-10"
                >
                    <StatusPill tone="orange">
                        Waiting list
                    </StatusPill>

                    <h2 className="mt-4 max-w-2xl text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                        Your place has been recorded.
                    </h2>

                    <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                        The current level is no longer open
                        for registration. Your request has been
                        placed on the waiting list. Please wait
                        until the current academy session ends
                        before your next step.
                    </p>

                    {waitingList?.requested_at && (
                        <p className="mt-4 flex items-center gap-2 text-xs text-muted-light">
                            <ClockIcon size={14} />
                            Request recorded{" "}
                            {formatDate(
                                waitingList.requested_at
                            )}
                        </p>
                    )}
                </motion.section>
            )}

            {/* No enrollment */}
            {!hasEnrollment && !isWaiting && (
                <motion.section
                    initial={{
                        opacity: 0,
                        y: 8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="mt-10 border-y border-border py-10 sm:py-14"
                >
                    <div className="max-w-2xl">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-bright/[0.09] text-purple-bright">
                            <BookIcon size={18} />
                        </div>

                        <h2 className="mt-6 text-2xl font-semibold tracking-[-0.035em] sm:text-3xl">
                            Your academic journey is
                            waiting.
                        </h2>

                        <p className="mt-3 text-sm leading-6 text-muted">
                            You don't currently have an active
                            academy enrollment. Choose an
                            available level to begin your
                            discipleship journey.
                        </p>

                        <Link
                            href="/student/classes"
                            className="mt-6 inline-flex h-10 items-center gap-2 rounded-full bg-purple-primary px-5 text-sm font-medium text-white transition-all duration-200 hover:bg-purple-violet hover:shadow-lg hover:shadow-purple-primary/10"
                        >
                            Explore academy
                            <ArrowIcon size={15} />
                        </Link>
                    </div>
                </motion.section>
            )}

            {/* Active student */}
            {hasEnrollment && (
                <>
                    {/* Current study */}
                    <motion.section
                        initial={{
                            opacity: 0,
                            y: 8,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        transition={{
                            delay: 0.05,
                        }}
                        className="mt-10 overflow-hidden rounded-[28px] border border-border bg-surface shadow-[0_12px_40px_rgba(58,0,108,0.05)]"
                    >
                        <div className="p-6 sm:p-8 lg:p-9">
                            <div className="flex flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <span className="h-2 w-2 rounded-full bg-success" />

                                        <p className="text-xs font-medium text-muted">
                                            Currently enrolled
                                        </p>
                                    </div>

                                    <h2 className="mt-4 text-3xl font-semibold tracking-[-0.045em]">
                                        {level?.name ||
                                            (level?.level_number
                                                ? `${level.level_number} Level`
                                                : "Current Level")}
                                    </h2>

                                    <p className="mt-2 text-sm text-muted">
                                        {session?.name ||
                                            "Current academic session"}
                                    </p>
                                </div>

                                <Link
                                    href="/student/classes"
                                    className="group inline-flex h-10 w-fit items-center gap-2 rounded-full border border-border bg-background px-4 text-sm font-medium transition-all hover:border-purple-bright/25 hover:bg-surface-secondary"
                                >
                                    Continue learning
                                    <span className="transition-transform group-hover:translate-x-0.5">
                                        <ArrowIcon size={15} />
                                    </span>
                                </Link>
                            </div>
                        </div>

                        <div className="grid border-t border-border sm:grid-cols-3">
                            <div className="px-6 py-5 sm:px-8">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-light">
                                    Level
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                    {level?.level_number ??
                                        level?.name ??
                                        "—"}
                                </p>
                            </div>

                            <div className="border-t border-border px-6 py-5 sm:border-l sm:border-t-0 sm:px-8">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-light">
                                    Status
                                </p>

                                <div className="mt-2">
                                    <StatusPill tone="green">
                                        {enrollment?.status
                                            ? enrollment.status
                                                .charAt(0)
                                                .toUpperCase() +
                                            enrollment.status.slice(
                                                1
                                            )
                                            : "Active"}
                                    </StatusPill>
                                </div>
                            </div>

                            <div className="border-t border-border px-6 py-5 sm:border-l sm:border-t-0 sm:px-8">
                                <p className="text-[11px] uppercase tracking-[0.12em] text-muted-light">
                                    Enrolled
                                </p>

                                <p className="mt-2 text-sm font-semibold">
                                    {formatDate(
                                        enrollment?.enrolled_at
                                    ) || "—"}
                                </p>
                            </div>
                        </div>
                    </motion.section>

                    {/* Academic information */}
                    <div className="mt-10 grid gap-10 lg:grid-cols-[1.35fr_0.65fr]">
                        {/* Result */}
                        <section>
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                        Academic progress
                                    </p>

                                    <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                                        Your result
                                    </h2>
                                </div>

                                {hasResult && (
                                    <Link
                                        href="/student/performance"
                                        className="hidden items-center gap-1.5 text-xs font-medium text-purple-bright sm:flex"
                                    >
                                        View performance
                                        <ArrowIcon size={13} />
                                    </Link>
                                )}
                            </div>

                            <div className="mt-5 rounded-[24px] border border-border bg-surface p-6 sm:p-7">
                                {!hasResult ? (
                                    <div className="py-5">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                                            <ChartIcon size={18} />
                                        </div>

                                        <h3 className="mt-5 text-base font-semibold">
                                            No result yet
                                        </h3>

                                        <p className="mt-2 max-w-md text-sm leading-6 text-muted">
                                            Your academic result will
                                            appear here once your current
                                            level has been assessed and
                                            processed.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
                                            <div>
                                                <p className="text-xs text-muted">
                                                    Overall score
                                                </p>

                                                <div className="mt-2 flex items-end gap-2">
                                                    <span className="text-5xl font-semibold tracking-[-0.06em]">
                                                        {result.overall_score ??
                                                            "—"}
                                                    </span>

                                                    <span className="mb-1.5 text-sm text-muted">
                                                        / 100
                                                    </span>
                                                </div>
                                            </div>

                                            <div>
                                                <StatusPill
                                                    tone={
                                                        result.status ===
                                                            "passed" ||
                                                        result.status ===
                                                            "finalized"
                                                            ? "green"
                                                            : result.status ===
                                                                "failed"
                                                            ? "red"
                                                            : "orange"
                                                    }
                                                >
                                                    {result.status
                                                        ? result.status
                                                            .charAt(
                                                                0
                                                            )
                                                            .toUpperCase() +
                                                        result.status.slice(
                                                            1
                                                        )
                                                        : "Available"}
                                                </StatusPill>
                                            </div>
                                        </div>

                                        {result.grade && (
                                            <div className="mt-7 border-t border-border pt-5">
                                                <p className="text-xs text-muted">
                                                    Grade
                                                </p>

                                                <p className="mt-1 text-sm font-semibold">
                                                    {result.grade}
                                                </p>
                                            </div>
                                        )}

                                        <Link
                                            href="/student/performance"
                                            className="mt-6 flex items-center justify-between rounded-xl bg-surface-secondary px-4 py-3 text-xs font-medium transition-colors hover:bg-purple-bright/[0.08]"
                                        >
                                            <span>
                                                View full academic
                                                performance
                                            </span>

                                            <ArrowIcon size={14} />
                                        </Link>
                                    </div>
                                )}
                            </div>
                        </section>

                        {/* Progression */}
                        <section>
                            <div>
                                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                    Progression
                                </p>

                                <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                                    Next step
                                </h2>
                            </div>

                            <div className="mt-5 rounded-[24px] border border-border bg-surface p-6 sm:p-7">
                                {!hasPromotion ? (
                                    <div className="py-5">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                                            <ArrowIcon size={17} />
                                        </div>

                                        <h3 className="mt-5 text-base font-semibold">
                                            Nothing to review yet
                                        </h3>

                                        <p className="mt-2 text-sm leading-6 text-muted">
                                            Your next academic progression
                                            will appear here when your
                                            current level has been
                                            processed.
                                        </p>
                                    </div>
                                ) : (
                                    <div>
                                        <p className="text-xs text-muted">
                                            Proposed next level
                                        </p>

                                        <h3 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                                            {promotion?.to_level
                                                ?.name ||
                                                (promotion?.to_level
                                                    ?.level_number
                                                    ? `${promotion.to_level.level_number} Level`
                                                    : "Next level")}
                                        </h3>

                                        <div className="mt-5">
                                            <StatusPill
                                                tone={
                                                    promotion.status ===
                                                    "approved"
                                                        ? "green"
                                                        : promotion.status ===
                                                            "rejected"
                                                        ? "red"
                                                        : "orange"
                                                }
                                            >
                                                {promotion.status
                                                    ? promotion.status
                                                        .charAt(
                                                            0
                                                        )
                                                        .toUpperCase() +
                                                    promotion.status.slice(
                                                        1
                                                    )
                                                    : "Pending"}
                                            </StatusPill>
                                        </div>

                                        {promotion.status ===
                                            "pending" && (
                                            <p className="mt-4 text-xs leading-5 text-muted">
                                                Your promotion is
                                                awaiting academic
                                                approval.
                                            </p>
                                        )}

                                        {promotion.status ===
                                            "approved" && (
                                            <p className="mt-4 flex items-center gap-2 text-xs text-success">
                                                <CheckIcon size={14} />
                                                Promotion approved.
                                            </p>
                                        )}
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    {/* Quick access */}
                    <section className="mt-12">
                        <div>
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                Academy
                            </p>

                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                                Quick access
                            </h2>
                        </div>

                        <div className="mt-4 divide-y divide-border border-y border-border">
                            <QuickAction
                                href="/student/classes"
                                icon={BookIcon}
                                title="My Classes"
                                description="Continue with your available learning content."
                            />

                            <QuickAction
                                href="/student/tests"
                                icon={TestIcon}
                                title="Tests & Exams"
                                description="View assessments and your available attempts."
                            />

                            <QuickAction
                                href="/student/performance"
                                icon={ChartIcon}
                                title="Performance"
                                description="Review your academic performance and results."
                            />

                            <QuickAction
                                href="/student/announcements"
                                icon={MegaphoneIcon}
                                title="Announcements"
                                description="Stay updated with academy communications."
                            />
                        </div>
                    </section>

                    {/* Quiet footer */}
                    <div className="mt-12 flex flex-col gap-2 border-t border-border pt-6 pb-4 text-xs text-muted-light sm:flex-row sm:items-center sm:justify-between">
                        <span>
                            Triumphant Discipleship Academy
                        </span>

                        <span>
                            Learn. Grow. Become.
                        </span>
                    </div>
                </>
            )}
        </motion.div>
    );
}

