"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "motion/react";
import { supabase } from "@/lib/supabase";

function normalizeData(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    return data;
}

function formatDuration(seconds) {
    if (!seconds || Number.isNaN(Number(seconds))) {
        return null;
    }

    const totalSeconds = Number(seconds);
    const minutes = Math.floor(totalSeconds / 60);

    if (minutes < 1) {
        return `${totalSeconds}s`;
    }

    if (minutes < 60) {
        return `${minutes} min`;
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return `${hours} hr`;
    }

    return `${hours} hr ${remainingMinutes} min`;
}

function getProgress(progress) {
    const value = Number(progress);

    if (Number.isNaN(value)) {
        return 0;
    }

    return Math.min(100, Math.max(0, value));
}

function getClassStatus(progress) {
    if (!progress) {
        return "not_started";
    }

    if (
        progress.completed_at ||
        progress.progress_percentage >= 100
    ) {
        return "completed";
    }

    if (
        progress.progress_percentage > 0 ||
        progress.video_watched
    ) {
        return "in_progress";
    }

    return "not_started";
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

function BookIcon({ size = 20 }) {
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

function PlayIcon({ size = 17 }) {
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
            <circle cx="12" cy="12" r="8.5" />
            <path d="m10 8.8 5 3.2-5 3.2z" />
        </svg>
    );
}

function CheckIcon({ size = 16 }) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6.5 12.5 3.5 3.5 7.5-8" />
        </svg>
    );
}

function FileIcon({ size = 16 }) {
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
            <path d="M7 3h7l4 4v14H7z" />
            <path d="M14 3v5h4" />
            <path d="M9.5 12h5" />
            <path d="M9.5 16h5" />
        </svg>
    );
}

function ChevronIcon({ open }) {
    return (
        <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`transition-transform duration-200 ${
                open ? "rotate-180" : ""
            }`}
        >
            <path d="m6 9 6 6 6-6" />
        </svg>
    );
}

function StatusIndicator({ status }) {
    if (status === "completed") {
        return (
            <span className="flex items-center gap-1.5 text-xs font-medium text-success">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-success/10">
                    <CheckIcon size={12} />
                </span>
                Completed
            </span>
        );
    }

    if (status === "in_progress") {
        return (
            <span className="flex items-center gap-1.5 text-xs font-medium text-purple-bright">
                <span className="h-1.5 w-1.5 rounded-full bg-purple-bright" />
                In progress
            </span>
        );
    }

    return (
        <span className="flex items-center gap-1.5 text-xs text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-light" />
            Not started
        </span>
    );
}

function ClassRow({ item, index }) {
    const classItem = item.class || item;
    const progress = item.progress || {};
    const videos = item.videos || item.video || [];
    const resources =
        item.resources || item.resource || [];

    const videoList = Array.isArray(videos)
        ? videos
        : videos
            ? [videos]
            : [];

    const resourceList = Array.isArray(resources)
        ? resources
        : resources
            ? [resources]
            : [];

    const status = getClassStatus(progress);
    const percentage = getProgress(
        progress.progress_percentage
    );

    const hasVideo = videoList.length > 0;
    const hasResources = resourceList.length > 0;

    return (
        <motion.div
            initial={{
                opacity: 0,
                y: 6,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay: index * 0.04,
                duration: 0.25,
            }}
            className="group relative border-t border-border first:border-t-0"
        >
            <Link
                href={`/student/classes/${classItem.id}`}
                className="flex gap-4 px-5 py-5 transition-colors duration-200 hover:bg-surface-secondary/45 sm:px-6"
            >
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright">
                    {status === "completed" ? (
                        <CheckIcon size={16} />
                    ) : (
                        <PlayIcon size={16} />
                    )}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                            <h4 className="truncate pr-2 text-sm font-medium tracking-[-0.01em]">
                                {classItem.title ||
                                    `Class ${classItem.class_number || ""}`}
                            </h4>

                            {classItem.description && (
                                <p className="mt-1 line-clamp-2 max-w-2xl text-xs leading-5 text-muted">
                                    {classItem.description}
                                </p>
                            )}
                        </div>

                        <span className="hidden shrink-0 text-muted-light transition-all duration-200 group-hover:translate-x-1 group-hover:text-purple-bright sm:block">
                            <ArrowIcon size={16} />
                        </span>
                    </div>

                    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                        <StatusIndicator status={status} />

                        {hasVideo && (
                            <span className="text-[11px] text-muted">
                                Video
                            </span>
                        )}

                        {hasResources && (
                            <span className="text-[11px] text-muted">
                                {resourceList.length}{" "}
                                {resourceList.length === 1
                                    ? "resource"
                                    : "resources"}
                            </span>
                        )}

                        {classItem.duration_minutes && (
                            <span className="text-[11px] text-muted">
                                {classItem.duration_minutes} min
                            </span>
                        )}
                    </div>

                    {percentage > 0 &&
                        percentage < 100 && (
                            <div className="mt-4 flex items-center gap-3">
                                <div className="h-1 flex-1 max-w-xs overflow-hidden rounded-full bg-surface-secondary">
                                    <motion.div
                                        initial={{
                                            width: 0,
                                        }}
                                        animate={{
                                            width: `${percentage}%`,
                                        }}
                                        transition={{
                                            duration: 0.6,
                                            ease: "easeOut",
                                        }}
                                        className="h-full rounded-full bg-purple-bright"
                                    />
                                </div>

                                <span className="text-[10px] font-medium text-muted">
                                    {percentage}%
                                </span>
                            </div>
                        )}
                </div>

                <span className="mt-1 shrink-0 text-muted-light sm:hidden">
                    <ArrowIcon size={15} />
                </span>
            </Link>
        </motion.div>
    );
}

