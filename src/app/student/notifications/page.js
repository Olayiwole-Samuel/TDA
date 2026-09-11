"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
Bell,
BellRing,
Check,
CheckCheck,
Search,
RefreshCw,
ChevronDown,
ChevronUp,
Inbox,
Sparkles,
CircleAlert,
GraduationCap,
ClipboardCheck,
FileText,
Trophy,
Megaphone,
Settings,
MessageCircleQuestion,
UserRound,
X,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const NOTIFICATION_TYPES = {
general: {
label: "General",
icon: Bell,
},
academic: {
label: "Academic",
icon: GraduationCap,
},
test: {
label: "Class Test",
icon: ClipboardCheck,
},
examination: {
label: "Examination",
icon: FileText,
},
result: {
label: "Result",
icon: Trophy,
},
promotion: {
label: "Promotion",
icon: GraduationCap,
},
announcement: {
label: "Announcement",
icon: Megaphone,
},
system: {
label: "System",
icon: Settings,
},
};

function normalizeData(data) {
if (!data) return {};

if (Array.isArray(data)) {
    return {
        notifications: data,
    };
}

return data;

}

function normalizeNotifications(data) {
const source =
data?.notifications ||
data?.notification ||
data?.data?.notifications ||
data?.communications?.notifications ||
[];

if (!Array.isArray(source)) return [];

return source
    .filter(Boolean)
    .map((item) => ({
        id: item.id || item.notification_id,
        title: item.title || "Notification",
        message:
            item.message ||
            item.content ||
            item.body ||
            "",
        notificationType: String(
            item.notification_type ||
                item.notificationType ||
                "general"
        ).toLowerCase(),
        relatedId:
            item.related_id ||
            item.relatedId ||
            null,
        isRead:
            item.is_read === true ||
            item.isRead === true,
        readAt:
            item.read_at ||
            item.readAt ||
            null,
        createdAt:
            item.created_at ||
            item.createdAt ||
            null,
        updatedAt:
            item.updated_at ||
            item.updatedAt ||
            null,
    }))
    .filter((item) => item.id);

}

function formatDate(value) {
if (!value) return "Recently";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return "Recently";
}

return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(date);

}

function formatDateTime(value) {
if (!value) return "";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return "";
}

return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
}).format(date);

}

function formatRelativeDate(value) {
if (!value) return "Recently";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return "Recently";
}

const now = new Date();
const difference = now.getTime() - date.getTime();

if (difference < 0) return "Upcoming";

const minutes = Math.floor(difference / (1000 * 60));
const hours = Math.floor(difference / (1000 * 60 * 60));
const days = Math.floor(
    difference / (1000 * 60 * 60 * 24)
);

if (minutes < 1) return "Just now";
if (minutes < 60) return `${minutes}m ago`;
if (hours < 24) return `${hours}h ago`;
if (days === 1) return "Yesterday";
if (days < 7) return `${days}d ago`;

return formatDate(value);

}

function getTypeConfig(type) {
return (
NOTIFICATION_TYPES[type] ||
NOTIFICATION_TYPES.general
);
}

