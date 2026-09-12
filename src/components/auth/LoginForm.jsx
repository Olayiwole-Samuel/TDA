"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function LoginForm() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    function handleChange(event) {
        const { name, value } = event.target;

        setForm((current) => ({
            ...current,
            [name]: value,
        }));

        if (error) {
            setError("");
        }
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setError("");

        const email = form.email.trim().toLowerCase();

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!form.password) {
            setError("Please enter your password.");
            return;
        }

        try {
            setLoading(true);

            const { data, error: loginError } =
                await supabase.auth.signInWithPassword({
                    email,
                    password: form.password,
                });

            if (loginError) {
                throw loginError;
            }

            if (!data?.user) {
                throw new Error(
                    "We could not complete your login. Please try again."
                );
            }

            const { data: profile, error: profileError } =
                await supabase
                    .from("profiles")
                    .select("id, full_name, email, role")
                    .eq("id", data.user.id)
                    .single();

            if (profileError) {
                console.error("Profile lookup error:", profileError);

                await supabase.auth.signOut();

                throw new Error(
                    "Your account was found, but your academy profile could not be loaded."
                );
            }

            if (profile.role === "student") {
                router.replace("/student/dashboard");
                router.refresh();
                return;
            }

            if (profile.role === "teacher") {
                router.replace("/teacher/dashboard");
                router.refresh();
                return;
            }

            await supabase.auth.signOut();

            setError(
                "Your account does not currently have access to the academy portal."
            );
        } catch (err) {
            console.error("Login error:", err);

            const message =
                err?.message || "Unable to log in. Please try again.";

            if (
                message.toLowerCase().includes("invalid login credentials")
            ) {
                setError("Incorrect email or password.");
            } else {
                setError(message);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="w-full"
        >
            <div className="mb-8">
                <div className="mb-3 inline-flex items-center rounded-full border border-purple-500/20 bg-purple-500/10 px-3 py-1 text-xs font-medium text-purple-600 dark:text-purple-300">
                    Academy Portal
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    Welcome back
                </h1>

                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Log in to continue your discipleship journey.
                </p>
            </div>

            {error && (
                <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-6 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm leading-6 text-red-600 dark:text-red-300"
                >
                    {error}
                </motion.div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Email address
                    </label>

                    <input
                        id="email"
                        name="email"
                        type="email"
                        value={form.email}
                        onChange={handleChange}
                        placeholder="you@example.com"
                        autoComplete="email"
                        disabled={loading}
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                </div>

                <div>
                    <div className="mb-2 flex items-center justify-between">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-[var(--foreground)]"
                        >
                            Password
                        </label>

                        <Link
                            href="/forgot-password"
                            className="text-xs font-medium text-[var(--primary)] transition hover:text-[var(--accent)]"
                        >
                            Forgot password?
                        </Link>
                    </div>

                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="Enter your password"
                            autoComplete="current-password"
                            disabled={loading}
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowPassword((current) => !current)
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--foreground-muted)] transition hover:bg-purple-500/10 hover:text-purple-600"
                            aria-label={
                                showPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={loading}
                    className="group flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-semibold text-white shadow-lg shadow-purple-600/20 transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <Loader2
                                size={18}
                                className="animate-spin"
                            />
                            Logging in...
                        </>
                    ) : (
                        <>
                            Log in
                            <ArrowRight
                                size={18}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-7 text-center text-sm text-[var(--foreground-muted)]">
                Don&apos;t have an account?{" "}
                <Link
                    href="/register"
                    className="font-semibold text-[var(--primary)] transition hover:text-[var(--accent)]"
                >
                    Create an account
                </Link>
            </p>
        </motion.div>
    );
}