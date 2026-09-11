"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
Megaphone,
Search,
CalendarDays,
ChevronDown,
ChevronUp,
Sparkles,
Clock3,
Inbox,
RefreshCw,
AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const PURPLE = "#6A1BDB";

function normalizeData(data) {
if (!data) return {};

if (Array.isArray(data)) {
    return {
        announcements: data,
    };
}

return data;


}

function normalizeAnnouncements(data) {
const source =
data?.announcements ||
data?.announcement ||
data?.data?.announcements ||
data?.communications?.announcements ||
[];


if (!Array.isArray(source)) return [];

return source
    .filter(Boolean)
    .map((item) => ({
        id: item.id || item.announcement_id,
        title: item.title || "Untitled announcement",
        content: item.content || item.message || "",
        targetLevelId:
            item.target_level_id ||
            item.targetLevelId ||
            null,
        targetSessionId:
            item.target_session_id ||
            item.targetSessionId ||
            null,
        levelName:
            item.level_name ||
            item.levelName ||
            item.level?.name ||
            null,
        sessionName:
            item.session_name ||
            item.sessionName ||
            item.session?.name ||
            null,
        isPublished:
            item.is_published !== false &&
            item.isPublished !== false,
        publishedAt:
            item.published_at ||
            item.publishedAt ||
            item.created_at ||
            item.createdAt ||
            null,
        createdAt:
            item.created_at ||
            item.createdAt ||
            null,
    }))
    .filter((item) => item.id);


}

function formatDate(value) {
if (!value) return "Recently published";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return "Recently published";
}

return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "long",
    year: "numeric",
}).format(date);


}

function formatRelativeDate(value) {
if (!value) return "";

const date = new Date(value);

if (Number.isNaN(date.getTime())) {
    return "";
}

const now = new Date();
const diff = now.getTime() - date.getTime();

if (diff < 0) return "Upcoming";

const minutes = Math.floor(diff / (1000 * 60));
const hours = Math.floor(diff / (1000 * 60 * 60));
const days = Math.floor(diff / (1000 * 60 * 60 * 24));

if (minutes < 1) return "Just now";
if (minutes < 60) return `${minutes}m ago`;
if (hours < 24) return `${hours}h ago`;
if (days === 1) return "Yesterday";
if (days < 7) return `${days}d ago`;

return formatDate(value);
```

}

function stripHtml(value) {
if (!value) return "";

```
return value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
```

}

function AnnouncementCard({ announcement, index, expanded, onToggle }) {
const plainContent = stripHtml(announcement.content);

```
const preview =
    plainContent.length > 180
        ? `${plainContent.slice(0, 180).trim()}…`
        : plainContent;

return (
    <motion.article
        layout
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.35,
            delay: Math.min(index * 0.05, 0.3),
        }}
        className="group overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
        <button
            type="button"
            onClick={onToggle}
            className="w-full text-left"
            aria-expanded={expanded}
        >
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div
                        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-white shadow-sm"
                        style={{
                            background:
                                "linear-gradient(135deg, #5500A6, #7F2AE8)",
                        }}
                    >
                        <Megaphone size={21} strokeWidth={2} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span
                                className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold"
                                style={{
                                    color: PURPLE,
                                    background:
                                        "rgba(106, 27, 219, 0.09)",
                                }}
                            >
                                Announcement
                            </span>

                            {announcement.levelName && (
                                <span className="inline-flex items-center rounded-full bg-surface-secondary px-2.5 py-1 text-[11px] font-medium text-muted">
                                    {announcement.levelName}
                                </span>
                            )}
                        </div>

                        <h2 className="mt-3 text-[17px] font-semibold leading-6 tracking-[-0.01em] text-foreground sm:text-[19px]">
                            {announcement.title}
                        </h2>

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
                            <span className="inline-flex items-center gap-1.5">
                                <CalendarDays size={13} />
                                {formatDate(announcement.publishedAt)}
                            </span>

                            {announcement.publishedAt && (
                                <span className="inline-flex items-center gap-1.5">
                                    <Clock3 size={13} />
                                    {formatRelativeDate(
                                        announcement.publishedAt
                                    )}
                                </span>
                            )}
                        </div>
                    </div>

                    <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-secondary text-muted transition-colors group-hover:text-foreground">
                        {expanded ? (
                            <ChevronUp size={18} />
                        ) : (
                            <ChevronDown size={18} />
                        )}
                    </div>
                </div>

                {!expanded && preview && (
                    <p className="mt-5 pl-16 text-sm leading-6 text-muted sm:text-[15px]">
                        {preview}
                    </p>
                )}
            </div>
        </button>

        <AnimatePresence initial={false}>
            {expanded && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                >
                    <div className="border-t border-border px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
                        <div className="pl-0 sm:pl-16">
                            <div className="whitespace-pre-wrap text-sm leading-7 text-foreground/85 sm:text-[15px]">
                                {announcement.content ||
                                    "No additional information was provided."}
                            </div>

                            <div className="mt-6 flex flex-wrap gap-2">
                                {announcement.levelName && (
                                    <div className="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-muted">
                                        <span className="font-semibold text-foreground">
                                            Level:
                                        </span>{" "}
                                        {announcement.levelName}
                                    </div>
                                )}

                                {announcement.sessionName && (
                                    <div className="rounded-xl border border-border bg-surface-secondary px-3 py-2 text-xs text-muted">
                                        <span className="font-semibold text-foreground">
                                            Session:
                                        </span>{" "}
                                        {announcement.sessionName}
                                    </div>
                                )}
                            </div>

                            <div className="mt-5 text-xs text-muted">
                                Published{" "}
                                <span className="font-medium text-foreground">
                                    {formatDate(
                                        announcement.publishedAt
                                    )}
                                </span>
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </motion.article>
);


}

