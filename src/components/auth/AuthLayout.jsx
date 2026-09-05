
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion } from "motion/react";

export default function AuthLayout({ children }) {
    const { theme, setTheme } = useTheme();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark";

    return (
        <main className="relative min-h-screen overflow-hidden bg-background">
            {/* Ambient purple lighting */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-purple-bright/10 blur-[120px] dark:bg-purple-bright/15" />

                <div className="absolute bottom-[-180px] right-[-100px] h-[380px] w-[380px] rounded-full bg-purple-violet/10 blur-[120px] dark:bg-purple-violet/15" />
            </div>

            <div className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-6 sm:px-8">

                {/* Top navigation */}
                <header className="flex items-center justify-between">
                    {/* Brand */}
                    <Link
                        href="/"
                        className="flex items-center gap-3"
                    >
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-[9px] font-extrabold tracking-tight text-primary-foreground shadow-sm">
                            TDA
                        </div>

                        <div className="hidden leading-none sm:block">
                            <span className="block text-sm font-bold">
                                Triumphant
                            </span>

                            <span className="mt-1 block text-[10px] font-medium text-muted">
                                Discipleship Academy
                            </span>
                        </div>
                    </Link>

                    {/* Controls */}
                    <div className="flex items-center gap-2">
                        {/* Back to home */}
                        <Link
                            href="/"
                            className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface/80 px-4 text-sm font-medium text-muted backdrop-blur-xl transition-all hover:border-purple-primary/20 hover:bg-surface-secondary hover:text-foreground"
                        >
                            <span aria-hidden="true">←</span>
                            <span className="hidden sm:inline">
                                Back to Home
                            </span>
                            <span className="sm:hidden">
                                Home
                            </span>
                        </Link>

                        {/* Theme toggle */}
                        <button
                            type="button"
                            onClick={() =>
                                mounted &&
                                setTheme(
                                    isDark
                                        ? "light"
                                        : "dark"
                                )
                            }
                            disabled={!mounted}
                            aria-label={
                                mounted
                                    ? isDark
                                        ? "Switch to light mode"
                                        : "Switch to dark mode"
                                    : "Change appearance"
                            }
                            className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/10 text-purple-primary transition-all hover:bg-purple-light/25 disabled:cursor-default dark:border-purple-light/15 dark:bg-purple-primary/20 dark:text-purple-soft dark:hover:bg-purple-primary/30"
                        >
                            {mounted ? (
                                isDark ? (
                                    "☀"
                                ) : (
                                    "☾"
                                )
                            ) : (
                                <span className="h-[18px] w-[18px]" />
                            )}
                        </button>
                    </div>
                </header>

                {/* Page content */}
                <div className="flex flex-1 items-center justify-center py-12">
                    <motion.div
                        initial={{ opacity: 0, y: 18 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.45 }}
                        className="w-full max-w-md"
                    >
                        {children}
                    </motion.div>
                </div>

                {/* Footer */}
                <footer className="py-4 text-center text-xs text-muted">
                    © {new Date().getFullYear()} Triumphant Discipleship Academy
                </footer>
            </div>
        </main>
    );
}

