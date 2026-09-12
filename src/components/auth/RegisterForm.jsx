"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, Check } from "lucide-react";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { supabase } from "@/lib/supabase";

const COUNTRIES = [
    { code: "NG", name: "Nigeria", dialCode: "+234" },
    { code: "US", name: "United States", dialCode: "+1" },
    { code: "GB", name: "United Kingdom", dialCode: "+44" },
    { code: "CA", name: "Canada", dialCode: "+1" },
    { code: "GH", name: "Ghana", dialCode: "+233" },
    { code: "ZA", name: "South Africa", dialCode: "+27" },
    { code: "AU", name: "Australia", dialCode: "+61" },
    { code: "DE", name: "Germany", dialCode: "+49" },
    { code: "FR", name: "France", dialCode: "+33" },
    { code: "AE", name: "United Arab Emirates", dialCode: "+971" },
];

function getInitialCountry() {
    return COUNTRIES.find((country) => country.code === "NG") || COUNTRIES[0];
}

export default function RegisterForm() {
    const router = useRouter();

    const [form, setForm] = useState({
        fullName: "",
        email: "",
        country: "NG",
        phone: "",
        password: "",
        confirmPassword: "",
        terms: false,
    });

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const selectedCountry =
        COUNTRIES.find((country) => country.code === form.country) ||
        getInitialCountry();

    function handleChange(event) {
        const { name, value, type, checked } = event.target;

        setForm((current) => ({
            ...current,
            [name]: type === "checkbox" ? checked : value,
        }));

        if (error) {
            setError("");
        }
    }

    function validatePhone() {
        const rawPhone = form.phone.trim();

        if (!rawPhone) {
            return {
                valid: false,
                message: "Please enter your phone number.",
            };
        }

        const phoneWithCountryCode = rawPhone.startsWith("+")
            ? rawPhone
            : `${selectedCountry.dialCode}${rawPhone.replace(/\D/g, "")}`;

        const phoneNumber = parsePhoneNumberFromString(phoneWithCountryCode);

        if (!phoneNumber || !phoneNumber.isValid()) {
            return {
                valid: false,
                message: "Please enter a valid phone number.",
            };
        }

        return {
            valid: true,
            value: phoneNumber.number,
        };
    }

    async function handleSubmit(event) {
        event.preventDefault();

        if (loading) return;

        setError("");

        const fullName = form.fullName.trim();
        const email = form.email.trim().toLowerCase();

        if (!fullName) {
            setError("Please enter your full name.");
            return;
        }

        if (fullName.length < 2) {
            setError("Please enter your complete name.");
            return;
        }

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setError("Please enter a valid email address.");
            return;
        }

        const phoneValidation = validatePhone();

        if (!phoneValidation.valid) {
            setError(phoneValidation.message);
            return;
        }

        if (form.password.length < 8) {
            setError("Your password must be at least 8 characters.");
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError("Your passwords do not match.");
            return;
        }

        if (!form.terms) {
            setError("Please accept the terms and conditions.");
            return;
        }

        try {
            setLoading(true);

            const { data, error: signUpError } = await supabase.auth.signUp({
                email,
                password: form.password,
                options: {
                    data: {
                        full_name: fullName,
                        country: selectedCountry.code,
                        phone: phoneValidation.value,
                    },
                },
            });

            if (signUpError) {
                throw signUpError;
            }

            if (!data?.user) {
                throw new Error(
                    "Your account could not be created. Please try again."
                );
            }

            if (!data?.session) {
                throw new Error(
                    "Your account was created, but automatic sign-in was not completed. Please try logging in."
                );
            }

            router.replace("/student/dashboard");
            router.refresh();
        } catch (err) {
            console.error("Registration error:", err);

            let message =
                err?.message ||
                "Something went wrong while creating your account.";

            if (message.toLowerCase().includes("already registered")) {
                message =
                    "An account with this email already exists. Please log in instead.";
            }

            if (message.toLowerCase().includes("user already registered")) {
                message =
                    "An account with this email already exists. Please log in instead.";
            }

            setError(message);
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
                    Student Registration
                </div>

                <h1 className="text-3xl font-semibold tracking-tight text-[var(--foreground)] sm:text-4xl">
                    Create your account
                </h1>

                <p className="mt-2 text-sm leading-6 text-[var(--foreground-muted)]">
                    Create your account and begin your discipleship journey.
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
                        htmlFor="fullName"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Full name
                    </label>

                    <input
                        id="fullName"
                        name="fullName"
                        type="text"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Enter your full name"
                        autoComplete="name"
                        disabled={loading}
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    />
                </div>

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
                    <label
                        htmlFor="country"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Country
                    </label>

                    <select
                        id="country"
                        name="country"
                        value={form.country}
                        onChange={handleChange}
                        disabled={loading}
                        className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {COUNTRIES.map((country) => (
                            <option
                                key={country.code}
                                value={country.code}
                            >
                                {country.name} ({country.dialCode})
                            </option>
                        ))}
                    </select>
                </div>

                <div>
                    <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Phone number
                    </label>

                    <div className="flex gap-2">
                        <div className="flex h-12 shrink-0 items-center rounded-2xl border border-[var(--border)] bg-[var(--surface-secondary)] px-4 text-sm font-medium text-[var(--foreground)]">
                            {selectedCountry.dialCode}
                        </div>

                        <input
                            id="phone"
                            name="phone"
                            type="tel"
                            value={form.phone}
                            onChange={handleChange}
                            placeholder="0808 267 9797"
                            autoComplete="tel"
                            disabled={loading}
                            className="h-12 min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />
                    </div>
                </div>

                <div>
                    <label
                        htmlFor="password"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Password
                    </label>

                    <div className="relative">
                        <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={form.password}
                            onChange={handleChange}
                            placeholder="At least 8 characters"
                            autoComplete="new-password"
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

                <div>
                    <label
                        htmlFor="confirmPassword"
                        className="mb-2 block text-sm font-medium text-[var(--foreground)]"
                    >
                        Confirm password
                    </label>

                    <div className="relative">
                        <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={
                                showConfirmPassword ? "text" : "password"
                            }
                            value={form.confirmPassword}
                            onChange={handleChange}
                            placeholder="Enter your password again"
                            autoComplete="new-password"
                            disabled={loading}
                            className="h-12 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 pr-12 text-sm text-[var(--foreground)] outline-none transition focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 disabled:cursor-not-allowed disabled:opacity-60"
                        />

                        <button
                            type="button"
                            onClick={() =>
                                setShowConfirmPassword(
                                    (current) => !current
                                )
                            }
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-[var(--foreground-muted)] transition hover:bg-purple-500/10 hover:text-purple-600"
                            aria-label={
                                showConfirmPassword
                                    ? "Hide password"
                                    : "Show password"
                            }
                        >
                            {showConfirmPassword ? (
                                <EyeOff size={18} />
                            ) : (
                                <Eye size={18} />
                            )}
                        </button>
                    </div>
                </div>

                <label className="flex cursor-pointer items-start gap-3">
                    <span className="relative mt-0.5">
                        <input
                            type="checkbox"
                            name="terms"
                            checked={form.terms}
                            onChange={handleChange}
                            disabled={loading}
                            className="peer sr-only"
                        />

                        <span className="flex h-5 w-5 items-center justify-center rounded-md border border-[var(--border)] bg-[var(--surface)] transition peer-checked:border-purple-600 peer-checked:bg-purple-600">
                            {form.terms && (
                                <Check
                                    size={13}
                                    strokeWidth={3}
                                    className="text-white"
                                />
                            )}
                        </span>
                    </span>

                    <span className="text-sm leading-6 text-[var(--foreground-muted)]">
                        I agree to the academy&apos;s terms and conditions.
                    </span>
                </label>

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
                            Creating account...
                        </>
                    ) : (
                        <>
                            Create account
                            <ArrowRight
                                size={18}
                                className="transition-transform group-hover:translate-x-0.5"
                            />
                        </>
                    )}
                </button>
            </form>

            <p className="mt-7 text-center text-sm text-[var(--foreground-muted)]">
                Already have an account?{" "}
                <Link
                    href="/login"
                    className="font-semibold text-[var(--primary)] transition hover:text-[var(--accent)]"
                >
                    Log in
                </Link>
            </p>
        </motion.div>
    );
}