"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useTheme } from "next-themes";
import { supabase } from "@/lib/supabase";

const navigationSections = [
    {
        label: "Learning",
        items: [
            {
                label: "Dashboard",
                href: "/student/dashboard",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                        <polyline points="9 22 9 12 15 12 15 22" />
                    </svg>
                ),
            },
            {
                label: "My Classes",
                href: "/student/classes",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="3" y="4" width="18" height="16" rx="2" />
                        <path d="M8 2v4M16 2v4M3 10h18" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Assessments",
        items: [
            {
                label: "Overview",
                href: "/student/tests",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M9 11l3 3L22 4" />
                        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                    </svg>
                ),
            },
            {
                label: "Class Tests",
                href: "/student/tests",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <rect x="5" y="3" width="14" height="18" rx="2" />
                        <path d="M9 7h6M9 11h6M9 15h3" />
                    </svg>
                ),
                match: ["/student/tests"],
            },
            {
                label: "Examinations",
                href: "/student/examinations",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" />
                        <path d="M9 7h6M9 11h6M9 15h2M14 15h1" />
                    </svg>
                ),
                match: ["/student/examinations"],
            },
            {
                label: "Results",
                href: "/student/results",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M4 19V5" />
                        <path d="M4 19h17" />
                        <path d="M8 16v-4" />
                        <path d="M12 16V8" />
                        <path d="M16 16v-6" />
                        <path d="M20 16V5" />
                    </svg>
                ),
            },
            {
                label: "Performance",
                href: "/student/performance",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M3 3v18h18" />
                        <path d="M18 17V9M13 17V5M8 17v-3" />
                    </svg>
                ),
            },
        ],
    },
    {
        label: "Academy",
        items: [
            {
                label: "Attendance",
                href: "/student/attendance",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <circle cx="12" cy="12" r="9" />
                        <polyline points="12 7 12 12 15.5 14" />
                    </svg>
                ),
            },
            {
                label: "Announcements",
                href: "/student/announcements",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                ),
            },
            {
                label: "Questions",
                href: "/student/questions",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M21 11.5a8.38 8.38 0 0 1-9 8.5 8.38 8.38 0 0 1-4-.95L3 21l1.95-5A8.38 8.38 0 0 1 4 12a8.38 8.38 0 0 1 8-8.5 8.38 8.38 0 0 1 9 8Z" />
                        <path d="M9.5 9a2.5 2.5 0 1 1 4.25 1.8c-.8.7-1.75 1.1-1.75 2.2" />
                        <path d="M12 16h.01" />
                    </svg>
                ),
            },
            {
                label: "Notifications",
                href: "/student/notifications",
                icon: (
                    <svg
                        width="18"
                        height="18"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1.75"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
                    </svg>
                ),
            },
        ],
    },
];

const themes = [
    {
        value: "light",
        label: "Light",
        icon: (
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
            </svg>
        ),
    },
    
    {
        value: "dark",
        label: "Dark",
        icon: (
            <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
            </svg>
        ),
    },
];

function ThemeSwitcher({ mobile = false }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return (
            <div
                className={`rounded-full bg-surface-secondary/60 ${
                    mobile ? "h-10 w-full" : "h-10 w-full"
                }`}
            />
        );
    }

    return (
        <div
            className={`flex items-center rounded-full bg-surface-secondary/70 p-1 ${
                mobile ? "w-full" : "w-full"
            }`}
            role="group"
            aria-label="Choose appearance"
        >
            {themes.map((item) => {
                const active = theme === item.value;

                return (
                    <button
                        key={item.value}
                        type="button"
                        onClick={() => setTheme(item.value)}
                        aria-label={`Use ${item.label.toLowerCase()} theme`}
                        aria-pressed={active}
                        className={`relative flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full text-[12px] font-medium transition-colors ${
                            active
                                ? "text-foreground"
                                : "text-muted hover:text-foreground"
                        }`}
                    >
                        {active && (
                            <motion.span
                                layoutId={
                                    mobile
                                        ? "mobile-theme-pill"
                                        : "desktop-theme-pill"
                                }
                                transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 35,
                                }}
                                className="absolute inset-0 rounded-full bg-surface shadow-sm"
                            />
                        )}

                        <span className="relative z-10 flex items-center justify-center">
                            {item.icon}
                        </span>

                        <span className="relative z-10 hidden xl:inline">
                            {item.label}
                        </span>
                    </button>
                );
            })}
        </div>
    );
}