function NotificationIcon({ type, unread }) {
const config = getTypeConfig(type);
const Icon = config.icon;

return (
    <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl transition ${
            unread
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-surface-secondary text-muted"
        }`}
    >
        <Icon size={21} strokeWidth={1.9} />
    </div>
);

}

function TypeBadge({ type }) {
const config = getTypeConfig(type);

return (
    <span className="inline-flex items-center rounded-full bg-surface-secondary px-2.5 py-1.5 text-[11px] font-semibold text-muted">
        {config.label}
    </span>
);

}

function NotificationCard({
notification,
index,
expanded,
onToggle,
onMarkRead,
markingRead,
}) {
const unread = !notification.isRead;

return (
    <motion.article
        layout
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{
            duration: 0.3,
            delay: Math.min(index * 0.04, 0.25),
        }}
        className={`overflow-hidden rounded-[28px] border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-md ${
            unread
                ? "border-primary/20"
                : "border-border"
        }`}
    >
        <button
            type="button"
            onClick={onToggle}
            className="w-full text-left"
            aria-expanded={expanded}
        >
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <NotificationIcon
                        type={notification.notificationType}
                        unread={unread}
                    />

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <TypeBadge
                                type={
                                    notification.notificationType
                                }
                            />

                            {unread && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
                                    <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                    New
                                </span>
                            )}
                        </div>

                        <h2
                            className={`mt-3 text-[16px] leading-6 sm:text-[18px] ${
                                unread
                                    ? "font-bold text-foreground"
                                    : "font-semibold text-foreground"
                            }`}
                        >
                            {notification.title}
                        </h2>

                        <p
                            className={`mt-2 line-clamp-2 text-sm leading-6 ${
                                unread
                                    ? "text-foreground/80"
                                    : "text-muted"
                            }`}
                        >
                            {notification.message ||
                                "No additional message was provided."}
                        </p>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                            <span>
                                {formatRelativeDate(
                                    notification.createdAt
                                )}
                            </span>

                            {notification.createdAt && (
                                <span>
                                    {formatDateTime(
                                        notification.createdAt
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted">
                        {expanded ? (
                            <ChevronUp size={18} />
                        ) : (
                            <ChevronDown size={18} />
                        )}
                    </div>
                </div>
            </div>
        </button>

        <AnimatePresence initial={false}>
            {expanded && (
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
                >
                    <div className="border-t border-border px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
                        <div className="pl-0 sm:pl-16">
                            <p className="whitespace-pre-wrap text-sm leading-7 text-foreground sm:text-[15px]">
                                {notification.message ||
                                    "No additional message was provided."}
                            </p>

                            <div className="mt-5 flex flex-wrap items-center gap-3">
                                {unread ? (
                                    <button
                                        type="button"
                                        onClick={(event) => {
                                            event.stopPropagation();
                                            onMarkRead();
                                        }}
                                        disabled={markingRead}
                                        className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                                    >
                                        {markingRead ? (
                                            <RefreshCw
                                                size={14}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <Check size={15} />
                                        )}

                                        {markingRead
                                            ? "Marking..."
                                            : "Mark as read"}
                                    </button>
                                ) : (
                                    <span className="inline-flex items-center gap-2 rounded-xl bg-surface-secondary px-4 py-2.5 text-xs font-semibold text-muted">
                                        <CheckCheck size={15} />
                                        Read
                                    </span>
                                )}

                                {notification.relatedId && (
                                    <span className="rounded-xl border border-border px-3 py-2 text-xs text-muted">
                                        Related academy activity
                                    </span>
                                )}
                            </div>

                            <div className="mt-5 border-t border-border pt-4 text-xs text-muted">
                                {notification.isRead &&
                                notification.readAt ? (
                                    <span>
                                        Read{" "}
                                        {formatDateTime(
                                            notification.readAt
                                        )}
                                    </span>
                                ) : (
                                    <span>
                                        Received{" "}
                                        {formatDateTime(
                                            notification.createdAt
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.article>
);

}

function EmptyState({
searchActive,
filterActive,
onClear,
}) {
let title = "You're all caught up";
let description =
"You don't have any notifications at the moment. Important academy updates will appear here.";

if (searchActive) {
    title = "No notifications found";
    description =
        "Try a different search term or clear your filters to see more notifications.";
} else if (filterActive) {
    title = "Nothing in this category";
    description =
        "There are no notifications matching the selected category.";
}

return (
    <motion.div
        initial={{
            opacity: 0,
            y: 12,
        }}
        animate={{
            opacity: 1,
            y: 0,
        }}
        className="rounded-[28px] border border-dashed border-border bg-surface px-6 py-14 text-center"
    >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-secondary text-primary">
            {searchActive || filterActive ? (
                <Search size={26} />
            ) : (
                <Inbox size={26} />
            )}
        </div>

        <h3 className="mt-5 text-lg font-semibold text-foreground">
            {title}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {description}
        </p>

        {(searchActive || filterActive) && (
            <button
                type="button"
                onClick={onClear}
                className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
                Clear filters
            </button>
        )}
    </motion.div>
);

}

export default function StudentNotificationsPage() {
const [notifications, setNotifications] =
useState([]);

const [search, setSearch] = useState("");
const [filter, setFilter] = useState("all");
const [expandedId, setExpandedId] =
    useState(null);

const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] =
    useState(false);

const [markingId, setMarkingId] =
    useState(null);

const [markingAll, setMarkingAll] =
    useState(false);

const [error, setError] = useState("");

async function loadNotifications(
    showRefresh = false
) {
    if (showRefresh) {
        setRefreshing(true);
    } else {
        setLoading(true);
    }

    setError("");

    try {
        const {
            data: userData,
            error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
            throw userError;
        }

        if (!userData?.user) {
            throw new Error(
                "You need to be signed in to view your notifications."
            );
        }

        const {
            data,
            error: rpcError,
        } = await supabase.rpc(
            "get_my_communications"
        );

        if (rpcError) {
            throw rpcError;
        }

        const normalized = normalizeData(data);

        const items =
            normalizeNotifications(normalized);

        items.sort((a, b) => {
            const first = new Date(
                a.createdAt || 0
            ).getTime();

            const second = new Date(
                b.createdAt || 0
            ).getTime();

            return second - first;
        });

        setNotifications(items);

        setExpandedId((current) => {
            if (
                current &&
                items.some(
                    (item) => item.id === current
                )
            ) {
                return current;
            }

            return null;
        });
    } catch (err) {
        console.error(
            "Notifications error:",
            err
        );

        setError(
            err?.message ||
                "We couldn't load your notifications. Please try again."
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}

useEffect(() => {
    loadNotifications();
}, []);

const unreadCount = useMemo(
    () =>
        notifications.filter(
            (item) => !item.isRead
        ).length,
    [notifications]
);

const filteredNotifications = useMemo(() => {
    const query = search
        .trim()
        .toLowerCase();

    return notifications.filter(
        (notification) => {
            const matchesFilter =
                filter === "all" ||
                notification.notificationType ===
                    filter;

            if (!matchesFilter) {
                return false;
            }

            if (!query) {
                return true;
            }

            const searchable = [
                notification.title,
                notification.message,
                notification.notificationType,
            ]
                .filter(Boolean)
                .join(" ")
                .toLowerCase();

            return searchable.includes(query);
        }
    );
}, [notifications, search, filter]);

const availableTypes = useMemo(() => {
    const types = new Set(
        notifications
            .map(
                (item) =>
                    item.notificationType
            )
            .filter(Boolean)
    );

    return Array.from(types);
}, [notifications]);

async function markNotificationRead(
    notification
) {
    if (
        !notification ||
        notification.isRead
    ) {
        return;
    }

    setMarkingId(notification.id);
    setError("");

    try {
        const { data, error: rpcError } =
            await supabase.rpc(
                "mark_notification_read",
                {
                    p_notification_id:
                        notification.id,
                }
            );

        if (rpcError) {
            throw rpcError;
        }

        setNotifications((current) =>
            current.map((item) =>
                item.id === notification.id
                    ? {
                          ...item,
                          isRead: true,
                          readAt:
                              item.readAt ||
                              new Date().toISOString(),
                      }
                    : item
            )
        );

        return data;
    } catch (err) {
        console.error(
            "Mark notification read error:",
            err
        );

        setError(
            err?.message ||
                "We couldn't mark this notification as read."
        );
    } finally {
        setMarkingId(null);
    }
}

async function markAllAsRead() {
    const unreadNotifications =
        notifications.filter(
            (item) => !item.isRead
        );

    if (!unreadNotifications.length) {
        return;
    }

    setMarkingAll(true);
    setError("");

    try {
        for (const notification of unreadNotifications) {
            const { error: rpcError } =
                await supabase.rpc(
                    "mark_notification_read",
                    {
                        p_notification_id:
                            notification.id,
                    }
                );

            if (rpcError) {
                throw rpcError;
            }
        }

        const now =
            new Date().toISOString();

        setNotifications((current) =>
            current.map((item) =>
                item.isRead
                    ? item
                    : {
                          ...item,
                          isRead: true,
                          readAt:
                              item.readAt || now,
                      }
            )
        );
    } catch (err) {
        console.error(
            "Mark all notifications read error:",
            err
        );

        setError(
            err?.message ||
                "We couldn't mark all notifications as read."
        );

        await loadNotifications(true);
    } finally {
        setMarkingAll(false);
    }
}

function clearFilters() {
    setSearch("");
    setFilter("all");
}

const hasFilters =
    Boolean(search.trim()) ||
    filter !== "all";

return (
    <main className="min-h-full bg-background text-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <motion.div
                initial={{
                    opacity: 0,
                    y: 12,
                }}
                animate={{
                    opacity: 1,
                    y: 0,
                }}
                transition={{
                    duration: 0.4,
                }}
            >
                <div className="relative overflow-hidden rounded-[32px] border border-border bg-surface shadow-sm">
                    <div
                        className="absolute -right-20 -top-24 h-64 w-64 rounded-full opacity-20 blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle, #9D4BFF 0%, transparent 70%)",
                        }}
                    />

                    <div
                        className="absolute -bottom-32 left-1/3 h-64 w-64 rounded-full opacity-10 blur-3xl"
                        style={{
                            background:
                                "radial-gradient(circle, #5500A6 0%, transparent 70%)",
                        }}
                    />

                    <div className="relative p-6 sm:p-8 lg:p-10">
                        <div className="flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
                            <div className="max-w-2xl">
                                <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-secondary px-3 py-1.5 text-xs font-semibold text-primary">
                                    <Sparkles
                                        size={13}
                                    />
                                    Stay up to date
                                </div>

                                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                                    Notifications
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                                    Keep track of important
                                    academy activity, assessment
                                    updates, results, announcements,
                                    and other notifications.
                                </p>
                            </div>

                            <div className="relative shrink-0">
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-[22px] text-white shadow-lg"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #5500A6, #9D4BFF)",
                                    }}
                                >
                                    {unreadCount >
                                    0 ? (
                                        <BellRing
                                            size={28}
                                            strokeWidth={
                                                1.8
                                            }
                                        />
                                    ) : (
                                        <Bell
                                            size={28}
                                            strokeWidth={
                                                1.8
                                            }
                                        />
                                    )}
                                </div>

                                {unreadCount >
                                    0 && (
                                    <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-surface bg-primary px-1.5 text-[10px] font-bold text-white">
                                        {unreadCount >
                                        99
                                            ? "99+"
                                            : unreadCount}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 12,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.08,
                    }}
                    className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                        Total
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {notifications.length}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        notifications
                    </p>
                </motion.div>

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 12,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.13,
                    }}
                    className="rounded-[24px] border border-primary/15 bg-primary/[0.04] p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-primary">
                        Unread
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {unreadCount}
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        waiting for you
                    </p>
                </motion.div>

                <motion.div
                    initial={{
                        opacity: 0,
                        y: 12,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    transition={{
                        delay: 0.18,
                    }}
                    className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                        Showing
                    </p>

                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {
                            filteredNotifications.length
                        }
                    </p>

                    <p className="mt-1 text-xs text-muted">
                        matching notifications
                    </p>
                </motion.div>
            </div>

            <div className="mt-8 flex flex-col gap-3">
                <div className="flex flex-col gap-3 sm:flex-row">
                    <div className="relative min-w-0 flex-1">
                        <Search
                            size={18}
                            className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                        />

                        <input
                            type="search"
                            value={search}
                            onChange={(
                                event
                            ) =>
                                setSearch(
                                    event.target
                                        .value
                                )
                            }
                            placeholder="Search notifications..."
                            className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                        />
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadNotifications(
                                true
                            )
                        }
                        disabled={
                            refreshing
                        }
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        <RefreshCw
                            size={17}
                            className={
                                refreshing
                                    ? "animate-spin"
                                    : ""
                            }
                        />
                        Refresh
                    </button>

                    {unreadCount >
                        0 && (
                        <button
                            type="button"
                            onClick={
                                markAllAsRead
                            }
                            disabled={
                                markingAll
                            }
                            className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {markingAll ? (
                                <RefreshCw
                                    size={17}
                                    className="animate-spin"
                                />
                            ) : (
                                <CheckCheck
                                    size={17}
                                />
                            )}

                            {markingAll
                                ? "Updating..."
                                : "Mark all read"}
                        </button>
                    )}
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    <button
                        type="button"
                        onClick={() =>
                            setFilter(
                                "all"
                            )
                        }
                        className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                            filter === "all"
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground"
                        }`}
                    >
                        All
                    </button>

                    {availableTypes.map(
                        (type) => {
                            const config =
                                getTypeConfig(
                                    type
                                );

                            return (
                                <button
                                    key={
                                        type
                                    }
                                    type="button"
                                    onClick={() =>
                                        setFilter(
                                            type
                                        )
                                    }
                                    className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${
                                        filter ===
                                        type
                                            ? "bg-primary text-primary-foreground"
                                            : "border border-border bg-surface text-muted hover:bg-surface-secondary hover:text-foreground"
                                    }`}
                                >
                                    {
                                        config.label
                                    }
                                </button>
                            );
                        }
                    )}

                    {hasFilters && (
                        <button
                            type="button"
                            onClick={
                                clearFilters
                            }
                            className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-muted transition hover:text-foreground"
                        >
                            <X
                                size={
                                    13
                                }
                            />
                            Clear
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <motion.div
                    initial={{
                        opacity: 0,
                        y: 8,
                    }}
                    animate={{
                        opacity: 1,
                        y: 0,
                    }}
                    className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4"
                >
                    <CircleAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-danger"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                            Something went wrong
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() =>
                            loadNotifications()
                        }
                        className="shrink-0 text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                        Try again
                    </button>
                </motion.div>
            )}

            <section className="mt-8">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map(
                            (item) => (
                                <div
                                    key={
                                        item
                                    }
                                    className="animate-pulse rounded-[28px] border border-border bg-surface p-6"
                                >
                                    <div className="flex gap-4">
                                        <div className="h-12 w-12 shrink-0 rounded-2xl bg-surface-secondary" />

                                        <div className="flex-1">
                                            <div className="h-4 w-24 rounded-full bg-surface-secondary" />

                                            <div className="mt-4 h-5 w-2/3 rounded-full bg-surface-secondary" />

                                            <div className="mt-3 h-3 w-4/5 rounded-full bg-surface-secondary" />

                                            <div className="mt-2 h-3 w-1/3 rounded-full bg-surface-secondary" />
                                        </div>
                                    </div>
                                </div>
                            )
                        )}
                    </div>
                ) : filteredNotifications.length ===
                  0 ? (
                    <EmptyState
                        searchActive={Boolean(
                            search.trim()
                        )}
                        filterActive={
                            filter !==
                            "all"
                        }
                        onClear={
                            clearFilters
                        }
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Your notifications
                                </h2>

                                <p className="mt-1 text-xs text-muted">
                                    Latest activity from
                                    the academy
                                </p>
                            </div>

                            {unreadCount >
                                0 && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary">
                                    <BellRing
                                        size={
                                            13
                                        }
                                    />
                                    {
                                        unreadCount
                                    }{" "}
                                    unread
                                </span>
                            )}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredNotifications.map(
                                (
                                    notification,
                                    index
                                ) => (
                                    <NotificationCard
                                        key={
                                            notification.id
                                        }
                                        notification={
                                            notification
                                        }
                                        index={
                                            index
                                        }
                                        expanded={
                                            expandedId ===
                                            notification.id
                                        }
                                        onToggle={() =>
                                            setExpandedId(
                                                (
                                                    current
                                                ) =>
                                                    current ===
                                                    notification.id
                                                        ? null
                                                        : notification.id
                                            )
                                        }
                                        onMarkRead={() =>
                                            markNotificationRead(
                                                notification
                                            )
                                        }
                                        markingRead={
                                            markingId ===
                                            notification.id
                                        }
                                    />
                                )
                            )}
                        </AnimatePresence>
                    </div>
                )}
            </section>
        </div>
    </main>
);
}