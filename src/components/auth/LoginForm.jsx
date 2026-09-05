"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Button from "@/components/ui/Button";
import PasswordInput from "./PasswordInput";

export default function LoginForm() {
    const router = useRouter();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });

    const [errors, setErrors] = useState({});
    const [serverError, setServerError] = useState("");
    const [loading, setLoading] = useState(false);

    const updateField = (field, value) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        setErrors((current) => ({
            ...current,
            [field]: "",
        }));

        setServerError("");
    };

    const validate = () => {
        const nextErrors = {};

        if (!form.email.trim()) {
            nextErrors.email = "Please enter your email address.";
        } else if (
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)
        ) {
            nextErrors.email = "Please enter a valid email address.";
        }

        if (!form.password) {
            nextErrors.password = "Please enter your password.";
        }

        setErrors(nextErrors);

        return Object.keys(nextErrors).length === 0;
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        setServerError("");

        if (!validate()) return;

        try {
            setLoading(true);

            const { data, error } =
                await supabase.auth.signInWithPassword({
                    email: form.email.trim().toLowerCase(),
                    password: form.password,
                });

            if (error) {
                console.error("Login error:", error);

                if (
                    error.message
                        ?.toLowerCase()
                        .includes("email not confirmed")
                ) {
                    setServerError(
                        "Please verify your email address before signing in."
                    );
                } else {
                    setServerError(
                        "Incorrect email or password. Please try again."
                    );
                }

                return;
            }

            console.log("Login successful:", data);

            router.replace("/student/dashboard");
        } catch (error) {
            console.error("Unexpected login error:", error);

            setServerError(
                "Something went wrong while signing you in. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="mb-8 text-center">
                <p className="text-sm font-medium text-purple-bright">
                    Welcome back
                </p>

                <h1 className="mt-3 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                    Continue your journey.
                </h1>

                <p className="mx-auto mt-4 max-w-sm text-sm leading-6 text-muted">
                    Sign in to continue learning, track your progress,
                    and stay connected with the Academy.
                </p>
            </div>

            <form
                onSubmit={handleSubmit}
                className="space-y-5"
                noValidate
            >
                {/* Email */}
                <div>
                    <label
                        htmlFor="email"
                        className="mb-2 block text-sm font-medium"
                    >
                        Email address
                    </label>

                    <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(event) =>
                            updateField("email", event.target.value)
                        }
                        placeholder="you@example.com"
                        autoComplete="email"
                        className={`h-12 w-full rounded-2xl border bg-surface px-4 text-sm outline-none transition-all placeholder:text-muted-light focus:border-purple-bright focus:ring-4 focus:ring-purple-bright/10 ${
                            errors.email
                                ? "border-danger"
                                : "border-border"
                        }`}
                    />

                    {errors.email && (
                        <p className="mt-2 text-xs text-danger">
                            {errors.email}
                        </p>
                    )}
                </div>

                {/* Password */}
                <PasswordInput
                    label="Password"
                    name="password"
                    value={form.password}
                    onChange={(event) =>
                        updateField("password", event.target.value)
                    }
                    error={errors.password}
                />

                {/* Forgot password */}
                <div className="flex justify-end">
                    <Link
                        href="/forgot-password"
                        className="text-sm font-medium text-purple-bright transition-colors hover:text-purple-highlight"
                    >
                        Forgot password?
                    </Link>
                </div>

                {/* Server error */}
                {serverError && (
                    <div className="rounded-2xl border border-danger/20 bg-danger/5 px-4 py-3 text-sm text-danger">
                        {serverError}

                        {serverError.includes("verify") && (
                            <Link
                                href="/verify-email"
                                className="mt-2 block font-medium underline underline-offset-4"
                            >
                                Go to email verification
                            </Link>
                        )}
                    </div>
                )}

                <Button
                    type="submit"
                    size="lg"
                    className="h-12 w-full"
                    disabled={loading}
                >
                    {loading ? "Signing in..." : "Sign in"}
                </Button>
            </form>

            <p className="mt-7 text-center text-sm text-muted">
                Don't have an account?{" "}
                <Link
                    href="/register"
                    className="font-medium text-purple-bright transition-colors hover:text-purple-highlight"
                >
                    Create an account
                </Link>
            </p>
        </div>
    );
}