function NavigationLink({ item, pathname, onNavigate }) {
    const matches = item.match || [item.href];

    const active = matches.some(
        (path) =>
            pathname === path ||
            pathname.startsWith(`${path}/`)
    );

    return (
        <Link
            href={item.href}
            onClick={onNavigate}
            className={`group relative flex items-center gap-3 rounded-[12px] px-3 py-[9px] text-[14px] font-medium transition-colors ${
                active
                    ? "bg-purple-bright/10 text-purple-bright"
                    : "text-muted hover:bg-surface-secondary hover:text-foreground"
            }`}
        >
            {active && (
                <motion.span
                    layoutId="student-active-nav"
                    className="absolute left-0 h-5 w-[3px] rounded-full bg-purple-bright"
                    transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 35,
                    }}
                />
            )}

            <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] transition-colors ${
                    active
                        ? "bg-purple-bright/15 text-purple-bright"
                        : "text-muted group-hover:text-foreground"
                }`}
            >
                {item.icon}
            </span>

            <span>{item.label}</span>
        </Link>
    );
}

export default function StudentLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();

    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        let mounted = true;

        const checkSession = async () => {
            try {
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
            } catch (error) {
                console.error("Student session error:", error);

                if (mounted) {
                    router.replace("/login");
                }
            }
        };

        checkSession();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session?.user) {
                router.replace("/login");
                return;
            }

            if (mounted) {
                setUser(session.user);
            }
        });

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
                <div className="flex flex-col items-center gap-3">
                    <div className="h-9 w-9 animate-spin rounded-full border-[2.5px] border-border border-t-purple-bright" />

                    <p className="text-[13px] font-medium text-muted">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground">
            {/* Desktop Sidebar */}
            <aside className="fixed inset-y-0 left-0 z-40 hidden w-[260px] border-r border-border/60 bg-surface/80 backdrop-blur-2xl lg:flex lg:flex-col">
                {/* Brand */}
                <div className="flex h-[72px] items-center px-5">
                    <Link
                        href="/"
                        className="group flex items-center gap-3"
                    >
                        <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-purple-primary text-[13px] font-semibold text-white shadow-sm transition-transform duration-200 group-hover:scale-[1.03]">
                            TDA
                        </div>

                        <div className="leading-tight">
                            <p className="text-[15px] font-semibold tracking-tight">
                                Triumphant
                            </p>

                            <p className="text-[12px] text-muted">
                                Discipleship Academy
                            </p>
                        </div>
                    </Link>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto px-3 py-3">
                    {navigationSections.map((section) => (
                        <div
                            key={section.label}
                            className="mb-5 last:mb-0"
                        >
                            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
                                {section.label}
                            </p>

                            <div className="space-y-0.5">
                                {section.items.map((item) => (
                                    <NavigationLink
                                        key={item.label}
                                        item={item}
                                        pathname={pathname}
                                    />
                                ))}
                            </div>
                        </div>
                    ))}
                </nav>

                {/* Bottom section */}
                <div className="border-t border-border/60 p-4">
                    <div className="mb-4">
                        <p className="mb-2 px-1 text-[11px] font-medium text-muted">
                            Appearance
                        </p>

                        <ThemeSwitcher />
                    </div>

                    <Link
                        href="/student/profile"
                        className="mb-1 flex items-center gap-3 rounded-[12px] px-2 py-2 transition-colors hover:bg-surface-secondary"
                    >
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-purple-bright/12 text-[13px] font-semibold text-purple-bright">
                            {user?.email?.charAt(0).toUpperCase() || "S"}
                        </div>

                        <div className="min-w-0 flex-1">
                            <p className="text-[14px] font-medium">
                                Student
                            </p>

                            <p className="truncate text-[12px] text-muted">
                                {user?.email}
                            </p>
                        </div>
                    </Link>

                    <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full rounded-[12px] px-3 py-2.5 text-left text-[14px] text-muted transition-colors hover:bg-danger/5 hover:text-danger"
                    >
                        Sign out
                    </button>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="fixed inset-x-0 top-0 z-40 border-b border-border/60 bg-surface/80 px-4 backdrop-blur-2xl lg:hidden">
                <div className="flex h-14 items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2.5"
                    >
                        <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-purple-primary text-[12px] font-semibold text-white">
                            TDA
                        </div>

                        <span className="text-[15px] font-semibold tracking-tight">
                            Academy
                        </span>
                    </Link>

                    <button
                        type="button"
                        onClick={() =>
                            setMobileOpen((value) => !value)
                        }
                        aria-label={
                            mobileOpen
                                ? "Close navigation"
                                : "Open navigation"
                        }
                        aria-expanded={mobileOpen}
                        className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-secondary/80 text-[17px] text-foreground transition-colors active:scale-95"
                    >
                        <AnimatePresence
                            mode="wait"
                            initial={false}
                        >
                            {mobileOpen ? (
                                <motion.span
                                    key="close"
                                    initial={{
                                        opacity: 0,
                                        rotate: -90,
                                        scale: 0.7,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        rotate: 0,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        rotate: 90,
                                        scale: 0.7,
                                    }}
                                    transition={{
                                        duration: 0.15,
                                    }}
                                >
                                    ✕
                                </motion.span>
                            ) : (
                                <motion.span
                                    key="menu"
                                    initial={{
                                        opacity: 0,
                                        rotate: 90,
                                        scale: 0.7,
                                    }}
                                    animate={{
                                        opacity: 1,
                                        rotate: 0,
                                        scale: 1,
                                    }}
                                    exit={{
                                        opacity: 0,
                                        rotate: -90,
                                        scale: 0.7,
                                    }}
                                    transition={{
                                        duration: 0.15,
                                    }}
                                >
                                    ☰
                                </motion.span>
                            )}
                        </AnimatePresence>
                    </button>
                </div>
            </header>

            {/* Mobile Navigation */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px] lg:hidden"
                        />

                        <motion.div
                            initial={{
                                opacity: 0,
                                y: -8,
                                scale: 0.98,
                            }}
                            animate={{
                                opacity: 1,
                                y: 0,
                                scale: 1,
                            }}
                            exit={{
                                opacity: 0,
                                y: -8,
                                scale: 0.98,
                            }}
                            transition={{
                                duration: 0.2,
                                ease: [0.22, 1, 0.36, 1],
                            }}
                            className="fixed inset-x-3 top-[68px] z-40 max-h-[calc(100vh-84px)] overflow-y-auto rounded-[20px] border border-border/60 bg-surface/95 p-2 shadow-xl backdrop-blur-2xl lg:hidden"
                        >
                            <nav>
                                {navigationSections.map((section) => (
                                    <div
                                        key={section.label}
                                        className="mb-4 last:mb-0"
                                    >
                                        <p className="mb-1.5 px-3 pt-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted/70">
                                            {section.label}
                                        </p>

                                        <div className="space-y-0.5">
                                            {section.items.map(
                                                (item) => (
                                                    <NavigationLink
                                                        key={
                                                            item.label
                                                        }
                                                        item={item}
                                                        pathname={
                                                            pathname
                                                        }
                                                        onNavigate={() =>
                                                            setMobileOpen(
                                                                false
                                                            )
                                                        }
                                                    />
                                                )
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </nav>

                            <div className="my-2 border-t border-border/60" />

                            <div className="px-1 pb-1">
                                <p className="mb-2 px-2 text-[11px] font-medium text-muted">
                                    Appearance
                                </p>

                                <ThemeSwitcher mobile />
                            </div>

                            <div className="my-2 border-t border-border/60" />

                            <Link
                                href="/student/profile"
                                className="flex items-center gap-3 rounded-[12px] px-3 py-3 text-[15px] text-muted transition-colors hover:bg-surface-secondary hover:text-foreground"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-surface-secondary text-[13px]">
                                    {user?.email
                                        ?.charAt(0)
                                        .toUpperCase() || "S"}
                                </span>

                                Profile
                            </Link>

                            <button
                                type="button"
                                onClick={handleLogout}
                                className="flex w-full items-center gap-3 rounded-[12px] px-3 py-3 text-left text-[15px] text-danger transition-colors hover:bg-danger/5"
                            >
                                <span className="flex h-7 w-7 items-center justify-center rounded-[9px] bg-danger/5">
                                    ↗
                                </span>

                                Sign out
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main className="min-h-screen lg:pl-[260px]">
                <div className="px-4 pb-12 pt-20 sm:px-6 lg:px-8 lg:pt-8">
                    <div className="mx-auto max-w-6xl">
                        {children}
                    </div>
                </div>
            </main>
        </div>
    );
}