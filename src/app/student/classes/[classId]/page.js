"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion } from "motion/react";
import { supabase } from "@/lib/supabase";

function normalizeData(data) {
    if (!data) return null;

    if (Array.isArray(data)) {
        return data[0] || null;
    }

    return data;
}

function ArrowLeftIcon({ size = 16 }) {
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
            <path d="M19 12H5" />
            <path d="m11 18-6-6 6-6" />
        </svg>
    );
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

function PlayIcon({ size = 24 }) {
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
            <circle cx="12" cy="12" r="9" />
            <path d="m10 8.8 5 3.2-5 3.2z" />
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
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="m6.5 12.5 3.5 3.5 7.5-8" />
        </svg>
    );
}

function FileIcon({ size = 18 }) {
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

function ClockIcon({ size = 15 }) {
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

function ExternalIcon({ size = 15 }) {
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
            <path d="M14 5h5v5" />
            <path d="m19 5-8 8" />
            <path d="M19 13v5a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h5" />
        </svg>
    );
}

function getStatus(progress) {
    if (!progress) {
        return "not_started";
    }

    if (
        progress.completed_at ||
        Number(progress.progress_percentage) >= 100
    ) {
        return "completed";
    }

    if (
        Number(progress.progress_percentage) > 0 ||
        progress.video_watched
    ) {
        return "in_progress";
    }

    return "not_started";
}

function getVideoList(classItem) {
    const videos =
        classItem?.videos ||
        classItem?.video ||
        [];

    if (Array.isArray(videos)) {
        return videos;
    }

    return videos ? [videos] : [];
}

function getResourceList(classItem) {
    const resources =
        classItem?.resources ||
        classItem?.resource ||
        [];

    if (Array.isArray(resources)) {
        return resources;
    }

    return resources ? [resources] : [];
}

function getTestList(classItem) {
    const tests =
        classItem?.tests ||
        classItem?.test ||
        [];

    if (Array.isArray(tests)) {
        return tests;
    }

    return tests ? [tests] : [];
}

function getEmbedUrl(url, provider) {
    if (!url) return null;

    const value = url.trim();

    if (
        provider === "youtube" ||
        value.includes("youtube.com") ||
        value.includes("youtu.be")
    ) {
        try {
            const parsed = new URL(value);

            if (parsed.hostname.includes("youtu.be")) {
                return `https://www.youtube.com/embed/${parsed.pathname.slice(
                    1
                )}`;
            }

            const videoId = parsed.searchParams.get("v");

            if (videoId) {
                return `https://www.youtube.com/embed/${videoId}`;
            }

            if (parsed.pathname.includes("/embed/")) {
                return value;
            }
        } catch {
            return value;
        }
    }

    if (
        provider === "vimeo" ||
        value.includes("vimeo.com")
    ) {
        try {
            const parsed = new URL(value);
            const parts = parsed.pathname
                .split("/")
                .filter(Boolean);

            const videoId = parts[parts.length - 1];

            if (videoId) {
                return `https://player.vimeo.com/video/${videoId}`;
            }
        } catch {
            return value;
        }
    }

    if (
        provider === "google_drive" ||
        value.includes("drive.google.com")
    ) {
        try {
            const parsed = new URL(value);

            const match =
                parsed.pathname.match(
                    /\/file\/d\/([^/]+)/
                );

            if (match?.[1]) {
                return `https://drive.google.com/file/d/${match[1]}/preview`;
            }
        } catch {
            return value;
        }
    }

    return null;
}

function LoadingState() {
    return (
        <div className="mx-auto max-w-5xl">
            <div className="space-y-3 pt-2">
                <div className="h-3 w-24 animate-pulse rounded-full bg-surface-secondary" />

                <div className="h-9 w-80 max-w-full animate-pulse rounded-xl bg-surface-secondary" />

                <div className="h-4 w-96 max-w-full animate-pulse rounded-full bg-surface-secondary" />
            </div>

            <div className="mt-8 aspect-video animate-pulse rounded-[26px] bg-surface-secondary/70" />

            <div className="mt-8 space-y-4">
                <div className="h-5 w-48 animate-pulse rounded-full bg-surface-secondary" />
                <div className="h-4 w-full animate-pulse rounded-full bg-surface-secondary" />
                <div className="h-4 w-4/5 animate-pulse rounded-full bg-surface-secondary" />
            </div>
        </div>
    );
}

function EmptyState({ title, description }) {
    return (
        <div className="mx-auto max-w-5xl">
            <div className="border-y border-border py-16">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright">
                    <PlayIcon size={20} />
                </div>

                <h1 className="mt-6 text-2xl font-semibold tracking-[-0.035em]">
                    {title}
                </h1>

                <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                    {description}
                </p>

                <Link
                    href="/student/classes"
                    className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-purple-bright"
                >
                    Back to my classes
                    <ArrowLeftIcon size={15} />
                </Link>
            </div>
        </div>
    );
}

export default function StudentClassPage() {
    const params = useParams();
    const router = useRouter();

    const classId = params?.classId;

    const [learning, setLearning] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [markingComplete, setMarkingComplete] =
        useState(false);
    const [completed, setCompleted] = useState(false);

    useEffect(() => {
        let mounted = true;

        const loadClass = async () => {
            try {
                setLoading(true);
                setError("");

                if (!classId) {
                    throw new Error(
                        "Class ID is missing."
                    );
                }

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
                    "Student class error:",
                    err
                );

                if (!mounted) return;

                setError(
                    "We couldn't load this class right now."
                );
            } finally {
                if (mounted) {
                    setLoading(false);
                }
            }
        };

        loadClass();

        return () => {
            mounted = false;
        };
    }, [classId, router]);

    const classData = useMemo(() => {
        if (!learning || !classId) {
            return null;
        }

        const topics = Array.isArray(learning.topics)
            ? learning.topics
            : Array.isArray(
                learning.learning_content
            )
                ? learning.learning_content
                : Array.isArray(learning.content)
                    ? learning.content
                    : [];

        for (const topic of topics) {
            const classes = Array.isArray(topic.classes)
                ? topic.classes
                : [];

            const found = classes.find(
                (item) =>
                    String(
                        item?.class?.id ||
                        item?.id
                    ) === String(classId)
            );

            if (found) {
                const actualClass =
                    found.class || found;

                return {
                    classItem: actualClass,
                    topic,
                    progress:
                        found.progress ||
                        actualClass.progress ||
                        null,
                    videos:
                        found.videos ||
                        found.video ||
                        actualClass.videos ||
                        actualClass.video ||
                        [],
                    resources:
                        found.resources ||
                        found.resource ||
                        actualClass.resources ||
                        actualClass.resource ||
                        [],
                    tests:
                        found.tests ||
                        found.test ||
                        actualClass.tests ||
                        actualClass.test ||
                        [],
                };
            }
        }

        return null;
    }, [learning, classId]);

    useEffect(() => {
        if (!classData?.progress) return;

        const status = getStatus(
            classData.progress
        );

        setCompleted(status === "completed");
    }, [classData]);

    const videos = useMemo(
        () =>
            getVideoList({
                videos: classData?.videos,
            }),
        [classData]
    );

    const resources = useMemo(
        () =>
            getResourceList({
                resources: classData?.resources,
            }),
        [classData]
    );

    const tests = useMemo(
        () =>
            getTestList({
                tests: classData?.tests,
            }),
        [classData]
    );

    const primaryVideo = videos[0] || null;

    const embedUrl = getEmbedUrl(
        primaryVideo?.video_url,
        primaryVideo?.provider
    );

    const progress = classData?.progress || null;

    const status = completed
        ? "completed"
        : getStatus(progress);

    const progressPercentage = Math.min(
        100,
        Math.max(
            0,
            Number(
                progress?.progress_percentage || 0
            )
        )
    );

    const topicName =
        classData?.topic?.title ||
        "Current topic";

    const level =
        learning?.level ||
        learning?.current_level ||
        null;

    const session =
        learning?.session ||
        learning?.academic_session ||
        null;

    const handleMarkComplete = async () => {
        if (!classData?.classItem?.id) {
            return;
        }

        try {
            setMarkingComplete(true);
            setError("");

            const { error: rpcError } =
                await supabase.rpc(
                    "mark_video_watched",
                    {
                        p_class_id:
                            classData.classItem.id,
                    }
                );

            if (rpcError) {
                throw rpcError;
            }

            setCompleted(true);
        } catch (err) {
            console.error(
                "Mark class complete error:",
                err
            );

            setError(
                "We couldn't save your progress. Please try again."
            );
        } finally {
            setMarkingComplete(false);
        }
    };

    if (loading) {
        return <LoadingState />;
    }

    if (error && !classData) {
        return (
            <div className="mx-auto max-w-5xl">
                <div className="border-y border-border py-16">
                    <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-danger">
                        Something went wrong
                    </p>

                    <h1 className="mt-3 text-2xl font-semibold tracking-[-0.035em]">
                        We couldn't open this class.
                    </h1>

                    <p className="mt-3 max-w-lg text-sm leading-6 text-muted">
                        {error}
                    </p>

                    <Link
                        href="/student/classes"
                        className="mt-6 inline-flex items-center gap-2 rounded-full bg-purple-primary px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-purple-violet"
                    >
                        <ArrowLeftIcon size={15} />
                        Back to classes
                    </Link>
                </div>
            </div>
        );
    }

    if (!classData) {
        return (
            <EmptyState
                title="Class not available"
                description="This class may no longer be published, may not belong to your current learning content, or may not exist."
            />
        );
    }

    return (
        <motion.main
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35 }}
            className="mx-auto max-w-5xl"
        >
            {/* Back navigation */}
            <div className="pt-2 sm:pt-4">
                <Link
                    href="/student/classes"
                    className="group inline-flex items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-purple-bright"
                >
                    <span className="transition-transform group-hover:-translate-x-0.5">
                        <ArrowLeftIcon size={14} />
                    </span>

                    My Classes
                </Link>
            </div>

            {/* Class heading */}
            <section className="mt-8">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-medium text-muted">
                    <span className="text-purple-bright">
                        {level?.name ||
                            (level?.level_number
                                ? `${level.level_number} Level`
                                : "Current level")}
                    </span>

                    <span className="text-muted-light">
                        /
                    </span>

                    <span>{topicName}</span>

                    {session?.name && (
                        <>
                            <span className="text-muted-light">
                                /
                            </span>

                            <span>
                                {session.name}
                            </span>
                        </>
                    )}
                </div>

                <div className="mt-4 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
                    <div>
                        <h1 className="max-w-3xl text-[30px] font-semibold tracking-[-0.045em] sm:text-[38px]">
                            {classData.classItem
                                .title ||
                                "Class"}
                        </h1>

                        {classData.classItem
                            .description && (
                            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">
                                {
                                    classData.classItem
                                        .description
                                }
                            </p>
                        )}
                    </div>

                    <div className="shrink-0">
                        {status === "completed" ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-success/10 px-3 py-1.5 text-xs font-medium text-success">
                                <CheckIcon size={13} />
                                Completed
                            </span>
                        ) : status === "in_progress" ? (
                            <span className="inline-flex items-center gap-2 rounded-full bg-purple-bright/10 px-3 py-1.5 text-xs font-medium text-purple-bright">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-bright" />
                                In progress
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-2 rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-muted">
                                <span className="h-1.5 w-1.5 rounded-full bg-muted-light" />
                                Not started
                            </span>
                        )}
                    </div>
                </div>
            </section>

            {/* Video */}
            <section className="mt-8">
                <div className="overflow-hidden rounded-[26px] border border-border bg-black shadow-[0_18px_60px_rgba(58,0,108,0.10)]">
                    {primaryVideo ? (
                        embedUrl ? (
                            <div className="relative aspect-video w-full bg-black">
                                <iframe
                                    src={embedUrl}
                                    title={
                                        primaryVideo.title ||
                                        classData.classItem
                                            .title
                                    }
                                    className="absolute inset-0 h-full w-full"
                                    allow="autoplay; fullscreen; picture-in-picture"
                                    allowFullScreen
                                />
                            </div>
                        ) : (
                            <div className="flex aspect-video items-center justify-center p-6">
                                <div className="text-center">
                                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white">
                                        <PlayIcon size={24} />
                                    </div>

                                    <h2 className="mt-5 text-base font-semibold text-white">
                                        {primaryVideo.title ||
                                            "Class video"}
                                    </h2>

                                    <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/60">
                                        This video is hosted on an
                                        external provider.
                                    </p>

                                    <a
                                        href={
                                            primaryVideo.video_url
                                        }
                                        target="_blank"
                                        rel="noreferrer"
                                        className="mt-5 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-medium text-black transition-opacity hover:opacity-90"
                                    >
                                        Open video
                                        <ExternalIcon size={13} />
                                    </a>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="flex aspect-video items-center justify-center p-6">
                            <div className="text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white/[0.08] text-white/70">
                                    <PlayIcon size={24} />
                                </div>

                                <h2 className="mt-5 text-base font-semibold text-white">
                                    Video not available
                                </h2>

                                <p className="mx-auto mt-2 max-w-sm text-xs leading-5 text-white/50">
                                    A recording hasn't been
                                    published for this class yet.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Video information */}
                {primaryVideo && (
                    <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted">
                        {primaryVideo.duration_seconds && (
                            <span className="flex items-center gap-1.5">
                                <ClockIcon size={13} />
                                {Math.floor(
                                    Number(
                                        primaryVideo.duration_seconds
                                    ) / 60
                                )}{" "}
                                min
                            </span>
                        )}

                        {primaryVideo.provider && (
                            <span>
                                {primaryVideo.provider ===
                                "google_drive"
                                    ? "Google Drive"
                                    : primaryVideo.provider
                                        .charAt(0)
                                        .toUpperCase() +
                                    primaryVideo.provider.slice(
                                        1
                                    )}
                            </span>
                        )}
                    </div>
                )}
            </section>

            {/* Progress */}
            <section className="mt-8 rounded-[24px] border border-border bg-surface p-5 sm:p-6">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-xs font-medium">
                            Your progress
                        </p>

                        <p className="mt-1 text-xs text-muted">
                            {completed
                                ? "You've completed this class."
                                : progressPercentage > 0
                                    ? `${progressPercentage}% completed`
                                    : "Start this class to begin tracking your progress."}
                        </p>
                    </div>

                    {!completed && (
                        <button
                            type="button"
                            onClick={handleMarkComplete}
                            disabled={markingComplete}
                            className="inline-flex h-10 items-center justify-center gap-2 rounded-full bg-purple-primary px-5 text-xs font-medium text-white transition-all hover:bg-purple-violet disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {markingComplete ? (
                                <>
                                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                                    Saving...
                                </>
                            ) : (
                                <>
                                    <CheckIcon size={14} />
                                    Mark as completed
                                </>
                            )}
                        </button>
                    )}

                    {completed && (
                        <div className="flex items-center gap-2 text-xs font-medium text-success">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-success/10">
                                <CheckIcon size={13} />
                            </span>
                            Class completed
                        </div>
                    )}
                </div>

                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-surface-secondary">
                    <motion.div
                        initial={{
                            width: 0,
                        }}
                        animate={{
                            width: `${
                                completed
                                    ? 100
                                    : progressPercentage
                            }%`,
                        }}
                        transition={{
                            duration: 0.6,
                            ease: "easeOut",
                        }}
                        className="h-full rounded-full bg-purple-bright"
                    />
                </div>
            </section>

            {error && (
                <div className="mt-5 rounded-2xl bg-danger/[0.06] px-4 py-3 text-xs text-danger">
                    {error}
                </div>
            )}

            {/* Class content */}
            <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_300px]">
                {/* Main content */}
                <div>
                    <section>
                        <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                            About this class
                        </p>

                        <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                            {classData.classItem
                                .title ||
                                "Class overview"}
                        </h2>

                        <div className="mt-4 text-sm leading-7 text-muted">
                            {classData.classItem
                                .description ? (
                                <p>
                                    {
                                        classData.classItem
                                            .description
                                    }
                                </p>
                            ) : (
                                <p>
                                    Continue through this class
                                    and complete the available
                                    assessment when you're ready.
                                </p>
                            )}
                        </div>
                    </section>

                    {/* Resources */}
                    {resources.length > 0 && (
                        <section className="mt-10 border-t border-border pt-8">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                Materials
                            </p>

                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                                Class resources
                            </h2>

                            <div className="mt-5 divide-y divide-border rounded-[22px] border border-border bg-surface">
                                {resources.map(
                                    (resource, index) => (
                                        <a
                                            key={
                                                resource.id ||
                                                index
                                            }
                                            href={
                                                resource.resource_url
                                            }
                                            target="_blank"
                                            rel="noreferrer"
                                            className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-surface-secondary/50 sm:px-6"
                                        >
                                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright">
                                                <FileIcon size={17} />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <p className="truncate text-sm font-medium">
                                                    {resource.title ||
                                                        `Resource ${
                                                            index +
                                                            1
                                                        }`}
                                                </p>

                                                {resource.description && (
                                                    <p className="mt-1 line-clamp-1 text-xs text-muted">
                                                        {
                                                            resource.description
                                                        }
                                                    </p>
                                                )}
                                            </div>

                                            <span className="text-muted-light transition-transform group-hover:translate-x-1 group-hover:text-purple-bright">
                                                <ExternalIcon size={15} />
                                            </span>
                                        </a>
                                    )
                                )}
                            </div>
                        </section>
                    )}

                    {/* Tests */}
                    {tests.length > 0 && (
                        <section className="mt-10 border-t border-border pt-8">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-purple-bright">
                                Assessment
                            </p>

                            <h2 className="mt-2 text-xl font-semibold tracking-[-0.025em]">
                                Class test
                            </h2>

                            <div className="mt-5 space-y-3">
                                {tests.map(
                                    (test, index) => {
                                        const attempt =
                                            test.attempt ||
                                            test.test_attempt ||
                                            null;

                                        const submitted =
                                            !!attempt?.submitted_at ||
                                            attempt?.status ===
                                                "submitted";

                                        return (
                                            <Link
                                                key={
                                                    test.id ||
                                                    index
                                                }
                                                href={`/student/tests/${test.id}`}
                                                className="group flex items-center gap-4 rounded-[22px] border border-border bg-surface p-5 transition-all hover:border-purple-bright/20 hover:bg-surface-secondary/40"
                                            >
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-bright/[0.08] text-purple-bright">
                                                    <CheckIcon
                                                        size={17}
                                                    />
                                                </div>

                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-medium">
                                                        {test.title ||
                                                            `Class test ${
                                                                index +
                                                                1
                                                            }`}
                                                    </p>

                                                    <p className="mt-1 text-xs text-muted">
                                                        {submitted
                                                            ? "Attempt submitted"
                                                            : `${test.duration_minutes ||
                                                                60} minute assessment`}
                                                    </p>
                                                </div>

                                                <span className="flex items-center gap-1.5 text-xs font-medium text-purple-bright">
                                                    {submitted
                                                        ? "View"
                                                        : "Start"}

                                                    <ArrowIcon
                                                        size={14}
                                                    />
                                                </span>
                                            </Link>
                                        );
                                    }
                                )}
                            </div>
                        </section>
                    )}
                </div>

                {/* Class summary */}
                <aside>
                    <div className="lg:sticky lg:top-6">
                        <div className="rounded-[24px] border border-border bg-surface p-5 sm:p-6">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-muted-light">
                                Class details
                            </p>

                            <div className="mt-5 space-y-5">
                                {classData.classItem
                                    .class_number && (
                                    <div>
                                        <p className="text-[11px] text-muted-light">
                                            Class
                                        </p>

                                        <p className="mt-1 text-sm font-medium">
                                            {
                                                classData
                                                    .classItem
                                                    .class_number
                                            }
                                        </p>
                                    </div>
                                )}

                                {classData.classItem
                                    .duration_minutes && (
                                    <div>
                                        <p className="text-[11px] text-muted-light">
                                            Duration
                                        </p>

                                        <p className="mt-1 flex items-center gap-1.5 text-sm font-medium">
                                            <ClockIcon size={14} />
                                            {
                                                classData
                                                    .classItem
                                                    .duration_minutes
                                            }{" "}
                                            minutes
                                        </p>
                                    </div>
                                )}

                                <div>
                                    <p className="text-[11px] text-muted-light">
                                        Topic
                                    </p>

                                    <p className="mt-1 text-sm font-medium">
                                        {topicName}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-[11px] text-muted-light">
                                        Status
                                    </p>

                                    <div className="mt-2">
                                        {status ===
                                        "completed" ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-success">
                                                <CheckIcon
                                                    size={13}
                                                />
                                                Completed
                                            </span>
                                        ) : status ===
                                            "in_progress" ? (
                                            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-purple-bright">
                                                <span className="h-1.5 w-1.5 rounded-full bg-purple-bright" />
                                                In progress
                                            </span>
                                        ) : (
                                            <span className="text-xs text-muted">
                                                Not started
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Link
                            href="/student/classes"
                            className="mt-4 flex items-center justify-between rounded-2xl border border-border px-4 py-3 text-xs font-medium text-muted transition-colors hover:bg-surface-secondary hover:text-purple-bright"
                        >
                            <span>All classes</span>
                            <ArrowIcon size={14} />
                        </Link>
                    </div>
                </aside>
            </div>

            {/* Bottom navigation */}
            <div className="mt-12 flex items-center justify-between border-t border-border pt-6 pb-5">
                <Link
                    href="/student/classes"
                    className="inline-flex items-center gap-2 text-xs font-medium text-muted transition-colors hover:text-purple-bright"
                >
                    <ArrowLeftIcon size={14} />
                    Back to classes
                </Link>

                {completed && (
                    <Link
                        href="/student/tests"
                        className="inline-flex items-center gap-2 text-xs font-medium text-purple-bright"
                    >
                        View assessments
                        <ArrowIcon size={14} />
                    </Link>
                )}
            </div>
        </motion.main>
    );
}