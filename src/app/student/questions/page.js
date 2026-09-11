"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
MessageCircleQuestion,
Plus,
Search,
Send,
ChevronDown,
ChevronUp,
Clock3,
CheckCircle2,
CircleAlert,
X,
RefreshCw,
Inbox,
Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

const STATUS_CONFIG = {
open: {
label: "Open",
icon: Clock3,
className:
"bg-amber-500/10 text-amber-600 dark:text-amber-400",
},
answered: {
label: "Answered",
icon: CheckCircle2,
className:
"bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
},
closed: {
label: "Closed",
icon: CheckCircle2,
className: "bg-surface-secondary text-muted",
},
};

function normalizeData(data) {
if (!data) return {};


if (Array.isArray(data)) {
    return {
        questions: data,
    };
}

return data;


}

function normalizeQuestions(data) {
const source =
data?.support_questions ||
data?.supportQuestions ||
data?.questions ||
data?.data?.support_questions ||
data?.communications?.support_questions ||
[];


if (!Array.isArray(source)) return [];

return source
    .filter(Boolean)
    .map((item) => ({
        id: item.id || item.question_id,
        subject:
            item.subject ||
            item.title ||
            "Question",
        question:
            item.question ||
            item.message ||
            item.content ||
            "",
        status: String(item.status || "open").toLowerCase(),
        answer:
            item.answer ||
            item.response ||
            null,
        answeredBy:
            item.answered_by_name ||
            item.answeredByName ||
            item.answered_by ||
            null,
        answeredAt:
            item.answered_at ||
            item.answeredAt ||
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
    month: "short",
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
    month: "long",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
}).format(date);


}

function getStatusConfig(status) {
return STATUS_CONFIG[status] || STATUS_CONFIG.open;
}

function QuestionStatus({ status }) {
const config = getStatusConfig(status);
const Icon = config.icon;


return (
    <span
        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold ${config.className}`}
    >
        <Icon size={12} />
        {config.label}
    </span>
);


}

function QuestionCard({
question,
index,
expanded,
onToggle,
}) {
const hasAnswer = Boolean(question.answer);


return (
    <motion.article
        layout
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
            duration: 0.35,
            delay: Math.min(index * 0.05, 0.3),
        }}
        className="overflow-hidden rounded-[28px] border border-border bg-surface shadow-sm transition-shadow duration-300 hover:shadow-md"
    >
        <button
            type="button"
            onClick={onToggle}
            className="w-full text-left"
            aria-expanded={expanded}
        >
            <div className="p-5 sm:p-6">
                <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-surface-secondary text-primary">
                        <MessageCircleQuestion
                            size={21}
                            strokeWidth={1.9}
                        />
                    </div>

                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <QuestionStatus status={question.status} />

                            {hasAnswer && (
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-2.5 py-1.5 text-[11px] font-semibold text-primary">
                                    <CheckCircle2 size={12} />
                                    Response available
                                </span>
                            )}
                        </div>

                        <h3 className="mt-3 text-[16px] font-semibold leading-6 text-foreground sm:text-[18px]">
                            {question.subject}
                        </h3>

                        <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted">
                            {question.question ||
                                "No question content available."}
                        </p>

                        <div className="mt-3 flex items-center gap-2 text-xs text-muted">
                            <Clock3 size={13} />
                            Asked {formatDate(question.createdAt)}
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
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28 }}
                >
                    <div className="border-t border-border px-5 pb-6 pt-5 sm:px-6 sm:pb-7">
                        <div className="space-y-5">
                            <div>
                                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                    Your question
                                </p>

                                <div className="rounded-2xl bg-surface-secondary p-4">
                                    <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                                        {question.question ||
                                            "No question content available."}
                                    </p>
                                </div>
                            </div>

                            {hasAnswer ? (
                                <div>
                                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-muted">
                                            Academy response
                                        </p>

                                        {question.answeredAt && (
                                            <span className="text-xs text-muted">
                                                {formatDateTime(
                                                    question.answeredAt
                                                )}
                                            </span>
                                        )}
                                    </div>

                                    <div className="rounded-2xl border border-primary/10 bg-primary/[0.04] p-4">
                                        <p className="whitespace-pre-wrap text-sm leading-7 text-foreground">
                                            {question.answer}
                                        </p>

                                        {question.answeredBy && (
                                            <div className="mt-4 border-t border-primary/10 pt-3 text-xs text-muted">
                                                Responded by{" "}
                                                <span className="font-semibold text-foreground">
                                                    {question.answeredBy}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ) : (
                                <div className="flex items-start gap-3 rounded-2xl border border-amber-500/15 bg-amber-500/[0.05] p-4">
                                    <CircleAlert
                                        size={18}
                                        className="mt-0.5 shrink-0 text-amber-500"
                                    />

                                    <div>
                                        <p className="text-sm font-semibold text-foreground">
                                            Awaiting a response
                                        </p>

                                        <p className="mt-1 text-sm leading-6 text-muted">
                                            Your question has been received.
                                            The academy will respond when it
                                            has been reviewed.
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="text-xs text-muted">
                                Submitted{" "}
                                <span className="font-medium text-foreground">
                                    {formatDateTime(question.createdAt)}
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

function AskQuestionModal({
open,
onClose,
onSuccess,
}) {
const [subject, setSubject] = useState("");
const [question, setQuestion] = useState("");
const [submitting, setSubmitting] = useState(false);
const [error, setError] = useState("");


useEffect(() => {
    if (!open) {
        setSubject("");
        setQuestion("");
        setSubmitting(false);
        setError("");
    }
}, [open]);

useEffect(() => {
    if (!open) return;

    function handleKeyDown(event) {
        if (event.key === "Escape" && !submitting) {
            onClose();
        }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => {
        document.removeEventListener("keydown", handleKeyDown);
    };
}, [open, submitting, onClose]);

if (!open) return null;

async function handleSubmit(event) {
    event.preventDefault();

    const cleanSubject = subject.trim();
    const cleanQuestion = question.trim();

    if (!cleanSubject) {
        setError("Please enter a subject.");
        return;
    }

    if (!cleanQuestion) {
        setError("Please enter your question.");
        return;
    }

    if (cleanSubject.length > 150) {
        setError("Subject must be 150 characters or less.");
        return;
    }

    if (cleanQuestion.length > 5000) {
        setError("Question must be 5000 characters or less.");
        return;
    }

    setSubmitting(true);
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
                "You need to be signed in to submit a question."
            );
        }

        const { error: insertError } = await supabase
            .from("support_questions")
            .insert({
                student_id: userData.user.id,
                subject: cleanSubject,
                question: cleanQuestion,
            });

        if (insertError) {
            throw insertError;
        }

        onSuccess();
    } catch (err) {
        console.error("Submit question error:", err);

        setError(
            err?.message ||
                "We couldn't submit your question. Please try again."
        );
    } finally {
        setSubmitting(false);
    }
}

return (
    <div
        className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 p-0 backdrop-blur-sm sm:items-center sm:p-6"
        onMouseDown={(event) => {
            if (
                event.target === event.currentTarget &&
                !submitting
            ) {
                onClose();
            }
        }}
    >
        <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.98 }}
            transition={{ duration: 0.25 }}
            className="max-h-[92vh] w-full overflow-y-auto rounded-t-[30px] border border-border bg-surface shadow-2xl sm:max-w-xl sm:rounded-[30px]"
        >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-surface/95 px-5 py-4 backdrop-blur sm:px-6">
                <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.12em] text-primary">
                        Academy support
                    </p>

                    <h2 className="mt-1 text-lg font-semibold text-foreground">
                        Ask a question
                    </h2>
                </div>

                <button
                    type="button"
                    onClick={onClose}
                    disabled={submitting}
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-secondary text-muted transition hover:text-foreground disabled:opacity-50"
                    aria-label="Close"
                >
                    <X size={18} />
                </button>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5 p-5 sm:p-6"
            >
                <div>
                    <label
                        htmlFor="question-subject"
                        className="mb-2 block text-sm font-semibold text-foreground"
                    >
                        Subject
                    </label>

                    <input
                        id="question-subject"
                        type="text"
                        value={subject}
                        onChange={(event) =>
                            setSubject(event.target.value)
                        }
                        placeholder="What is your question about?"
                        maxLength={150}
                        disabled={submitting}
                        className="h-12 w-full rounded-2xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                    />

                    <div className="mt-1.5 text-right text-[11px] text-muted">
                        {subject.length}/150
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="question-content"
                        className="mb-2 block text-sm font-semibold text-foreground"
                    >
                        Your question
                    </label>

                    <textarea
                        id="question-content"
                        value={question}
                        onChange={(event) =>
                            setQuestion(event.target.value)
                        }
                        placeholder="Write your question clearly so the academy can help you..."
                        maxLength={5000}
                        rows={7}
                        disabled={submitting}
                        className="w-full resize-none rounded-2xl border border-border bg-background px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:opacity-60"
                    />

                    <div className="mt-1.5 text-right text-[11px] text-muted">
                        {question.length}/5000
                    </div>
                </div>

                {error && (
                    <div className="flex items-start gap-3 rounded-2xl border border-danger/20 bg-danger/5 p-4">
                        <CircleAlert
                            size={18}
                            className="mt-0.5 shrink-0 text-danger"
                        />

                        <p className="text-sm leading-6 text-muted">
                            {error}
                        </p>
                    </div>
                )}

                <div className="rounded-2xl bg-surface-secondary p-4">
                    <p className="text-xs font-semibold text-foreground">
                        Before you send
                    </p>

                    <p className="mt-1.5 text-xs leading-5 text-muted">
                        Ask questions related to your classes,
                        assessments, academy activities, or anything you
                        need clarification on.
                    </p>
                </div>

                <button
                    type="submit"
                    disabled={
                        submitting ||
                        !subject.trim() ||
                        !question.trim()
                    }
                    className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {submitting ? (
                        <>
                            <RefreshCw
                                size={17}
                                className="animate-spin"
                            />
                            Sending...
                        </>
                    ) : (
                        <>
                            <Send size={17} />
                            Send question
                        </>
                    )}
                </button>
            </form>
        </motion.div>
    </div>
);


}

function EmptyState({ searchActive, onClear, onAsk }) {
return (
<motion.div
initial={{ opacity: 0, y: 12 }}
animate={{ opacity: 1, y: 0 }}
className="rounded-[28px] border border-dashed border-border bg-surface px-6 py-14 text-center"
> <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-3xl bg-surface-secondary text-primary">
{searchActive ? ( <Search size={26} />
) : ( <MessageCircleQuestion size={26} />
)} </div>


        <h3 className="mt-5 text-lg font-semibold text-foreground">
            {searchActive
                ? "No questions found"
                : "You haven't asked anything yet"}
        </h3>

        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
            {searchActive
                ? "Try a different search term or clear your search to see your questions."
                : "If you need clarification about your classes, assessments, or academy activities, you can ask the academy here."}
        </p>

        <div className="mt-5 flex flex-col justify-center gap-2 sm:flex-row">
            {searchActive ? (
                <button
                    type="button"
                    onClick={onClear}
                    className="rounded-xl bg-surface-secondary px-4 py-2.5 text-sm font-semibold text-foreground transition hover:bg-surface-purple"
                >
                    Clear search
                </button>
            ) : (
                <button
                    type="button"
                    onClick={onAsk}
                    className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary-hover"
                >
                    <Plus size={17} />
                    Ask your first question
                </button>
            )}
        </div>
    </motion.div>
);

}

export default function StudentQuestionsPage() {
const [questions, setQuestions] = useState([]);
const [search, setSearch] = useState("");
const [expandedId, setExpandedId] = useState(null);

const [showAskModal, setShowAskModal] = useState(false);

const [loading, setLoading] = useState(true);
const [refreshing, setRefreshing] = useState(false);
const [error, setError] = useState("");

async function loadQuestions(showRefresh = false) {
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
                "You need to be signed in to view your questions."
            );
        }

        const {
            data,
            error: rpcError,
        } = await supabase.rpc("get_my_communications");

        if (rpcError) {
            throw rpcError;
        }

        const normalized = normalizeData(data);
        const items = normalizeQuestions(normalized);

        items.sort((a, b) => {
            const first = new Date(
                a.createdAt || 0
            ).getTime();

            const second = new Date(
                b.createdAt || 0
            ).getTime();

            return second - first;
        });

        setQuestions(items);

        setExpandedId((current) => {
            if (
                current &&
                items.some((item) => item.id === current)
            ) {
                return current;
            }

            return null;
        });
    } catch (err) {
        console.error("Questions error:", err);

        setError(
            err?.message ||
                "We couldn't load your questions. Please try again."
        );
    } finally {
        setLoading(false);
        setRefreshing(false);
    }
}

useEffect(() => {
    loadQuestions();
}, []);

const filteredQuestions = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return questions;

    return questions.filter((item) => {
        const searchable = [
            item.subject,
            item.question,
            item.answer,
            item.status,
        ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();

        return searchable.includes(query);
    });
}, [questions, search]);

const stats = useMemo(() => {
    return {
        total: questions.length,
        open: questions.filter(
            (item) => item.status === "open"
        ).length,
        answered: questions.filter(
            (item) => item.status === "answered"
        ).length,
        closed: questions.filter(
            (item) => item.status === "closed"
        ).length,
    };
}, [questions]);

function handleQuestionSubmitted() {
    setShowAskModal(false);
    loadQuestions(true);
}

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
                                    Academy support
                                </div>

                                <h1 className="mt-4 text-3xl font-semibold tracking-[-0.035em] text-foreground sm:text-4xl">
                                    Questions
                                </h1>

                                <p className="mt-3 max-w-xl text-sm leading-6 text-muted sm:text-base">
                                    Have something you need clarified?
                                    Send a question to the academy and
                                    keep track of the response here.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() =>
                                    setShowAskModal(true)
                                }
                                className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary-hover"
                            >
                                <Plus size={18} />
                                Ask a question
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {[
                    {
                        label: "Total",
                        value: stats.total,
                        description: "questions asked",
                    },
                    {
                        label: "Open",
                        value: stats.open,
                        description: "awaiting response",
                    },
                    {
                        label: "Answered",
                        value: stats.answered,
                        description: "responses received",
                    },
                    {
                        label: "Closed",
                        value: stats.closed,
                        description: "questions completed",
                    },
                ].map((item, index) => (
                    <motion.div
                        key={item.label}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{
                            delay: 0.08 + index * 0.05,
                        }}
                        className="rounded-[24px] border border-border bg-surface p-5 shadow-sm"
                    >
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
                            {item.label}
                        </p>

                        <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
                            {item.value}
                        </p>

                        <p className="mt-1 text-xs text-muted">
                            {item.description}
                        </p>
                    </motion.div>
                ))}
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
                        placeholder="Search your questions..."
                        className="h-12 w-full rounded-2xl border border-border bg-surface pl-11 pr-4 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-primary focus:ring-4 focus:ring-primary/10"
                    />
                </div>

                <button
                    type="button"
                    onClick={() => loadQuestions(true)}
                    disabled={refreshing}
                    className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-2xl border border-border bg-surface px-5 text-sm font-semibold text-foreground transition hover:bg-surface-secondary disabled:cursor-not-allowed disabled:opacity-60"
                >
                    <RefreshCw
                        size={17}
                        className={
                            refreshing ? "animate-spin" : ""
                        }
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
                    <CircleAlert
                        size={18}
                        className="mt-0.5 shrink-0 text-danger"
                    />

                    <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-foreground">
                            Couldn't load your questions
                        </p>

                        <p className="mt-1 text-sm leading-6 text-muted">
                            {error}
                        </p>
                    </div>

                    <button
                        type="button"
                        onClick={() => loadQuestions()}
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
                                    <div className="h-11 w-11 shrink-0 rounded-2xl bg-surface-secondary" />

                                    <div className="flex-1">
                                        <div className="h-4 w-28 rounded-full bg-surface-secondary" />
                                        <div className="mt-4 h-5 w-2/3 rounded-full bg-surface-secondary" />
                                        <div className="mt-3 h-3 w-4/5 rounded-full bg-surface-secondary" />
                                        <div className="mt-2 h-3 w-1/3 rounded-full bg-surface-secondary" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filteredQuestions.length === 0 ? (
                    <EmptyState
                        searchActive={Boolean(search.trim())}
                        onClear={() => setSearch("")}
                        onAsk={() => setShowAskModal(true)}
                    />
                ) : (
                    <div className="space-y-4">
                        <div className="mb-4 flex items-center justify-between">
                            <div>
                                <h2 className="text-base font-semibold text-foreground">
                                    Your questions
                                </h2>

                                <p className="mt-1 text-xs text-muted">
                                    Questions and responses from the
                                    academy
                                </p>
                            </div>

                            {search.trim() && (
                                <span className="hidden rounded-full bg-surface-secondary px-3 py-1.5 text-xs font-medium text-muted sm:inline-flex">
                                    {filteredQuestions.length} result
                                    {filteredQuestions.length !== 1
                                        ? "s"
                                        : ""}
                                </span>
                            )}
                        </div>

                        <AnimatePresence mode="popLayout">
                            {filteredQuestions.map(
                                (question, index) => (
                                    <QuestionCard
                                        key={question.id}
                                        question={question}
                                        index={index}
                                        expanded={
                                            expandedId ===
                                            question.id
                                        }
                                        onToggle={() =>
                                            setExpandedId(
                                                (current) =>
                                                    current ===
                                                    question.id
                                                        ? null
                                                        : question.id
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

        <AnimatePresence>
            {showAskModal && (
                <AskQuestionModal
                    open={showAskModal}
                    onClose={() => setShowAskModal(false)}
                    onSuccess={handleQuestionSubmitted}
                />
            )}
        </AnimatePresence>
    </main>
);


}