function TopicSection({
    topic,
    index,
    open,
    onToggle,
}) {
    const classes = Array.isArray(topic.classes)
        ? topic.classes
        : [];

    const completedCount = classes.filter(
        (item) =>
            getClassStatus(item.progress) === "completed"
    ).length;

    const progress =
        classes.length > 0
            ? Math.round(
                (completedCount / classes.length) * 100
            )
            : 0;

    return (
        <motion.section
            initial={{
                opacity: 0,
                y: 10,
            }}
            animate={{
                opacity: 1,
                y: 0,
            }}
            transition={{
                delay: index * 0.05,
                duration: 0.3,
            }}
            className="border-b border-border last:border-b-0"
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex w-full items-center gap-4 px-1 py-6 text-left"
            >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-primary/[0.08] text-xs font-semibold text-purple-bright">
                    {String(
                        topic.topic_number ||
                            index + 1
                    ).padStart(2, "0")}
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-between">
                        <div>
                            <h3 className="text-[15px] font-semibold tracking-[-0.02em]">
                                {topic.title ||
                                    `Topic ${index + 1}`}
                            </h3>

                            {topic.description && (
                                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted">
                                    {topic.description}
                                </p>
                            )}
                        </div>

                        <div className="flex shrink-0 items-center gap-3">
                            {classes.length > 0 && (
                                <span className="text-[11px] text-muted">
                                    {completedCount}/
                                    {classes.length}{" "}
                                    completed
                                </span>
                            )}

                            <ChevronIcon open={open} />
                        </div>
                    </div>

                    {classes.length > 0 && (
                        <div className="mt-3 flex items-center gap-3">
                            <div className="h-1 max-w-40 flex-1 overflow-hidden rounded-full bg-surface-secondary">
                                <div
                                    className="h-full rounded-full bg-purple-bright transition-all duration-500"
                                    style={{
                                        width: `${progress}%`,
                                    }}
                                />
                            </div>

                            <span className="text-[10px] font-medium text-muted-light">
                                {progress}%
                            </span>
                        </div>
                    )}
                </div>
            </button>

            <AnimatePresence initial={false}>
                {open && (
                    <motion.div
                        initial={{
                            height: 0,
                            opacity: 0,
                        }}
                        animate={{
                            height: "auto",
                            opacity: 1,
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                        }}
                        transition={{
                            duration: 0.25,
                        }}
                        className="overflow-hidden"
                    >
                        <div className="mb-2 ml-0 overflow-hidden rounded-2xl border border-border bg-surface">
                            {classes.length > 0 ? (
                                classes.map(
                                    (classItem, classIndex) => (
                                        <ClassRow
                                            key={
                                                classItem.id ||
                                                classIndex
                                            }
                                            item={classItem}
                                            index={
                                                classIndex
                                            }
                                        />
                                    )
                                )
                            ) : (
                                <div className="px-5 py-7 text-sm text-muted sm:px-6">
                                    No published classes are
                                    available for this topic yet.
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.section>
    );
}

function LoadingState() {
    return (
        <div className="space-y-8">
            <div className="space-y-3">
                <div className="h-3 w-24 animate-pulse rounded-full bg-surface-secondary" />
                <div className="h-10 w-64 max-w-full animate-pulse rounded-xl bg-surface-secondary" />
                <div className="h-4 w-96 max-w-full animate-pulse rounded-full bg-surface-secondary" />
            </div>

            <div className="rounded-[26px] border border-border bg-surface p-6 sm:p-8">
                <div className="h-4 w-28 animate-pulse rounded-full bg-surface-secondary" />
                <div className="mt-4 h-8 w-48 animate-pulse rounded-lg bg-surface-secondary" />

                <div className="mt-8 space-y-5">
                    <div className="h-16 animate-pulse rounded-xl bg-surface-secondary/70" />
                    <div className="h-16 animate-pulse rounded-xl bg-surface-secondary/70" />
                    <div className="h-16 animate-pulse rounded-xl bg-surface-secondary/70" />
                </div>
            </div>
        </div>
    );
}

export default function StudentClassesPage() {
    const [learning, setLearning] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [openTopics, setOpenTopics] = useState({});

    useEffect(() => {
        let mounted = true;

        const loadLearningContent = async () => {
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

                const {
                    data,
                    error: learningError,
                } = await supabase.rpc(
                    "get_my_learning_content"
                );

                if (learningError) {
                    throw learningError;
                }

                if (!mounted) return;

                setLearning(normalizeData(data));
            } catch (err) {
                console.error(
                    "Student learning content error:",
                    err
                );

                if (!mounted) return;

                setError(
                    "We couldn't load your classes right now. Please try again."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadLearningContent();

        return () => {
            mounted = false;
        };
    }, []);

    const topics = useMemo(() => {
        if (!learning) return [];

        if (Array.isArray(learning.topics)) {
            return learning.topics;
        }

        if (Array.isArray(learning.learning_content)) {
            return learning.learning_content;
        }

        if (Array.isArray(learning.content)) {
            return learning.content;
        }

        return [];
    }, [learning]);

    const allClasses = useMemo(() => {
        return topics.flatMap((topic) =>
            Array.isArray(topic.classes)
                ? topic.classes
                : []
        );
    }, [topics]);

    const completedClasses = allClasses.filter(
        (item) =>
            getClassStatus(item.progress) ===
            "completed"
    ).length;

    const overallProgress =
        allClasses.length > 0
            ? Math.round(
                (completedClasses /
                    allClasses.length) *
                100
            )
            : 0;

    const currentLevel =
        learning?.level ||
        learning?.current_level ||
        null;

    const session =
        learning?.session ||
        learning?.academic_session ||
        null;

    const enrollment =
        learning?.enrollment ||
        null;

    if (loading) {
        return <LoadingState />;
    }

    if (error) {
        return (
            <div className="mx-auto max-w-6xl">
                <div className="border-y border-border py-16">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-danger">
                        Something went wrong
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                        We couldn't load your classes.
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                        {error}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            window.location.reload()
                        }
                        className="mt-6 inline-flex h-10 items-center rounded-full bg-purple-primary px-5 text-sm font-medium text-white transition-colors hover:bg-purple-violet"
                    >
                        Try again
                    </button>
                </div>
            </div>
        );
    }

    if (!learning) {
        return (
            <div className="mx-auto max-w-6xl">
                <div className="border-y border-border py-16">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright">
                        <BookIcon size={20} />
                    </div>

                    <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">
                        Your classes will appear here.
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                        Once you have an active academy
                        enrollment, your published learning
                        content will appear here.
                    </p>

                    <Link
                        href="/student/dashboard"
                        className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-bright"
                    >
                        Return to dashboard
                        <ArrowIcon size={15} />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-6xl"
        >
            {/* Page heading */}
            <section className="pt-2 sm:pt-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-purple-bright">
                    Learning
                </p>

                <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                    <div>
                        <h1 className="text-[32px] font-semibold tracking-[-0.045em] sm:text-[40px]">
                            My Classes
                        </h1>

                        <p className="mt-2 max-w-xl text-sm leading-6 text-muted">
                            Work through your published academy
                            classes at your own pace.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted">
                        <span className="h-1.5 w-1.5 rounded-full bg-success" />

                        {currentLevel?.name ||
                            (currentLevel?.level_number
                                ? `${currentLevel.level_number} Level`
                                : "Current level")}

                        {session?.name && (
                            <>
                                <span className="text-muted-light">
                                    ·
                                </span>
                                <span>
                                    {session.name}
                                </span>
                            </>
                        )}
                    </div>
                </div>
            </section>

            {/* Progress overview */}
            <section className="mt-10 rounded-[26px] border border-border bg-surface p-6 shadow-[0_12px_40px_rgba(58,0,108,0.04)] sm:p-8">
                <div className="flex flex-col gap-7 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-light">
                            Learning journey
                        </p>

                        <h2 className="mt-2 text-2xl font-semibold tracking-[-0.035em]">
                            {currentLevel?.name ||
                                (currentLevel?.level_number
                                    ? `${currentLevel.level_number} Level`
                                    : "Current level")}
                        </h2>

                        <p className="mt-1 text-sm text-muted">
                            {allClasses.length > 0
                                ? `${completedClasses} of ${allClasses.length} classes completed`
                                : "Classes will appear as they are published."}
                        </p>
                    </div>

                    {allClasses.length > 0 && (
                        <div className="text-left sm:text-right">
                            <span className="text-3xl font-semibold tracking-[-0.05em]">
                                {overallProgress}%
                            </span>

                            <p className="mt-1 text-[11px] text-muted">
                                completed
                            </p>
                        </div>
                    )}
                </div>

                {allClasses.length > 0 && (
                    <div className="mt-7 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{
                                width: `${overallProgress}%`,
                            }}
                            transition={{
                                duration: 0.8,
                                ease: "easeOut",
                            }}
                            className="h-full rounded-full bg-purple-bright"
                        />
                    </div>
                )}
            </section>

            {/* Topics */}
            <section className="mt-10">
                <div className="flex items-end justify-between">
                    <div>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                            Curriculum
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                            Your learning content
                        </h2>
                    </div>

                    {topics.length > 0 && (
                        <span className="text-xs text-muted">
                            {topics.length}{" "}
                            {topics.length === 1
                                ? "topic"
                                : "topics"}
                        </span>
                    )}
                </div>

                {topics.length === 0 ? (
                    <div className="mt-5 rounded-[24px] border border-border bg-surface px-6 py-12 text-center sm:px-8">
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-surface-secondary text-muted">
                            <BookIcon size={19} />
                        </div>

                        <h3 className="mt-5 text-base font-semibold">
                            No classes available yet
                        </h3>

                        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                            Your teachers haven't published
                            learning content for your current
                            level yet. Check back later.
                        </p>
                    </div>
                ) : (
                    <div className="mt-4">
                        {topics.map((topic, index) => (
                            <TopicSection
                                key={
                                    topic.id ||
                                    index
                                }
                                topic={topic}
                                index={index}
                                open={
                                    openTopics[
                                        topic.id
                                    ] ?? true
                                }
                                onToggle={() =>
                                    setOpenTopics(
                                        (current) => ({
                                            ...current,
                                            [topic.id]:
                                                !(
                                                    current[
                                                        topic.id
                                                    ] ?? true
                                                ),
                                        })
                                    )
                                }
                            />
                        ))}
                    </div>
                )}
            </section>

            {/* Learning note */}
            <section className="mt-12 border-t border-border pt-7 pb-4">
                <div className="flex gap-3">
                    <div className="mt-0.5 shrink-0 text-purple-bright">
                        <FileIcon size={16} />
                    </div>

                    <div>
                        <p className="text-xs font-medium">
                            Keep your learning consistent
                        </p>

                        <p className="mt-1 max-w-2xl text-xs leading-5 text-muted">
                            Complete each class and its available
                            assessment before moving forward.
                            Your learning progress is saved to
                            your academy account.
                        </p>
                    </div>
                </div>
            </section>
        </motion.main>
    );
}