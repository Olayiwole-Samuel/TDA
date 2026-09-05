
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";

const RESEND_COOLDOWN = 60;

export default function VerifyEmailForm() {
    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [cooldown, setCooldown] = useState(0);
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        let mounted = true;

        const loadUser = async () => {
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!mounted) return;

            if (user?.email) {
                setEmail(user.email);
            }

            setLoading(false);
        };

        loadUser();

        return () => {
            mounted = false;
        };
    }, []);

    useEffect(() => {
        if (cooldown <= 0) return;

        const timer = setInterval(() => {
            setCooldown((current) => {
                if (current <= 1) {
                    clearInterval(timer);
                    return 0;
                }

                return current - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [cooldown]);

    const resendVerification = async () => {
        if (!email || resending || cooldown > 0) return;

        setResending(true);
        setError("");
        setMessage("");

        try {
            const { error: resendError } =
                await supabase.auth.resend({
                    type: "signup",
                    email,
                    options: {
                        emailRedirectTo:
                            `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
                    },
                });

            if (resendError) {
                setError(resendError.message);
                return;
            }

            setMessage(
                "A new verification email has been sent. Please check your inbox."
            );

            setCooldown(RESEND_COOLDOWN);
        } catch (error) {
            console.error(
                "Verification email error:",
                error
            );

            setError(
                "Something went wrong. Please try again."
            );
        } finally {
            setResending(false);
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center text-center">
                <div className="h-12 w-12 animate-pulse rounded-full bg-purple-light/20" />

                <div className="mt-6 h-8 w-56 animate-pulse rounded-xl bg-purple-light/20" />

                <div className="mt-3 h-4 w-72 animate-pulse rounded-lg bg-purple-light/10" />
            </div>
        );
    }

    return (
        <div className="text-center">
            {/* Icon */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/15 text-2xl dark:border-purple-light/15 dark:bg-purple-primary/20">
                ✉
            </div>

            {/* Heading */}
            <p className="mt-7 text-sm font-medium text-purple-bright">
                Almost there
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Verify your email.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
                We sent a verification link to your email address.
                Confirm your email to activate your Academy account.
            </p>

            {/* Email */}
            {email && (
                <div className="mx-auto mt-7 max-w-sm rounded-2xl border border-border bg-surface-secondary px-4 py-3">
                    <p className="truncate text-sm font-medium">
                        {email}
                    </p>
                </div>
            )}

            {/* Success */}
            {message && (
                <div className="mt-5 rounded-2xl border border-success/20 bg-success/5 px-4 py-3 text-sm text-success">
                    {message}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="mt-5 rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                    {error}
                </div>
            )}

            {/* Resend */}
            <div className="mt-7">
                <Button
                    type="button"
                    size="lg"
                    className="h-12 w-full"
                    disabled={
                        !email ||
                        resending ||
                        cooldown > 0
                    }
                    onClick={resendVerification}
                >
                    {resending
                        ? "Sending..."
                        : cooldown > 0
                            ? `Resend available in ${cooldown}s`
                            : "Resend verification email"}
                </Button>
            </div>

            {/* Help */}
            <p className="mt-5 text-xs leading-5 text-muted">
                Didn't receive it? Check your spam or junk folder.
            </p>

            {/* Login */}
            <div className="mt-8 border-t border-border pt-7">
                <p className="text-sm text-muted">
                    Already verified?
                </p>

                <Link
                    href="/login"
                    className="mt-2 inline-block text-sm font-medium text-purple-bright transition-colors hover:text-purple-highlight"
                >
                    Continue to sign in →
                </Link>
            </div>
        </div>
    );
}

