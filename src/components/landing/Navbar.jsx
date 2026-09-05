"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "motion/react";
import Button from "@/components/ui/Button";
import Image from "next/image";

const links = [
    { label: "Academy", href: "#academy" },
    { label: "Journey", href: "#journey" },
    { label: "How it works", href: "#how-it-works" },
    { label: "FAQ", href: "#faq" },
];

export default function Navbar() {
    const { theme, setTheme } = useTheme();

    const [open, setOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isDark = theme === "dark";

    return (
        <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6">
            <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between rounded-full border border-border bg-surface/85 px-5 shadow-sm backdrop-blur-xl">

                {/* Logo */}
                <Link
                    href="/"
                    className="flex items-center gap-3"
                    onClick={() => setOpen(false)}
                    aria-label="Triumphant Discipleship Academy home"
                >
                    <div className="relative h-16 w-16 shrink-0">
                        <Image
                            src="/images/logo.png"
                            alt="Discipleship Academy"
                            fill
                            priority
                            className="object-contain"
                            sizes="52px"
                        />
                    </div>

                    <div className="flex flex-col items-center leading-none">
                        <span className="text-2xl font-extrabold tracking-[-0.04em]">
                            TDA
                        </span>
                    </div>
                </Link>

                {/* Desktop navigation */}
                <div className="hidden items-center gap-7 md:flex">
                    {links.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            className="text-sm text-muted transition-colors hover:text-foreground"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                {/* Desktop actions */}
                <div className="hidden items-center gap-3 md:flex">

                    {/* Theme toggle */}
                    <button
                        type="button"
                        aria-label={
                            mounted
                                ? isDark
                                    ? "Switch to light mode"
                                    : "Switch to dark mode"
                                : "Toggle theme"
                        }
                        onClick={() =>
                            setTheme(isDark ? "light" : "dark")
                        }
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/10 text-purple-primary transition-all hover:bg-purple-light/25 dark:border-purple-light/15 dark:bg-purple-primary/20 dark:text-purple-soft dark:hover:bg-purple-primary/30"
                    >
                        {mounted ? (
                            isDark ? "☀" : "☾"
                        ) : (
                            <span className="h-[18px] w-[18px]" />
                        )}
                    </button>

                    {/* Join Academy */}
                    <Link href="/register">
                        <Button size="sm">
                            Join the Academy
                        </Button>
                    </Link>
                </div>

                {/* Mobile menu button */}
                <button
                    type="button"
                    aria-label="Toggle menu"
                    aria-expanded={open}
                    onClick={() => setOpen((value) => !value)}
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-border md:hidden"
                >
                    <span className="text-lg">
                        {open ? "×" : "☰"}
                    </span>
                </button>
            </nav>

            {/* Mobile menu */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{
                            opacity: 0,
                            y: -10,
                            scale: 0.98,
                        }}
                        animate={{
                            opacity: 1,
                            y: 0,
                            scale: 1,
                        }}
                        exit={{
                            opacity: 0,
                            y: -10,
                            scale: 0.98,
                        }}
                        className="mx-4 mt-2 rounded-3xl border border-border bg-surface/95 p-4 shadow-lg backdrop-blur-xl md:hidden"
                    >
                        <div className="flex flex-col">

                            {/* Section links */}
                            {links.map((link) => (
                                <a
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setOpen(false)}
                                    className="rounded-2xl px-4 py-3 text-sm text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                                >
                                    {link.label}
                                </a>
                            ))}

                            {/* Appearance */}
                            <div className="flex items-center justify-between rounded-2xl bg-purple-light/10 px-4 py-3 dark:bg-purple-primary/15">
                                <span className="text-sm text-muted">
                                    Appearance
                                </span>

                                <button
                                    type="button"
                                    onClick={() =>
                                        setTheme(
                                            isDark
                                                ? "light"
                                                : "dark"
                                        )
                                    }
                                    className="rounded-full px-3 py-1.5 text-sm font-medium text-purple-primary dark:text-purple-soft"
                                >
                                    {mounted
                                        ? isDark
                                            ? "Light"
                                            : "Dark"
                                        : "Appearance"}
                                </button>
                            </div>

                            {/* Join Academy */}
                            <div className="mt-2 border-t border-border pt-3">
                                <Link
                                    href="/register"
                                    onClick={() => setOpen(false)}
                                    className="block"
                                >
                                    <Button className="w-full">
                                        Join the Academy
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </header>
    );
}