function EmptyState({ searchActive, onClear }) {
return (
<motion.div
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
className="rounded-[28px] border border-dashed border-border bg-surface px-6 py-14 text-center"
> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-secondary text-primary">
{searchActive ? ( <Search size={26} />
) : ( <Inbox size={26} />
)} </div>


        <h3 className="mt-5 text-lg font-semibold text-foreground">
            {searchActive
                ? "No announcements found"
                : "No announcements yet"}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {searchActive
                ? "Try a different search term or clear your search to see all available announcements."
                : "There are no published announcements available for you at the moment. New academy updates will appear here."}
        </p>

        {searchActive && (
            <button
                type="button"
                onClick={onClear}
                className="mt-5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
            >
                Clear search
            </button>
        )}
    </motion.div>
);


}

export default function StudentAnnouncementsPage() {
const [announcements, setAnnouncements] = useState([]);
const [search, setSearch] = useState("");
const [expandedId, setExpandedId] = useState(null);
const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState("");

async function loadAnnouncements(showRefresh = false) {
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
                "You need to be signed in to view announcements."
            );
        }

        const { data, error: rpcError } = await supabase.rpc(
            "get_my_communications"
        );

        if (rpcError) {
            throw rpcError;
        }

        const normalized = normalizeData(data);
        const items = normalizeAnnouncements(normalized);

        setAnnouncements(items);

        setExpandedId((current) => {
            if (
                current &&
                items.some((announcement) => announcement.id === current)
            ) {
                return current;
            }

            return null;
        });
    } catch (err) {
        console.error("Announcements error:", err);

        setError(
            err?.message ||
                "We couldn't load your announcements. Please try again."
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}

useEffect(() => {
    loadAnnouncements();
}, []);

const filteredAnnouncements = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return announcements;

    return announcements.filter((announcement) => {
        const searchable = [
            announcement.title,
            announcement.content,
            announcement.levelName,
            announcement.sessionName,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchable.includes(query);
    });
}, [announcements, search]);

