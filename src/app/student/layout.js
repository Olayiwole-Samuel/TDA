"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { supabase } from "@/lib/supabase";

const navigation = [
    {
        label: "Dashboard",
        href: "/student/dashboard",
        icon: "⌂",
    },
    {
        label: "My Classes",
        href: "/student/classes",
        icon: "▣",
    },
    {
        label: "Tests & Exams",
        href: "/student/tests",
        icon: "✓",
    },
    {
        label: "Performance",
        href: "/student/performance",
        icon: "◒",
    },
    {
        label: "Attendance",
        href: "/student/attendance",
        icon: "◷",
    },
    {
        label: "Announcements",
        href: "/student/announcements",
        icon: "○",
    },
];

export default function StudentLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            const {
                data: { session },
            } = await supabase.auth.getSession();

            if (!mounted) return;

            if (!session?.user) {
                router.replace("/login");
                return;
            }

            setUser(session.user);
            setLoading(false);
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (!session?.user) {
                    router.replace("/login");
                    return;
                }

                setUser(session.user);
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, [router]);

    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.replace("/login");
        router.refresh();
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <div className="h-10 w-10 animate-spin rounded-full border-2 border-purple-bright/20 border-t-purple-bright" />

                    <p className="text-sm text-muted">
                        Loading your portal...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Desktop sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 border-r border-border bg-surface/80 backdrop-blur-2xl lg:flex lg:flex-col">
                <div className="flex h-20 items-center px-6">
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-primary text-sm font-bold text-white shadow-sm">
                            TDA
                        </div>

                        <div className="leading-tight">
                            <p className="text-sm font-bold">
                                Triumphant
                            </p>
                            <p className="text-xs text-muted">
                                Discipleship Academy
                            </p>
                        </div>
                    </Link>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-5">
                    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-light">
                        Academy
                    </p>

                    <nav className="space-y-1.5">
                        {navigation.map((item) => {
                            const active =
                                pathname === item.href ||
                                pathname.startsWith(
                                    `${item.href}/`
                                );

                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-sm font-medium transition-all ${
                                        active
                                            ? "bg-purple-bright/10 text-purple-bright"
                                            : "text-muted hover:bg-surface-secondary hover:text-foreground"
                                    }`}
                                >
                                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-surface-secondary text-sm">
                                        {item.icon}
                                    </span>

                                    {item.label}
                                </Link>
                            );
                        })}
                    </nav>
                </div>

                <div className="border-t border-border p-4">
                    <Link
                        href="/student/profile"
                        className="mb-2 flex items-center gap-3 rounded-2xl p-2 transition-colors hover:bg-surface-secondary"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-bright/10 text-sm font-semibold text-purple-bright">
                            {user?.email?.charAt(0).toUpperCase() ||
                                "S"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium">
                                Student
                            </p>

                            <p className="truncate text-xs text-muted">
                                {user?.email}
                            </p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-2xl px-3 py-2.5 text-left text-sm text-muted transition-colors hover:bg-danger/5 hover:text-danger"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile header */}
            <header className="fixed inset-x-0 top-0 z-40 border-b border-border bg-surface/80 px-4 py-3 backdrop-blur-2xl lg:hidden">
                <div className="flex h-12 items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-primary text-xs font-bold text-white">
                            TDA
                        </div>

                        <span className="text-sm font-semibold">
                            Discipleship Academy
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() =>
                            setMobileOpen((value) => !value)
                        }
                        aria-label="Toggle navigation"
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-lg"
                    >
                        {mobileOpen ? "×" : "☰"}
                    </button>
                </div>
            </header>

            {/* Mobile navigation */}
            <AnimatePresence>
                {mobileOpen && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -10,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                        }}
                        exit={{
                            opacity: 0,
                            y: -10,
                        }}
                        className="fixed inset-x-3 top-[72px] z-30 rounded-3xl border border-border bg-surface/95 p-3 shadow-xl backdrop-blur-2xl lg:hidden"
                    >
                        <nav className="space-y-1">
                            {navigation.map((item) => {
                                const active =
                                    pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm ${
                                            active
                                                ? "bg-purple-bright/10 font-medium text-purple-bright"
                                                : "text-muted"
                                        }`}
                                    >
                                        <span>
                                            {item.icon}
                                        </span>

                                        {item.label}
                                    </Link>
                                );
                            })}
                        </nav>

                        <div className="mt-3 border-t border-border pt-3">
                            <Link
                                href="/student/profile"
                                className="block rounded-2xl px-4 py-3 text-sm text-muted"
                            >
                                Profile
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="w-full rounded-2xl px-4 py-3 text-left text-sm text-danger"
                            >
                                Sign out
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Main content */}
            <main className="min-h-screen lg:pl-64">
                <div className="px-4 pb-10 pt-24 sm:px-6 lg:px-8 lg:pt-8">
                    <div className="mx-auto max-w-7xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}