"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AuthLayout from "@/components/auth/AuthLayout";
import { supabase } from "@/lib/supabase";

function CallbackContent() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [status, setStatus] = useState("verifying");
    const [message, setMessage] = useState(
        "Please wait while we confirm your email address."
    );

    useEffect(() => {
        const verifyEmail = async () => {
            const tokenHash = searchParams.get("token_hash");
            const type = searchParams.get("type");

            if (!tokenHash || !type) {
                setStatus("error");
                setMessage(
                    "This verification link is invalid or incomplete."
                );
                return;
            }

            try {
                const { error } = await supabase.auth.verifyOtp({
                    token_hash: tokenHash,
                    type,
                });

                if (error) {
                    console.error(
                        "Email verification error:",
                        error
                    );

                    setStatus("error");
                    setMessage(
                        error.message ||
                            "We couldn't verify your email address."
                    );

                    return;
                }

                setStatus("success");
                setMessage(
                    "Your email has been verified successfully."
                );

                setTimeout(() => {
                    router.replace("/login");
                }, 1800);
            } catch (error) {
                console.error(
                    "Unexpected verification error:",
                    error
                );

                setStatus("error");
                setMessage(
                    "Something went wrong while verifying your email."
                );
            }
        };

        verifyEmail();
    }, [router, searchParams]);

    return (
        <div className="text-center">
            {status === "verifying" && (
                <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/15 dark:border-purple-light/15 dark:bg-purple-primary/20">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-light/30 border-t-purple-bright" />
                    </div>

                    <p className="mt-7 text-sm font-medium text-purple-bright">
                        Verifying
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                        Confirming your email.
                    </h1>

                    <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
                        {message}
                    </p>
                </>
            )}

            {status === "success" && (
                <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-success/20 bg-success/10 text-2xl text-success">
                        ✓
                    </div>

                    <p className="mt-7 text-sm font-medium text-success">
                        Verified
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                        You're all set.
                    </h1>

                    <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
                        {message} Redirecting you to sign in...
                    </p>
                </>
            )}

            {status === "error" && (
                <>
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-danger/20 bg-danger/10 text-2xl text-danger">
                        !
                    </div>

                    <p className="mt-7 text-sm font-medium text-danger">
                        Verification failed
                    </p>

                    <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                        We couldn't verify you.
                    </h1>

                    <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
                        {message}
                    </p>

                    <button
                        type="button"
                        onClick={() =>
                            router.replace("/verify-email")
                        }
                        className="mt-8 inline-flex h-11 items-center justify-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                    >
                        Back to verification
                    </button>
                </>
            )}
        </div>
    );
}

function CallbackLoading() {
    return (
        <div className="text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-purple-primary/15 bg-purple-light/15 dark:border-purple-light/15 dark:bg-purple-primary/20">
                <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-light/30 border-t-purple-bright" />
            </div>

            <p className="mt-7 text-sm font-medium text-purple-bright">
                Verifying
            </p>

            <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Please wait.
            </h1>

            <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-muted">
                Preparing your verification.
            </p>
        </div>
    );
}

export default function AuthCallbackPage() {
    return (
        <AuthLayout>
            <Suspense fallback={<CallbackLoading />}>
                <CallbackContent />
            </Suspense>
        </AuthLayout>
    );
}