const latestAnnouncement = announcements[0];

return (
    <main className="min-h-full bg-background text-foreground">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
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
                                    <Sparkles size={13} />
                                    Academy updates
                                </div>

                                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                                    Announcements
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                                    Stay informed about important academy
                                    updates, class information, schedules,
                                    assessments, and other notices.
                                </p>
                            </div>

                            <div className="shrink-0">
                                <div
                                    className="flex h-16 w-16 items-center justify-center rounded-[22px] text-white shadow-lg"
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #5500A6, #9D4BFF)",
                                    }}
                                >
                                    <Megaphone
                                        size={28}
                                        strokeWidth={1.8}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.08 }}
                    className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                        Published
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {announcements.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        announcements available
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.13 }}
                    className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                        Latest
                    </p>
                    <p className="mt-2 truncate text-lg font-semibold tracking-tight text-foreground">
                        {latestAnnouncement?.title || "Nothing new"}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        {latestAnnouncement
                            ? formatRelativeDate(
                                  latestAnnouncement.publishedAt
                              )
                            : "Waiting for updates"}
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.18 }}
                    className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                >
                    <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                        Showing
                    </p>
                    <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                        {filteredAnnouncements.length}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                        matching announcements
                    </p>
                </motion.div>
            </div>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative min-w-0 flex-1">
                    <Search
                        size={18}
                        className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted"
                    />

                    <input
                        type="search"
                        value={search}
                        onChange={(event) =>
                            setSearch(event.target.value)
                        }
                        placeholder="Search announcements..."
                        className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => loadAnnouncements(true)}
                    disabled={refreshing}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={refreshing ? "animate-spin" : ""}
                    />
                    Refresh
                </button>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-6 flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4"
                >
                    <div className="mt-0.5 shrink-0 text-danger">
                        <AlertCircle size={18} />
                    </div>

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                            Couldn't load announcements
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadAnnouncements()}
                        className="shrink-0 text-sm font-semibold text-primary hover:text-primary-hover"
                    >
                        Try again
                    </button>
                </motion.div>
            )}

            <section className="mt-8">
                {loading ? (
                    <div className="space-y-4">
                        {[1, 2, 3].map((item) => (
                            <div
                                key={item}
                                className="animate-pulse rounded-[28px] border border-border bg-surface p-6"
                            >
                                <div className="flex gap-4">
                                    <div className="h-12 w-12 shrink-0 rounded-2xl bg-surface-secondary" />

                                    <div className="flex-1">
                                        <div className="h-4 w-28 rounded-full bg-surface-secondary" />
                                        <div className="mt-4 h-5 w-2/3 rounded-full bg-surface-secondary" />
                                        <div className="mt-3 h-3 w-1/3 rounded-full bg-surface-secondary" />
                                    </div>
                                </div>

                                <div className="mt-6 h-3 w-4/5 rounded-full bg-surface-secondary" />
                                <div className="mt-3 h-3 w-3/5 rounded-full bg-surface-secondary" />
                            </div>
                        ))}
                    </div>
                ) : filteredAnnouncements.length === 0 ? (
                    <EmptyState
                        searchActive={Boolean(search.trim())}
                        onClear={() => setSearch("")}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Latest updates
                                </h2>
                                <p className="mt-1 text-xs text-muted">
                                    Official information from the academy
                                </p>
                            </div>

                            {search.trim() && (
                                <span className="rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-muted">
                                    Search: "{search.trim()}"
                                </span>
                            )}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredAnnouncements.map(
                                (announcement, index) => (
                                    <AnnouncementCard
                                        key={announcement.id}
                                        announcement={announcement}
                                        index={index}
                                        expanded={
                                            expandedId === announcement.id
                                        }
                                        onToggle={() =>
                                            setExpandedId((current) =>
                                                current ===
                                                announcement.id
                                                    ? null
                                                    : announcement.id
                                            )
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